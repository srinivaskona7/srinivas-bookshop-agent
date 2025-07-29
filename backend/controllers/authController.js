import jwt from 'jsonwebtoken';
import User from '../models/user.js';
import logger from '../config/logger.js';

export const register = async (req, res) => {
  try {
    const { firstName, lastName, username, email, password, passwordHint } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        error: 'User with this email or username already exists' 
      });
    }
    
    // Check if this is the first user (auto-admin)
    const userCount = await User.countDocuments();
    const role = userCount === 0 ? 'admin' : 'user';
    
    const user = new User({
      firstName,
      lastName,
      username,
      email,
      password,
      passwordHint,
      role
    });
    
    await user.save();
    logger.info(`New user registered: ${username} with role: ${role}`);
    
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Allow users to authenticate using either their username or email address.
    // The field is still named "username" in the request body for backwards
    // compatibility but can contain an email. We search for a user where
    // either the username or the email matches the provided identifier.
    const user = await User.findOne({
      $or: [
        { username },
        { email: username },
      ],
    });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    logger.info(`User logged in: ${username}`);
    
    res.json({
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.email,
        role: user.role,
        profileImageUrl: user.profileImageUrl
      }
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};