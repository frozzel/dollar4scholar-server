const mongoose = require('mongoose');
const moment = require('moment-timezone');

const estTime = moment.tz('America/New_York').format();
const estPlusSevenDays = moment.tz('America/New_York').add(7, 'days').format();
const december15At459PM = moment.tz('2023-12-15 16:59', 'America/New_York').format();

// Function to calculate the last day of each month for the next year
const calculateLastDayOfEachMonth = () => {
    const dates = [];
    const now = moment.tz('America/New_York');

    for (let i = 0; i < 12; i++) {
        const date = now.clone().add(i, 'months').endOf('month');
        dates.push(date.format());
    }
    return dates;
};

// Calculate last days and use the first one for the default value
const lastDays = calculateLastDayOfEachMonth();
const firstLastDay = lastDays[0];

const scholarshipSchema = new mongoose.Schema({
    dateStarted: {
        type: Date,
        default: estTime,
        required: true
    },
    dateFinished: {
        type: Date,
        default: firstLastDay,
        required: true
    },
    donorContributions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Contribution'
    }],
    pot: {
        type: Number,
        default: 0,  // Default value set to 0
        required: true
    },
    winner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    studentsEntered: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',  // Reference to the User model
        required: false
    }],
    active: {
        type: Boolean,
        default: true,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Scholarship = mongoose.model('Scholarship', scholarshipSchema);

module.exports = Scholarship;
