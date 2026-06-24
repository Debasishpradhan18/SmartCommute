const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { getDBType } = require('../config/db.js');

const JSON_DB_PATH = path.join(__dirname, '../../../db.json');

// Mongoose Schema
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  searchHistory: [
    {
      source: String,
      destination: String,
      distance: String,
      duration: String,
      trafficLevel: String,
      createdAt: { type: Date, default: Date.now }
    }
  ]
});

let MongooseUser;
try {
  MongooseUser = mongoose.model('User', UserSchema);
} catch (e) {
  MongooseUser = mongoose.models.User;
}

// JSON DB Helpers
const readJsonDb = () => {
  if (!fs.existsSync(JSON_DB_PATH)) {
    fs.writeFileSync(JSON_DB_PATH, JSON.stringify({ users: [], rides: [] }, null, 2));
  }
  try {
    const data = fs.readFileSync(JSON_DB_PATH, 'utf8');
    const parsed = JSON.parse(data);
    if (!parsed.users) parsed.users = [];
    if (!parsed.rides) parsed.rides = [];
    return parsed;
  } catch (err) {
    return { users: [], rides: [] };
  }
};

const writeJsonDb = (data) => {
  fs.writeFileSync(JSON_DB_PATH, JSON.stringify(data, null, 2));
};

// Dual-mode database interface
const User = {
  findOne: async (query) => {
    if (getDBType() && MongooseUser) {
      return await MongooseUser.findOne(query);
    } else {
      const db = readJsonDb();
      if (query.email) {
        const user = db.users.find(u => u.email.toLowerCase() === query.email.toLowerCase());
        return user ? { ...user, _id: user.id } : null;
      }
      if (query._id || query.id) {
        const id = query._id || query.id;
        const user = db.users.find(u => u.id === id);
        return user ? { ...user, _id: user.id } : null;
      }
      return null;
    }
  },

  findById: async (id) => {
    if (getDBType() && MongooseUser) {
      return await MongooseUser.findById(id);
    } else {
      const db = readJsonDb();
      const user = db.users.find(u => u.id === id);
      return user ? { ...user, _id: user.id } : null;
    }
  },

  create: async (userData) => {
    if (getDBType() && MongooseUser) {
      return await MongooseUser.create(userData);
    } else {
      const db = readJsonDb();
      const newUser = {
        id: Math.random().toString(36).substring(2, 15),
        email: userData.email.toLowerCase(),
        password: userData.password,
        searchHistory: [],
        createdAt: new Date().toISOString()
      };
      db.users.push(newUser);
      writeJsonDb(db);
      return { ...newUser, _id: newUser.id };
    }
  },

  addHistory: async (userId, historyItem) => {
    if (getDBType() && MongooseUser) {
      return await MongooseUser.findByIdAndUpdate(
        userId,
        { $push: { searchHistory: { ...historyItem, createdAt: new Date() } } },
        { new: true }
      );
    } else {
      const db = readJsonDb();
      const userIndex = db.users.findIndex(u => u.id === userId);
      if (userIndex !== -1) {
        const item = {
          ...historyItem,
          id: Math.random().toString(36).substring(2, 9),
          createdAt: new Date().toISOString()
        };
        db.users[userIndex].searchHistory = db.users[userIndex].searchHistory || [];
        db.users[userIndex].searchHistory.push(item);
        writeJsonDb(db);
        return { ...db.users[userIndex], _id: db.users[userIndex].id };
      }
      return null;
    }
  },

  getHistory: async (userId) => {
    if (getDBType() && MongooseUser) {
      const user = await MongooseUser.findById(userId);
      return user ? user.searchHistory : [];
    } else {
      const db = readJsonDb();
      const user = db.users.find(u => u.id === userId);
      return user ? (user.searchHistory || []) : [];
    }
  }
};

module.exports = {
  User,
  readJsonDb,
  writeJsonDb
};
