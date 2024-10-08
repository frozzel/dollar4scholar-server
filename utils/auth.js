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
exports.isAuth = async (req, res, next) => {
    // console.log('🔑 Checking User Authentication 🔑');

    const token = req.headers?.authorization
    if (!token) return sendError(res, 'Invalid token!', 401)

    const jwtToken = token.split('Bearer ')[1]

    if (!jwtToken) return sendError(res, 'Invalid token!', 401)

    try {
        // verify if token is outdated
        const decode = jwt.verify(jwtToken, process.env.JWT_SECRET);
        const { userId } = decode;

        const user = await User.findById(userId);
        if (!user) return sendError(res, 'No user found', 404);

        req.user = user;
        next();

    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return sendError(res, 'Token has expired!', 401);
        }
        return sendError(res, 'Invalid token!', 401);
    }
};


exports.getTransactionDetails = async ({transactionId}) => {
        console.log('🔑 Getting Transaction Details 🔑');
    return new Promise(async (resolve, reject) => {
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
        
                if (apiResponse != null) var response = new ApiContracts.GetTransactionDetailsResponse(apiResponse);
        
                // console.log(JSON.stringify(response, null, 2));
        
                if(response != null){
                    if(response.getMessages().getResultCode() == ApiContracts.MessageTypeEnum.OK){
                        console.log('Transaction Id : ' + response.getTransaction().getTransId());
                        console.log('Transaction Type : ' + response.getTransaction().getTransactionType());
                        console.log('Message Code : ' + response.getMessages().getMessage()[0].getCode());
                        console.log('Message Text : ' + response.getMessages().getMessage()[0].getText());
                        resolve(response.getTransaction().getCustomer().getEmail());
                    }
                    else{
                        console.log('Result Code: ' + response.getMessages().getResultCode());
                        console.log('Error Code: ' + response.getMessages().getMessage()[0].getCode());
                        console.log('Error message: ' + response.getMessages().getMessage()[0].getText());
                        reject(response.getMessages().getMessage()[0].getText());
                    }
                }
                else{
                    var apiError = ctrl.getError();
                    console.log(apiError);
                    console.log('Null Response.');
                    reject('Null Response.');
                }
                
            });
        }
    );
}



exports.createCustomerProfileFromTransaction = async ({transactionId}) => {
    console.log('👤 Creating Customer Profile 👤');
    return new Promise(async (resolve, reject) => {
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
                resolve(response);
			}
			else
			{
				//console.log(JSON.stringify(response));
				//console.log('Result Code: ' + response.getMessages().getResultCode());
				console.log('Error Code: ' + response.getMessages().getMessage()[0].getCode());
				console.log('Error message: ' + response.getMessages().getMessage()[0].getText());
                reject(response.getMessages().getMessage()[0].getText());
			}
		}
		else
		{
			var apiError = ctrl.getError();
			console.log(apiError);
			console.log('Null response received');
            reject('Null response received');
		}

		// callback(response);

	});

}
);
}   

