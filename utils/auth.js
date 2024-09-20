const { check, validationResult } = require('express-validator'); // import express validator
const jwt = require("jsonwebtoken"); // import jsonwebtoken
const User = require("../models/user"); // import user model
const { sendError } = require("./helper"); // import helper function
var ApiContracts = require('authorizenet').APIContracts;
var ApiControllers = require('authorizenet').APIControllers;

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


exports.getTransactionDetails = async (transactionId, callback) => {

    const merchantAuthenticationType = new ApiContracts.MerchantAuthenticationType();
    merchantAuthenticationType.setName(process.env.AUTHORIZE_NET_API_LOGIN_ID);
    merchantAuthenticationType.setTransactionKey(process.env.AUTHORIZE_NET_TRANSACTION_KEY);

    var getRequest = new ApiContracts.GetTransactionDetailsRequest();
    getRequest.setMerchantAuthentication(merchantAuthenticationType);
    getRequest.setTransId(transactionId);

    // console.log(JSON.stringify(getRequest.getJSON(), null, 2));
        
    var ctrl = new ApiControllers.GetTransactionDetailsController(getRequest.getJSON());

    ctrl.execute(function(){

        var apiResponse = ctrl.getResponse();

        var response = new ApiContracts.GetTransactionDetailsResponse(apiResponse);

        // console.log(JSON.stringify(response, null, 2));

        if(response != null){
            if(response.getMessages().getResultCode() == ApiContracts.MessageTypeEnum.OK){
                console.log('Transaction Id : ' + response.getTransaction().getTransId());
                console.log('Transaction Type : ' + response.getTransaction().getTransactionType());
                console.log('Message Code : ' + response.getMessages().getMessage()[0].getCode());
                console.log('Message Text : ' + response.getMessages().getMessage()[0].getText());
            }
            else{
                console.log('Result Code: ' + response.getMessages().getResultCode());
                console.log('Error Code: ' + response.getMessages().getMessage()[0].getCode());
                console.log('Error message: ' + response.getMessages().getMessage()[0].getText());
            }
        }
        else{
            console.log('Null Response.');
        }
        
        callback(response);
    });
}

exports.createCustomerProfileFromTransaction = async (transactionId, callback) => {

	var merchantAuthenticationType = new ApiContracts.MerchantAuthenticationType();
	merchantAuthenticationType.setName(process.env.AUTHORIZE_NET_API_LOGIN_ID);
	merchantAuthenticationType.setTransactionKey(process.env.AUTHORIZE_NET_TRANSACTION_KEY);

	var createRequest = new ApiContracts.CreateCustomerProfileFromTransactionRequest();
	createRequest.setTransId(transactionId);
	createRequest.setMerchantAuthentication(merchantAuthenticationType);

	//console.log(JSON.stringify(createRequest.getJSON(), null, 2));
		
	var ctrl = new ApiControllers.CreateCustomerProfileFromTransactionController(createRequest.getJSON());

	ctrl.execute(function(){

		var apiResponse = ctrl.getResponse();

		if (apiResponse != null) var response = new ApiContracts.CreateCustomerProfileResponse(apiResponse);
		//console.log(JSON.stringify(response.getJSON(), null, 2));
		
		if(response != null) 
		{
			if(response.getMessages().getResultCode() == ApiContracts.MessageTypeEnum.OK)
			{
				console.log('Successfully created a customer payment profile with id: ' + response.getCustomerProfileId() + 
					' from a transaction : ' + transactionId );
			}
			else
			{
				//console.log(JSON.stringify(response));
				//console.log('Result Code: ' + response.getMessages().getResultCode());
				console.log('Error Code: ' + response.getMessages().getMessage()[0].getCode());
				console.log('Error message: ' + response.getMessages().getMessage()[0].getText());
			}
		}
		else
		{
			var apiError = ctrl.getError();
			console.log(apiError);
			console.log('Null response received');
		}

		callback(response);

	});
}




// const message = createCustomerProfileFromTransaction('120040369898', (response) => {
//     console.log(response);
// });
// console.log(message);