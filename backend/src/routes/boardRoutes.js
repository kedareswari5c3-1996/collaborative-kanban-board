const express = require('express');

const authenticateUser = require('../middleware/authMiddleware');

const {
  createBoard,
  getBoards,
} = require('../controllers/boardController');

const router = express.Router();

router.post('/', authenticateUser, createBoard);

router.get('/tenant/:tenantId', authenticateUser, getBoards);

module.exports = router;