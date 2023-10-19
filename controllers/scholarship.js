const Scholarship = require('../models/scholarship');
const Contribution = require('../models/contribution');
const User = require('../models/user');
const { sendError} = require('../utils/helper');


// Create a new scholarship
exports.createScholarship = async (req, res) => {
    try {
        const scholarship = new Scholarship(req.body);
        await scholarship.save();
        res.status(201).json({ message: 'Scholarship created successfully', scholarship });
    } catch (error) {
        res.status(400).json({ message: 'Error creating scholarship', error });
    }
};

// Add donor contributions to a scholarship
exports.addDonorContribution = async (req, res) => {

        const {userId} = req.params;
        const scholarship = await Scholarship.findOne().sort({created_at: -1});
        const user = await User.findOne({ _id: userId });
        
        if (!user) return sendError(res, 'User not found!', 404)
        if (!scholarship) return sendError(res, 'Scholarship not found!', 404)

        if (req.body.wallet > user.wallet) return sendError(res, 'Insufficient funds!', 400)

        const contributions = new Contribution({
            userId: userId,
            scholarshipId: scholarship._id,
            amount: req.body.wallet,
            date: new Date()
        });
        
        await contributions.save();
        scholarship.donorContributions.push(contributions._id);
        scholarship.pot += req.body.wallet; // add the amount to the scholarship pot
        await scholarship.save();

        // Deduct the contribution amount from the user's wallet

        user.wallet -= req.body.wallet;

        // add the contribution id to the user object
        user.contribution.push(contributions._id);
        await user.save();

        const userWallet = user.wallet;

        res.status(200).json({ message: 'Donor contribution added successfully', wallet: userWallet, contributions });

};

// Get current scholarship pot
exports.getScholarshipPot = async (req, res) => {
    try {
        const scholarship = await Scholarship.findOne().sort({ created_at: -1 });
        if (!scholarship) return sendError(res, 'Scholarship not found!', 404);
        res.status(200).json({ message: 'Scholarship pot retrieved successfully', scholarship });
    } catch (error) {
        res.status(400).json({ message: 'Error retrieving scholarship pot', error });
    }
};

// Add money to the pot of a scholarship
exports.addMoneyToPot = async (req, res) => {
    const { userId } = req.params;
    const scholarship = await Scholarship.findOne().sort({ created_at: -1 });
    const user = await User.findOne({ _id: userId });

    if (!user) return sendError(res, 'User not found!', 404);
    if (!scholarship) return sendError(res, 'Scholarship not found!', 404);

    if (req.body.wallet > user.wallet) return sendError(res, 'Insufficient funds!', 400);

    const numberOfEntries = Math.floor(req.body.wallet); // Assuming wallet contains a whole number

    for (let i = 0; i < numberOfEntries; i++) {
        scholarship.studentsEntered.push(user._id);
    }
    scholarship.pot += req.body.wallet;

    await Scholarship.findByIdAndUpdate(scholarship._id, scholarship);

     // Deduct the contribution amount from the user's wallet

     user.wallet -= req.body.wallet;

     // add the contribution id to the user object
     
     await user.save();

     const userWallet = user.wallet;

    res.status(200).json({ message: 'User added to scholarship successfully', scholarship: scholarship, wallet: userWallet });
};


// Add money to the pot of a scholarship


// Set a scholarship as active or not
exports.setActiveStatus = async (req, res) => {
    try {
        const scholarship = await Scholarship.findById(req.params.id);
        scholarship.active = req.body.active;
        await scholarship.save();
        res.status(200).json({ message: 'Scholarship status updated successfully', scholarship });
    } catch (error) {
        res.status(400).json({ message: 'Error updating scholarship status', error });
    }
};
