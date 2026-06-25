const express = require('express');
const { Parking, Reservation } = require('../models/Parking.js');
const { User } = require('../models/User.js');
const { authMiddleware } = require('../middleware/auth.js');

const router = express.Router();

const CITY_COORDS = {
  bhubaneswar: [20.2961, 85.8245],
  cuttack: [20.4625, 85.8830],
  puri: [19.8134, 85.8315],
  rourkela: [22.2604, 84.8536],
  sambalpur: [21.4653, 83.9757],
  berhampur: [19.3000, 84.8500],
  balasore: [21.4950, 86.9317],
  angul: [20.8400, 85.1000],
  bhadrak: [21.0500, 86.5000],
  jajpur: [20.8500, 86.3333],
  jagatsinghpur: [20.2700, 86.1700],
  paradeep: [20.3164, 86.6085],
  kendrapara: [20.5000, 86.4200],
  dhenkanal: [20.6621, 85.6000],
  koraput: [18.8100, 82.7200],
  keonjhar: [21.6289, 85.5817],
  baripada: [21.9320, 86.7516],
  rayagada: [19.1689, 83.4150],
  jharsuguda: [21.8550, 84.0300],
  phulbani: [20.4700, 84.2300]
};

// Seed helper for mock parking garages
async function seedGaragesForCity(city) {
  const cleanCity = city.trim().toLowerCase();
  const baseCoords = CITY_COORDS[cleanCity] || [20.2961, 85.8245]; // Fallback to Bhubaneswar

  const garagesToSeed = [
    {
      name: `${city.charAt(0).toUpperCase() + city.slice(1)} Central Plaza Parking`,
      city: cleanCity,
      coords: [baseCoords[0] + 0.005, baseCoords[1] - 0.003],
      totalSlots: 60,
      availableSlots: 22,
      price: 20
    },
    {
      name: `${city.charAt(0).toUpperCase() + city.slice(1)} Park-N-Go Garage`,
      city: cleanCity,
      coords: [baseCoords[0] - 0.004, baseCoords[1] + 0.006],
      totalSlots: 100,
      availableSlots: 65,
      price: 15
    },
    {
      name: `${city.charAt(0).toUpperCase() + city.slice(1)} Premium Safe Lot`,
      city: cleanCity,
      coords: [baseCoords[0] + 0.002, baseCoords[1] + 0.004],
      totalSlots: 40,
      availableSlots: 8,
      price: 30
    }
  ];

  const seeded = [];
  for (const g of garagesToSeed) {
    const created = await Parking.create(g);
    seeded.push(created);
  }
  return seeded;
}

// GET / - Search garages by city name
router.get('/', authMiddleware, async (req, res) => {
  const { city } = req.query;
  if (!city) {
    return res.status(400).json({ message: 'City parameter is required' });
  }

  const cleanCity = city.trim().toLowerCase();
  if (!CITY_COORDS[cleanCity]) {
    return res.status(400).json({ message: 'Currently SmartCommute supports only Odisha.' });
  }

  try {
    let garages = await Parking.findByCity(city);
    // If no garages exist in database for this city, seed them on-the-fly!
    if (garages.length === 0) {
      garages = await seedGaragesForCity(city);
    }
    res.json(garages);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving parking garages', error: err.message });
  }
});

// GET /reservations - Get logged in user's active bookings
router.get('/reservations', authMiddleware, async (req, res) => {
  try {
    const bookings = await Reservation.findByUser(req.user.id);
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving reservations', error: err.message });
  }
});

// POST /:id/reserve - Book a parking spot
router.post('/:id/reserve', authMiddleware, async (req, res) => {
  const garageId = req.params.id;

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const garage = await Parking.findById(garageId);
    if (!garage) {
      return res.status(404).json({ message: 'Parking garage not found' });
    }

    if (garage.availableSlots <= 0) {
      return res.status(400).json({ message: 'This parking garage is fully occupied' });
    }

    // Decrement vacancy
    const updatedGarage = await Parking.updateVacancy(garageId, -1);

    // Create reservation ticket
    const slotNumber = `A-${Math.floor(Math.random() * garage.totalSlots) + 1}`;
    const booking = await Reservation.create({
      userId: user._id,
      userEmail: user.email,
      garageId: garage._id,
      garageName: garage.name,
      slotNumber
    });

    res.status(201).json({
      message: 'Spot reserved successfully',
      booking,
      garage: updatedGarage
    });
  } catch (err) {
    res.status(500).json({ message: 'Error reserving parking slot', error: err.message });
  }
});

// POST /reservations/:id/cancel - Cancel a booking
router.post('/reservations/:id/cancel', authMiddleware, async (req, res) => {
  const reservationId = req.params.id;

  try {
    const booking = await Reservation.findById(reservationId);
    if (!booking) {
      return res.status(404).json({ message: 'Reservation ticket not found' });
    }

    if (booking.userId !== req.user.id) {
      return res.status(403).json({ message: 'You are not authorized to cancel this booking' });
    }

    // Delete reservation log
    await Reservation.delete(reservationId);

    // Increment vacancy in the garage
    const updatedGarage = await Parking.updateVacancy(booking.garageId, 1);

    res.json({
      message: 'Booking cancelled successfully',
      garage: updatedGarage
    });
  } catch (err) {
    res.status(500).json({ message: 'Error cancelling reservation', error: err.message });
  }
});

module.exports = router;
