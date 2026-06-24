import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, History, Search } from 'lucide-react';
import { API_URL } from '../config';

interface RouteSearchProps {
  token: string;
  onPlanSuccess: (data: any) => void;
  onPlanStart: () => void;
  onPlanError: (err: string) => void;
  recentSearches: any[];
  fetchHistory: () => void;
}

export default function RouteSearch({
  token,
  onPlanSuccess,
  onPlanStart,
  onPlanError,
  recentSearches,
  fetchHistory
}: RouteSearchProps) {
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [sourceSuggestions, setSourceSuggestions] = useState<string[]>([]);
  const [destSuggestions, setDestSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch autocomplete suggestions for Source
  useEffect(() => {
    if (source.length < 2) {
      setSourceSuggestions([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      try {
        const res = await fetch(`${API_URL}/api/commute/suggestions?q=${source}`);
        const data = await res.json();
        setSourceSuggestions(data);
      } catch (err) {
        console.error('Suggestions error:', err);
      }
    }, 200);
    return () => clearTimeout(delayDebounce);
  }, [source]);

  // Fetch autocomplete suggestions for Destination
  useEffect(() => {
    if (destination.length < 2) {
      setDestSuggestions([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      try {
        const res = await fetch(`${API_URL}/api/commute/suggestions?q=${destination}`);
        const data = await res.json();
        setDestSuggestions(data);
      } catch (err) {
        console.error('Suggestions error:', err);
      }
    }, 200);
    return () => clearTimeout(delayDebounce);
  }, [destination]);

  const handlePlanRoute = async (srcVal: string, destVal: string) => {
    if (!srcVal || !destVal) return;
    
    onPlanStart();
    setLoading(true);
    
    try {
      const res = await fetch(`${API_URL}/api/commute/plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: srcVal, destination: destVal })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Route planning failed');
      }

      onPlanSuccess(data);

      // Save to user search history on backend
      const primaryRoute = data.routes[0];
      await fetch(`${API_URL}/api/commute/history`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          source: data.source.name,
          destination: data.destination.name,
          distance: primaryRoute.distance,
          duration: primaryRoute.duration,
          trafficLevel: primaryRoute.trafficLevel
        })
      });

      fetchHistory(); // Refresh history panel
    } catch (err: any) {
      onPlanError(err.message || 'Could not map these locations. Please try another address.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handlePlanRoute(source, destination);
  };

  return (
    <div className="routes-section">
      <div className="search-card glass-panel">
        <h3 className="section-title">
          <Navigation size={18} className="text-accent" />
          Plan Your Commute
        </h3>
        
        <form onSubmit={handleSubmit}>
          <div className="search-input-wrapper">
            <div className="search-connector"></div>
            <MapPin size={18} className="input-icon-left" style={{ color: 'var(--traffic-low)' }} />
            <input
              type="text"
              className="search-input-field"
              placeholder="Enter Start Point (e.g. London)"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              required
            />
            {sourceSuggestions.length > 0 && (
              <div className="suggestions-popup">
                {sourceSuggestions.map((item) => (
                  <div
                    key={item}
                    className="suggestion-item"
                    onClick={() => {
                      setSource(item);
                      setSourceSuggestions([]);
                    }}
                  >
                    {item}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="search-input-wrapper">
            <MapPin size={18} className="input-icon-left" style={{ color: 'var(--traffic-heavy)' }} />
            <input
              type="text"
              className="search-input-field"
              placeholder="Enter Destination (e.g. Mumbai)"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              required
            />
            {destSuggestions.length > 0 && (
              <div className="suggestions-popup">
                {destSuggestions.map((item) => (
                  <div
                    key={item}
                    className="suggestion-item"
                    onClick={() => {
                      setDestination(item);
                      setDestSuggestions([]);
                    }}
                  >
                    {item}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            className="plan-btn"
            disabled={loading || !source.trim() || !destination.trim()}
          >
            <Search size={18} />
            {loading ? 'Optimizing Routes...' : 'Calculate Routes'}
          </button>
        </form>
      </div>

      {recentSearches.length > 0 && (
        <div style={{ marginTop: '24px' }}>
          <h4 className="section-title">
            <History size={16} />
            Recent Commutes
          </h4>
          <div style={{ maxHeight: '200px', overflowY: 'auto', paddingRight: '4px' }}>
            {recentSearches.map((item, idx) => (
              <div
                key={item._id || idx}
                className="history-item"
                onClick={() => {
                  setSource(item.source);
                  setDestination(item.destination);
                  handlePlanRoute(item.source, item.destination);
                }}
              >
                <div className="history-locations">
                  {item.source.split(',')[0]} → {item.destination.split(',')[0]}
                </div>
                <div className="history-meta">
                  <span>{item.distance} km • {item.duration} mins</span>
                  <span 
                    style={{ 
                      color: item.trafficLevel === 'low' ? 'var(--traffic-low)' : 
                             item.trafficLevel === 'medium' ? 'var(--traffic-medium)' : 
                             'var(--traffic-heavy)',
                      textTransform: 'capitalize',
                      fontWeight: 600
                    }}
                  >
                    {item.trafficLevel} Traffic
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
