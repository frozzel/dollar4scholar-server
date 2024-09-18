const express = require('express');
const router = express.Router();
// const {isAuth} = require('../utils/auth');
const {getAnAcceptPaymentPage, webhook} = require('../controllers/auth');

// Route to create payment page

router.post('/paymentPage', getAnAcceptPaymentPage);
router.post('/webhook', webhook);

module.exports = router;    