exports.createSubscriptionFromCustomerProfile = async ({customerProfileId, amount, customerPaymentProfileId}) =>{
    console.log('🔄 Creating Subscription From Customer Profile 🔄');
    return new Promise(async (resolve, reject) => {
    
    const today = new Date();
    const startDate = new Date(today);

    // Set the month to the next month
    startDate.setMonth(today.getMonth() + 1);

    // Function to adjust date if it's fictional (like the 30th of February)
    const adjustDate = (date) => {
      const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
      if (date.getDate() > daysInMonth) {
        date.setDate(daysInMonth);
      }
      return date;
    };

    // Adjust the start date if it's on a fictional date
    adjustDate(startDate);

    // Function to format the date as YYYY-MM-DD
    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0'); // Add leading zero
      const day = String(date.getDate()).padStart(2, '0'); // Add leading zero
      return `${year}-${month}-${day}`;
    };

    console.log('Start Date:', formatDate(startDate));

	var merchantAuthenticationType = new ApiContracts.MerchantAuthenticationType();
	merchantAuthenticationType.setName(process.env.AUTHORIZE_NET_API_LOGIN_ID);
	merchantAuthenticationType.setTransactionKey(process.env.AUTHORIZE_NET_TRANSACTION_KEY);

	var interval = new ApiContracts.PaymentScheduleType.Interval();
	interval.setLength(1);
	interval.setUnit(ApiContracts.ARBSubscriptionUnitEnum.MONTHS);

	var paymentScheduleType = new ApiContracts.PaymentScheduleType();
	paymentScheduleType.setInterval(interval);
	paymentScheduleType.setStartDate(formatDate(startDate));
	paymentScheduleType.setTotalOccurrences(9999);
    // paymentScheduleType.setTrailAmount(0);
	// paymentScheduleType.setTrialOccurrences(0);

	var customerProfileIdType = new ApiContracts.CustomerProfileIdType();
	customerProfileIdType.setCustomerProfileId(customerProfileId);
	customerProfileIdType.setCustomerPaymentProfileId(customerPaymentProfileId);
	// customerProfileIdType.setCustomerAddressId(customerAddressId);

	var arbSubscription = new ApiContracts.ARBSubscriptionType();
	arbSubscription.setName('Monthly Subscription $2.79 Dollar4Scholar');
	arbSubscription.setPaymentSchedule(paymentScheduleType);
	arbSubscription.setAmount(amount);
	// arbSubscription.setTrialAmount(utils.getRandomAmount());
	arbSubscription.setProfile(customerProfileIdType);

	var createRequest = new ApiContracts.ARBCreateSubscriptionRequest();
	createRequest.setMerchantAuthentication(merchantAuthenticationType);
	createRequest.setSubscription(arbSubscription);

	// console.log(JSON.stringify(createRequest.getJSON(), null, 2));
		
	var ctrl = new ApiControllers.ARBCreateSubscriptionController(createRequest.getJSON());

	ctrl.execute(function(){

		var apiResponse = ctrl.getResponse();

		if (apiResponse != null) var response = new ApiContracts.ARBCreateSubscriptionResponse(apiResponse);

		console.log(JSON.stringify(response, null, 2));

		if(response != null){
			if(response.getMessages().getResultCode() == ApiContracts.MessageTypeEnum.OK){
				console.log('Subscription Id : ' + response.getSubscriptionId());
				console.log('Message Code : ' + response.getMessages().getMessage()[0].getCode());
				console.log('Message Text : ' + response.getMessages().getMessage()[0].getText());
                resolve(response.getSubscriptionId());
			}
			else{
				console.log('Result Code: ' + response.getMessages().getResultCode());
				console.log('Error Code: ' + response.getMessages().getMessage()[0].getCode());
				console.log('Error message: ' + response.getMessages().getMessage()[0].getText());
                reject(response.getMessages().getMessage()[0].getText());
			}
		}
		else{
			var apiError = ctrl.getError();
			console.log(apiError);
			console.log('Null Response.');
            reject('Null Response.');
		}

	});
}
);
}

exports.cancelSubscriptionAuth = async ({subscriptionId}) => {
    console.log('❌ Cancelling Subscription ❌');
    console.log('Subscription Id:', subscriptionId);
    return new Promise(async (resolve, reject) => {
   
    const merchantAuthenticationType = new ApiContracts.MerchantAuthenticationType();
    merchantAuthenticationType.setName(process.env.AUTHORIZE_NET_API_LOGIN_ID);
    merchantAuthenticationType.setTransactionKey(process.env.AUTHORIZE_NET_TRANSACTION_KEY);

    var cancelRequest = new ApiContracts.ARBCancelSubscriptionRequest();
    cancelRequest.setMerchantAuthentication(merchantAuthenticationType);
    cancelRequest.setSubscriptionId(subscriptionId);

    // console.log(JSON.stringify(cancelRequest.getJSON(), null, 2));
        
    var ctrl = new ApiControllers.ARBCancelSubscriptionController(cancelRequest.getJSON());

    ctrl.execute(function(){

        var apiResponse = ctrl.getResponse();

        if (apiResponse != null) var response = new ApiContracts.ARBCancelSubscriptionResponse(apiResponse);

        // console.log(JSON.stringify(response, null, 2));

        if(response != null){
            if(response.getMessages().getResultCode() == ApiContracts.MessageTypeEnum.OK){
                console.log('Subscription Cancelled');
                console.log('Message Code : ' + response.getMessages().getMessage()[0].getCode());
                console.log('Message Text : ' + response.getMessages().getMessage()[0].getText());
                resolve({message: 'Subscription Cancelled'});
            }
            else{
                console.log('Result Code: ' + response.getMessages().getResultCode());
                console.log('Error Code: ' + response.getMessages().getMessage()[0].getCode());
                console.log('Error message: ' + response.getMessages().getMessage()[0].getText());
                reject({message: response.getMessages().getMessage()[0].getText()});
            }
        }
        else{
            var apiError = ctrl.getError();
            console.log(apiError);
            console.log('Null Response.');
            reject('Null Response.');
        }

    });
}
);
}

