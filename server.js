// create our server
const express = require('express'); // import express
require('express-async-errors'); // import express-async-errors
const {errorHandler} = require('./utils/error')// import error handler
require('dotenv').config()// import dotenv
require('./config/connections')//   import database connection
var cors = require('cors')// import cors

 /////////////////////////// cors options ///////////////////////////
var corsOptions = {
  origin: 'http://localhost:5173/',
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}

const app = express();// create express app

/////////////////////////// use middleware ///////////////////////////
app.use(express.static('public'));
app.use(cors())// enable cors
app.use(errorHandler)// use error handler

/////////////////////////// import webhooks before express.json ///////////////////////////
const webhooksRouter = require('./routes/webhooks');// import webhooks router
app.use('/api/webhooks', webhooksRouter);// use webhooks router


/////////////////////////// import middleware cont. ///////////////////////////
app.use(express.json())// parse json request body


/////////////////////////// import routes ///////////////////////////
const userRouter = require('./routes/user');// import user router
const scholarshipRouter = require('./routes/scholarship');// import scholarship router
const stripeRouter = require('./routes/stripe');// import stripe router
const authRouter = require('./routes/auth');// import auth router


/////////////////////////// use routes ///////////////////////////
app.use('/api/user', userRouter);// use user router
app.use('/api/scholarship', scholarshipRouter);// use scholarship router
app.use('/api/stripe', stripeRouter);// use stripe router
app.use('/api/auth', authRouter);// use auth router


/////////////////////////// start server ///////////////////////////
const server = require('http').Server(app); // import http
const PORT = process.env.PORT || 8080// define a port

server.listen(PORT,  () => {// start express server on port 8080
    console.log(`................................................`)
    console.log(`🚀  Server running on http://localhost:${PORT}, 🚀`)
    console.log(`...............................................`)
    console.log(`...............Starting Database...............`)
   
    
})