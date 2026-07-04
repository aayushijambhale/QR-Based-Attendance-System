import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { MongoAdmin } from '../src/server/models/mongooseModels.js';

async function forceUpdateAdminPassword() {
  await mongoose.connect('mongodb://127.0.0.1:27017/attendance');
  const admin = await MongoAdmin.findOne({ email: 'aayushiadmin@gmail.com' });
  if (admin) {
    const salt = bcrypt.genSaltSync(10);
    const newHash = bcrypt.hashSync('Password123', salt);
    admin.passwordHash = newHash;
    await admin.save();
    console.log('Admin password forcefully updated to Password123!');
  } else {
    console.log('Admin not found!');
  }
  process.exit(0);
}
forceUpdateAdminPassword();
