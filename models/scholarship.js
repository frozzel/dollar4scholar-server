const mongoose = require('mongoose');
const moment = require('moment-timezone');

const estTime = moment.tz('America/New_York').format();
const estPlusSevenDays = moment.tz('America/New_York').add(7, 'days').format();



const scholarshipSchema = new mongoose.Schema({
    dateStarted: {
        type: Date,
        default: estTime,
        required: true
    },
    dateFinished: {
        type: Date,
        default: estPlusSevenDays,
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
