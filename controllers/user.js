// Importing User Model
const jwt = require('jsonwebtoken')
const User = require('../models/user')
const EmailVerificationToken = require('../models/email_verification');
const { isValidObjectId } = require('mongoose');
const { generateOPT} = require('../utils/mail');
const { sendError, generateRandomByte, uploadImageToCloudLogo, uploadImageToCloud, formatUser} = require('../utils/helper');
const PasswordResetToken = require('../models/password_reset');
const { sendEmail } = require('../utils/mail');
const cloudinary = require('../cloud');

// create user
exports.create = async (req, res) => {
    const { name, email, password, type } = req.body;// get name, email, password, username from req.body
     
  
    const oldUser = await User.findOne({ email }); // check if user already exists
    // const usernameExist = await User.findOne({ username }); // check if username already exists
  
    if (oldUser) return sendError(res, "This email is already in use!"); // if user already exists, return error
    // if (usernameExist) return sendError(res, "This username is already in use!"); // if username already exists, return error
  
    const newUser = new User({ name, email, password, type });// create new user
    await newUser.save();// save new user
  
    // generate 6 digit otp
    let OTP = generateOPT();
  
    // store otp inside our db
    const newEmailVerificationToken = new EmailVerificationToken({
      owner: newUser._id,
      token: OTP,
    });
    
    await newEmailVerificationToken.save();// save otp to db
  
    // send that otp to our user
    const htmlContent = `
      <h1>Welcome, ${name}!</h1>
      <p>Thanks for trying dollar4scholar. We’re thrilled to have you on board. To get the most out of our site, verify your email:</p>
      <p>Your verification code:</p>
      <h1 className="text-red">${OTP}</h1>
      <p>For reference, here's your login information:</p>
      <h3>Email: ${email}</h3>
      <p>If you have any questions, feel free to email our customer success team. (We're lightning quick at replying.) We also offer live chat during business hours.</p>
      <p>Thanks!</p>
      <p>Team dollar4scholar</p>
      <h3>dollar4scholar411@gmail.com</h3>
    `
    await sendEmail(newUser.email, newUser.name, 'Email Verification', htmlContent)
  
  
    res.status(201).json({
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        type: newUser.type,
      },
    });
  };

// verify email
exports.verifyEmail = async (req, res) => {
  const { userId, OTP } = req.body;

  if (!isValidObjectId(userId)) return sendError(res, "Invalid user!");

  const user = await User.findById(userId);
  if (!user) return sendError(res, "user not found!", 404);

  if (user.isVerified) return sendError(res, "user is already verified!");

  const token = await EmailVerificationToken.findOne({ owner: userId });
  if (!token) return sendError(res, "token not found!");

  const isMatched = await token.compareToken(OTP);
  if (!isMatched) return sendError(res, "Please submit a valid code!");

  user.isVerified = true;
  await user.save();

  await EmailVerificationToken.findByIdAndDelete(token._id);

  const htmlContent = `
  <h1>Welcome, ${user.name}!</h1>
    <p>Thanks for trying dollar4scholar. We’re thrilled to have you on board. Your email is now verified! you can start bidding to win your scholarship! :</p>
    <p>For reference, here's your login information:</p>
    <h3>Email: ${user.email}</h3>
    <p>If you have any questions, feel free to email our customer success team. (We're lightning quick at replying.) We also offer live chat during business hours.</p>
    <p>Thanks!</p>
    <p>dollar4scholar Team</p>
    <h3>dollar4scholar411@gmail.com</h3>
  `
  await sendEmail(user.email, user.name, 'Welcome Email!', htmlContent)

  const jwtToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
  res.json({
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      token: jwtToken,
      isVerified: user.isVerified,
      role: user.role,
    },
    message: "Your email is verified.",
  });
};

// resend email verification token
exports.resendEmailVerificationToken = async (req, res) => {
  const { userId } = req.body;
  
  const user = await User.findById(userId);
  if (!user) return sendError(res, "user not found!");

  if (user.isVerified)
    return sendError(res, "This email id is already verified!");

  const alreadyHasToken = await EmailVerificationToken.findOne({
    owner: userId,
  });
  if (alreadyHasToken)
    return sendError(res, "Only after one hour you can request for another token!");

  // generate 6 digit otp
  let OTP = generateOPT();

  // store otp inside our db
  const newEmailVerificationToken = new EmailVerificationToken({ owner: user._id, token: OTP })

  await newEmailVerificationToken.save()

  const htmlContent = `
  <h1>Welcome, ${user.name}!</h1>
  <p>Thanks for trying dollar4scholar. We’re thrilled to have you on board. To get the most out of our site, verify your email:</p>
  <p>Your verification code:</p>
  <h1 className="text-red">${OTP}</h1>
  <p>For reference, here's your login information:</p>
  <h3>Email: ${user.email}</h3>
  <p>If you have any questions, feel free to email our customer success team. (We're lightning quick at replying.) We also offer live chat during business hours.</p>
  <p>Thanks!</p>
  <p>Team dollar4scholar</p>
  <h3>dollar4scholar411@gmail.com</h3>
`
await sendEmail(user.email, user.name, 'Email Verification', htmlContent) 

  res.json({
    message: "New code has been sent to your registered email account.",
  });
};

