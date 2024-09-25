const User = require('../models/user')
const Scholarship = require('../models/scholarship')
var ApiContracts = require('authorizenet').APIContracts;
var ApiControllers = require('authorizenet').APIControllers;
const {getTransactionDetails, createCustomerProfileFromTransaction, createSubscriptionFromCustomerProfile, cancelSubscriptionAuth} = require('../utils/auth.js');
const { sendError } = require('../utils/helper.js');
const { isValidObjectId } = require('mongoose');



// // Route to create payment page

exports.getAnAcceptPaymentPage = (req, res) => {
    console.log('🔑 Getting Hosted Payment Page Token 🔑');
	// console.log(req.body);
	// console.log("User userId Server", req.body.params.userId);
	// console.log("User email Server", req.body.params.email);
	// console.log("User refId Server", req.body.params.refId);
	// console.log("User amount Server", req.body.params.amount);
	// console.log("User stripeId Server", req.body.params.stripeId);
    var userId = req.body.userId;
	var email = req.body.email;

    var refId = req.body.refId;
	var amount = req.body.amount;
	// var customerProfileId = req.body.stripeId;
	// console.log('User ID', userId);
	// console.log('User Email', email);
	// console.log('User Ref ID', refId);
	// console.log('User Amount', amount);

   
    var merchantAuthenticationType = new ApiContracts.MerchantAuthenticationType();
	merchantAuthenticationType.setName(process.env.AUTHORIZE_NET_API_LOGIN_ID);
	merchantAuthenticationType.setTransactionKey(process.env.AUTHORIZE_NET_TRANSACTION_KEY);

    // Create a CustomerDataType object to hold the customer ID
    var customerData = new ApiContracts.CustomerDataType();
    // customerData.setId(userId)  // Replace CUSTOMER_ID with your actual customer ID
	customerData.setEmail(email);


	// Create an OrderType object to hold the order information
	const orderType = new ApiContracts.OrderType();
    // orderType.setInvoiceNumber(userId);
    orderType.setDescription("Dollar4Scholar $" + amount + " Monthly Subscription " + "Email: " + email + " User ID: " + userId);

	// Create a CustomerProfilePaymentType object to hold the customer profile ID
	// const profile = new ApiContracts.CustomerProfilePaymentType();
    // profile.setCustomerProfileId(customerProfileId);
	
	var transactionRequestType = new ApiContracts.TransactionRequestType();
	transactionRequestType.setTransactionType(ApiContracts.TransactionTypeEnum.AUTHCAPTURETRANSACTION);
	transactionRequestType.setAmount(amount);
    transactionRequestType.setCustomer(customerData);
	transactionRequestType.setOrder(orderType);
	// transactionRequestType.setProfile(profile); // Set the customer profile here
	
	var setting1 = new ApiContracts.SettingType();
	setting1.setSettingName('hostedPaymentButtonOptions');
	setting1.setSettingValue('{\"text\": \"Subscribe\"}');

	var setting2 = new ApiContracts.SettingType();
	setting2.setSettingName('hostedPaymentOrderOptions');
	setting2.setSettingValue('{\"show\": true}');

        // Adding the return URL setting
    var returnUrlSetting = new ApiContracts.SettingType();
    returnUrlSetting.setSettingName('hostedPaymentReturnOptions');
    returnUrlSetting.setSettingValue(`{"url": "${process.env.PAYMENT_REDIRECT}", "urlText": "Home", "cancelUrl": "${process.env.PAYMENT_CANCEL}", "cancelUrlText": "Cancel"} `);

	// Add Payment Options to exclude eChecks
	var paymentOptionsSetting = new ApiContracts.SettingType();
	paymentOptionsSetting.setSettingName('hostedPaymentPaymentOptions');
	paymentOptionsSetting.setSettingValue('{ "cardCodeRequired": true, "showCreditCard": true, "showBankAccount": false }'); // This setting may change depending on your requirements

	// Add setting to ensure save payment option is always checked
	// var savePaymentOptionsSetting = new ApiContracts.SettingType();
	// savePaymentOptionsSetting.setSettingName('hostedPaymentCustomerOptions');
	// savePaymentOptionsSetting.setSettingValue('{ "addPaymentProfile": true, "profileSavePolicy": "addUpdate" }');

	var settingList = [];
	settingList.push(setting1);
	settingList.push(setting2);
    settingList.push(returnUrlSetting); // Add the return URL setting to the list
	settingList.push(paymentOptionsSetting); // Include the payment options setting
	// settingList.push(savePaymentOptionsSetting); // Include the save payment options setting

	var alist = new ApiContracts.ArrayOfSetting();
	alist.setSetting(settingList);

	var getRequest = new ApiContracts.GetHostedPaymentPageRequest();
	getRequest.setMerchantAuthentication(merchantAuthenticationType);
	getRequest.setTransactionRequest(transactionRequestType);
	getRequest.setHostedPaymentSettings(alist);
    getRequest.setRefId(refId);

	// console.log(JSON.stringify(getRequest.getJSON(), null, 2));
		
	var ctrl = new ApiControllers.GetHostedPaymentPageController(getRequest.getJSON());

	ctrl.execute(function(){

		var apiResponse = ctrl.getResponse();

		var response = new ApiContracts.GetHostedPaymentPageResponse(apiResponse);

		//pretty print response
		// console.log(JSON.stringify(response, null, 2));

		if(response != null) 
		{
			if(response.getMessages().getResultCode() == ApiContracts.MessageTypeEnum.OK)
			{
				console.log('🤑🤑 Hosted payment page token Retrieved 🤑🤑');
				// console.log(response.getToken());
                res.json(response.getToken());
			}
			else
			{
				//console.log('Result Code: ' + response.getMessages().getResultCode());
				console.log('Error Code: ' + response.getMessages().getMessage()[0].getCode());
				console.log('Error message: ' + response.getMessages().getMessage()[0].getText());
                res.json(response);
			}
		}
		else
		{
			console.log('Null response received');
            res.json(response);
		}

		// res.json(response.token);
	});
}

