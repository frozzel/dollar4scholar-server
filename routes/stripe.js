// This is your test secret API key.
const express = require('express');
const router = express.Router();
const {getSessionStatus, createSession} = require('../controllers/stripe');


router.post('/create-checkout-session', createSession);
router.get('/session-status', getSessionStatus);


module.exports = router;