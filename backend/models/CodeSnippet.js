import mongoose from 'mongoose';

const CodeSnippetSchema = new mongoose.Schema({
  code: { type: String, required: true },
  language: { type: String, required: true },
  output: { type: String },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('CodeSnippet', CodeSnippetSchema); 