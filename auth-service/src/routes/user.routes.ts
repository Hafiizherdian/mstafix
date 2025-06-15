import express from 'express';
import * as userController from '../controllers/user.controller';
import { verifyToken, verifyAdmin } from '../middleware/auth';
import jwt from 'jsonwebtoken';

// Extended request dengan user
interface AuthenticatedRequest extends express.Request {
  user?: jwt.JwtPayload;
}

const router = express.Router();

// List all users - admin only
router.get('/', verifyToken, verifyAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const users = await userController.getAllUsers();
    return res.status(200).json(users);
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    } else {
      return res.status(500).json({ error: 'Unknown error occurred' });
    }
  }
});

// Get user count and registration statistics - admin only
router.get('/count', verifyToken, verifyAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const stats = await userController.getUserStats();
    return res.status(200).json(stats);
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    } else {
      return res.status(500).json({ error: 'Unknown error occurred' });
    }
  }
});

// Get user activity for the last 7 days - admin only
router.get('/activity', verifyToken, verifyAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const activity = await userController.getUserActivity();
    return res.status(200).json(activity);
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    } else {
      return res.status(500).json({ error: 'Unknown error occurred' });
    }
  }
});

export default router; 