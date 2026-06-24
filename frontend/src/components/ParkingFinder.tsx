import React, { useState, useEffect } from 'react';
import { Search, MapPin, Calendar, Compass, AlertCircle, Trash2, Ticket } from 'lucide-react';
import { API_URL } from '../config';

interface ParkingFinderProps {
  token: string;
}

export default function ParkingFinder({ token }: ParkingFinderProps) {
  const [activeTab, setActiveTab] = useState<'find' | 'reservations'>('find');
  const [city, setCity] = useState('');
  const [garages, setGarages] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchReservations = async () => {
    try {
      const res = await fetch(`${API_URL}/api/parking/reservations`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setReservations(data);
      }
    } catch (err) {
      console.error('Error fetching reservations:', err);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, [token]);

  const handleSearchParking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!city.trim()) return;

    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${API_URL}/api/parking?city=${city.trim()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to find parking');
      setGarages(data);
    } catch (err: any) {
      setError(err.message || 'Error searching parking garages');
    } finally {
      setLoading(false);
    }
  };

  const handleReserveSpot = async (garageId: string) => {
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${API_URL}/api/parking/${garageId}/reserve`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Reservation failed');

      // Update state for garages
      setGarages(prev =>
        prev.map(g => (g._id === garageId ? data.garage : g))
      );
      setSuccess(`Spot reserved successfully! Ticket: ${data.booking.slotNumber}`);
      fetchReservations(); // Refresh reservation list
    } catch (err: any) {
      setError(err.message || 'Error booking parking slot');
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${API_URL}/api/parking/reservations/${bookingId}/cancel`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Cancellation failed');

      setSuccess('Booking cancelled successfully.');
      
      // Update reservations list
      setReservations(prev => prev.filter(r => r._id !== bookingId));
      
      // If we searched recently, refresh the list to show updated spots
      if (city) {
        const freshRes = await fetch(`${API_URL}/api/parking?city=${city.trim()}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const freshData = await freshRes.json();
        if (freshRes.ok) setGarages(freshData);
      }
    } catch (err: any) {
      setError(err.message || 'Error cancelling reservation');
    }
  };

  return (
    <div className="parking-finder-panel">
      <div className="auth-tabs" style={{ marginBottom: '16px' }}>
        <button
          className={`auth-tab ${activeTab === 'find' ? 'active' : ''}`}
          onClick={() => setActiveTab('find')}
        >
          Find Parking
        </button>
        <button
          className={`auth-tab ${activeTab === 'reservations' ? 'active' : ''}`}
          onClick={() => { setActiveTab('reservations'); fetchReservations(); }}
        >
          Reservations ({reservations.length})
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <form onSubmit={handleSearchParking} className="search-input-wrapper" style={{ marginBottom: 0 }}>
            <Search size={16} className="input-icon-left" style={{ top: '13px' }} />
            <input
              type="text"
              className="search-input-field"
              placeholder="Enter City Name (e.g. London)"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              style={{ padding: '10px 12px 10px 38px' }}
              required
            />
          </form>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>Searching garages...</div>
          ) : garages.length === 0 ? (
            <div className="empty-state">
              <Compass size={24} style={{ marginBottom: '8px', color: 'var(--text-muted)' }} />
              <p>Type a city and search to load smart parking garages.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '350px', overflowY: 'auto' }}>
              {garages.map(garage => {
                const ratio = garage.availableSlots / garage.totalSlots;
                const statusColor = ratio === 0 ? 'var(--traffic-heavy)' :
                                    ratio <= 0.2 ? 'var(--traffic-medium)' :
                                    'var(--traffic-low)';

                return (
                  <div key={garage._id} className="history-item" style={{ cursor: 'default' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>
                        {garage.name}
                      </span>
                      <span style={{ fontSize: '13px', color: 'var(--traffic-low)', fontWeight: 700 }}>
                        ${garage.price.toFixed(2)}/hr
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={12} />
                        {garage.city.toUpperCase()}
                      </span>
                      <span style={{ color: statusColor, fontWeight: 700 }}>
                        {garage.availableSlots} / {garage.totalSlots} slots free
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div style={{ 
                      width: '100%', 
                      height: '4px', 
                      background: 'rgba(255,255,255,0.05)', 
                      borderRadius: '2px', 
                      marginBottom: '12px',
                      overflow: 'hidden'
                    }}>
                      <div style={{ 
                        width: `${(garage.availableSlots / garage.totalSlots) * 100}%`, 
                        height: '100%', 
                        background: statusColor, 
                        transition: 'width 0.5s ease' 
                      }}></div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        className="logout-btn"
                        disabled={garage.availableSlots <= 0}
                        onClick={() => handleReserveSpot(garage._id)}
                        style={{
                          background: garage.availableSlots <= 0 ? 'rgba(255,255,255,0.05)' : 'var(--accent-color)',
                          borderColor: 'transparent',
                          padding: '4px 14px',
                          fontSize: '11px',
                          fontWeight: 700,
                          color: garage.availableSlots <= 0 ? 'var(--text-muted)' : '#FFFFFF',
                          cursor: garage.availableSlots <= 0 ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {garage.availableSlots <= 0 ? 'Fully Booked' : 'Reserve Spot'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'reservations' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {reservations.length === 0 ? (
            <div className="empty-state">You have no active parking reservations.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '400px', overflowY: 'auto' }}>
              {reservations.map(res => (
                <div key={res._id} className="parking-ticket glass-panel" style={{
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid var(--glass-border)',
                  borderLeft: '4px solid var(--accent-color)',
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05), rgba(255,255,255,0.02))'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>
                      {res.garageName}
                    </span>
                    <Ticket size={16} style={{ color: 'var(--accent-color)' }} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                    <div>
                      <div style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Spot Number</div>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff' }}>{res.slotNumber}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Ticket Code</div>
                      <div style={{ fontSize: '12px', fontFamily: 'monospace', fontWeight: 700, color: 'var(--accent-color)' }}>
                        #{res._id ? res._id.slice(-6).toUpperCase() : 'CODE'}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed var(--glass-border)', paddingTop: '10px' }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={12} />
                      {new Date(res.createdAt).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => handleCancelBooking(res._id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--traffic-heavy)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '11px',
                        fontWeight: 600
                      }}
                    >
                      <Trash2 size={12} />
                      Cancel
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
