import dotenv from 'dotenv';
import mongoose from 'mongoose';
import {
  MongoAdmin,
  MongoStudent,
  MongoTeacher,
  MongoSubject,
  MongoAttendance,
  MongoAttendanceSession,
  MongoNotification,
  MongoSystemSettings
} from './src/server/models/mongooseModels.js';

dotenv.config();

async function clearDatabase() {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/attendance';
  console.log(`Clearing DB to trigger re-seed. Connecting to: ${MONGODB_URI}`);
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB, dropping collections...");

    await MongoAdmin.deleteMany({});
    await MongoTeacher.deleteMany({});
    await MongoStudent.deleteMany({});
    await MongoSubject.deleteMany({});
    await MongoAttendance.deleteMany({});
    await MongoAttendanceSession.deleteMany({});
    await MongoNotification.deleteMany({});
    await MongoSystemSettings.deleteMany({});

    console.log("Collections cleared successfully! Dropping finished.");
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  } catch (err) {
    console.error("Database clear failed:", err);
  }
}

clearDatabase();
