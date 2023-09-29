// create routes for user   

const express = require("express"); // import express
const { userValidator, validate,  } = require("../utils/auth"); // import user validator
const { create } = require("../controllers/user"); // import create user controller

const router = express.Router(); // create router

// test route to make sure everything is working (accessed at GET http://localhost:8080/api/user)
router.get("/", (req, res) => {
    res.json({ message: "Welcome to the User API" });
});

router.post("/create", userValidator, validate, create); // create user route


module.exports = router; // export router