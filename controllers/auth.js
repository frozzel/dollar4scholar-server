const User = require('../models/user')
const Scholarship = require('../models/scholarship')
var ApiContracts = require('authorizenet').APIContracts;
var ApiControllers = require('authorizenet').APIControllers;
const {getTransactionDetails, 
	createCustomerProfileFromTransaction, 
	createSubscriptionFromCustomerProfile, 
	cancelSubscriptionAuth, 
	deleteCustomerProfileAuth} = require('../utils/auth.js');
const { sendError } = require('../utils/helper.js');
const { isValidObjectId } = require('mongoose');



// // Route to create payment page

exports.getAnAcceptPaymentPage = (req, res) => {
    console.log('🔑 Getting Hosted Payment Page Token 🔑');

    var userId = req.body.userId;
	var email = req.body.email;

    var refId = req.body.refId;
	var amount = req.body.amount;

   
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
	
	var transactionRequestType = new ApiContracts.TransactionRequestType();
	transactionRequestType.setTransactionType(ApiContracts.TransactionTypeEnum.AUTHCAPTURETRANSACTION);
	transactionRequestType.setAmount(amount);
    transactionRequestType.setCustomer(customerData);
	transactionRequestType.setOrder(orderType);
	
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

	var settingList = [];
	settingList.push(setting1);
	settingList.push(setting2);
    settingList.push(returnUrlSetting); // Add the return URL setting to the list
	settingList.push(paymentOptionsSetting); // Include the payment options setting

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

exports.webhookTransaction = async (req, res) => {
    // console.log(req.body.payload.id);
	console.log('💰 Webhook Transaction Received 💰');
	// console.log(req.body);

	const transactionId = req.body.payload.id;
	const amount = req.body.payload.authAmount;

	function calculateOriginalTransactionAmount(totalAmountCharged) {
		const stripePercentage = 0.029;
		const flatFee = 0.30;
		
		const originalAmount2= (totalAmountCharged - flatFee) / (1 + stripePercentage);
		return Number(originalAmount2.toFixed(1)); // Round to 2 decimal places
	  }
	  
	  const originalAmount = calculateOriginalTransactionAmount(amount);


	if (req.body.payload.merchantReferenceId === 'donor') {
		console.log('👤 Donor Transaction 🌟');

		const userEmail = await getTransactionDetails( {transactionId: transactionId});

		console.log('User Email: ', userEmail);

		const user = await User.findOne({email: userEmail});
		if (!user) return sendError(res, 404, 'User not found');

		const newWallet = user.wallet + originalAmount;

		user.wallet = newWallet;

		await user.save();

		console.log('👤 User: ', user.name, '💵 Wallet: ', user.wallet);

		
		return res.json({message: '👤 Donor Transaction 🌟', wallet: `💵 ${user.wallet}`});
	}
 
	console.log('👤 Student Transaction 🌟');

	const userEmail = await getTransactionDetails( {transactionId: transactionId});

	console.log('User Email: ', userEmail);
	

	var profileInfo = await createCustomerProfileFromTransaction({transactionId: transactionId})
	if (profileInfo === '❌ Customer Profile not created ❌') {
		console.log('❌ Customer Profile not created ❌ 1');
		profileInfo = await createCustomerProfileFromTransaction({transactionId: transactionId});

		if (profileInfo === '❌ Customer Profile not created ❌') {
			console.log('❌ Customer Profile not created ❌ 2');
			profileInfo = await createCustomerProfileFromTransaction({transactionId: transactionId});
			return res.json('❌ Customer Profile not created ❌ Done');
		}
	}
		

	console.log('👤 Customer Profile ID: ', profileInfo);

	const customerProfileId = profileInfo.customerProfileId;
	
	const user = await User.findOne({email: userEmail});
	if (!user) return sendError(res, 404, 'User not found');
	user.stripeId = customerProfileId;


	await user.save();
	console.log('👤 User: ', user);

	res.json({email: userEmail, customerProfileId: customerProfileId,});
    // res.json({message: '❌ 👤 Donor Transaction  Fail ❌'});
}

exports.webhookPaymentProfile = async (req, res) => {
	console.log('🌐 Webhook Payment Profile 🌐');
	// console.log(req.body);
	const customerProfileId = req.body.payload.customerProfileId;
	const customerPaymentProfileId = req.body.payload.id;
	const amount = 2.79;

	console.log('Customer Profile ID: ', customerProfileId);
	console.log('Customer Payment Profile ID: ', customerPaymentProfileId);

	const user = await User.findOne({stripeId: customerProfileId});
	if (!user) return sendError(res, 404, 'User not found');

	const subscriptionId = await createSubscriptionFromCustomerProfile({customerProfileId, amount, customerPaymentProfileId});

	console.log('🔄  Subscription ID: ', subscriptionId );

	if(subscriptionId){
		const scholarship = await Scholarship.findOne().sort({createdAt: -1});
		if (!scholarship) return sendError(res, 404, 'Scholarship not found');
		scholarship.studentsEntered.push(user._id);
		scholarship.pot += 1.50;

		await Scholarship.findByIdAndUpdate(scholarship._id, scholarship);
		console.log('🎓 Scholarship: ', scholarship);
	} else {
			console.log('❌ Subscription not created ❌');
			return sendError(res, 404, '❌ Subscription not created ❌');
		}

	user.subscriptionId = subscriptionId;
	user.subscription = true;

	await user.save();

	console.log('👤 User: ', user);

	res.json({customerProfileId, customerPaymentProfileId,});
}

exports.cancelSubscription = async (req, res) => {
	console.log('❌ Cancelling Subscription ❌');
	try{
		const {userId} = req.params;

		if (!isValidObjectId(userId)) return sendError(res, 404, 'Invalid user!');

		const user = await User.findById(userId);
		if (!user) return sendError(res, 404, 'User not found!');

		const subscriptionId = user.subscriptionId;
		console.log('Subscription ID: ', subscriptionId);

		const deletedSubscription = await cancelSubscriptionAuth({subscriptionId: subscriptionId});
		if(!deletedSubscription) return res.send('No subscription found');

		user.subscription = false;
		user.subscriptionId = null;

		await user.save();
		
		const deleteCustomerProfile = await deleteCustomerProfileAuth({customerProfileId: user.stripeId});
		if(!deleteCustomerProfile) return res.status(404).send('No customer profile found');

		user.stripeId = null;

		await user.save();

		res.json({message: '💀 Subscription cancelled successfully! 💀'});
} catch (error) {
	console.log(error);
	res.json({message: '💀 Error cancelling subscription 💀'});
	}
}

exports.cancelSubscriptionHook = async (req, res) => {
	console.log('❌ Webhook Subscription Cancelled ❌');
	// console.log(req.body);
	try{
	const subscriptionId = req.body.payload.id;
	const customerProfileId = req.body.payload.profile.customerProfileId;

	console.log('Subscription ID: ', subscriptionId);
	console.log('Customer Profile ID: ', customerProfileId);

	const user = await User.findOne({stripeId: customerProfileId});

	const deleteCustomerProfile = await deleteCustomerProfileAuth({customerProfileId: customerProfileId});
	if(!deleteCustomerProfile) return res.send('No customer profile found');

	user.stripeId = null;

	await user.save();

	console.log('👤 User: ', user);

	res.json({status: 200, message: '💀 Subscription cancelled successfully! 💀'});

} catch (error) {
	console.log(error);
	res.json({status: 401, message: '💀 Error cancelling subscription 💀', error});
	}
}
exports.getAnAcceptPaymentPageDonor = (req, res) => {
    console.log('🤕 Getting Hosted Payment Page Token Donor 🤕');
	var userId = req.body.userId;
	var email = req.body.email;

    var refId = req.body.refId;
	var amount = req.body.amount;

	function  calculateTotalAmount(transactionAmount) {
		// Calculate the Stripe fee
	const stripeFee = (transactionAmount + 0.3) / (1 - 0.029) - transactionAmount;
	// Calculate the total amount charged
	const totalAmountCharged = transactionAmount + stripeFee;  
	return Number(totalAmountCharged.toFixed(2)); // Round to 2 decimal places
  }
 	const totalAmountCharged = calculateTotalAmount(amount);

	console.log('Total Amount Charged: ', totalAmountCharged);
   
    var merchantAuthenticationType = new ApiContracts.MerchantAuthenticationType();
	merchantAuthenticationType.setName(process.env.AUTHORIZE_NET_API_LOGIN_ID);
	merchantAuthenticationType.setTransactionKey(process.env.AUTHORIZE_NET_TRANSACTION_KEY);

    // Create a CustomerDataType object to hold the customer ID
    var customerData = new ApiContracts.CustomerDataType();
	customerData.setEmail(email);


	// Create an OrderType object to hold the order information
	const orderType = new ApiContracts.OrderType();
    orderType.setDescription("Credit Card Transaction Fees are added into your Total $"+ totalAmountCharged + " Email: " + email + " User ID: " + userId);
	

	// Create a CustomerProfilePaymentType object to hold the customer profile ID
	// const profile = new ApiContracts.CustomerProfilePaymentType();
    // profile.setCustomerProfileId(customerProfileId);
	
	var transactionRequestType = new ApiContracts.TransactionRequestType();
	transactionRequestType.setTransactionType(ApiContracts.TransactionTypeEnum.AUTHCAPTURETRANSACTION);
	transactionRequestType.setAmount(totalAmountCharged);
    transactionRequestType.setCustomer(customerData);
	transactionRequestType.setOrder(orderType);
	
	var setting1 = new ApiContracts.SettingType();
	setting1.setSettingName('hostedPaymentButtonOptions');
	setting1.setSettingValue('{\"text\": \"Add Funds\"}');

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

	var settingList = [];
	settingList.push(setting1);
	settingList.push(setting2);
    settingList.push(returnUrlSetting); // Add the return URL setting to the list
	settingList.push(paymentOptionsSetting); // Include the payment options setting

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
				console.log('🤑🤑 Hosted payment page Donar token Retrieved 🤑🤑');
				
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