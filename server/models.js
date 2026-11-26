import mongoose from 'mongoose';

const resumeItemSchema = new mongoose.Schema({
  category: { type: String, required: true, trim: true, maxlength: 100 },
  quantity: { type: String, required: false, trim: true, maxlength: 50 },
  location: { type: String, required:false, maxlength:500 },
  colour: { type: String, required: false, maxlength: 100 },
  description: { type: String, required: false, maxlength: 1000 }
}, { collection: 'resume_items', autoIndex: false });

export const ResumeItem = mongoose.models.ResumeItem || mongoose.model('ResumeItem', resumeItemSchema);
