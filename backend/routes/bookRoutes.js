import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { getBooks } from '../controllers/bookController.js';

const router = express.Router();

/**
 * @swagger
 * /api/books:
 *   get:
 *     summary: Get all books
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Books retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/', authenticateToken, getBooks);

export default router;