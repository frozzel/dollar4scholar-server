const mongoose = require('mongoose');// import mongoose
const bcrypt = require('bcrypt');// import bcrypt

// create email verification token schema
const emailVerificationTokenSchema = new mongoose.Schema({// create a schema for token
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    token: {
        type: String,
        required: true
    },
    createAt: {
        type: Date,
        expires: 18000,
        default: Date.now(),
    }
});

// hash token before saving to database
emailVerificationTokenSchema.pre('save', async function(next){ // hash token before saving to database
    if(this.isModified('token')) {
     this.token = await bcrypt.hash(this.token, 10);
     
    }
    next();
})

// compare token with token in database
emailVerificationTokenSchema.methods.compareToken = async function(token) {
    const result = await bcrypt.compare(token, this.token);
    return result;
}

// export email verification token model
module.exports = mongoose.model('EmailVerificationToken', emailVerificationTokenSchema);