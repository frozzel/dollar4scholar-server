// This is your test secret API key.
const express = require('express');
const router = express.Router();
const {getSessionStatus, createSession, createSubscription, cancelSubscription} = require('../controllers/stripe');


router.post('/create-checkout-session', createSession);
router.get('/session-status', getSessionStatus);
router.post('/create-subscription', createSubscription);
router.delete('/cancel-subscription/:userId', cancelSubscription);


module.exports = router;