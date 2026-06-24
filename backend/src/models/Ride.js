const mongoose = require('mongoose');
const { getDBType } = require('../config/db.js');
const { readJsonDb, writeJsonDb } = require('./User.js');

// Mongoose Schema for Ride
const RideSchema = new mongoose.Schema({
  driver: { type: String, required: true },
  from: { type: String, required: true },
  to: { type: String, required: true },
  seats: { type: Number, required: true, default: 1 },
  price: { type: Number, required: true, default: 0 },
  riders: { type: [String], default: [] },
  messages: [
    {
      sender: { type: String, required: true },
      text: { type: String, required: true },
      createdAt: { type: Date, default: Date.now }
    }
  ],
  createdAt: { type: Date, default: Date.now }
});

let MongooseRide;
try {
  MongooseRide = mongoose.model('Ride', RideSchema);
} catch (e) {
  MongooseRide = mongoose.models.Ride;
}

// Dual-mode database operations for Ride
const Ride = {
  create: async (rideData) => {
    if (getDBType() && MongooseRide) {
      return await MongooseRide.create(rideData);
    } else {
      const db = readJsonDb();
      const newRide = {
        id: Math.random().toString(36).substring(2, 15),
        driver: rideData.driver,
        from: rideData.from,
        to: rideData.to,
        seats: Number(rideData.seats),
        price: Number(rideData.price),
        riders: [],
        messages: [],
        createdAt: new Date().toISOString()
      };
      db.rides = db.rides || [];
      db.rides.push(newRide);
      writeJsonDb(db);
      return { ...newRide, _id: newRide.id };
    }
  },

  findAll: async () => {
    if (getDBType() && MongooseRide) {
      return await MongooseRide.find({});
    } else {
      const db = readJsonDb();
      return db.rides || [];
    }
  },

  findById: async (id) => {
    if (getDBType() && MongooseRide) {
      return await MongooseRide.findById(id);
    } else {
      const db = readJsonDb();
      const ride = db.rides.find(r => r.id === id);
      return ride ? { ...ride, _id: ride.id } : null;
    }
  },

  join: async (rideId, riderEmail) => {
    if (getDBType() && MongooseRide) {
      const ride = await MongooseRide.findById(rideId);
      if (ride && ride.seats > 0 && !ride.riders.includes(riderEmail)) {
        ride.seats -= 1;
        ride.riders.push(riderEmail);
        await ride.save();
        return ride;
      }
      return null;
    } else {
      const db = readJsonDb();
      const rideIdx = db.rides.findIndex(r => r.id === rideId);
      if (rideIdx !== -1) {
        const ride = db.rides[rideIdx];
        if (ride.seats > 0 && !ride.riders.includes(riderEmail)) {
          ride.seats -= 1;
          ride.riders.push(riderEmail);
          writeJsonDb(db);
          return { ...ride, _id: ride.id };
        }
      }
      return null;
    }
  },

  addMessage: async (rideId, sender, text) => {
    const newMessage = {
      sender,
      text,
      createdAt: new Date().toISOString()
    };

    if (getDBType() && MongooseRide) {
      return await MongooseRide.findByIdAndUpdate(
        rideId,
        { $push: { messages: newMessage } },
        { new: true }
      );
    } else {
      const db = readJsonDb();
      const rideIdx = db.rides.findIndex(r => r.id === rideId);
      if (rideIdx !== -1) {
        db.rides[rideIdx].messages = db.rides[rideIdx].messages || [];
        db.rides[rideIdx].messages.push(newMessage);
        writeJsonDb(db);
        return { ...db.rides[rideIdx], _id: db.rides[rideIdx].id };
      }
      return null;
    }
  }
};

module.exports = {
  Ride
};
