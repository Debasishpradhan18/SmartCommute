const mongoose = require('mongoose');
const { getDBType } = require('../config/db.js');
const { readJsonDb, writeJsonDb } = require('./User.js');

// Mongoose Schemas
const ParkingSchema = new mongoose.Schema({
  name: { type: String, required: true },
  city: { type: String, required: true },
  coords: { type: [Number], required: true }, // [lat, lon]
  totalSlots: { type: Number, required: true },
  availableSlots: { type: Number, required: true },
  price: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

const ReservationSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  userEmail: { type: String, required: true },
  garageId: { type: String, required: true },
  garageName: { type: String, required: true },
  slotNumber: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

let MongooseParking;
let MongooseReservation;
try {
  MongooseParking = mongoose.model('Parking', ParkingSchema);
  MongooseReservation = mongoose.model('Reservation', ReservationSchema);
} catch (e) {
  MongooseParking = mongoose.models.Parking;
  MongooseReservation = mongoose.models.Reservation;
}

// Dual-mode database operations
const Parking = {
  create: async (data) => {
    if (getDBType() && MongooseParking) {
      return await MongooseParking.create(data);
    } else {
      const db = readJsonDb();
      const newGarage = {
        id: Math.random().toString(36).substring(2, 15),
        name: data.name,
        city: data.city.toLowerCase(),
        coords: data.coords,
        totalSlots: Number(data.totalSlots),
        availableSlots: Number(data.availableSlots),
        price: Number(data.price),
        createdAt: new Date().toISOString()
      };
      db.parking = db.parking || [];
      db.parking.push(newGarage);
      writeJsonDb(db);
      return { ...newGarage, _id: newGarage.id };
    }
  },

  findByCity: async (city) => {
    const cleanCity = city.trim().toLowerCase();
    if (getDBType() && MongooseParking) {
      return await MongooseParking.find({ city: cleanCity });
    } else {
      const db = readJsonDb();
      db.parking = db.parking || [];
      return db.parking.filter(p => p.city === cleanCity);
    }
  },

  findById: async (id) => {
    if (getDBType() && MongooseParking) {
      return await MongooseParking.findById(id);
    } else {
      const db = readJsonDb();
      db.parking = db.parking || [];
      const item = db.parking.find(p => p.id === id);
      return item ? { ...item, _id: item.id } : null;
    }
  },

  updateVacancy: async (id, change) => {
    if (getDBType() && MongooseParking) {
      const garage = await MongooseParking.findById(id);
      if (garage) {
        garage.availableSlots = Math.max(0, Math.min(garage.totalSlots, garage.availableSlots + change));
        await garage.save();
        return garage;
      }
      return null;
    } else {
      const db = readJsonDb();
      db.parking = db.parking || [];
      const idx = db.parking.findIndex(p => p.id === id);
      if (idx !== -1) {
        const p = db.parking[idx];
        p.availableSlots = Math.max(0, Math.min(p.totalSlots, p.availableSlots + change));
        writeJsonDb(db);
        return { ...p, _id: p.id };
      }
      return null;
    }
  }
};

const Reservation = {
  create: async (data) => {
    if (getDBType() && MongooseReservation) {
      return await MongooseReservation.create(data);
    } else {
      const db = readJsonDb();
      const newRes = {
        id: Math.random().toString(36).substring(2, 15),
        userId: data.userId,
        userEmail: data.userEmail,
        garageId: data.garageId,
        garageName: data.garageName,
        slotNumber: data.slotNumber,
        createdAt: new Date().toISOString()
      };
      db.reservations = db.reservations || [];
      db.reservations.push(newRes);
      writeJsonDb(db);
      return { ...newRes, _id: newRes.id };
    }
  },

  findByUser: async (userId) => {
    if (getDBType() && MongooseReservation) {
      return await MongooseReservation.find({ userId });
    } else {
      const db = readJsonDb();
      db.reservations = db.reservations || [];
      return db.reservations.filter(r => r.userId === userId);
    }
  },

  findById: async (id) => {
    if (getDBType() && MongooseReservation) {
      return await MongooseReservation.findById(id);
    } else {
      const db = readJsonDb();
      db.reservations = db.reservations || [];
      const item = db.reservations.find(r => r.id === id);
      return item ? { ...item, _id: item.id } : null;
    }
  },

  delete: async (id) => {
    if (getDBType() && MongooseReservation) {
      return await MongooseReservation.findByIdAndDelete(id);
    } else {
      const db = readJsonDb();
      db.reservations = db.reservations || [];
      const idx = db.reservations.findIndex(r => r.id === id);
      if (idx !== -1) {
        const deleted = db.reservations.splice(idx, 1)[0];
        writeJsonDb(db);
        return { ...deleted, _id: deleted.id };
      }
      return null;
    }
  }
};

module.exports = {
  Parking,
  Reservation
};
