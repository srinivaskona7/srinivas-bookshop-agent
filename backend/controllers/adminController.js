import User from '../models/user.js';
import Book from '../models/book.js';
import logger from '../config/logger.js';

export const getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    logger.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    
    const user = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    logger.info(`User role updated: ${user.username} -> ${role}`);
    res.json(user);
  } catch (error) {
    logger.error('Update user role error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createBook = async (req, res) => {
  try {
    const { title, author, description, price } = req.body;
    
    if (!req.files || !req.files.cover || !req.files.pdf) {
      return res.status(400).json({ error: 'Both cover image and PDF file are required' });
    }
    
    const book = new Book({
      title,
      author,
      description,
      price: parseFloat(price),
      coverImageUrl: `/uploads/books/${req.files.cover[0].filename}`,
      bookFileUrl: `/uploads/books/${req.files.pdf[0].filename}`
    });
    
    await book.save();
    logger.info(`New book created: ${title} by ${author}`);
    res.status(201).json(book);
  } catch (error) {
    logger.error('Create book error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};