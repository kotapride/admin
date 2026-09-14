import { createClient } from '@supabase/supabase-js';

let supabaseInstance = null;

export function getSupabaseAdmin() {
  if (supabaseInstance) return supabaseInstance;

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !serviceKey || supabaseUrl.includes('placeholder')) {
    return null; // Signals mock/demo mode
  }

  supabaseInstance = createClient(supabaseUrl, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });

  return supabaseInstance;
}

// In-memory demo data for local testing before connecting real Supabase credentials
global.__ADMIN_DEMO_RECORDS__ = global.__ADMIN_DEMO_RECORDS__ || [
  {
    id: 'sub-001-demo',
    full_name: 'Aarav Sharma',
    father_name: 'Rajesh Sharma',
    class: '9th Class',
    course: 'English Development Level 3',
    email: 'aarav.sharma@example.com',
    phone: '9876543210',
    address: 'Flat 402, Green Avenue, Delhi',
    aadhar_number: '548963214578',
    photo_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80',
    aadhar_file_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    aadhar_file_path: 'samples/sample_aadhar_1.jpg',
    file_name: 'aarav_aadhaar_card.jpg',
    file_size: 1048576,
    file_type: 'image/jpeg',
    status: 'PENDING',
    admin_notes: null,
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 'sub-002-demo',
    full_name: 'Priya Patel',
    father_name: 'Mahesh Patel',
    class: '10th Class',
    course: 'English Development Level 5',
    email: 'priya.patel@example.com',
    phone: '9823456789',
    address: 'B-12, Shanti Nagar, Mumbai',
    aadhar_number: '789456123012',
    photo_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
    aadhar_file_url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=800&q=80',
    aadhar_file_path: 'samples/sample_aadhar_2.jpg',
    file_name: 'priya_doc.jpg',
    file_size: 824512,
    file_type: 'image/jpeg',
    status: 'APPROVED',
    admin_notes: 'Document verified and biometrics matched successfully.',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000 / 2).toISOString()
  },
  {
    id: 'sub-003-demo',
    full_name: 'Rahul Verma',
    father_name: 'Sanjay Verma',
    class: '8th Class',
    course: 'English Development Level 2',
    email: 'rahul.verma@example.com',
    phone: '9123456780',
    address: '14/3, Civil Lines, Jaipur',
    aadhar_number: '321654987456',
    photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    aadhar_file_url: 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=800&q=80',
    aadhar_file_path: 'samples/sample_aadhar_3.pdf',
    file_name: 'rahul_aadhar.pdf',
    file_size: 245780,
    file_type: 'application/pdf',
    status: 'REJECTED',
    admin_notes: 'QR code unreadable due to low scan resolution. Please re-upload.',
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString()
  }
];
