const express = require('express');
const authenticateUser = require('../middleware/authMiddleware');

const {
  createOrganization,
  getOrganizations,
} = require('../controllers/organizationController');

const router = express.Router();

router.post('/', authenticateUser, createOrganization);
router.get('/', authenticateUser, getOrganizations);

module.exports = router;