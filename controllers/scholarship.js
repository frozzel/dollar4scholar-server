const Scholarship = require('../models/scholarship');
const Contribution = require('../models/contribution');
const User = require('../models/user');
const { sendError} = require('../utils/helper');
const cron = require('node-cron');
const { sendEmail } = require('../utils/mail');

//schedule a cron job to run sunday at 11:59am 

cron.schedule('59 16 * * 5', async () => { 
    updateWinner = async () => {
        try {
            const scholarship = await Scholarship.findOne().sort({createdAt: -1});
            
            if (scholarship.studentsEntered.length !== 0) {
                const winnerId = scholarship.studentsEntered[Math.floor(Math.random() * scholarship.studentsEntered.length)];
                const winner = await User.findById(winnerId);
                await Scholarship.findByIdAndUpdate(scholarship._id, { winner: winnerId });
                console.log('Winner updated', winner);
                const htmlContent = `
                <h1>Dear, ${winner.name}!</h1>
                <p>We are thrilled to inform you that you have been selected as the winner of our scholarship program. Congratulations! Your dedication and hard work have truly paid off.</p>
                
                <h1 className="text-red"></h1>
                <p>For reference, here's your login information:</p>
                <h3>Email: ${winner.email}</h3>
                <p>If you have any questions or need further assistance, please don't hesitate to reach out to our customer success team. We're here to support you every step of the way.</p>
                <p>Again, congratulations on this remarkable achievement. We look forward to seeing all that you will accomplish with this scholarship.</p>
                <p>Best regards!</p>
                <p>Team dollar4scholar</p>
                <h3>info@dollar4scholar.com</h3>
              `
              const htmlContent2 = `
                <h1>Hello, Admin!</h1>
                <p>I hope this message finds you well. I'm pleased to inform you that we have a winner for the latest scholarship program. Here are the details:</p>
                
                <h1 className="text-red">Winner Details:</h1>
                <h3>Winner's Name: ${winner.name}</h3>
                <h3>Email Address: ${winner.email}</h3>
                <h3>Phone Number: ${winner.phone}</h3>
                <div>
                <p>Please join me in congratulating the winner on their achievement!
                </p>
                <p>If you have any further questions or need additional information, feel free to reach out.
                </p>
                </div>
                <p>Best regards!</p>
                <p>Team dollar4scholar</p>
                <h3>info@dollar4scholar.com</h3>
              `

                await sendEmail(winner.email, winner.name, 'Congratulations on Winning the Scholarship!', htmlContent)
                await sendEmail("dollar4scholar411@gmail.com", "Admin", 'Scholarship Winner Announcement', htmlContent2)

                console.log('Winner updated', winner);
                createNewScholarship();

            } else {
                 // If studentsEntered is empty, add specific user object id
                // Example:
                scholarship.studentsEntered.push('653feed0d6b6f35f89d5e6ce');
                const winner = scholarship.studentsEntered[Math.floor(Math.random() * scholarship.studentsEntered.length)];
                await Scholarship.findByIdAndUpdate(scholarship._id, { winner: winner });
                await scholarship.save();
                console.log('No students entered');
                createNewScholarship();
            }
        } catch (error) {
            console.log(error);
        }
    }

    createNewScholarship = async () => {
        try {
            const scholarship = new Scholarship({
                pot: 0,
                active: true,
                studentsEntered: [],
                donorContributions: []
            });
            await scholarship.save();
            console.log('New scholarship created!', scholarship);
        } catch (error) {
            console.log(error);
        }
    }

    updateWinner();
}, null, true, 'America/New_York'); // The last argument sets the timezone



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
        const scholarship = await Scholarship.findOne().sort({createdAt: -1});
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
        const scholarship = await Scholarship.findOne().sort({ createdAt: -1 });
        if (!scholarship) return sendError(res, 'Scholarship not found!', 404);
        res.status(200).json({ message: 'Scholarship pot retrieved successfully', scholarship });
    } catch (error) {
        res.status(400).json({ message: 'Error retrieving scholarship pot', error });
    }
};

