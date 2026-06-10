import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { seedDatabase } from './src/server/db.js';
import {
  MongoAdmin,
  MongoTeacher,
  MongoStudent,
  MongoSubject,
  MongoAttendance,
  MongoAttendanceSession,
  MongoNotification,
  MongoSystemSettings
} from './src/server/models/mongooseModels.js';

async function run() {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/attendance';
  console.log(`Connecting to database: ${MONGODB_URI}`);

  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB successfully!");

    console.log("Dropping existing collections for clean seed...");
    await MongoAdmin.deleteMany({});
    await MongoTeacher.deleteMany({});
    await MongoStudent.deleteMany({});
    await MongoSubject.deleteMany({});
    await MongoAttendance.deleteMany({});
    await MongoAttendanceSession.deleteMany({});
    await MongoNotification.deleteMany({});
    await MongoSystemSettings.deleteMany({});
    console.log("Existing data cleared.");

    await seedDatabase();
    console.log("Database seeded successfully with custom cohort!");

    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
    process.exit(0);
  } catch (err) {
    console.error("Database seeding failed:", err);
    process.exit(1);
  }
}

run();
