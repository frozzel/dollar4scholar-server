// Importing User Model
const User = require("../models/user");
const EmailVerificationToken = require("../models/emailVerificationToken");// Importing EmailVerificationToken Model
const { sendError, sendEmail } = require("../utils/helper"); // Importing helper functions
const { generateOPT} = require('../utils/mail'); // Importing helper functions


exports.create = async (req, res) => {
    const { name, email, password, username } = req.body;// get name, email, password, username from req.body
  
    const oldUser = await User.findOne({ email }); // check if user already exists
    const usernameExist = await User.findOne({ username }); // check if username already exists
  
    if (oldUser) return sendError(res, "This email is already in use!"); // if user already exists, return error
    if (usernameExist) return sendError(res, "This username is already in use!"); // if username already exists, return error
  
    const newUser = new User({ name, email, password, username });// create new user
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
        username: newUser.username,
      },
    });
  };