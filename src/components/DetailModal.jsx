import React, { useState, useEffect } from 'react';
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
  Award
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
              <span className={`badge ${record.status.toLowerCase()}`}>
                <span className="badge-dot"></span>
                {record.status}
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

                {record.status !== 'PENDING' && (
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
                {isPdf ? (
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
          onClose={() => setShowCert(false)} 
        />
      )}
    </div>
  );
}
