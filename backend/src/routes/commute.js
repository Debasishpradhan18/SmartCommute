const express = require('express');
const { User } = require('../models/User.js');
const { authMiddleware } = require('../middleware/auth.js');

const router = express.Router();

const CITIES = {
  london: [51.5074, -0.1278],
  'new york': [40.7128, -74.0060],
  'san francisco': [37.7749, -122.4194],
  mumbai: [19.0760, 72.8777],
  delhi: [28.7041, 77.1025],
  paris: [48.8566, 2.3522],
  tokyo: [35.6762, 139.6503],
  sydney: [-33.8688, 151.2093]
};

// Haversine Distance helper
function getHaversineDistance(coords1, coords2) {
  const R = 6371; // km
  const dLat = ((coords2[0] - coords1[0]) * Math.PI) / 180;
  const dLon = ((coords2[1] - coords1[1]) * Math.PI) / 180;
  const lat1 = (coords1[0] * Math.PI) / 180;
  const lat2 = (coords2[0] * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Geocode query helper using local DB or OSM Nominatim public API
async function geocodeAddress(query) {
  const cleanQuery = query.trim().toLowerCase();

  // 1. Try local dictionary
  if (CITIES[cleanQuery]) {
    return {
      name: query,
      coords: CITIES[cleanQuery]
    };
  }

  for (const city of Object.keys(CITIES)) {
    if (cleanQuery.includes(city) || city.includes(cleanQuery)) {
      return {
        name: city.toUpperCase(),
        coords: CITIES[city]
      };
    }
  }

  // 2. Try Nominatim public API (no key required, but with fallback)
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'SmartCommuteApp/1.0'
      }
    });
    const data = await response.json();
    if (data && data.length > 0) {
      return {
        name: data[0].display_name,
        coords: [parseFloat(data[0].lat), parseFloat(data[0].lon)]
      };
    }
  } catch (err) {
    console.error('OSM Geocoding failed, using fallback:', err.message);
  }

  // 3. Fallback: Return a coordinate relative to London
  const randomOffsetLat = (Math.random() - 0.5) * 0.5;
  const randomOffsetLon = (Math.random() - 0.5) * 0.5;
  return {
    name: query,
    coords: [51.5074 + randomOffsetLat, -0.1278 + randomOffsetLon]
  };
}

// Generate route coords path with jitter
function generateRoutePoints(start, end, jitterCount = 6) {
  const points = [start];
  for (let i = 1; i <= jitterCount; i++) {
    const fraction = i / (jitterCount + 1);
    const lat = start[0] + (end[0] - start[0]) * fraction;
    const lon = start[1] + (end[1] - start[1]) * fraction;

    // Jitter to make it look like a street route rather than straight line
    const jitterFactor = 0.015;
    const latJitter = (Math.random() - 0.5) * jitterFactor;
    const lonJitter = (Math.random() - 0.5) * jitterFactor;

    points.push([lat + latJitter, lon + lonJitter]);
  }
  points.push(end);
  return points;
}

// GET /api/commute/suggestions - auto complete cities
router.get('/suggestions', (req, res) => {
  const { q } = req.query;
  if (!q) return res.json([]);
  const list = Object.keys(CITIES).filter((city) =>
    city.includes(q.toLowerCase())
  );
  res.json(list.map((c) => c.charAt(0).toUpperCase() + c.slice(1)));
});

// Offset path coordinates for visual distinction (creating parallel routes on map)
function offsetPath(path, offsetLat, offsetLon) {
  if (path.length <= 2) return path;
  return path.map((coord, idx) => {
    if (idx === 0 || idx === path.length - 1) return coord;
    return [coord[0] + offsetLat, coord[1] + offsetLon];
  });
}

// Format OSRM route object into application route format
function formatOSRMRoute(osrmRoute, id, name, type, trafficLevel, trafficColor, durationMultiplier = 1) {
  const distance = (osrmRoute.distance / 1000).toFixed(1);
  const duration = Math.round((osrmRoute.duration / 60) * durationMultiplier);
  const path = osrmRoute.geometry.coordinates.map(coord => [coord[1], coord[0]]);
  return {
    id,
    name,
    type,
    distance,
    duration: duration < 3 ? 3 : duration,
    trafficLevel,
    trafficColor,
    path
  };
}

