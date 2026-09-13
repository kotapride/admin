import React, { useState } from 'react';
import { Shield, Lock, User, AlertCircle, Loader2, KeyRound } from 'lucide-react';

export default function LoginView({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFillDemo = () => {
    setUsername('admin');
    setPassword('password123');
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password) {
      setError('Please enter both username and password.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: username.trim(),
          password
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Authentication failed. Please verify credentials.');
      }

      onLoginSuccess(data.token, data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <img src="/logo.png" alt="PrepMagic Logo" style={{ maxWidth: '250px', height: 'auto' }} />
          </div>
          <h1 className="login-title">Command Center</h1>
          <p className="login-subtitle">Aadhaar Document Review & Verification Portal</p>
        </div>

        {/* Demo Shortcut */}
        <div className="demo-credentials-box">
          <div>
            <strong>Quick Access:</strong> <code>admin</code> / <code>password123</code>
          </div>
          <button type="button" className="btn-fill-demo" onClick={handleFillDemo}>
            Fill Demo
          </button>
        </div>

        {error && (
          <div
            style={{
              background: 'rgba(244, 63, 94, 0.12)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              color: '#fb7185',
              padding: '12px 14px',
              borderRadius: 8,
              marginBottom: 20,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Username */}
          <div style={{ marginBottom: 18 }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: 600,
                marginBottom: 6,
                color: 'var(--text-main)'
              }}
            >
              Admin Username or Email
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <User
                size={16}
                style={{
                  position: 'absolute',
                  left: 14,
                  color: 'var(--text-subtle)',
                  pointerEvents: 'none'
                }}
              />
              <input
                type="text"
                className="search-input"
                style={{ paddingLeft: 40 }}
                placeholder="admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                autoFocus
              />
            </div>
          </div>

          {/* Password */}
          <div style={{ marginBottom: 24 }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: 600,
                marginBottom: 6,
                color: 'var(--text-main)'
              }}
            >
              Password
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Lock
                size={16}
                style={{
                  position: 'absolute',
                  left: 14,
                  color: 'var(--text-subtle)',
                  pointerEvents: 'none'
                }}
              />
              <input
                type="password"
                className="search-input"
                style={{ paddingLeft: 40 }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="btn-approve"
            style={{
              width: '100%',
              padding: '13px',
              fontSize: '0.95rem',
              background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
              boxShadow: '0 8px 20px -4px rgba(79, 70, 229, 0.5)'
            }}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <KeyRound size={18} />
                <span>Sign In to Dashboard</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