// forget password
exports.forgetPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) return sendError(res, "email is missing!");

  const user = await User.findOne({ email });
  if (!user) return sendError(res, "User not found!", 404);

  const alreadyHasToken = await PasswordResetToken.findOne({ owner: user._id });
  if (alreadyHasToken)
    return sendError(
      res,
      "Only after one hour you can request for another token!"
    );

  const token = await generateRandomByte();
  const newPasswordResetToken = await PasswordResetToken({
    owner: user._id,
    token,
  });
  await newPasswordResetToken.save();

  const resetPasswordUrl = `http://localhost:5173/auth/reset-password?token=${token}&id=${user._id}`;

  ///////////////  change this url to production url when deploying to production /////////////
  // const resetPasswordUrl = `http://dollar4scholar.com/auth/reset-password?token=${token}&id=${user._id}`;

  const htmlContent = `
  <h1>Welcome, ${user.name}!</h1>
  <p>Thanks for trying dollar4scholar. We’re thrilled to have you on board.</p>
  <p>Click here to reset password</p>
    <a href='${resetPasswordUrl}'>Change Password</a>
  <p>For reference, here's your login information:</p>
  <h3>Email: ${user.email}</h3>
  <p>If you have any questions, feel free to email our customer success team. (We're lightning quick at replying.) We also offer live chat during business hours.</p>
  <p>Thanks!</p>
  <p>Team dollar4scholar</p>
  <h3>dollar4scholar@gmail.com.com</h3>
  
`
await sendEmail(user.email, user.name, 'Reset Password Link', htmlContent)

  res.json({ message: "Link sent to your email!" });
};

exports.sendResetPasswordTokenStatus = (req, res) => {
  res.json({ valid: true })
}

// reset password
exports.resetPassword = async (req, res) => {
  const { newPassword, userId } = req.body;

  const user = await User.findById(userId);
  const matched = await user.comparePassword(newPassword);
  if (matched)
    return sendError(
      res,
      "The new password must be different from the old one!"
    );

  user.password = newPassword;
  await user.save();

  await PasswordResetToken.findByIdAndDelete(req.resetToken._id);

  const htmlContent = `
  <h1>Password Reset Successfully</h1>
  <p>Now you can use new password.</p>
`
await sendEmail(user.email, user.name, 'Password Reset Successfully', htmlContent)

  res.json({
    message: "Password reset successfully, now you can use new password.",
  });
}

// sign in
exports.signIn = async (req, res) => {
  const { email, password } = req.body
  

  const user = await User.findOne({ email })

  if (!user) return sendError(res, "User not found!")

  const matched =  await user.comparePassword(password)

  if (!matched) return sendError(res, "Invalid Email/Password!")

  const {name, _id, role, isVerified, schoolsFollowing, teachersFollowing, following, followers} = user;

  const jwtToken = jwt.sign({userId: _id}, process.env.JWT_SECRET, {expiresIn: '1d'})

  res.json({user: {id: _id, name, email, role, token: jwtToken, isVerified, role, schoolsFollowing, teachersFollowing, following, followers}})

}

exports.userInfo = async (req, res) => {
  const {userId} = req.params;

  if (!isValidObjectId(userId)) return sendError(res, "Invalid user!");

  const user = await User.findById(userId).populate('contribution')
  if (!user) return sendError(res, "user not found!", 404);

  res.json({user: {id: user._id, name: user.name, email: user.email, type: user.type, isVerified: user.isVerified, avatar: user.avatar?.url, phone: user.phone, address: user.address, birth: user.birth, town: user.town, school: user.school, major: user.major, wallet: user.wallet, contribution: [user.contribution] }})
}

// update user info for authenticated user in profile page
exports.updateUser = async (req, res) => {
  const { name, phone, address, birth,  school, major } = req.body;
  const { file } = req;
  const { userId } = req.params;
  
  if (!isValidObjectId(userId)) return sendError(res, "User not found!");

  const user = await User.findById(userId);
  if (!user) return sendError(res, "Invalid request, record not found!");

  const public_id = user.avatar?.public_id;

  // remove old image if there was one!
  if (public_id && file) {
    const { result } = await cloudinary.uploader.destroy(public_id);
    if (result !== "ok") {
      return sendError(res, "Could not remove image from cloud!");
    }
  }

  // upload new avatar if there is one!
  if (file) {
    const { url, public_id } = await uploadImageToCloud(file.path);
    user.avatar = { url, public_id };
  }

  user.name = name;
  user.phone = phone;
  user.address = address;
  user.birth = birth;
  user.school = school;
  user.major = major;

  

  await user.save();

  res.status(201).json({actor: formatUser(user)});
};

// update donor info for authenticated user in profile page
exports.updateDonor = async (req, res) => {
  const { name, phone, address } = req.body;
  const { file } = req;
  const { userId } = req.params;
  
  if (!isValidObjectId(userId)) return sendError(res, "Donor not found!");

  const user = await User.findById(userId);
  if (!user) return sendError(res, "Invalid request, Donor not found!");

  const public_id = user.avatar?.public_id;

  // remove old image if there was one!
  if (public_id && file) {
    const { result } = await cloudinary.uploader.destroy(public_id);
    if (result !== "ok") {
      return sendError(res, "Could not remove image from cloud!");
    }
  }

  // upload new avatar if there is one!
  if (file) {
    const { url, public_id } = await uploadImageToCloudLogo(file.path);
    user.avatar = { url, public_id };
  }

  user.name = name;
  user.phone = phone;
  user.address = address;

  

  await user.save();

  res.status(201).json({actor: formatUser(user)});
};

// update user wallet for authenticated user in profile page
exports.updateUserWallet = async (req, res) => {
  const { wallet } = req.body;
  const { userId } = req.params;
  
  if (!isValidObjectId(userId)) return sendError(res, "User not found!");

  const user = await User.findById(userId);
  if (!user) return sendError(res, "Invalid request, record not found!");
  
  const newWallet = user.wallet + wallet;
  
  user.wallet = newWallet;
  
  await user.save();

  res.status(201).json({wallet: newWallet});
};