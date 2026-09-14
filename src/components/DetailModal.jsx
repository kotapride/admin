import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Download,
  Trash2,
  FileText,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Loader2,
  ShieldCheck,
  Award,
  Camera,
  UploadCloud
} from 'lucide-react';
import CertificateGenerator from './Certificate';

export default function DetailModal({ recordId, token, onClose, onRecordUpdated, onRecordDeleted }) {
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showCert, setShowCert] = useState(false);
  const [photoUpdating, setPhotoUpdating] = useState(false);
  const photoInputRef = useRef(null);

  const handlePhotoSelect = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const maxSize = 5 * 1024 * 1024;
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (JPG, PNG, or WebP).');
      return;
    }
    if (file.size > maxSize) {
      alert('Photo size exceeds 5MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result;
      setPhotoUpdating(true);
      try {
        const response = await fetch(`/api/records/${recordId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            photoBase64: base64,
            photoMimeType: file.type,
            photoFileName: file.name
          })
        });

        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Failed to update student photo.');
        }

        setRecord(data.record);
        if (typeof onRecordUpdated === 'function') {
          onRecordUpdated(data.record);
        }
      } catch (err) {
        alert(`Error updating photo: ${err.message}`);
      } finally {
        setPhotoUpdating(false);
        if (photoInputRef.current) photoInputRef.current.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    fetchDetail();
    // Escape key listener
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [recordId]);

  const fetchDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/records/${recordId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to load record details.');
      }
      setRecord(data.record);
      setAdminNotes(data.record.admin_notes || '');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/records/${recordId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          status: newStatus,
          adminNotes: adminNotes.trim()
        })
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Status update failed.');
      }
      setRecord(data.record);
      onRecordUpdated(data.record);
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to permanently delete this submission and associated document?')) {
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch(`/api/records/${recordId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Deletion failed.');
      }
      onRecordDeleted(recordId);
      onClose();
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const maskAadhaar = (num) => {
    if (!num) return '';
    const clean = num.replace(/\D/g, '');
    if (clean.length < 4) return clean;
    return `${clean.slice(0, 4)} ${clean.slice(4, 8)} ${clean.slice(8, 12)}`;
  };

  const isPdf = record?.file_type === 'application/pdf' || record?.file_name?.toLowerCase().endsWith('.pdf');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <h2 className="modal-title">Aadhaar Application Review</h2>
            {record && (
              <span className={`badge ${(record.status || 'PENDING').toLowerCase()}`}>
                <span className="badge-dot"></span>
                {record.status || 'PENDING'}
              </span>
            )}
          </div>
          <button className="modal-close-btn" onClick={onClose} title="Close (Esc)">
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
            <Loader2 size={32} className="spin" style={{ margin: '0 auto 12px' }} />
            <div>Loading submission details and secure document...</div>
          </div>
        ) : error ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#fb7185' }}>
            <p>{error}</p>
            <button className="btn-secondary" onClick={fetchDetail} style={{ marginTop: 12 }}>
              Retry
            </button>
          </div>
        ) : record ? (
          <div className="modal-body-grid">
            {/* Left Column: Details & Verification Action */}
            <div className="modal-left-col">
              {/* Student Profile & Photo Header with Update Action */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '16px',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                border: '1px solid var(--border-color, #334155)',
                marginBottom: '16px',
                position: 'relative'
              }}>
                <input
                  type="file"
                  ref={photoInputRef}
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePhotoSelect}
                  style={{ display: 'none' }}
                />

                <div style={{ position: 'relative', width: '68px', height: '84px', flexShrink: 0 }}>
                  {record.photo_url ? (
                    <img
                      src={record.photo_url}
                      alt={record.full_name}
                      style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '8px',
                        objectFit: 'cover',
                        border: '2px solid var(--primary-light, #6366f1)',
                        boxShadow: '0 4px 10px rgba(0, 0, 0, 0.25)'
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '8px',
                        background: '#1e293b',
                        color: '#94a3b8',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '1.3rem',
                        border: '1px dashed #475569'
                      }}
                    >
                      <span>{(record.full_name || 'U').charAt(0).toUpperCase()}</span>
                      <span style={{ fontSize: '0.6rem', fontWeight: 500, color: '#94a3b8' }}>NO PHOTO</span>
                    </div>
                  )}

                  {/* Camera overlay button to update photo */}
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    disabled={photoUpdating || actionLoading}
                    title="Change / Upload Student Photo"
                    style={{
                      position: 'absolute',
                      bottom: '-4px',
                      right: '-4px',
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      background: '#4f46e5',
                      border: '2px solid #0f172a',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {photoUpdating ? (
                      <Loader2 size={12} className="spin" />
                    ) : (
                      <Camera size={13} />
                    )}
                  </button>
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h3 style={{ margin: '0 0 4px', fontSize: '1.15rem', color: 'var(--text-main, #ffffff)', fontWeight: 700 }}>
                      {record.full_name}
                    </h3>
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      disabled={photoUpdating || actionLoading}
                      style={{
                        background: 'rgba(79, 70, 229, 0.15)',
                        color: '#818cf8',
                        border: '1px solid rgba(99, 102, 241, 0.3)',
                        borderRadius: '6px',
                        padding: '3px 8px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4
                      }}
                    >
                      <UploadCloud size={12} />
                      <span>{photoUpdating ? 'Uploading...' : record.photo_url ? 'Change Photo' : 'Upload Photo'}</span>
                    </button>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted, #94a3b8)', display: 'flex', flexDirection: 'column', gap: 3, marginTop: 4 }}>
                    <span>Class: <strong style={{ color: 'var(--text-main, #e2e8f0)' }}>{record.class || 'N/A'}</strong></span>
                    <span>Course: <strong style={{ color: 'var(--text-main, #e2e8f0)' }}>{record.course || 'N/A'}</strong></span>
                  </div>
                </div>
              </div>

              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Full Name</span>
                  <span className="info-value">{record.full_name}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Mobile Number</span>
                  <span className="info-value mono-cell">{record.phone}</span>
                </div>
                {record.class && (
                  <div className="info-item">
                    <span className="info-label">Class / Grade</span>
                    <span className="info-value">{record.class}</span>
                  </div>
                )}
                {record.father_name && (
                  <div className="info-item">
                    <span className="info-label">Father's Name</span>
                    <span className="info-value">{record.father_name}</span>
                  </div>
                )}
                {record.mother_name && (
                  <div className="info-item">
                    <span className="info-label">Mother's Name</span>
                    <span className="info-value">{record.mother_name}</span>
                  </div>
                )}
                {record.address && (
                  <div className="info-item" style={{ gridColumn: 'span 2' }}>
                    <span className="info-label">Address</span>
                    <span className="info-value" style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                      {record.address}
                    </span>
                  </div>
                )}
                {record.aadhar_number && (
                  <div className="info-item">
                    <span className="info-label">Aadhaar Number</span>
                    <span className="info-value mono-cell" style={{ letterSpacing: '0.08em' }}>
                      {maskAadhaar(record.aadhar_number)}
                    </span>
                  </div>
                )}
                <div className="info-item">
                  <span className="info-label">Submitted On</span>
                  <span className="info-value" style={{ fontSize: '0.85rem' }}>
                    {new Date(record.created_at).toLocaleString()}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">File Type / Size</span>
                  <span className="info-value" style={{ fontSize: '0.85rem' }}>
                    {record.file_type || 'Unknown'} • {record.file_size ? `${(record.file_size / 1024).toFixed(1)} KB` : 'N/A'}
                  </span>
                </div>
              </div>

              {/* Verification & Action Box */}
              <div className="verification-box">
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: '0.9rem' }}>
                  <ShieldCheck size={18} color="var(--primary-light)" />
                  <span>Administrative Verification & Decision</span>
                </div>

                <div style={{ marginTop: 12 }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 600 }}>
                    Verification Remarks / Notes
                  </label>
                  <textarea
                    className="notes-textarea"
                    rows={3}
                    placeholder="Enter verification remarks, UIDAI verification status, or reason for rejection..."
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    disabled={actionLoading}
                  />
                </div>

                <div className="status-button-group">
                  <button
                    type="button"
                    className="btn-approve"
                    onClick={() => handleUpdateStatus('APPROVED')}
                    disabled={actionLoading}
                  >
                    <CheckCircle2 size={16} />
                    <span>Approve</span>
                  </button>

                  <button
                    type="button"
                    className="btn-reject"
                    onClick={() => handleUpdateStatus('REJECTED')}
                    disabled={actionLoading}
                  >
                    <XCircle size={16} />
                    <span>Reject</span>
                  </button>
                </div>

                {(record.status || 'PENDING') !== 'PENDING' && (
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ width: '100%', marginTop: 10, fontSize: '0.8rem', padding: 8 }}
                    onClick={() => handleUpdateStatus('PENDING')}
                    disabled={actionLoading}
                  >
                    <Clock size={14} />
                    <span>Revert to Pending</span>
                  </button>
                )}
              </div>

              {/* Danger Zone */}
              <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => setShowCert(true)}
                  style={{
                    background: '#0f2c4a',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 14px',
                    borderRadius: '8px'
                  }}
                >
                  <Award size={16} />
                  <span>Generate Certificate</span>
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={actionLoading}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#fb7185',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 8px'
                  }}
                >
                  <Trash2 size={14} />
                  <span>Delete Record Permanently</span>
                </button>
              </div>
            </div>

            {/* Right Column: Aadhaar Document Viewer */}
            <div className="modal-right-col">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span className="info-label">Uploaded Aadhaar Document</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <a
                    href={record.secureDocUrl || record.aadhar_file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary"
                    style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                    download={record.file_name}
                  >
                    <Download size={12} />
                    <span>Download</span>
                  </a>
                  <a
                    href={record.secureDocUrl || record.aadhar_file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary"
                    style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                  >
                    <ExternalLink size={12} />
                    <span>New Tab</span>
                  </a>
                </div>
              </div>

              {/* Document Display Canvas */}
              <div className="doc-viewer-box">
                {isPdf && !(record.secureDocUrl || record.aadhar_file_url)?.includes('unsplash.com') ? (
                  <iframe 
                    src={`${record.secureDocUrl || record.aadhar_file_url}#toolbar=0`} 
                    style={{ width: '100%', height: '100%', border: 'none', minHeight: '400px' }} 
                    title="Aadhaar Document PDF"
                  />
                ) : (
                  <img
                    src={record.secureDocUrl || record.aadhar_file_url}
                    alt="Aadhaar Document Copy"
                    className="doc-preview-img"
                    style={{ transform: `scale(${zoomLevel})` }}
                  />
                )}
              </div>

              {/* Zoom Controls for Image */}
              {!isPdf && (
                <div className="doc-toolbar">
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>
                    Zoom: {Math.round(zoomLevel * 100)}%
                  </span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{ padding: '6px 10px' }}
                      onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.25))}
                      title="Zoom In"
                    >
                      <ZoomIn size={14} />
                    </button>
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{ padding: '6px 10px' }}
                      onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.25))}
                      title="Zoom Out"
                    >
                      <ZoomOut size={14} />
                    </button>
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{ padding: '6px 10px' }}
                      onClick={() => setZoomLevel(1)}
                      title="Reset Zoom"
                    >
                      <RotateCcw size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>

      {showCert && (
        <CertificateGenerator 
          student={record} 
          token={token}
          onClose={() => setShowCert(false)} 
          onPhotoUpdated={(updatedRecord) => {
            setRecord(updatedRecord);
            if (typeof onRecordUpdated === 'function') {
              onRecordUpdated(updatedRecord);
            }
          }}
        />
      )}
    </div>
  );
}
