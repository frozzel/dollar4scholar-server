///////////////////////////////////// create routes for user/////////////////////////////////////   

const express = require("express"); // import express
const { create, verifyEmail, resendEmailVerificationToken, forgetPassword, sendResetPasswordTokenStatus, resetPassword, signIn, userInfo, updateUser, updateUserWallet, updateDonor } = require("../controllers/user");
const { isValidPassResetToken } = require("../utils/user");
const { userValidator, validate, validatePassword, signInValidator, isAuth } = require("../utils/auth");
const { uploadImage } = require("../utils/multer");

const router = express.Router(); // create router

// test route to make sure everything is working (accessed at GET http://localhost:8080/api/user)
router.get("/", (req, res) => {
    res.json({ message: "Welcome to the User API" });
});

router.post("/create", userValidator, validate, create); // create user route
router.post("/verify-email", verifyEmail); // verify email route
router.post("/resend-email-verification-token", resendEmailVerificationToken); // resend email verification token route
router.post('/forget-password', forgetPassword); // forget password route
router.post('/verify-pass-reset-token', isValidPassResetToken, sendResetPasswordTokenStatus); // verify password reset token route
router.post('/reset-password', validatePassword, validate, isValidPassResetToken, resetPassword)// reset password route
router.post("/sign-in", signInValidator, validate, signIn);// sign in route

// get user info route for authenticated user
router.get('/is-auth', isAuth, (req, res) => {
   const {user} = req;
   res.json({user: {id: user._id, email: user.email, name: user.name, isVerified: user.isVerified, type: user.type, }})
})

router.get("/profile/:userId", isAuth, userInfo)// get user info route for profile page
router.put("/update/:userId", isAuth, uploadImage.single("avatar"), updateUser)// update user info route for profile page
router.put("/donor/:userId", isAuth, uploadImage.single("avatar"), updateDonor)// update user info route for profile page

router.post("/wallet/:userId", isAuth, updateUserWallet)// update user wallet route for profile page

module.exports = router; // export router