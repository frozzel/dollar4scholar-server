const express = require('express');
const router = express.Router();
const {isAuth} = require('../utils/auth');
const {getAnAcceptPaymentPage, webhook, cancelSubscription} = require('../controllers/auth');

// Route to create payment page

router.post('/paymentPage/:userId', isAuth, getAnAcceptPaymentPage);
router.post('/webhook',  webhook);
router.delete('/cancel-subscription/:userId', cancelSubscription);

module.exports = router;    