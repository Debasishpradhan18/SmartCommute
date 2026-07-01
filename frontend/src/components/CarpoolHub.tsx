import React, { useState, useEffect } from 'react';
import { Plus, Search, Car, DollarSign, Users, MessageSquare, AlertCircle } from 'lucide-react';
import { API_URL } from '../config';

interface CarpoolHubProps {
  token: string;
  userEmail: string;
  onOpenChat: (rideId: string, title: string) => void;
}

export default function CarpoolHub({ token, userEmail, onOpenChat }: CarpoolHubProps) {
  const [activeTab, setActiveTab] = useState<'find' | 'offer' | 'active'>('find');
  const [rides, setRides] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Offer form state
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [seats, setSeats] = useState('3');
  const [price, setPrice] = useState('50');

  // Search filter
  const [filterQuery, setFilterQuery] = useState('');

  const fetchRides = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/rides`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch rides');
      setRides(data);
    } catch (err: any) {
      setError(err.message || 'Could not fetch rides from server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab !== 'offer') {
      fetchRides();
    }
    setError('');
    setSuccess('');
  }, [activeTab]);

  const handleOfferRide = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!from || !to || !seats || !price) {
      setError('Please fill in all fields');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/rides`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ from, to, seats: Number(seats), price: Number(price) })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create ride');
      
      setSuccess('Ride offered successfully!');
      setFrom('');
      setTo('');
      setSeats('3');
      setPrice('50');
      setTimeout(() => setActiveTab('active'), 1500);
    } catch (err: any) {
      setError(err.message || 'Error creating ride');
    }
  };

  const handleJoinRide = async (rideId: string) => {
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/rides/${rideId}/join`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to join ride');
      
      fetchRides(); // refresh list
      setSuccess('Joined ride successfully!');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err: any) {
      setError(err.message || 'Error joining ride');
    }
  };

  // Filter rides based on search query
  const filteredRides = rides.filter(ride => {
    const q = filterQuery.toLowerCase();
    return (
      (ride.from && ride.from.toLowerCase().includes(q)) ||
      (ride.to && ride.to.toLowerCase().includes(q)) ||
      (ride.driver && ride.driver.toLowerCase().includes(q))
    );
  });

  // Rides that I'm driving or I've joined
  const myActiveRides = rides.filter(ride => {
    const isDriver = ride.driver === userEmail;
    const isRider = ride.riders && ride.riders.includes(userEmail);
    return isDriver || isRider;
  });

  // Filter out my own rides from the "Find" tab
  const joinableRides = filteredRides.filter(ride => {
    return ride.driver !== userEmail && !(ride.riders && ride.riders.includes(userEmail));
  });

  return (
    <div className="carpool-hub-panel">
      <div className="auth-tabs" style={{ marginBottom: '16px' }}>
        <button
          className={`auth-tab ${activeTab === 'find' ? 'active' : ''}`}
          onClick={() => setActiveTab('find')}
        >
          Find Ride
        </button>
        <button
          className={`auth-tab ${activeTab === 'offer' ? 'active' : ''}`}
          onClick={() => setActiveTab('offer')}
        >
          Offer Ride
        </button>
        <button
          className={`auth-tab ${activeTab === 'active' ? 'active' : ''}`}
          onClick={() => setActiveTab('active')}
        >
          My Rides
        </button>
      </div>

      {error && (
        <div className="error-banner" style={{ marginBottom: '16px' }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="error-banner" style={{ 
          background: 'rgba(16, 185, 129, 0.1)', 
          border: '1px solid rgba(16, 185, 129, 0.2)', 
          color: 'var(--traffic-low)', 
          marginBottom: '16px' 
        }}>
          <span>{success}</span>
        </div>
      )}

      {activeTab === 'find' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="search-input-wrapper" style={{ marginBottom: 0 }}>
            <Search size={16} className="input-icon-left" style={{ top: '13px' }} />
            <input
              type="text"
              className="search-input-field"
              placeholder="Search by from, to, or driver..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              style={{ padding: '10px 12px 10px 38px' }}
            />
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>Searching active grid...</div>
          ) : joinableRides.length === 0 ? (
            <div className="empty-state">No commuter ride-shares are registered in this sector.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '350px', overflowY: 'auto' }} className="animate-fade-in">
              {joinableRides.map(ride => (
                <div key={ride._id} className="history-item animate-slide-up" style={{ cursor: 'default' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff' }}>
                      🚗 {ride.from} → {ride.to}
                    </span>
                    <span className="mono-text" style={{ fontSize: '14px', color: 'var(--traffic-low)', fontWeight: 800 }}>
                      ₹{ride.price}
                    </span>
                  </div>
                  
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                    👤 pilot: {ride.driver.split('@')[0]}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                      <Users size={14} style={{ color: 'var(--accent-color)' }} />
                      {ride.seats} slots left
                    </span>
                    <button
                      className="plan-btn"
                      onClick={() => handleJoinRide(ride._id)}
                      style={{
                        width: 'auto',
                        padding: '6px 14px',
                        fontSize: '11px',
                        borderRadius: '6px',
                        boxShadow: 'none',
                        height: '30px'
                      }}
                    >
                      Join Ride
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'offer' && (
        <form onSubmit={handleOfferRide} className="glass-panel animate-fade-in" style={{ padding: '24px', borderRadius: '16px' }}>
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label">Departure Hub (From)</label>
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '14px' }}
              placeholder="e.g. Patia, Bhubaneswar"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label">Destination Hub (To)</label>
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '14px' }}
              placeholder="e.g. Trishulia, Cuttack"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Available Slots</label>
              <input
                type="number"
                min="1"
                max="8"
                className="form-input"
                style={{ paddingLeft: '14px' }}
                value={seats}
                onChange={(e) => setSeats(e.target.value)}
                required
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Price Per Seat (₹)</label>
              <input
                type="number"
                min="0"
                className="form-input"
                style={{ paddingLeft: '14px' }}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="plan-btn">
            <Plus size={16} />
            Post Ride Offer
          </button>
        </form>
      )}

      {activeTab === 'active' && (
        <div className="animate-fade-in">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>Retrieving ride data...</div>
          ) : myActiveRides.length === 0 ? (
            <div className="empty-state">No offered or joined rides registered under this profile.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {myActiveRides.map(ride => {
                const isDriver = ride.driver === userEmail;
                return (
                  <div key={ride._id} className="history-item animate-slide-up" style={{ cursor: 'default' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff' }}>
                        🚗 {ride.from} → {ride.to}
                      </span>
                      <span style={{ 
                        fontSize: '9px', 
                        padding: '3px 8px', 
                        borderRadius: '4px',
                        background: isDriver ? 'rgba(129, 140, 248, 0.15)' : 'rgba(57, 255, 20, 0.15)',
                        color: isDriver ? 'var(--accent-purple)' : 'var(--traffic-low)',
                        fontWeight: 800,
                        height: 'fit-content',
                        letterSpacing: '0.05em',
                        border: isDriver ? '1px solid rgba(129, 140, 248, 0.25)' : '1px solid rgba(57, 255, 20, 0.25)'
                      }}>
                        {isDriver ? 'DRIVER' : 'PASSENGER'}
                      </span>
                    </div>

                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                      {isDriver ? `👥 Riders: ${ride.riders.length > 0 ? ride.riders.map((r: string) => r.split('@')[0]).join(', ') : 'none'}` : `👤 pilot: ${ride.driver.split('@')[0]}`}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed rgba(255,255,255,0.05)', paddingTop: '10px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }} className="mono-text">
                        ₹{ride.price} • {ride.seats} seats left
                      </span>
                      <button
                        className="logout-btn"
                        onClick={() => onOpenChat(ride._id, `${ride.from} → ${ride.to}`)}
                        style={{
                          background: 'rgba(0, 240, 255, 0.05)',
                          borderColor: 'var(--glass-border)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '5px 12px',
                          fontSize: '11px',
                          color: 'var(--accent-color)',
                          borderRadius: '6px'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'var(--accent-color)';
                          e.currentTarget.style.background = 'rgba(0, 240, 255, 0.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'var(--glass-border)';
                          e.currentTarget.style.background = 'rgba(0, 240, 255, 0.05)';
                        }}
                      >
                        <MessageSquare size={12} />
                        Chat
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
