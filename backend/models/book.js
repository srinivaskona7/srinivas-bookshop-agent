import mongoose from 'mongoose';

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  author: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  coverImageUrl: {
    type: String,
    default: null
  },
  bookFileUrl: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

export default mongoose.model('Book', bookSchema);