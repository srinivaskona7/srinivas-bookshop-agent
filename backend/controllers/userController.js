import User from '../models/user.js';
import logger from '../config/logger.js';
import path from 'path';
import fs from 'fs';

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    logger.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateMe = async (req, res) => {
  try {
    const { firstName, lastName, email, passwordHint } = req.body;
    const updateData = {};
    
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (email) updateData.email = email;
    if (passwordHint !== undefined) updateData.passwordHint = passwordHint;
    
    // Handle profile image upload
    if (req.file) {
      // Delete old profile image if exists
      if (req.user.profileImageUrl) {
        const oldImagePath = path.join(process.cwd(), req.user.profileImageUrl);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      
      updateData.profileImageUrl = `/uploads/profile/${req.file.filename}`;
    }
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');
    
    logger.info(`User updated profile: ${user.username}`);
    res.json(user);
  } catch (error) {
    logger.error('Update user error:', error);
    
    if (error.code === 11000) {
      res.status(400).json({ error: 'Email already exists' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};