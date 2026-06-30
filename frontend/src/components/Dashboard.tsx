import React, { useState, useEffect } from 'react';
import { LogOut, Navigation, AlertTriangle, Compass, Users, MapPin } from 'lucide-react';
import RouteSearch from './RouteSearch';
import MapView from './MapView';
import CommuteDetails from './CommuteDetails';
import CarpoolHub from './CarpoolHub';
import RideChat from './RideChat';
import ParkingFinder from './ParkingFinder';
import { API_URL } from '../config';

interface DashboardProps {
  user: { id: string; email: string };
  token: string;
  onLogout: () => void;
}

export default function Dashboard({ user, token, onLogout }: DashboardProps) {
  const [sidebarTab, setSidebarTab] = useState<'route' | 'carpool' | 'parking'>('route');
  const [routeData, setRouteData] = useState<any | null>(null);
  const [selectedRouteIdx, setSelectedRouteIdx] = useState<number>(0);
  const [recentSearches, setRecentSearches] = useState<any[]>([]);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Lifted state to allow MapView city marker clicks to set input values
  const [sourceInput, setSourceInput] = useState('');
  const [destInput, setDestInput] = useState('');

  // Chat window state
  const [chatRideId, setChatRideId] = useState<string | null>(null);
  const [chatRideTitle, setChatRideTitle] = useState<string>('');

  // Lifted state to plot searched parking garages on the map
  const [searchedGarages, setSearchedGarages] = useState<any[]>([]);

  // Clear temporary searched garages when switching tabs to avoid visual clutter
  useEffect(() => {
    if (sidebarTab !== 'parking') {
      setSearchedGarages([]);
    }
  }, [sidebarTab]);

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API_URL}/api/commute/history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRecentSearches(data);
      }
    } catch (err) {
      console.error('Error fetching search history:', err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [token]);

  const handlePlanStart = () => {
    setLoading(true);
    setError('');
    setRouteData(null);
  };

  const handlePlanSuccess = (data: any) => {
    setRouteData(data);
    setSelectedRouteIdx(0); // Select first route by default
    setLoading(false);
  };

  const handlePlanError = (errMsg: string) => {
    setError(errMsg);
    setLoading(false);
  };

  const handleOpenChat = (rideId: string, title: string) => {
    setChatRideId(rideId);
    setChatRideTitle(title);
  };

  return (
    <div className="app-container">
      <header className="dashboard-header glass-panel">
        <div className="logo-section">
          <span className="logo-icon">🚦</span>
          <span className="logo-text">SmartCommute Odisha</span>
        </div>
        <div className="user-profile">
          <span className="user-email">{user.email}</span>
          <button className="logout-btn" onClick={onLogout}>
            <LogOut size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
            Log Out
          </button>
        </div>
      </header>

      {/* Odisha Smart Mobility Live Telemetry */}
      <div style={{
        background: 'linear-gradient(90deg, rgba(0, 240, 255, 0.05) 0%, rgba(57, 255, 20, 0.02) 100%)',
        borderBottom: '1px solid var(--glass-border)',
        padding: '10px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        zIndex: 5
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            width: '8px',
            height: '8px',
            background: 'var(--traffic-low)',
            borderRadius: '50%',
            boxShadow: '0 0 8px var(--traffic-low)',
            display: 'inline-block',
            animation: 'pulseStatus 2s infinite ease-in-out'
          }}></span>
          <style>{`
            @keyframes pulseStatus {
              0% { opacity: 0.5; }
              50% { opacity: 1; }
              100% { opacity: 0.5; }
            }
          `}</style>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>
            ODISHA TRANSIT GRID: ACTIVE
          </span>
        </div>

        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>AVG CONGESTION:</span>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--traffic-medium)' }}>34% (MODERATE)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>MONITORED VEHICLES:</span>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#ffffff' }}>4,812</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>CO2 SAVED TODAY:</span>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--traffic-low)' }}>1,840 kg</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>MO BUS RUNNING:</span>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-color)' }}>124 Fleet</span>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <aside className="sidebar-panel">
          {/* Navigation Mode Selectors */}
          <div style={{
            display: 'flex',
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '10px',
            padding: '4px',
            marginBottom: '10px'
          }}>
            <button
              onClick={() => setSidebarTab('route')}
              style={{
                flex: 1,
                border: 'none',
                background: sidebarTab === 'route' ? 'var(--bg-tertiary)' : 'transparent',
                color: sidebarTab === 'route' ? '#ffffff' : 'var(--text-secondary)',
                padding: '8px 4px',
                fontWeight: 600,
                fontSize: '12px',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                transition: 'all 0.2s ease'
              }}
            >
              <Navigation size={13} />
              Route
            </button>
            <button
              onClick={() => setSidebarTab('carpool')}
              style={{
                flex: 1,
                border: 'none',
                background: sidebarTab === 'carpool' ? 'var(--bg-tertiary)' : 'transparent',
                color: sidebarTab === 'carpool' ? '#ffffff' : 'var(--text-secondary)',
                padding: '8px 4px',
                fontWeight: 600,
                fontSize: '12px',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                transition: 'all 0.2s ease'
              }}
            >
              <Users size={13} />
              Carpool
            </button>
            <button
              onClick={() => setSidebarTab('parking')}
              style={{
                flex: 1,
                border: 'none',
                background: sidebarTab === 'parking' ? 'var(--bg-tertiary)' : 'transparent',
                color: sidebarTab === 'parking' ? '#ffffff' : 'var(--text-secondary)',
                padding: '8px 4px',
                fontWeight: 600,
                fontSize: '12px',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                transition: 'all 0.2s ease'
              }}
            >
              <MapPin size={13} />
              Parking
            </button>
          </div>

          {sidebarTab === 'route' && (
            <>
              <RouteSearch
                token={token}
                onPlanStart={handlePlanStart}
                onPlanSuccess={handlePlanSuccess}
                onPlanError={handlePlanError}
                recentSearches={recentSearches}
                fetchHistory={fetchHistory}
                source={sourceInput}
                setSource={setSourceInput}
                destination={destInput}
                setDestination={setDestInput}
              />

              {error && (
                <div className="error-banner" style={{ margin: 0 }}>
                  <AlertTriangle size={18} />
                  <span>{error}</span>
                </div>
              )}

              {loading && (
                <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                  <div className="loading-spinner" style={{
                    border: '3px solid rgba(255,255,255,0.1)',
                    borderTop: '3px solid var(--accent-color)',
                    borderRadius: '50%',
                    width: '30px',
                    height: '30px',
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto 10px auto'
                  }}></div>
                  <style>{`
                    @keyframes spin {
                      0% { transform: rotate(0deg); }
                      100% { transform: rotate(360deg); }
                    }
                  `}</style>
                  <span>Optimizing travel routes...</span>
                </div>
              )}

              {routeData && !loading && (
                <div>
                  <h4 className="section-title">
                    <Compass size={16} />
                    Suggested Routes
                  </h4>
                  <div className="routes-container">
                    {routeData.routes.map((route: any, idx: number) => (
                      <div
                        key={route.id}
                        className={`route-card ${selectedRouteIdx === idx ? 'selected' : ''}`}
                        onClick={() => setSelectedRouteIdx(idx)}
                      >
                        <div className="route-card-header">
                          <span className="route-title">{route.name}</span>
                          <span className={`route-badge ${route.trafficLevel}`}>
                            {route.trafficLevel}
                          </span>
                        </div>
                        <div className="route-info-row">
                          <span className="info-item">
                            Time: <strong className="info-highlight">{route.duration} min</strong>
                          </span>
                          <span className="info-item">
                            Dist: <strong className="info-highlight">{route.distance} km</strong>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {sidebarTab === 'carpool' && (
            <CarpoolHub 
              token={token} 
              userEmail={user.email} 
              onOpenChat={handleOpenChat} 
            />
          )}

          {sidebarTab === 'parking' && (
            <ParkingFinder 
              token={token} 
              onSearchSuccess={setSearchedGarages}
            />
          )}
        </aside>

        <main style={{ position: 'relative' }}>
          <MapView
            source={routeData ? routeData.source : null}
            destination={routeData ? routeData.destination : null}
            routes={routeData ? routeData.routes : []}
            selectedRouteIndex={selectedRouteIdx}
            onSelectRoute={setSelectedRouteIdx}
            onSelectSource={setSourceInput}
            onSelectDestination={setDestInput}
            carpools={routeData ? routeData.carpools : []}
            parking={routeData ? routeData.parking : []}
            searchedGarages={sidebarTab === 'parking' ? searchedGarages : []}
          />
          
          {sidebarTab === 'route' && (
            <CommuteDetails
              route={routeData ? routeData.routes[selectedRouteIdx] : null}
              carpools={routeData ? routeData.carpools : []}
              parking={routeData ? routeData.parking : []}
              aiPredictions={routeData ? routeData.aiPredictions : null}
              routes={routeData ? routeData.routes : []}
              selectedRouteIndex={selectedRouteIdx}
              onSelectRoute={setSelectedRouteIdx}
            />
          )}

          {/* Floating Chat Overlay */}
          {chatRideId && (
            <RideChat
              rideId={chatRideId}
              rideTitle={chatRideTitle}
              token={token}
              userEmail={user.email}
              onClose={() => setChatRideId(null)}
            />
          )}
        </main>
      </div>
    </div>
  );
}
