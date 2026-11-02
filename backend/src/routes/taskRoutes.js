
const express = require('express');

const authenticateUser = require('../middleware/authMiddleware');

const {
  createTask,
  getTasks,
  updateTask,
  deleteTask,
} = require('../controllers/taskController');

const router = express.Router();

router.post('/', authenticateUser, createTask);
router.get('/board/:boardId', authenticateUser, getTasks);
router.put('/:taskId', authenticateUser, updateTask);
router.delete('/:taskId', authenticateUser, deleteTask);

module.exports = router;
