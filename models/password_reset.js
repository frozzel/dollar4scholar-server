const mongoose = require("mongoose");// import mongoose
const bcrypt = require("bcrypt");// import bcrypt


// password reset token schema
const passwordResetTokenSchema = mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    token: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        expires: 3600,
        default: Date.now(),
    },
});

// hash token before saving to database
passwordResetTokenSchema.pre("save", async function (next) {
    if (this.isModified("token")) {
        this.token = await bcrypt.hash(this.token, 10);
    }

    next();
});


// compare token with hashed token in database
passwordResetTokenSchema.methods.compareToken = async function (token) {
    const result = await bcrypt.compare(token, this.token);
    return result;
};

// create password reset token model
module.exports = mongoose.model("PasswordResetToken", passwordResetTokenSchema);