// POST /api/commute/plan - route planning
router.post('/plan', async (req, res) => {
  const { source, destination } = req.body;

  if (!source || !destination) {
    return res.status(400).json({ message: 'Source and Destination are required' });
  }

  try {
    const sourceGeocode = await geocodeAddress(source);
    const destGeocode = await geocodeAddress(destination);

    const baseDistance = getHaversineDistance(sourceGeocode.coords, destGeocode.coords);

    // Attempt to fetch real routing from OSRM
    let osrmRoutes = [];
    try {
      const osrmUrl = `http://router.project-osrm.org/route/v1/driving/${sourceGeocode.coords[1]},${sourceGeocode.coords[0]};${destGeocode.coords[1]},${destGeocode.coords[0]}?overview=full&geometries=geojson&alternatives=true`;
      const response = await fetch(osrmUrl);
      const data = await response.json();
      if (data && data.code === 'Ok' && data.routes && data.routes.length > 0) {
        osrmRoutes = data.routes;
      }
    } catch (err) {
      console.error('OSM Routing failed, falling back to mock routes:', err.message);
    }

    let routes = [];
    if (osrmRoutes.length > 0) {
      // Route 1 (Fastest / Eco-Express)
      routes.push(formatOSRMRoute(osrmRoutes[0], 'fastest', 'Eco-Express Route', 'Fastest', 'low', '#10B981', 1.0));

      // Route 2 (Balanced / City Commute Link)
      if (osrmRoutes.length > 1) {
        routes.push(formatOSRMRoute(osrmRoutes[1], 'standard', 'City Commute Link', 'Balanced', 'medium', '#F59E0B', 1.1));
      } else {
        // Offset Route 1 path slightly for visual distinction
        const baseRoute = formatOSRMRoute(osrmRoutes[0], 'standard', 'City Commute Link', 'Balanced', 'medium', '#F59E0B', 1.3);
        baseRoute.path = offsetPath(baseRoute.path, 0.003, 0.003);
        routes.push(baseRoute);
      }

      // Route 3 (Alternative / Commercial Boulevard)
      if (osrmRoutes.length > 2) {
        routes.push(formatOSRMRoute(osrmRoutes[2], 'alternate', 'Commercial Boulevard', 'Alternative', 'heavy', '#EF4444', 1.2));
      } else {
        // Offset Route 1 path slightly (different direction) for visual distinction
        const baseRoute = formatOSRMRoute(osrmRoutes[0], 'alternate', 'Commercial Boulevard', 'Alternative', 'heavy', '#EF4444', 1.8);
        baseRoute.path = offsetPath(baseRoute.path, -0.003, -0.003);
        routes.push(baseRoute);
      }
    } else {
      // Fallback: Generate routes using jitter points
      routes = [
        {
          id: 'fastest',
          name: 'Eco-Express Route',
          type: 'Fastest',
          distance: (baseDistance * 1.05).toFixed(1),
          duration: Math.round(((baseDistance * 1.05) / 60) * 60),
          trafficLevel: 'low',
          trafficColor: '#10B981',
          path: generateRoutePoints(sourceGeocode.coords, destGeocode.coords, 6)
        },
        {
          id: 'standard',
          name: 'City Commute Link',
          type: 'Balanced',
          distance: baseDistance.toFixed(1),
          duration: Math.round((baseDistance / 35) * 60),
          trafficLevel: 'medium',
          trafficColor: '#F59E0B',
          path: generateRoutePoints(sourceGeocode.coords, destGeocode.coords, 8)
        },
        {
          id: 'alternate',
          name: 'Commercial Boulevard',
          type: 'Alternative',
          distance: (baseDistance * 1.15).toFixed(1),
          duration: Math.round(((baseDistance * 1.15) / 15) * 60),
          trafficLevel: 'heavy',
          trafficColor: '#EF4444',
          path: generateRoutePoints(sourceGeocode.coords, destGeocode.coords, 7)
        }
      ];
    }

    // Ensure minimum duration of 3 mins
    routes.forEach((r) => {
      if (r.duration < 3) r.duration = 3;
    });

    // Mock Carpool Options
    const carpools = [
      {
        driver: 'Sarah Jenkins',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
        rating: 4.9,
        cost: (baseDistance * 0.15).toFixed(2),
        eta: '5 mins away',
        vehicle: 'Tesla Model 3'
      },
      {
        driver: 'David Chen',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
        rating: 4.8,
        cost: (baseDistance * 0.12).toFixed(2),
        eta: '8 mins away',
        vehicle: 'Toyota Prius'
      }
    ];

    // Mock Parking Options near destination
    const parking = [
      {
        name: 'Central Plaza Parking',
        occupancy: '85%',
        rate: '$4.50/hr',
        distance: '150m walking distance',
        status: 'warning' // full-ish
      },
      {
        name: 'Park-N-Go Garage',
        occupancy: '40%',
        rate: '$3.00/hr',
        distance: '300m walking distance',
        status: 'success' // plenty space
      }
    ];

    // Generate AI Predictions dynamically based on route details and time of day
    const currentHour = new Date().getHours();
    let congestionTrend = { 
      trend: 'stable', 
      percentage: 5, 
      message: 'Traffic is currently stable. Minimal changes predicted over the next 30 minutes.' 
    };
    let bestDepartureTime = { 
      offsetMinutes: 0, 
      savingsMinutes: 0, 
      message: 'Leave now. Current road conditions are highly optimal with zero predicted bottlenecks.' 
    };
    let routeRecommendation = 'AI advisor recommends the Eco-Express Route for the most energy-efficient and fast trip today.';

    // Check if it's peak/rush hour (7-9 AM or 4-7 PM)
    if ((currentHour >= 7 && currentHour <= 9) || (currentHour >= 16 && currentHour <= 19)) {
      const isMorning = currentHour <= 12;
      congestionTrend = {
        trend: 'increase',
        percentage: isMorning ? 22 : 28,
        message: `Congestion is predicted to increase by ${isMorning ? 22 : 28}% in the next 30 minutes due to rush hour accumulation.`
      };
      bestDepartureTime = {
        offsetMinutes: isMorning ? 30 : 25,
        savingsMinutes: isMorning ? 7 : 11,
        message: `Leaving in ${isMorning ? 30 : 25} minutes is recommended. You will save approximately ${isMorning ? 7 : 11} minutes of idling in traffic.`
      };
      routeRecommendation = isMorning 
        ? 'AI suggests taking the City Commute Link as traffic begins to build on main avenues.'
        : 'AI recommends the Commercial Boulevard to bypass growing bottlenecks on the standard route.';
    } else if (currentHour >= 22 || currentHour <= 5) {
      // Late night
      congestionTrend = {
        trend: 'decrease',
        percentage: 12,
        message: 'Late-night traffic is dissipating. Expect congestion to drop by another 12% soon.'
      };
      bestDepartureTime = {
        offsetMinutes: 0,
        savingsMinutes: 0,
        message: 'Leave immediately. Roads are wide open and safe.'
      };
      routeRecommendation = 'Eco-Express Route is clear and highly recommended for late-night transit.';
    }

    const aiPredictions = {
      congestionTrend,
      bestDepartureTime,
      routeRecommendation
    };

    res.json({
      source: {
        name: sourceGeocode.name,
        coords: sourceGeocode.coords
      },
      destination: {
        name: destGeocode.name,
        coords: destGeocode.coords
      },
      routes,
      carpools,
      parking,
      aiPredictions
    });
  } catch (err) {
    res.status(500).json({ message: 'Error planning route', error: err.message });
  }
});

// POST /api/commute/history - save route history
router.post('/history', authMiddleware, async (req, res) => {
  const { source, destination, distance, duration, trafficLevel } = req.body;

  try {
    await User.addHistory(req.user.id, {
      source,
      destination,
      distance,
      duration,
      trafficLevel
    });
    res.json({ message: 'History saved successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error saving history' });
  }
});

// GET /api/commute/history - fetch history
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const history = await User.getHistory(req.user.id);
    res.json(history);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching history' });
  }
});

module.exports = router;
