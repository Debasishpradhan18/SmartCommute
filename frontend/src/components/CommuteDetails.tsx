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

  if (!route) {
    return (
      <div className="map-card-overlay glass-panel empty-state">
        <Compass size={24} style={{ marginBottom: '8px', color: 'var(--text-muted)' }} />
        <p>Calculate a route to view traffic estimations, carpool matching, and destination parking.</p>
      </div>
    );
  }

  // Calculate simulated green savings (CO2)
  const soloCo2 = (parseFloat(route.distance) * 0.12).toFixed(1);
  const sharedCo2 = (parseFloat(route.distance) * 0.04).toFixed(1);
  const savingsCo2 = (parseFloat(soloCo2) - parseFloat(sharedCo2)).toFixed(1);

  return (
    <div className="map-card-overlay glass-panel">
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
          style={{ position: 'relative' }}
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
            <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '2px' }}>{route.name}</h4>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Status: Active Navigation</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '11px', marginBottom: '4px' }}>
                <Clock size={14} />
                <span>EST. TIME</span>
              </div>
              <div style={{ fontSize: '20px', fontWeight: 800 }}>{route.duration} mins</div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '11px', marginBottom: '4px' }}>
                <Route size={14} />
                <span>DISTANCE</span>
              </div>
              <div style={{ fontSize: '20px', fontWeight: 800 }}>{route.distance} km</div>
            </div>
          </div>

          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px', 
            background: route.trafficLevel === 'low' ? 'rgba(16, 185, 129, 0.1)' : 
                        route.trafficLevel === 'medium' ? 'rgba(245, 158, 11, 0.1)' : 
                        'rgba(239, 68, 68, 0.1)',
            padding: '12px', 
            borderRadius: '8px',
            border: `1px solid ${route.trafficColor}33`
          }}>
            <AlertCircle size={18} style={{ color: route.trafficColor }} />
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, textTransform: 'capitalize', color: route.trafficColor }}>
                {route.trafficLevel} Traffic
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                {route.trafficLevel === 'low' ? 'Smooth flow, no delays detected.' : 
                 route.trafficLevel === 'medium' ? 'Minor congestion ahead. Stay alert.' : 
                 'Heavy delays. Alternative routes suggested.'}
              </div>
            </div>
          </div>

          <div style={{ 
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05), rgba(99, 102, 241, 0.05))',
            padding: '12px', 
            borderRadius: '8px',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <Award size={18} style={{ color: 'var(--traffic-low)' }} />
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700 }}>Eco-Impact Savings</div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                Carpooling on this route saves <strong style={{ color: 'var(--traffic-low)' }}>{savingsCo2} kg of CO2</strong> compared to solo driving.
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'carpool' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Car size={16} style={{ color: 'var(--accent-color)' }} />
            <h4 style={{ fontSize: '13px', fontWeight: 700 }}>Available Carpools Heading Your Way</h4>
          </div>
          {carpools.length === 0 ? (
            <div className="empty-state">No active carpool offers match this route.</div>
          ) : (
            <div style={{ display: 'flex', flexSide: 'column', flexDirection: 'column' }}>
              {carpools.map((driver, idx) => (
                <div key={idx} className="carpool-option">
                  <img src={driver.avatar} alt={driver.driver} className="driver-avatar" />
                  <div>
                    <div className="driver-name">{driver.driver}</div>
                    <div className="driver-sub">{driver.vehicle}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      <Star size={12} fill="#F59E0B" color="#F59E0B" />
                      <span>{driver.rating}</span>
                      <span>•</span>
                      <span>{driver.eta}</span>
                    </div>
                  </div>
                  <div className="driver-pricing">
                    <div className="driver-cost">${driver.cost}</div>
                    <button style={{
                      marginTop: '4px',
                      background: 'var(--accent-color)',
                      border: 'none',
                      borderRadius: '4px',
                      color: '#ffffff',
                      padding: '3px 8px',
                      fontSize: '10px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}>
                      Book
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'parking' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Compass size={16} style={{ color: 'var(--accent-color)' }} />
            <h4 style={{ fontSize: '13px', fontWeight: 700 }}>Parking Near Destination</h4>
          </div>
          {parking.length === 0 ? (
            <div className="empty-state">No parking garage information available.</div>
          ) : (
            <div>
              {parking.map((spot, idx) => (
                <div key={idx} className="parking-spot">
                  <div>
                    <div className="parking-name">{spot.name}</div>
                    <div className="parking-meta">{spot.distance} • {spot.rate}</div>
                  </div>
                  <div className="parking-availability">
                    <span className={`parking-occupancy ${spot.status}`}>
                      {spot.occupancy} Full
                    </span>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {spot.status === 'success' ? 'Plenty Spaces' : 'Limited Spaces'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'ai' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Congestion Predictor */}
          <div style={{
            background: 'rgba(255,255,255,0.02)',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid var(--glass-border)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              {aiPredictions?.congestionTrend.trend === 'increase' ? (
                <TrendingUp size={16} style={{ color: 'var(--traffic-heavy)' }} />
              ) : aiPredictions?.congestionTrend.trend === 'decrease' ? (
                <TrendingDown size={16} style={{ color: 'var(--traffic-low)' }} />
              ) : (
                <Clock3 size={16} style={{ color: 'var(--text-muted)' }} />
              )}
              <h4 style={{ fontSize: '13px', fontWeight: 700, margin: 0 }}>
                Congestion Trend (Next 30 Mins)
              </h4>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '4px' }}>
              <span style={{
                fontSize: '18px',
                fontWeight: 800,
                color: aiPredictions?.congestionTrend.trend === 'increase' ? 'var(--traffic-heavy)' :
                       aiPredictions?.congestionTrend.trend === 'decrease' ? 'var(--traffic-low)' : 'var(--text-secondary)'
              }}>
                {aiPredictions?.congestionTrend.trend === 'increase' ? '+' : aiPredictions?.congestionTrend.trend === 'decrease' ? '-' : ''}
                {aiPredictions?.congestionTrend.percentage}%
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                predicted {aiPredictions?.congestionTrend.trend}
              </span>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4' }}>
              {aiPredictions?.congestionTrend.message}
            </p>
          </div>

          {/* Best Departure Time */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(16, 185, 129, 0.05))',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid rgba(99, 102, 241, 0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <Clock size={16} style={{ color: '#818CF8' }} />
              <h4 style={{ fontSize: '13px', fontWeight: 700, margin: 0 }}>Optimal Departure Time</h4>
            </div>
            {aiPredictions && aiPredictions.bestDepartureTime.offsetMinutes > 0 ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 800, color: '#818CF8' }}>
                    In {aiPredictions.bestDepartureTime.offsetMinutes} mins
                  </span>
                  <span style={{
                    fontSize: '10px',
                    background: 'rgba(16, 185, 129, 0.2)',
                    color: 'var(--traffic-low)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontWeight: 700
                  }}>
                    Save {aiPredictions.bestDepartureTime.savingsMinutes} mins
                  </span>
                </div>
                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4' }}>
                  {aiPredictions.bestDepartureTime.message}
                </p>
              </div>
            ) : (
              <div>
                <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--traffic-low)', display: 'block', marginBottom: '4px' }}>
                  Leave Immediately
                </span>
                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4' }}>
                  {aiPredictions?.bestDepartureTime.message}
                </p>
              </div>
            )}
          </div>

          {/* Alternative Routes Comparison */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <Route size={16} style={{ color: 'var(--accent-color)' }} />
              <h4 style={{ fontSize: '13px', fontWeight: 700, margin: 0 }}>Alternative Route Advisor</h4>
            </div>
            
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '10px', lineHeight: '1.4', fontStyle: 'italic' }}>
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
                      background: isCurrent ? 'rgba(99, 102, 241, 0.08)' : 'rgba(255,255,255,0.02)',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: `1px solid ${isCurrent ? 'var(--accent-color)' : 'var(--glass-border)'}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700 }}>{r.name}</span>
                        <span style={{
                          fontSize: '9px',
                          background: r.trafficColor + '22',
                          color: r.trafficColor,
                          padding: '1px 4px',
                          borderRadius: '3px',
                          fontWeight: 700,
                          textTransform: 'uppercase'
                        }}>
                          {r.trafficLevel}
                        </span>
                      </div>
                      <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                        {r.distance} km • {r.duration} mins
                      </span>
                    </div>
                    {isCurrent ? (
                      <span style={{ fontSize: '10px', color: '#818CF8', fontWeight: 700 }}>Active</span>
                    ) : (
                      <button style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        fontSize: '10px',
                        cursor: 'pointer',
                        padding: '2px 4px',
                        fontWeight: 600
                      }}>
                        Select
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
