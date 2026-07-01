import React, { useState } from 'react';
import { Clock, Route, AlertCircle, Car, DollarSign, Star, Compass, Award, Sparkles, TrendingUp, TrendingDown, Clock3 } from 'lucide-react';

interface CommuteDetailsProps {
  route: any | null;
  carpools: any[];
  parking: any[];
  aiPredictions: {
    congestionTrend: {
      trend: string;
      percentage: number;
      message: string;
    };
    bestDepartureTime: {
      offsetMinutes: number;
      savingsMinutes: number;
      message: string;
    };
    routeRecommendation: string;
  } | null;
  routes: any[];
  selectedRouteIndex: number;
  onSelectRoute: (index: number) => void;
}

export default function CommuteDetails({ 
  route, 
  carpools, 
  parking,
  aiPredictions,
  routes,
  selectedRouteIndex,
  onSelectRoute
}: CommuteDetailsProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'carpool' | 'parking' | 'ai'>('info');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [bookedRides, setBookedRides] = useState<Record<number, boolean>>({});

  if (!route) {
    return (
      <div className="map-card-overlay glass-panel empty-state">
        <Compass size={24} style={{ marginBottom: '10px', color: 'var(--accent-purple)', animation: 'pulseStatus 2.5s infinite ease-in-out' }} />
        <p style={{ fontWeight: 600, color: '#ffffff', fontSize: '14px', marginBottom: '4px' }}>TELEMETRY HUD OFFLINE</p>
        <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Plan a commute route to activate live navigation streams, carpool matrices, and parking grid lookups.</p>
      </div>
    );
  }

  // Calculate simulated green savings (CO2)
  const soloCo2 = (parseFloat(route.distance) * 0.12).toFixed(1);
  const sharedCo2 = (parseFloat(route.distance) * 0.04).toFixed(1);
  const savingsCo2 = (parseFloat(soloCo2) - parseFloat(sharedCo2)).toFixed(1);

  if (isCollapsed) {
    return (
      <div 
        className="map-card-overlay glass-panel animate-slide-up"
        onClick={() => setIsCollapsed(false)}
        style={{
          width: 'fit-content',
          padding: '12px 20px',
          bottom: '24px',
          right: '24px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          borderLeft: '4px solid var(--accent-color)'
        }}
      >
        <span style={{ fontSize: '14px', animation: 'pulseStatus 1.5s infinite ease-in-out' }}>📡</span>
        <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--accent-color)', letterSpacing: '0.08em', fontFamily: 'var(--font-mono)' }}>
          RESTORE COMMUTE COMMAND HUD
        </span>
      </div>
    );
  }

  return (
    <div className="map-card-overlay glass-panel animate-fade-in">
      {/* HUD Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '14px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        paddingBottom: '8px'
      }}>
        <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-secondary)', letterSpacing: '0.08em', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '6px', height: '6px', backgroundColor: 'var(--accent-color)', borderRadius: '50%', boxShadow: '0 0 6px var(--accent-color)' }}></span>
          COMMUTE TELEMETRY FEED
        </span>
        <button 
          onClick={() => setIsCollapsed(true)}
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            color: 'var(--text-secondary)',
            fontSize: '9px',
            fontWeight: 800,
            padding: '3px 8px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontFamily: 'var(--font-mono)'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
        >
          MINIMIZE HUD
        </button>
      </div>

      <div className="overlay-tabs">
        <button
          className={`overlay-tab ${activeTab === 'info' ? 'active' : ''}`}
          onClick={() => setActiveTab('info')}
        >
          Details
        </button>
        <button
          className={`overlay-tab ${activeTab === 'carpool' ? 'active' : ''}`}
          onClick={() => setActiveTab('carpool')}
        >
          Carpool ({carpools.length})
        </button>
        <button
          className={`overlay-tab ${activeTab === 'parking' ? 'active' : ''}`}
          onClick={() => setActiveTab('parking')}
        >
          Parking Finder
        </button>
        <button
          className={`overlay-tab ${activeTab === 'ai' ? 'active' : ''}`}
          onClick={() => setActiveTab('ai')}
        >
          <Sparkles size={11} style={{ marginRight: '3px', display: 'inline', color: '#818CF8' }} />
          AI Predict
          <span style={{
            position: 'absolute',
            top: '0px',
            right: '4px',
            width: '5px',
            height: '5px',
            backgroundColor: '#818CF8',
            borderRadius: '50%',
            boxShadow: '0 0 6px #818CF8'
          }}></span>
        </button>
      </div>

      {activeTab === 'info' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <h4 style={{ fontSize: '15px', fontWeight: 800, marginBottom: '2px', color: '#ffffff' }}>{route.name}</h4>
            <span className="mono-text" style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>SYS_STATUS: GUIDANCE_LOCK_ON</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ background: 'rgba(0,0,0,0.25)', padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '10px', fontWeight: 700, marginBottom: '4px' }}>
                <Clock size={12} style={{ color: 'var(--accent-color)' }} />
                <span>EST. TIME</span>
              </div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff' }} className="mono-text">{route.duration} Mins</div>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.25)', padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '10px', fontWeight: 700, marginBottom: '4px' }}>
                <Route size={12} style={{ color: 'var(--accent-purple)' }} />
                <span>DISTANCE</span>
              </div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff' }} className="mono-text">{route.distance} Km</div>
            </div>
          </div>

          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px', 
            background: route.trafficLevel === 'low' ? 'rgba(57, 255, 20, 0.05)' : 
                        route.trafficLevel === 'medium' ? 'rgba(234, 179, 8, 0.05)' : 
                        'rgba(255, 0, 85, 0.05)',
            padding: '14px', 
            borderRadius: '10px',
            border: `1.5px solid ${route.trafficColor}`,
            boxShadow: `0 0 10px ${route.trafficColor}1a`
          }}>
            <AlertCircle size={20} style={{ color: route.trafficColor }} />
            <div>
              <div style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', color: route.trafficColor, letterSpacing: '0.02em' }}>
                {route.trafficLevel} Congestion
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: '1.4' }}>
                {route.trafficLevel === 'low' ? 'Optimal speeds detected across all telemetry checkpoints.' : 
                 route.trafficLevel === 'medium' ? 'Moderate queues forming at critical choke points.' : 
                 'Gridlock alert. Expect delays. Switch to alternative transit routes.'}
              </div>
            </div>
          </div>

          <div style={{ 
            background: 'linear-gradient(135deg, rgba(57, 255, 20, 0.04), rgba(0, 240, 255, 0.03))',
            padding: '14px', 
            borderRadius: '10px',
            border: '1px solid rgba(57, 255, 20, 0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <Award size={20} style={{ color: 'var(--traffic-low)' }} />
            <div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff' }}>Greenhouse Credit Offset</div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: '1.3' }}>
                Sharing this ride bypasses <strong style={{ color: 'var(--traffic-low)' }}>{savingsCo2} kg of CO2</strong> emission outputs.
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'carpool' && (
        <div className="animate-fade-in">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', borderBottom: '1px solid rgba(255, 255, 255, 0.04)', paddingBottom: '8px' }}>
            <Car size={15} style={{ color: 'var(--accent-color)' }} />
            <h4 style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', color: '#ffffff' }}>Matching Carpool Commutes</h4>
          </div>
          {carpools.length === 0 ? (
            <div className="empty-state">No real-time rides match this navigation query.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '250px', overflowY: 'auto', paddingRight: '4px' }}>
              {carpools.map((driver, idx) => {
                const isBooked = bookedRides[idx];
                return (
                  <div key={idx} className="carpool-option">
                    <img src={driver.avatar} alt={driver.driver} className="driver-avatar" />
                    <div>
                      <div className="driver-name">{driver.driver.split('@')[0]}</div>
                      <div className="driver-sub">{driver.vehicle}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        <Star size={12} fill="#eab308" color="#eab308" />
                        <span style={{ color: '#ffffff', fontWeight: 600 }}>{driver.rating}</span>
                        <span style={{ opacity: 0.3 }}>•</span>
                        <span>{driver.eta} ETA</span>
                      </div>
                    </div>
                    <div className="driver-pricing">
                      <div className="driver-cost">₹{driver.cost}</div>
                      <button 
                        onClick={() => setBookedRides(prev => ({ ...prev, [idx]: !isBooked }))}
                        style={{
                          marginTop: '6px',
                          background: isBooked ? 'var(--traffic-low)' : 'rgba(0, 240, 255, 0.1)',
                          border: isBooked ? 'none' : '1px solid var(--accent-color)',
                          borderRadius: '4px',
                          color: isBooked ? '#050811' : '#ffffff',
                          padding: '4px 10px',
                          fontSize: '10px',
                          fontWeight: 800,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          textTransform: 'uppercase',
                          fontFamily: 'var(--font-mono)'
                        }}
                      >
                        {isBooked ? '✓ Booked' : 'Book'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'parking' && (
        <div className="animate-fade-in">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', borderBottom: '1px solid rgba(255, 255, 255, 0.04)', paddingBottom: '8px' }}>
            <Compass size={15} style={{ color: 'var(--accent-color)' }} />
            <h4 style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', color: '#ffffff' }}>Smart Garages Near Destination</h4>
          </div>
          {parking.length === 0 ? (
            <div className="empty-state">No telemetry data for destination parking zones.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '250px', overflowY: 'auto', paddingRight: '4px' }}>
              {parking.map((spot, idx) => {
                const ratio = spot.availableSlots !== undefined ? (spot.availableSlots / spot.totalSlots) : 
                              spot.occupancy === '90%' ? 0.1 : spot.occupancy === '15%' ? 0.85 : 0.5;
                const statusColor = ratio <= 0.15 ? 'var(--traffic-heavy)' : 
                                    ratio <= 0.4 ? 'var(--traffic-medium)' : 
                                    'var(--traffic-low)';
                return (
                  <div key={idx} className="parking-spot" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div className="parking-name">{spot.name}</div>
                        <div className="parking-meta">{spot.distance} • {spot.rate}</div>
                      </div>
                      <div className="parking-availability">
                        <span className={`parking-occupancy ${spot.status}`} style={{ color: statusColor }}>
                          {spot.occupancy} Full
                        </span>
                        <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '1px' }}>
                          {ratio <= 0.15 ? 'Limited spots' : 'Spaces available'}
                        </div>
                      </div>
                    </div>
                    {/* Visual Progress Bar */}
                    <div style={{ 
                      width: '100%', 
                      height: '4px', 
                      background: 'rgba(255,255,255,0.05)', 
                      borderRadius: '2px', 
                      overflow: 'hidden'
                    }}>
                      <div style={{ 
                        width: `${(1 - ratio) * 100}%`, 
                        height: '100%', 
                        background: statusColor,
                        boxShadow: `0 0 6px ${statusColor}`
                      }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'ai' && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Congestion Predictor */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.25)',
            padding: '14px',
            borderRadius: '10px',
            border: '1px solid var(--glass-border)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              {aiPredictions?.congestionTrend.trend === 'increase' ? (
                <TrendingUp size={16} style={{ color: 'var(--traffic-heavy)' }} />
              ) : aiPredictions?.congestionTrend.trend === 'decrease' ? (
                <TrendingDown size={16} style={{ color: 'var(--traffic-low)' }} />
              ) : (
                <Clock3 size={16} style={{ color: 'var(--text-muted)' }} />
              )}
              <h4 style={{ fontSize: '12px', fontWeight: 800, margin: 0, textTransform: 'uppercase', color: '#ffffff' }}>
                Queue Growth Probability
              </h4>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '6px' }}>
              <span className="mono-text" style={{
                fontSize: '22px',
                fontWeight: 800,
                color: aiPredictions?.congestionTrend.trend === 'increase' ? 'var(--traffic-heavy)' :
                       aiPredictions?.congestionTrend.trend === 'decrease' ? 'var(--traffic-low)' : 'var(--text-secondary)'
              }}>
                {aiPredictions?.congestionTrend.trend === 'increase' ? '+' : aiPredictions?.congestionTrend.trend === 'decrease' ? '-' : ''}
                {aiPredictions?.congestionTrend.percentage}%
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
                {aiPredictions?.congestionTrend.trend} in traffic density
              </span>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4' }}>
              {aiPredictions?.congestionTrend.message}
            </p>
          </div>

          {/* Best Departure Time */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(129, 140, 248, 0.08), rgba(0, 240, 255, 0.03))',
            padding: '14px',
            borderRadius: '10px',
            border: '1px solid rgba(129, 140, 248, 0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Clock size={16} style={{ color: 'var(--accent-purple)' }} />
              <h4 style={{ fontSize: '12px', fontWeight: 800, margin: 0, textTransform: 'uppercase', color: '#ffffff' }}>Launch Matrix Optimizer</h4>
            </div>
            {aiPredictions && aiPredictions.bestDepartureTime.offsetMinutes > 0 ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span className="mono-text" style={{ fontSize: '15px', fontWeight: 800, color: 'var(--accent-purple)' }}>
                    In {aiPredictions.bestDepartureTime.offsetMinutes} Mins
                  </span>
                  <span className="mono-text" style={{
                    fontSize: '10px',
                    background: 'rgba(57, 255, 20, 0.15)',
                    color: 'var(--traffic-low)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontWeight: 800,
                    border: '1px solid rgba(57, 255, 20, 0.2)'
                  }}>
                    -{aiPredictions.bestDepartureTime.savingsMinutes} Min Delay
                  </span>
                </div>
                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4' }}>
                  {aiPredictions.bestDepartureTime.message}
                </p>
              </div>
            ) : (
              <div>
                <span className="mono-text" style={{ fontSize: '15px', fontWeight: 800, color: 'var(--traffic-low)', display: 'block', marginBottom: '6px' }}>
                  DEPART IMMEDIATE
                </span>
                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4' }}>
                  {aiPredictions?.bestDepartureTime.message}
                </p>
              </div>
            )}
          </div>

          {/* Alternative Routes Comparison */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <Route size={16} style={{ color: 'var(--accent-color)' }} />
              <h4 style={{ fontSize: '12px', fontWeight: 800, margin: 0, textTransform: 'uppercase', color: '#ffffff' }}>Commute Vectors</h4>
            </div>
            
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: '1.45', fontStyle: 'italic', background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '6px', borderLeft: '3px solid var(--accent-color)' }}>
              "{aiPredictions?.routeRecommendation}"
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {routes.map((r, idx) => {
                const isCurrent = idx === selectedRouteIndex;
                return (
                  <div
                    key={r.id}
                    onClick={() => onSelectRoute(idx)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: isCurrent ? 'rgba(0, 240, 255, 0.05)' : 'rgba(255,255,255,0.015)',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: `1.5px solid ${isCurrent ? 'var(--accent-color)' : 'rgba(255,255,255,0.05)'}`,
                      boxShadow: isCurrent ? '0 0 10px rgba(0, 240, 255, 0.08)' : 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>{r.name}</span>
                        <span className="mono-text" style={{
                          fontSize: '9px',
                          background: r.trafficColor + '22',
                          color: r.trafficColor,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          border: `1px solid ${r.trafficColor}33`
                        }}>
                          {r.trafficLevel}
                        </span>
                      </div>
                      <span className="mono-text" style={{ fontSize: '10px', color: 'var(--text-secondary)', display: 'block', marginTop: '2px' }}>
                        {r.distance} Km • {r.duration} Mins
                      </span>
                    </div>
                    {isCurrent ? (
                      <span className="mono-text" style={{ fontSize: '10px', color: 'var(--accent-color)', fontWeight: 800 }}>ACTIVE</span>
                    ) : (
                      <button style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-secondary)',
                        fontSize: '10px',
                        cursor: 'pointer',
                        fontWeight: 800,
                        fontFamily: 'var(--font-mono)'
                      }}>
                        SELECT
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
