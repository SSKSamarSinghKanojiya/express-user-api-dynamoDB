import express from 'express';
import {
  createUser,
  getUserById,
  updateUser,
  deleteUser,
  getAllUsers,
  getUserByEmail,
  createUser1,
  getAllUsers1
} from '../controllers/user.controller.js';
console.log("ttt")
const router = express.Router();
console.log("gg")
router.post('/', createUser1);
router.get('/', getAllUsers1);
router.get('/by-email', getUserByEmail); // /users/by-email?email=test@example.com
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;
