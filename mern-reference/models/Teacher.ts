import { Schema, model, Document } from 'mongoose';

export interface ITeacher extends Document {
  fullName: string;
  employeeId: string;
  email: string;
  department: string;
  phoneNumber: string;
  profilePhoto: string;
  createdAt: Date;
  updatedAt: Date;
}

const TeacherSchema = new Schema<ITeacher>({
  fullName: { type: String, required: true },
  employeeId: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  department: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  profilePhoto: { type: String, default: '' },
}, {
  timestamps: true
});

export const Teacher = model<ITeacher>('Teacher', TeacherSchema);
