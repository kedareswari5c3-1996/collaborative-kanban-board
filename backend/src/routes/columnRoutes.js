
const express = require('express');

const authenticateUser = require('../middleware/authMiddleware');

const {
  createColumn,
  getColumns,
  updateColumn,
  deleteColumn,
} = require('../controllers/columnController');

const router = express.Router();

router.post('/', authenticateUser, createColumn);
router.get('/board/:boardId', authenticateUser, getColumns);
router.put('/:columnId', authenticateUser, updateColumn);
router.delete('/:columnId', authenticateUser, deleteColumn);

module.exports = router;

