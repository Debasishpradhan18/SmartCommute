import React, { useState } from 'react';
import { Mail, Lock, AlertCircle, Compass } from 'lucide-react';
import { API_URL } from '../config';

interface AuthProps {
  onAuthSuccess: (token: string, user: { id: string; email: string }) => void;
}

export default function Auth({ onAuthSuccess }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
    
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      onAuthSuccess(data.token, data.user);
    } catch (err: any) {
      setError(err.message || 'Failed to connect to backend server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      {/* Decorative Cyber Grid elements */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '5%',
        fontSize: '11px',
        color: 'var(--text-muted)',
        fontFamily: 'var(--font-mono)',
        pointerEvents: 'none',
        opacity: 0.5
      }}>
        SYS_GATEWAY: ACTIVE<br />
        SECURE_PROTOCOL: TLS_1.3<br />
        ODISHA_GRID: 85.09E / 20.95N
      </div>
      <div style={{
        position: 'absolute',
        bottom: '10%',
        right: '5%',
        fontSize: '11px',
        color: 'var(--text-muted)',
        fontFamily: 'var(--font-mono)',
        pointerEvents: 'none',
        opacity: 0.5,
        textAlign: 'right'
      }}>
        NODE_STATUS: SHIELD_ON<br />
        TRANSIT_DB: LOCAL_FALLBACK<br />
        v1.2.4_PROT
      </div>

      <div className="auth-card glass-panel animate-slide-up">
        <div className="auth-header">
          <div style={{
            width: '60px',
            height: '60px',
            background: 'radial-gradient(circle, rgba(0, 240, 255, 0.15) 0%, transparent 70%)',
            border: '1.5px solid var(--glass-border)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto',
            boxShadow: '0 0 15px rgba(0, 240, 255, 0.1)'
          }}>
            <span className="logo-icon" style={{ fontSize: '28px', animation: 'pulseStatus 2s infinite ease-in-out' }}>🚦</span>
          </div>
          <h1 className="auth-title" style={{ fontFamily: 'var(--font-heading)' }}>
            SmartCommute
          </h1>
          <p className="auth-subtitle" style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Odisha Urban Mobility Portal
          </p>
        </div>

        <div className="auth-tabs">
          <button 
            className={`auth-tab ${isLogin ? 'active' : ''}`}
            onClick={() => { setIsLogin(true); setError(''); }}
            type="button"
          >
            🔒 Sign In
          </button>
          <button 
            className={`auth-tab ${!isLogin ? 'active' : ''}`}
            onClick={() => { setIsLogin(false); setError(''); }}
            type="button"
          >
            🔑 Register
          </button>
        </div>

        {error && (
          <div className="error-banner">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div className="input-container">
              <Mail className="input-icon" size={18} />
              <input 
                type="email" 
                className="form-input" 
                placeholder="you@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-container">
              <Lock className="input-icon" size={18} />
              <input 
                type="password" 
                className="form-input" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {!isLogin && (
            <div className="form-group animate-fade-in">
              <label className="form-label">Confirm Password</label>
              <div className="input-container">
                <Lock className="input-icon" size={18} />
                <input 
                  type="password" 
                  className="form-input" 
                  placeholder="••••••••" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
}