exports.deleteCustomerProfileAuth = async ({customerProfileId}) => {
    return new Promise(async (resolve, reject) => {
    console.log('🗑  Deleting Customer Profile 🗑');
    console.log('Customer Profile Id:', customerProfileId);
    var merchantAuthenticationType = new ApiContracts.MerchantAuthenticationType();
    merchantAuthenticationType.setName(process.env.AUTHORIZE_NET_API_LOGIN_ID);
    merchantAuthenticationType.setTransactionKey(process.env.AUTHORIZE_NET_TRANSACTION_KEY);

    var deleteRequest = new ApiContracts.DeleteCustomerProfileRequest();
	deleteRequest.setMerchantAuthentication(merchantAuthenticationType);
	deleteRequest.setCustomerProfileId(customerProfileId);

	//pretty print request
	//console.log(JSON.stringify(createRequest.getJSON(), null, 2));
		
	var ctrl = new ApiControllers.DeleteCustomerProfileController(deleteRequest.getJSON());

	ctrl.execute(function(){

		var apiResponse = ctrl.getResponse();

		if (apiResponse != null) var response = new ApiContracts.DeleteCustomerProfileResponse(apiResponse);

		//pretty print response
		//console.log(JSON.stringify(response, null, 2));

		if(response != null) 
		{
			if(response.getMessages().getResultCode() == ApiContracts.MessageTypeEnum.OK)
			{
				console.log('Successfully deleted a customer profile with id: ' + customerProfileId);
                resolve({message: 'Customer Profile Deleted'});
			}
			else
			{
				//console.log('Result Code: ' + response.getMessages().getResultCode());
				console.log('Error Code: ' + response.getMessages().getMessage()[0].getCode());
				console.log('Error message: ' + response.getMessages().getMessage()[0].getText());
                resolve('Error');
			}
		}
		else
		{
			var apiError = ctrl.getError();
			console.log(apiError);
			console.log('Null response received');
            reject({message: 'Null response received'});
		}

		
	});
}

);
}

exports.checkDeletedSubscription = async ({subscriptionId}) => {
    return new Promise(async (resolve, reject) => {
    console.log('🔍 Checking Deleted Subscription 🔍');
    console.log('Subscription Id:', subscriptionId);
    var merchantAuthenticationType = new ApiContracts.MerchantAuthenticationType();
    merchantAuthenticationType.setName(process.env.AUTHORIZE_NET_API_LOGIN_ID);
    merchantAuthenticationType.setTransactionKey(process.env.AUTHORIZE_NET_TRANSACTION_KEY);

    var getRequest = new ApiContracts.ARBGetSubscriptionStatusRequest();
    getRequest.setMerchantAuthentication(merchantAuthenticationType);
    getRequest.setSubscriptionId(subscriptionId);

    // console.log(JSON.stringify(getRequest.getJSON(), null, 2));
        
    var ctrl = new ApiControllers.ARBGetSubscriptionStatusController(getRequest.getJSON());

    ctrl.execute(function(){

        var apiResponse = ctrl.getResponse();

        if (apiResponse != null) var response = new ApiContracts.ARBGetSubscriptionStatusResponse(apiResponse);

        // console.log(JSON.stringify(response, null, 2));

        if(response != null){
            if(response.getMessages().getResultCode() == ApiContracts.MessageTypeEnum.OK){
                console.log('Subscription Status : ' + response.getStatus());
                console.log('Message Code : ' + response.getMessages().getMessage()[0].getCode());
                console.log('Message Text : ' + response.getMessages().getMessage()[0].getText());
                resolve({message: 'Subscription Deleted'});
            }
            else{
                console.log('Result Code: ' + response.getMessages().getResultCode());
                console.log('Error Code: ' + response.getMessages().getMessage()[0].getCode());
                console.log('Error message: ' + response.getMessages().getMessage()[0].getText());
                reject({message: response.getMessages().getMessage()[0].getText()});
            }
        }
        else{
            var apiError = ctrl.getError();
            console.log(apiError);
            console.log('Null Response.');
            reject({message: 'Null Response.'});
        }

    });
}
);
}