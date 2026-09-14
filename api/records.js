import { getSupabaseAdmin } from './_lib/supabase.js';
import { verifyAuthHeader, setCORS } from './_lib/auth.js';

export default async function handler(req, res) {
  setCORS(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 1. Verify Authentication
  const user = verifyAuthHeader(req);
  if (!user) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized. Invalid or expired token.'
    });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use GET.'
    });
  }

  try {
    const {
      page = '1',
      limit = '10',
      status = 'ALL',
      search = '',
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const offset = (pageNum - 1) * limitNum;

    const supabase = getSupabaseAdmin();

    if (supabase) {
      // 2a. Query Submissions from Supabase
      let baseQuery = supabase
        .from('submissions')
        .select('*', { count: 'exact' });

      // Search filter
      if (search && search.trim()) {
        const cleanSearch = search.trim();
        baseQuery = baseQuery.or(
          `full_name.ilike.%${cleanSearch}%,email.ilike.%${cleanSearch}%,aadhar_number.ilike.%${cleanSearch}%`
        );
      }

      baseQuery = baseQuery.order(sortBy, { ascending: sortOrder === 'asc' });

      let records = [];
      let totalRecordsCount = 0;

      if (status && status !== 'ALL') {
        // Attempt query with status column filter
        const statusQuery = baseQuery.eq('status', status.toUpperCase());
        const { data: statusData, count: statusCount, error: statusError } = await statusQuery.range(offset, offset + limitNum - 1);

        if (!statusError) {
          records = statusData || [];
          totalRecordsCount = statusCount || 0;
        } else if (statusError.message?.includes('status')) {
          // Status column does not exist in DB yet: fetch all and filter in memory
          const { data: allData, error: allErr } = await baseQuery;
          if (allErr) throw allErr;
          const mapped = (allData || []).map((r) => ({ ...r, status: r.status || 'PENDING' }));
          const filtered = mapped.filter((r) => r.status === status.toUpperCase());
          totalRecordsCount = filtered.length;
          records = filtered.slice(offset, offset + limitNum);
        } else {
          throw statusError;
        }
      } else {
        const { data: allData, count: countVal, error: allErr } = await baseQuery.range(offset, offset + limitNum - 1);
        if (allErr) throw allErr;
        records = allData || [];
        totalRecordsCount = countVal || 0;
      }

      const sanitizedRecords = records.map((r) => ({
        ...r,
        status: r.status || 'PENDING'
      }));

      // 2b. Compute Summary Stats gracefully
      let totalCount = totalRecordsCount;
      let pendingCount = totalRecordsCount;
      let approvedCount = 0;
      let rejectedCount = 0;

      try {
        const { count: tc } = await supabase
          .from('submissions')
          .select('*', { count: 'exact', head: true });
        if (tc !== null && tc !== undefined) totalCount = tc;

        const { count: pc, error: pe } = await supabase
          .from('submissions')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'PENDING');

        if (!pe) {
          pendingCount = pc || 0;
          const { count: ac } = await supabase
            .from('submissions')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'APPROVED');
          approvedCount = ac || 0;

          const { count: rc } = await supabase
            .from('submissions')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'REJECTED');
          rejectedCount = rc || 0;
        } else {
          pendingCount = totalCount;
        }
      } catch (e) {
        // Fallback to computed totals
        pendingCount = totalCount;
      }

      return res.status(200).json({
        success: true,
        records: sanitizedRecords,
        pagination: {
          page: pageNum,
          limit: limitNum,
          totalRecords: totalRecordsCount,
          totalPages: Math.ceil(totalRecordsCount / limitNum) || 1
        },
        stats: {
          total: totalCount,
          pending: pendingCount,
          approved: approvedCount,
          rejected: rejectedCount
        }
      });
    } else {
      // Demo / Mock Mode
      let list = [...(global.__ADMIN_DEMO_RECORDS__ || [])];

      if (status && status !== 'ALL') {
        list = list.filter((r) => r.status.toUpperCase() === status.toUpperCase());
      }

      if (search && search.trim()) {
        const s = search.trim().toLowerCase();
        list = list.filter(
          (r) =>
            r.full_name.toLowerCase().includes(s) ||
            r.email.toLowerCase().includes(s) ||
            r.aadhar_number.includes(s)
        );
      }

      list.sort((a, b) => {
        const valA = new Date(a.created_at).getTime();
        const valB = new Date(b.created_at).getTime();
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      });

      const totalRecords = list.length;
      const paginated = list.slice(offset, offset + limitNum);

      const allRecords = global.__ADMIN_DEMO_RECORDS__ || [];
      const stats = {
        total: allRecords.length,
        pending: allRecords.filter((r) => r.status === 'PENDING').length,
        approved: allRecords.filter((r) => r.status === 'APPROVED').length,
        rejected: allRecords.filter((r) => r.status === 'REJECTED').length
      };

      return res.status(200).json({
        success: true,
        records: paginated,
        pagination: {
          page: pageNum,
          limit: limitNum,
          totalRecords,
          totalPages: Math.ceil(totalRecords / limitNum)
        },
        stats,
        isDemo: true
      });
    }
  } catch (err) {
    console.error('Records Handler Exception:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Server error occurred while fetching records.'
    });
  }
}
