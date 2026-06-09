import { Schema, model, Document } from 'mongoose';

export interface IQRSession extends Document {
  subjectId: Schema.Types.ObjectId;
  subjectName: string;
  teacherId: Schema.Types.ObjectId;
  teacherName: string;
  generatedTime: Date;
  expiryTime: Date;
  status: 'Active' | 'Expired';
  sessionCode: string;
  createdAt: Date;
}

const QRSessionSchema = new Schema<IQRSession>({
  subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
  subjectName: { type: String, required: true },
  teacherId: { type: Schema.Types.ObjectId, ref: 'Teacher', required: true },
  teacherName: { type: String, required: true },
  generatedTime: { type: Date, default: Date.now },
  expiryTime: { type: Date, required: true },
  status: { type: String, enum: ['Active', 'Expired'], default: 'Active' },
  sessionCode: { type: String, required: true, unique: true },
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

export const QRSession = model<IQRSession>('QRSession', QRSessionSchema);
