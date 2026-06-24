const mongoose = require('mongoose');

let isMongoDB = false;

const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI;
  if (!mongoURI) {
    console.warn('⚠️ No MONGODB_URI found in .env. Falling back to local JSON database (db.json)');
    isMongoDB = false;
    return false;
  }

  try {
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 3000
    });
    console.log('🔥 MongoDB connected successfully!');
    isMongoDB = true;
    return true;
  } catch (err) {
    console.error(`❌ MongoDB connection failed: ${err.message}`);
    console.warn('⚠️ Falling back to local JSON database (db.json)');
    isMongoDB = false;
    return false;
  }
};

const getDBType = () => isMongoDB;
const setDBType = (val) => { isMongoDB = val; };

module.exports = {
  connectDB,
  getDBType,
  setDBType
};
