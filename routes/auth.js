const express = require('express');
const router = express.Router();
const {isAuth} = require('../utils/auth');
const {getAnAcceptPaymentPage, webhookTransaction, cancelSubscription, webhookPaymentProfile, cancelSubscriptionHook} = require('../controllers/auth');

// Route to create payment page

router.post('/paymentPage/:userId', isAuth, getAnAcceptPaymentPage);
router.post('/webhook/transaction',  webhookTransaction);
router.post('/webhook/payment-profile', webhookPaymentProfile);
router.post('/webhook/subscription-canceled', cancelSubscriptionHook);
router.delete('/cancel-subscription/:userId', cancelSubscription);

module.exports = router;    