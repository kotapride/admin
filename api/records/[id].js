import { getSupabaseAdmin } from '../_lib/supabase.js';
import { verifyAuthHeader, setCORS } from '../_lib/auth.js';

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
      error: 'Unauthorized. Please log in.'
    });
  }

  // Extract ID from query (Vercel routes /api/records/[id] pass id into req.query.id)
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'Record ID is required.'
    });
  }

  const supabase = getSupabaseAdmin();
  const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'aadhar-documents';

  try {
    // --------------------------------------------------------------------------
    // GET: Fetch Single Record Details
    // --------------------------------------------------------------------------
    if (req.method === 'GET') {
      if (supabase) {
        const { data: record, error } = await supabase
          .from('submissions')
          .select('*')
          .eq('id', id)
          .single();

        if (error || !record) {
          return res.status(404).json({
            success: false,
            error: 'Submission record not found.'
          });
        }

        // Generate temporary signed URL (valid for 60 minutes) for secure Aadhaar document access
        let secureDocUrl = record.aadhar_file_url;
        if (record.aadhar_file_path) {
          const { data: signedData } = await supabase.storage
            .from(bucketName)
            .createSignedUrl(record.aadhar_file_path, 3600);

          if (signedData?.signedUrl) {
            secureDocUrl = signedData.signedUrl;
          }
        }

        return res.status(200).json({
          success: true,
          record: {
            ...record,
            secureDocUrl
          }
        });
      } else {
        // Demo Mode
        const list = global.__ADMIN_DEMO_RECORDS__ || [];
        const record = list.find((r) => r.id === id);
        if (!record) {
          return res.status(404).json({ success: false, error: 'Record not found.' });
        }
        return res.status(200).json({
          success: true,
          record: {
            ...record,
            secureDocUrl: record.aadhar_file_url
          }
        });
      }
    }

    // --------------------------------------------------------------------------
    // PATCH: Update Record Status and Admin Notes
    // --------------------------------------------------------------------------
    if (req.method === 'PATCH') {
      let body = req.body;
      if (typeof body === 'string') {
        try {
          body = JSON.parse(body);
        } catch (e) {
          body = {};
        }
      }

      const { status, adminNotes } = body || {};

      if (status && !['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid status. Must be PENDING, APPROVED, or REJECTED.'
        });
      }

      if (supabase) {
        const updatePayload = {};
        if (status) updatePayload.status = status;
        if (adminNotes !== undefined) updatePayload.admin_notes = adminNotes;
        updatePayload.updated_at = new Date().toISOString();

        const { data: updatedRecord, error } = await supabase
          .from('submissions')
          .update(updatePayload)
          .eq('id', id)
          .select()
          .single();

        if (error) {
          throw error;
        }

        return res.status(200).json({
          success: true,
          message: 'Record updated successfully.',
          record: updatedRecord
        });
      } else {
        // Demo Mode
        const list = global.__ADMIN_DEMO_RECORDS__ || [];
        const record = list.find((r) => r.id === id);
        if (!record) {
          return res.status(404).json({ success: false, error: 'Record not found.' });
        }

        if (status) record.status = status;
        if (adminNotes !== undefined) record.admin_notes = adminNotes;
        record.updated_at = new Date().toISOString();

        return res.status(200).json({
          success: true,
          message: 'Record updated successfully (Demo Mode).',
          record
        });
      }
    }

    // --------------------------------------------------------------------------
    // DELETE: Remove Record and Storage Document
    // --------------------------------------------------------------------------
    if (req.method === 'DELETE') {
      if (supabase) {
        // First retrieve file path to clean up storage
        const { data: record } = await supabase
          .from('submissions')
          .select('aadhar_file_path')
          .eq('id', id)
          .single();

        if (record?.aadhar_file_path) {
          await supabase.storage
            .from(bucketName)
            .remove([record.aadhar_file_path]);
        }

        const { error } = await supabase
          .from('submissions')
          .delete()
          .eq('id', id);

        if (error) {
          throw error;
        }

        return res.status(200).json({
          success: true,
          message: 'Record and document deleted permanently.'
        });
      } else {
        // Demo Mode
        const list = global.__ADMIN_DEMO_RECORDS__ || [];
        const index = list.findIndex((r) => r.id === id);
        if (index === -1) {
          return res.status(404).json({ success: false, error: 'Record not found.' });
        }
        global.__ADMIN_DEMO_RECORDS__.splice(index, 1);
        return res.status(200).json({
          success: true,
          message: 'Record deleted permanently (Demo Mode).'
        });
      }
    }

    return res.status(405).json({
      success: false,
      error: `Method ${req.method} not allowed.`
    });
  } catch (err) {
    console.error(`Record [id] Handler Exception:`, err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Server error occurred while handling record request.'
    });
  }
}
