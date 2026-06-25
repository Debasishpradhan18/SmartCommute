const express = require('express');
const { Ride } = require('../models/Ride.js');
const { User } = require('../models/User.js');
const { authMiddleware } = require('../middleware/auth.js');

const router = express.Router();

// Helper to check if location is in Odisha
async function validateLocationInOdisha(locationName) {
  const clean = locationName.trim().toLowerCase();
  const predefinedCities = [
    'bhubaneswar', 'cuttack', 'puri', 'rourkela', 'sambalpur',
    'berhampur', 'balasore', 'angul', 'bhadrak', 'jajpur',
    'jagatsinghpur', 'paradeep', 'kendrapara', 'dhenkanal', 'koraput',
    'keonjhar', 'baripada', 'rayagada', 'jharsuguda', 'phulbani'
  ];
  
  // 1. Text match with predefined cities
  const matched = predefinedCities.some(city => clean.includes(city));
  if (matched) return true;
  
  // 2. Text match with "odisha" or "orissa"
  if (clean.includes('odisha') || clean.includes('orissa')) return true;
  
  // 3. Call geocoder
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationName)}&format=json&limit=1`;
    const response = await fetch(url, { headers: { 'User-Agent': 'SmartCommuteApp/1.0' } });
    const data = await response.json();
    if (data && data.length > 0) {
      const lat = parseFloat(data[0].lat);
      const lon = parseFloat(data[0].lon);
      const displayName = data[0].display_name.toLowerCase();
      
      const inBounds = lat >= 17.0 && lat <= 23.0 && lon >= 81.0 && lon <= 88.0;
      const hasOdisha = displayName.includes('odisha') || displayName.includes('orissa');
      return inBounds || hasOdisha;
    }
  } catch (err) {
    console.error('Ride geocoding check failed:', err.message);
  }
  return false;
}

// POST / - Create a new ride offer
router.post('/', authMiddleware, async (req, res) => {
  const { from, to, seats, price } = req.body;

  if (!from || !to || !seats || !price) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const fromValid = await validateLocationInOdisha(from);
    const toValid = await validateLocationInOdisha(to);
    if (!fromValid || !toValid) {
      return res.status(400).json({ message: 'Currently SmartCommute supports only Odisha.' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const ride = await Ride.create({
      driver: user.email,
      from,
      to,
      seats: Number(seats),
      price: Number(price)
    });

    res.status(201).json(ride);
  } catch (err) {
    res.status(500).json({ message: 'Error offering ride', error: err.message });
  }
});

// GET / - List all available rides
router.get('/', authMiddleware, async (req, res) => {
  try {
    const allRides = await Ride.findAll();
    // Return rides with remaining seats > 0
    const availableRides = allRides.filter(r => r.seats > 0);
    res.json(availableRides);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving rides', error: err.message });
  }
});

// POST /:id/join - Join a ride
router.post('/:id/join', authMiddleware, async (req, res) => {
  const rideId = req.params.id;

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const ride = await Ride.findById(rideId);
    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    if (ride.driver === user.email) {
      return res.status(400).json({ message: 'You cannot join your own offered ride' });
    }

    const joinedRide = await Ride.join(rideId, user.email);
    if (!joinedRide) {
      return res.status(400).json({ message: 'Could not join ride. It might be full or you already joined.' });
    }

    res.json(joinedRide);
  } catch (err) {
    res.status(500).json({ message: 'Error joining ride', error: err.message });
  }
});

// POST /:id/chat - Send a chat message inside a ride
router.post('/:id/chat', authMiddleware, async (req, res) => {
  const rideId = req.params.id;
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ message: 'Message text is required' });
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const ride = await Ride.findById(rideId);
    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    // Check if user is driver or a joined rider
    const isDriver = ride.driver === user.email;
    const isRider = ride.riders && ride.riders.includes(user.email);
    
    if (!isDriver && !isRider) {
      return res.status(403).json({ message: 'You must join this ride to chat' });
    }

    const updatedRide = await Ride.addMessage(rideId, user.email, text);
    res.json(updatedRide);
  } catch (err) {
    res.status(500).json({ message: 'Error sending message', error: err.message });
  }
});

// GET /:id/chat - Fetch chat logs for a ride
router.get('/:id/chat', authMiddleware, async (req, res) => {
  const rideId = req.params.id;

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const ride = await Ride.findById(rideId);
    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    const isDriver = ride.driver === user.email;
    const isRider = ride.riders && ride.riders.includes(user.email);

    if (!isDriver && !isRider) {
      return res.status(403).json({ message: 'Access denied to ride chat' });
    }

    res.json(ride.messages || []);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching chat messages', error: err.message });
  }
});

module.exports = router;
