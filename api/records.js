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
      let query = supabase
        .from('submissions')
        .select('*', { count: 'exact' });

      // Status filter
      if (status && status !== 'ALL') {
        query = query.eq('status', status.toUpperCase());
      }

      // Search filter
      if (search && search.trim()) {
        const cleanSearch = search.trim();
        query = query.or(
          `full_name.ilike.%${cleanSearch}%,email.ilike.%${cleanSearch}%,aadhar_number.ilike.%${cleanSearch}%`
        );
      }

      // Sorting & Pagination
      query = query
        .order(sortBy, { ascending: sortOrder === 'asc' })
        .range(offset, offset + limitNum - 1);

      const { data: records, count, error } = await query;

      if (error) {
        throw error;
      }

      // 2b. Compute Summary Stats
      const { count: totalCount } = await supabase
        .from('submissions')
        .select('*', { count: 'exact', head: true });

      const { count: pendingCount } = await supabase
        .from('submissions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'PENDING');

      const { count: approvedCount } = await supabase
        .from('submissions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'APPROVED');

      const { count: rejectedCount } = await supabase
        .from('submissions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'REJECTED');

      return res.status(200).json({
        success: true,
        records: records || [],
        pagination: {
          page: pageNum,
          limit: limitNum,
          totalRecords: count || 0,
          totalPages: Math.ceil((count || 0) / limitNum)
        },
        stats: {
          total: totalCount || 0,
          pending: pendingCount || 0,
          approved: approvedCount || 0,
          rejected: rejectedCount || 0
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
