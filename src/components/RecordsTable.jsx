import React, { useState } from 'react';
import {
  Search,
  Download,
  RotateCw,
  Eye,
  ChevronLeft,
  ChevronRight,
  Inbox,
  CheckCircle,
  XCircle,
  Award
} from 'lucide-react';
import CertificateGenerator from './Certificate';

export default function RecordsTable({
  records,
  loading,
  pagination,
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  onPageChange,
  onRefresh,
  onSelectRecord,
  onQuickStatusChange
}) {
  const [certStudent, setCertStudent] = useState(null);

  const maskAadhaar = (num) => {
    if (!num) return '••••';
    const clean = num.replace(/\D/g, '');
    if (clean.length < 4) return clean;
    return `XXXX XXXX ${clean.slice(-4)}`;
  };

  const exportToCSV = () => {
    if (!records || records.length === 0) {
      alert('No records available to export.');
      return;
    }

    const headers = ['ID', 'Full Name', 'Email', 'Phone', 'Aadhaar Number', 'Status', 'Submitted At'];
    const rows = records.map((r) => [
      r.id,
      `"${r.full_name}"`,
      r.email,
      r.phone,
      r.aadhar_number,
      r.status,
      `"${new Date(r.created_at).toISOString()}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `aadhaar_submissions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="table-section">
      {/* Controls Bar */}
      <div className="controls-card">
        {/* Search Input */}
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search by candidate name, email, or Aadhaar number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Filter Tabs */}
        <div className="filter-tabs">
          {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((st) => (
            <button
              key={st}
              type="button"
              className={`tab-btn ${statusFilter === st ? 'active' : ''}`}
              onClick={() => setStatusFilter(st)}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" className="btn-secondary" onClick={exportToCSV} title="Export current list to CSV">
            <Download size={15} />
            <span>Export CSV</span>
          </button>
          <button type="button" className="btn-secondary" onClick={onRefresh} title="Refresh records list">
            <RotateCw size={15} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="table-card">
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Applicant Profile</th>
                <th>Aadhaar Number</th>
                <th>Mobile Number</th>
                <th>Document Type</th>
                <th>Status</th>
                <th>Submitted On</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {records && records.length > 0 ? (
                records.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <div className="applicant-name">{r.full_name}</div>
                      <div className="applicant-email">{r.email}</div>
                    </td>
                    <td>
                      <span className="mono-cell" style={{ letterSpacing: '0.06em' }}>
                        {maskAadhaar(r.aadhar_number)}
                      </span>
                    </td>
                    <td>
                      <span className="mono-cell">{r.phone}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {r.file_type ? r.file_type.split('/')[1]?.toUpperCase() : 'DOC'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${r.status.toLowerCase()}`}>
                        <span className="badge-dot"></span>
                        {r.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {new Date(r.created_at).toLocaleDateString()}{' '}
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
                        {new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td>
                      <div className="action-group" style={{ justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          className="btn-action-cert"
                          onClick={() => setCertStudent(r)}
                          title="Generate Certificate"
                        >
                          <Award size={14} />
                          <span>Cert</span>
                        </button>
                        <button
                          type="button"
                          className="btn-action-view"
                          onClick={() => onSelectRecord(r.id)}
                          title="View application & Aadhaar document"
                        >
                          <Eye size={14} />
                          <span>Review</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <Inbox size={42} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                    <div style={{ fontWeight: 600, fontSize: '1rem' }}>No submissions found</div>
                    <div style={{ fontSize: '0.85rem', marginTop: 4 }}>
                      {search ? 'Try adjusting your search criteria or clear the filters.' : 'Waiting for new Aadhaar submissions from App 1 (user-form).'}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {pagination && pagination.totalPages > 1 && (
          <div className="pagination-bar">
            <div>
              Showing page {pagination.page} of {pagination.totalPages} ({pagination.totalRecords} total entries)
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                className="btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                disabled={pagination.page <= 1}
                onClick={() => onPageChange(pagination.page - 1)}
              >
                <ChevronLeft size={14} />
                <span>Prev</span>
              </button>
              <button
                type="button"
                className="btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => onPageChange(pagination.page + 1)}
              >
                <span>Next</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {certStudent && (
        <CertificateGenerator 
          student={certStudent} 
          onClose={() => setCertStudent(null)} 
        />
      )}
    </div>
  );
}
