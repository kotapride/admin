import { getSupabaseAdmin } from './_lib/supabase.js';
import { signToken, comparePassword, setCORS } from './_lib/auth.js';

export default async function handler(req, res) {
  setCORS(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed. Use POST.' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        body = {};
      }
    }

    const { username, password } = body || {};

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password are required.'
      });
    }

    const supabase = getSupabaseAdmin();

    if (supabase) {
      // Query admin user in Supabase
      const { data: adminUser, error: fetchError } = await supabase
        .from('admins')
        .select('*')
        .or(`username.eq.${username.trim()},email.eq.${username.trim().toLowerCase()}`)
        .eq('is_active', true)
        .single();

      if (fetchError || !adminUser) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials or inactive account.'
        });
      }

      // Verify password
      const isMatch = await comparePassword(password, adminUser.password_hash);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          error: 'Invalid username or password.'
        });
      }

      // Update last_login_at
      await supabase
        .from('admins')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', adminUser.id);

      // Generate JWT
      const token = signToken({
        id: adminUser.id,
        username: adminUser.username,
        email: adminUser.email,
        role: adminUser.role
      });

      return res.status(200).json({
        success: true,
        token,
        user: {
          id: adminUser.id,
          username: adminUser.username,
          email: adminUser.email,
          fullName: adminUser.full_name || adminUser.username,
          role: adminUser.role
        }
      });
    } else {
      // Demo / Mock Mode fallback
      console.warn('⚡ Admin Login in Demo Mode: Supabase not yet connected.');
      
      const isMatch = (username.trim().toLowerCase() === 'admin' || username.trim().toLowerCase() === 'admin@portal.local') &&
        (password === 'password123' || password === 'admin123');

      if (!isMatch) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials. For demo mode use: admin / password123'
        });
      }

      const token = signToken({
        id: 'admin-demo-uuid',
        username: 'admin',
        email: 'admin@portal.local',
        role: 'superadmin'
      });

      return res.status(200).json({
        success: true,
        token,
        user: {
          id: 'admin-demo-uuid',
          username: 'admin',
          email: 'admin@portal.local',
          fullName: 'System Administrator',
          role: 'superadmin'
        },
        isDemo: true
      });
    }
  } catch (err) {
    console.error('Login Handler Exception:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Server error occurred during authentication.'
    });
  }
}
