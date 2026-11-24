import mongoose, { Schema, Types } from 'mongoose';

export interface NoteDoc {
  _id: Types.ObjectId;
  caseId: number;
  authorId: number;
  authorName: string;
  body: string;
  createdAt: Date;
}

const NoteSchema = new Schema<NoteDoc>(
  {
    caseId: { type: Number, required: true, ref: 'Case' },
    authorId: { type: Number, required: true, ref: 'User' },
    authorName: { type: String, required: true, maxlength: 100 },
    body: { type: String, required: true, maxlength: 2000 },
  },
  { timestamps: { createdAt: true, updatedAt: false }, versionKey: false },
);

NoteSchema.index({ caseId: 1, createdAt: 1 });

export const NoteModel =
  (mongoose.models.Note as mongoose.Model<NoteDoc>) ?? mongoose.model<NoteDoc>('Note', NoteSchema, 'notes');
