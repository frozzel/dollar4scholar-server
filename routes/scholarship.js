const express = require('express');
const router = express.Router();
const {createScholarship, addDonorContribution, getScholarshipPot, addMoneyToPot} = require('../controllers/scholarship');
const {isAuth} = require('../utils/auth');

// Route to create a new scholarship
router.post('/create', createScholarship);

// Route to add a donation to a scholarship
router.post('/donate/:userId',isAuth, addDonorContribution);
router.get('/pot', getScholarshipPot); // Route to get the current scholarship pot
router.post('/enter/:userId', addMoneyToPot); // Route to add money to the scholarship pot and enter to win the scholarship



module.exports = router;
