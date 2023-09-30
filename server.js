// create our server
const express = require('express'); // import express
require('express-async-errors'); // import express-async-errors
//const morgan = require('morgan')    // import morgan
const {errorHandler} = require('./utils/error')// import error handler
require('dotenv').config()// import dotenv
require('./config/connections')//   import database connection


const app = express();// create express app
app.use(express.json())// parse json request body


const server = require('http').Server(app); // import http

app.use(errorHandler)// use error handler
//app.use(morgan('dev'))// use morgan

const userRouter = require('./routes/user');// import user router




app.use('/api/user', userRouter);// use user router



const PORT = process.env.PORT || 8080// define a port

// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
app.get('/api', (req, res) => {
    res.json({ message: 'Welcome to the API' });   
});

server.listen(PORT,  () => {// start express server on port 8080
    console.log(`................................................`)
    console.log(`🚀  Server running on http://localhost:${PORT}, 🚀`)
    console.log(`...............................................`)
    console.log(`...............Starting Database...............`)
   
    
})