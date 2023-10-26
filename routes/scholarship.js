const express = require('express');
const router = express.Router();
const {createScholarship, addDonorContribution, getScholarshipPot, addMoneyToPot, getDonorContributions, getWinner, getAllWinnersActive, getWinnerById, setActiveStatus, getNumberOfUsers} = require('../controllers/scholarship');
const {isAuth} = require('../utils/auth');

// Route to create a new scholarship
router.post('/create', createScholarship);

// Route to add a donation to a scholarship
router.post('/donate/:userId',isAuth, addDonorContribution);
router.get('/pot', getScholarshipPot); // Route to get the current scholarship pot
router.post('/enter/:userId', addMoneyToPot); // Route to add money to the scholarship pot and enter to win the scholarship
router.get('/donations', getDonorContributions); // Rout to get all donations
router.get('/previouswinner', getWinner); // Route to get the winner of the scholarship ')
router.get('/winners', isAuth, getAllWinnersActive); // Route to get all the winners of the scholarships
router.get('/winner/:userId', isAuth, getWinnerById); // Route to get the winner of the scholarship
router.put('/active/:userId', isAuth, setActiveStatus); // Route to set the active status of the scholarship
router.get('/users', isAuth, getNumberOfUsers); // Route to get the number of users

module.exports = router;
