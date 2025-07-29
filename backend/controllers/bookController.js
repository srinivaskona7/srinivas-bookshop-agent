import Book from '../models/book.js';
import logger from '../config/logger.js';

export const getBooks = async (req, res) => {
  try {
    const books = await Book.find().sort({ createdAt: -1 });
    res.json(books);
  } catch (error) {
    logger.error('Get books error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};