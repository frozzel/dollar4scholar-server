const { check, validationResult } = require('express-validator'); // import express validator
const jwt = require("jsonwebtoken"); // import jsonwebtoken
const User = require("../models/user"); // import user model
const { sendError } = require("./helper"); // import helper function

// check if user is authenticated
exports.userValidator = [
    check("name").trim().not().isEmpty().withMessage("Name is missing!"),
    check("email").normalizeEmail().isEmail().withMessage("Email is invalid!"),
    check('type').trim().not().isEmpty().withMessage('Type is missing!'),
    check("password")
        .trim()
        .not()
        .isEmpty()
        .withMessage("Password is missing!")
        .isLength({ min: 8, max: 20 })
        .withMessage("Password must be 8 to 20 characters long!"),
];

// check if user is authenticated
exports.validate = (req, res, next) => {
    const error = validationResult(req).array();
    
    if (error.length) {
        return res.json({ error: error[0].msg });
    }
   
    next();
};

// check if password is valid
exports.validatePassword = [
    check("newPassword")
        .trim()
        .not()
        .isEmpty()
        .withMessage("Password is missing!")
        .isLength({ min: 8, max: 20 })
        .withMessage("Password must be 8 to 20 characters long!"),
];

// check if sign in request is valid
exports.signInValidator = [

    check("email").normalizeEmail().isEmail().withMessage("Email is invalid!"),
    check("password")
        .trim()
        .not()
        .isEmpty()
        .withMessage("Password is missing!")
       
];

// check if user is authenticated
exports.isAuth = async(req, res, next) => {
    const token =  req.headers?.authorization
    if (!token) return sendError(res, 'Invalid token!', 401)
  
    const jwtToken = token.split('Bearer ')[1]
  
    if (!jwtToken) return sendError(res, 'Invalid token!', 401)
    const decode = jwt.verify(jwtToken, process.env.JWT_SECRET)
    
    const {userId} = decode
  
    const user = await User.findById(userId)
    if(!user) return sendError(res, 'No user found', 404);
    
    req.user = user;
    
    // sendError(res, 'User is authenticated!', 200).next();
    next();
    
    }
