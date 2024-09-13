const express = require('express');
const router = express.Router();
// const {isAuth} = require('../utils/auth');
const {getAnAcceptPaymentPage} = require('../controllers/auth');

// Route to create payment page

router.post('/paymentPage', getAnAcceptPaymentPage);

module.exports = router;    