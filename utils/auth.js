const { check, validationResult } = require('express-validator'); // import express validator
const jwt = require("jsonwebtoken"); // import jsonwebtoken
const User = require("../models/user"); // import user model
const { sendError } = require("./helper"); // import helper function


exports.userValidator = [
    check("name").trim().not().isEmpty().withMessage("Name is missing!"),
    check("email").normalizeEmail().isEmail().withMessage("Email is invalid!"),
    check('username').trim().not().isEmpty().withMessage('Username is missing!'),
    check("password")
        .trim()
        .not()
        .isEmpty()
        .withMessage("Password is missing!")
        .isLength({ min: 8, max: 20 })
        .withMessage("Password must be 8 to 20 characters long!"),
];

exports.validate = (req, res, next) => {
    const error = validationResult(req).array();
    if (error.length) {
        return res.json({ error: error[0].msg });
    }
   
    next();
};
