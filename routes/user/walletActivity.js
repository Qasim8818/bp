const express = require('express');
const router = express.Router();
const auth = require('../../middlewares/authMiddleware');
const {
  depositRequest,
  withdrawRequest,
  getTransactions,
} = require('../../controllers/admin/userController');

router.post('/deposit', auth, depositRequest);
router.post('/withdraw', auth, withdrawRequest);
router.get('/', auth, getTransactions);

module.exports = router;