exports.webhook = async (req, res) => {
    console.log(req.body.payload.id);
	console.log('🔑 Webhook Received 🔑');
	// console.log(req.body);
    const transactionId = req.body.payload.id;
	const amount = req.body.payload.authAmount;

	// console.log("amount: ", amount);
	
	const userEmail = await getTransactionDetails( {transactionId: transactionId});

	console.log('User Email: ', userEmail);
	

	const profileInfo = await createCustomerProfileFromTransaction({transactionId: transactionId})

	console.log('👤 Customer Profile ID: ', profileInfo);

	const customerProfileId = profileInfo.customerProfileId;
	const customerPaymentProfileIdList = profileInfo.customerPaymentProfileIdList.numericString;
	const customerShippingAddressIdList = profileInfo.customerShippingAddressIdList.numericString;
 

	// Get the last string in the array and convert it to a plain string
	const customerPaymentProfileId = customerPaymentProfileIdList[customerPaymentProfileIdList.length - 1].toString();

	// Get the last string in the shipping address array and convert it to a plain string
	const customerAddressId = customerShippingAddressIdList[customerShippingAddressIdList.length - 1].toString();

	console.log("Customer Payment Profile Id", customerPaymentProfileId); // "923836061"
	console.log("customerProfileId: ", customerProfileId);
	console.log("customerAddressId: ", customerAddressId);
	

	
	const subscriptionId = await createSubscriptionFromCustomerProfile({customerProfileId, amount, customerPaymentProfileId, customerAddressId});

	console.log('🔄  Subscription ID: ', subscriptionId );

	const user = await User.findOne({email: userEmail});
	if (!user) return sendError(res, 404, 'User not found');
	user.stripeId = customerProfileId;
	user.subscriptionId = subscriptionId;
	user.subscription = true;

	await user.save();
	console.log('👤 User: ', user);

	

	if(subscriptionId){
		const scholarship = await Scholarship.findOne().sort({createdAt: -1});
		if (!scholarship) return sendError(res, 404, 'Scholarship not found');
		scholarship.studentsEntered.push(user._id);
		scholarship.pot += 1.50;

		await Scholarship.findByIdAndUpdate(scholarship._id, scholarship);
		console.log('🎓 Scholarship: ', scholarship);

	} else {
		console.log('❌ Subscription not created ❌');
	}



	res.json({email: userEmail, customerProfileId: customerProfileId, customerPaymentProfileId: customerPaymentProfileId, customerAddressId: customerAddressId, subscriptionId: subscriptionId,});
    
}

exports.cancelSubscription = async (req, res) => {
	console.log('🔑 Cancelling Subscription 🔑');
	try{
		const {userId} = req.params;

		if (!isValidObjectId(userId)) return sendError(res, 404, 'Invalid user!');

		const user = await User.findById(userId);
		if (!user) return sendError(res, 404, 'User not found!');

		const subscriptionId = user.subscriptionId;
		console.log('Subscription ID: ', subscriptionId);

		const deletedSubscription = await cancelSubscriptionAuth({subscriptionId: subscriptionId});
		if(!deletedSubscription) return res.status(404).send('No subscription found');
		user.subscription = false;
		user.subscriptionId = null;
		await user.save();
		res.json({message: 'Subscription cancelled successfully!'});
} catch (error) {
	console.log(error);
	res.status(400).json({message: 'Error cancelling subscription', error});
	}
}