// Add money to the pot of a scholarship
exports.addMoneyToPot = async (req, res) => {
    const { userId } = req.params;
    const scholarship = await Scholarship.findOne().sort({ createdAt: -1 });
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


// get donor contributions for a scholarships
exports.getDonorContributions = async (req, res) => {
    try {
        const donations = await Contribution.find().populate('userId').sort({ createdAt: -1 }).limit(6);
        if (!donations) return sendError(res, 'Donations not found!', 404);
        res.status(200).json({ message: 'Donor contributions retrieved successfully', donations });
    } catch (error) {
        res.status(400).json({ message: 'Error retrieving donor contributions', error });
    }
};

// Get the winner of a scholarship
exports.getWinner = async (req, res) => {
    try {
        const winners = await Scholarship.find({ active: true })
        .sort({ createdAt: -1 }) // Sort by createdAt in descending order
        .skip(1) // Skip the most recent scholarship
        .populate('winner', 'name avatar major school email phone address'); // Populate the 'winner' field        if (!winner) return sendError(res, 'Winner not found!', 404);
        res.status(200).json({ message: 'Winner retrieved successfully', winner: winners[0] });
    } catch (error) {
        res.status(400).json({ message: 'Error retrieving winner', error });
    }
}
// get all winners that are active
exports.getAllWinnersActive = async (req, res) => {
    try {
        const winners = await Scholarship.find({ active: true })
            .sort({ createdAt: -1 }) // Sort by createdAt in descending order
            .skip(1) // Skip the most recent winner
        
        if (!winners || winners.length === 0) {
            return sendError(res, 'Winners not found!', 404);
        }
        
        // Populate the 'winner' field
        await Scholarship.populate(winners, { path: 'winner', select: 'name avatar major school email phone address' });

        res.status(200).json({ message: 'Winners retrieved successfully', winners });
    } catch (error) {
        res.status(400).json({ message: 'Error retrieving winners', error });
    }
}

// get winner by scholarship id
exports.getWinnerById = async (req, res) => {
    const { userId } = req.params;
    try {
        const winner = await Scholarship.findById(userId).populate('winner', 'name avatar major school email phone address birth ');
        if (!winner) return sendError(res, 'Winner not found!', 404);
        res.status(200).json({ message: 'Winner retrieved successfully', winner });
    } catch (error) {
        res.status(400).json({ message: 'Error retrieving winner', error });
    }
}

// Set a scholarship as active or not
exports.setActiveStatus = async (req, res) => {
    const { userId } = req.params;
    try {
        const scholarship = await Scholarship.findById(userId);
        scholarship.active = req.body.active;
        await scholarship.save();
        res.status(200).json({ message: 'Scholarship status updated successfully', scholarship });
    } catch (error) {
        res.status(400).json({ message: 'Error updating scholarship status', error });
    }
};
// aggregate  to get number of users
exports.getNumberOfUsers = async (req, res) => {
    try {
        const users = await User.aggregate([
            {
                $group: {
                    _id: null,
                    count: { $sum: 1 },
                    studentCount: {
                        $sum: { $cond: [{ $eq: ['$type', 'student'] }, 1, 0] }
                    },
                    donorCount: {
                        $sum: { $cond: [{ $eq: ['$type', 'donor'] }, 1, 0] }
                    },
                    freshmanCount: {
                        $sum: { $cond: [{ $eq: ['$type', 'fresh'] }, 1, 0] }
                    }
                }
            }
        ]);
        res.status(200).json({ message: 'Number of users retrieved successfully', users });
    } catch (error) {
        res.status(400).json({ message: 'Error retrieving number of users', error });
    }
}

// get all scholarships that are active agrregate
exports.getAllScholarshipsActive = async (req, res) => {
    try {
        const totalScholarships = await Scholarship.countDocuments();
        const activeScholarships = await Scholarship.countDocuments({ active: true });

        res.status(200).json({ message: 'Scholarships retrieved successfully', data: {totalScholarships, activeScholarships} });
    } catch (error) {
        res.status(400).json({ message: 'Error retrieving scholarships', error });
    }
}