const { isValidObjectId } = require("mongoose");
const PasswordResetToken = require("../models/password_reset");
const { sendError } = require("../utils/helper");

// check if password reset token is valid
exports.isValidPassResetToken = async (req, res, next) => {
    const { token, userId } = req.body;

    if (!token.trim() || !isValidObjectId(userId))
        return sendError(res, "Invalid request!");

    const resetToken = await PasswordResetToken.findOne({ owner: userId });
    if (!resetToken)
        return sendError(res, "Unauthorized access, invalid request!");

    const matched = await resetToken.compareToken(token);
    if (!matched) return sendError(res, "Unauthorized access, invalid request!");

    req.resetToken = resetToken;
    next();
};