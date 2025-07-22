const express = require('express');
const router = express.Router();
const auth = require('../../middlewares/authMiddleware');
const { getProfile, updateProfile } = require('../../controllers/userController');

router.get('/', auth, getProfile);
router.put('/', aut