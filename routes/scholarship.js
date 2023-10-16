const express = require('express');
const router = express.Router();
const {createScholarship, addDonorContribution} = require('../controllers/scholarship');
const {isAuth} = require('../utils/auth');

// Route to create a new scholarship
router.post('/create', createScholarship);

// Route to add a donation to a scholarship
router.post('/donate/:userId',isAuth, addDonorContribution);



module.exports = router;
