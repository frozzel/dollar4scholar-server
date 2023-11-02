const mongoose = require('mongoose');// import mongoose
const bcrypt = require('bcrypt');// import bcrypt

// create user schema
const userSchema = mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: true
    },
    email: {
        type: String,
        trim: true,
        required: true,
        unique: true
    },
    type: {
        type: String,
        required: true,
        default: 'student',
        enum: ['fresh','student', 'admin', 'donor']
    },
    password: {
        type: String,
        required: true
    },
    isVerified: {
        type: Boolean,
        required: true,
        default: false
    },
    avatar: {
        type: Object,
        url: { type: String, required: false },
        public_id: { type: String, required: true },
        responsive: [URL],
      },
    phone: {
        type: String,
        trim: true,
        required: false
    },
    address: {
        type: String,
        trim: true,
        required: false
    },
    birth: {
        type: String,
        trim: true,
        required: false
    },
    contribution: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Contribution",
    }],
    school: {
        type: String,
        trim: true,
        required: false
    },
    major: {
        type: String,
        trim: true,
        required: false
    },
    wallet: {
        type: Number,
        required: true,
        default: 0
    },
    stripeId: {
        type: String,
        required: false
    },

}, 
{ timestamps: true }
)

// hash password before saving to database
userSchema.pre('save', async function(next){ // hash password before saving to database
    if(this.isModified('password')) {
     this.password = await bcrypt.hash(this.password, 10);
     
    }
    next();
})
// compare password
userSchema.methods.comparePassword = async function (password) {
    const result = await bcrypt.compare(password, this.password);
    return result;
};

// export user model
module.exports = mongoose.model('User', userSchema);