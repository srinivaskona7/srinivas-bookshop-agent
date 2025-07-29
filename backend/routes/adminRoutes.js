import express from 'express';
import multer from 'multer';
import path from 'path';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware.js';
import { getUsers, updateUserRole, createBook } from '../controllers/adminController.js';

const router = express.Router();

// Multer configuration for book files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/books/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const prefix = file.fieldname === 'cover' ? 'cover-' : 'book-';
    cb(null, prefix + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'cover' && file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else if (file.fieldname === 'pdf' && file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  }
});

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *       403:
 *         description: Admin access required
 */
router.get('/users', authenticateToken, requireAdmin, getUsers);

/**
 * @swagger
 * /api/admin/users/{id}/role:
 *   put:
 *     summary: Update user role (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [user, admin]
 *     responses:
 *       200:
 *         description: User role updated successfully
 *       403:
 *         description: Admin access required
 */
router.put('/users/:id/role', authenticateToken, requireAdmin, updateUserRole);

/**
 * @swagger
 * /api/admin/books:
 *   post:
 *     summary: Create a new book (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - author
 *               - description
 *               - price
 *               - cover
 *               - pdf
 *             properties:
 *               title:
 *                 type: string
 *               author:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               cover:
 *                 type: string
 *                 format: binary
 *               pdf:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Book created successfully
 *       403:
 *         description: Admin access required
 */
router.post('/books', authenticateToken, requireAdmin, upload.fields([
  { name: 'cover', maxCount: 1 },
  { name: 'pdf', maxCount: 1 }
]), createBook);

export default router;