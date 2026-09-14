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

        // Generate temporary signed URL for Supabase storage paths (Cloudinary URLs are already secure public URLs)
        let secureDocUrl = record.aadhar_file_url;
        if (record.aadhar_file_path && !record.aadhar_file_url?.includes('cloudinary.com') && !record.aadhar_file_path.startsWith('student_registrations')) {
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
            status: record.status || 'PENDING',
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

      const { status, adminNotes, photoBase64, photoMimeType, photoFileName } = body || {};

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

        // Handle Admin Photo Upload / Replacement
        if (photoBase64) {
          const base64Data = photoBase64.replace(/^data:image\/\w+;base64,/, '');
          const buffer = Buffer.from(base64Data, 'base64');
          const mimeType = photoMimeType || 'image/jpeg';
          const cleanName = (photoFileName || 'student_photo.jpg').replace(/[^a-zA-Z0-9.-]/g, '_');
          const newPhotoPath = `photo_${Date.now()}_${Math.random().toString(36).substring(2, 8)}_${cleanName}`;

          // Upload new photo to Supabase Storage
          const { error: uploadError } = await supabase.storage
            .from(bucketName)
            .upload(newPhotoPath, buffer, {
              contentType: mimeType,
              upsert: true
            });

          if (uploadError) {
            console.error('Admin photo upload error:', uploadError);
            return res.status(500).json({
              success: false,
              error: `Failed to upload student photo: ${uploadError.message}`
            });
          }

          const { data: urlData } = supabase.storage
            .from(bucketName)
            .getPublicUrl(newPhotoPath);

          const newPhotoUrl = urlData?.publicUrl || '';
          updatePayload.photo_url = newPhotoUrl;
          updatePayload.photo_file_path = newPhotoPath;

          // Delete previous photo from storage if existed
          const { data: existingRecord } = await supabase
            .from('submissions')
            .select('photo_file_path')
            .eq('id', id)
            .single();

          if (existingRecord?.photo_file_path) {
            await supabase.storage
              .from(bucketName)
              .remove([existingRecord.photo_file_path]);
          }
        }

        let finalRecord = null;
        let { data: updatedRecord, error } = await supabase
          .from('submissions')
          .update(updatePayload)
          .eq('id', id)
          .select()
          .single();

        if (error && error.message?.includes('status')) {
          // If status column doesn't exist yet in Supabase, retry without it
          const requestedStatus = updatePayload.status;
          delete updatePayload.status;
          const retryRes = await supabase
            .from('submissions')
            .update(updatePayload)
            .eq('id', id)
            .select()
            .single();

          if (retryRes.error) throw retryRes.error;
          finalRecord = { ...retryRes.data, status: requestedStatus || 'PENDING' };
        } else if (error) {
          throw error;
        } else {
          finalRecord = { ...updatedRecord, status: updatedRecord?.status || updatePayload.status || 'PENDING' };
        }

        return res.status(200).json({
          success: true,
          message: 'Record updated successfully.',
          record: finalRecord
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
        if (photoBase64) {
          record.photo_url = photoBase64.startsWith('data:') 
            ? photoBase64 
            : `data:${photoMimeType || 'image/jpeg'};base64,${photoBase64}`;
        }
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
        // First retrieve file paths to clean up storage
        const { data: record } = await supabase
          .from('submissions')
          .select('aadhar_file_path, photo_file_path')
          .eq('id', id)
          .single();

        const filesToDelete = [];
        if (record?.aadhar_file_path) filesToDelete.push(record.aadhar_file_path);
        if (record?.photo_file_path) filesToDelete.push(record.photo_file_path);

        if (filesToDelete.length > 0) {
          await supabase.storage
            .from(bucketName)
            .remove(filesToDelete);
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
