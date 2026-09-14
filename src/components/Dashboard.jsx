import React, { useState, useEffect, useCallback } from 'react';
import { Shield, LogOut, Database, ExternalLink } from 'lucide-react';
import StatsCard from './StatsCard';
import RecordsTable from './RecordsTable';
import DetailModal from './DetailModal';

export default function Dashboard({ token, user, onLogout }) {
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalRecords: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selectedRecordId, setSelectedRecordId] = useState(null);

  const fetchRecords = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        status: statusFilter,
        search: search.trim()
      });

      const response = await fetch(`/api/records?${queryParams.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        if (response.status === 401) {
          onLogout();
          return;
        }
        throw new Error(data.error || 'Failed to fetch submissions.');
      }

      setRecords(data.records || []);
      setPagination(data.pagination || { page: 1, limit: 10, totalRecords: 0, totalPages: 1 });
      if (data.stats) setStats(data.stats);
    } catch (err) {
      console.error('Fetch records error:', err);
    } finally {
      setLoading(false);
    }
  }, [token, statusFilter, search, onLogout]);

  // Debounced search & filter effect
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRecords(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchRecords]);

  const handleRecordUpdated = (updatedRecord) => {
    setRecords((prev) =>
      prev.map((r) => (r.id === updatedRecord.id ? { ...r, ...updatedRecord } : r))
    );
    // Refresh stats
    fetchRecords(pagination.page);
  };

  const handleRecordDeleted = (deletedId) => {
    setRecords((prev) => prev.filter((r) => r.id !== deletedId));
    fetchRecords(pagination.page);
  };

  return (
    <div className="dashboard-container">
      {/* Navbar */}
      <nav className="navbar">
        <div className="nav-brand">
          <img src="/logo.png" alt="PrepMagic" style={{ height: '36px' }} />
          <span className="nav-brand-badge">Admin Portal</span>
        </div>

        <div className="nav-right">
          <a
            href="http://localhost:3000"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary"
            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
          >
            <span>User Form (App 1)</span>
            <ExternalLink size={12} />
          </a>

          <div className="admin-profile">
            <div className="admin-avatar">
              {(user?.fullName || user?.username || 'A')[0].toUpperCase()}
            </div>
            <div>
              <div className="admin-name">{user?.fullName || user?.username}</div>
              <div className="admin-role-tag">{user?.role || 'Admin'}</div>
            </div>
          </div>

          <button type="button" className="btn-logout" onClick={onLogout} title="Sign Out">
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </nav>

      {/* Main Dashboard Content */}
      <main className="main-content">
        {/* Metric Summary Cards */}
        <StatsCard
          stats={stats}
          currentStatus={statusFilter}
          onStatusChange={(newStatus) => setStatusFilter(newStatus)}
        />

        {/* Submissions Table */}
        <RecordsTable
          records={records}
          loading={loading}
          pagination={pagination}
          search={search}
          setSearch={setSearch}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          onPageChange={(p) => fetchRecords(p)}
          onRefresh={() => fetchRecords(pagination.page)}
          onSelectRecord={(id) => setSelectedRecordId(id)}
          token={token}
          onRecordUpdated={handleRecordUpdated}
        />
      </main>

      {/* Inspection & Document Review Modal */}
      {selectedRecordId && (
        <DetailModal
          recordId={selectedRecordId}
          token={token}
          onClose={() => setSelectedRecordId(null)}
          onRecordUpdated={handleRecordUpdated}
          onRecordDeleted={handleRecordDeleted}
        />
      )}
    </div>
  );
}
