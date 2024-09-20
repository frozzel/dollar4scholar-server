const { sendError} = require('../utils/helper');
var ApiContracts = require('authorizenet').APIContracts;
var ApiControllers = require('authorizenet').APIControllers;
const {getTransactionDetails, createCustomerProfileFromTransaction} = require('../utils/auth.js');



// // Route to create payment page

exports.getAnAcceptPaymentPage = (req, res) => {
    console.log('🔑 Getting Hosted Payment Page Token 🔑');
	// console.log("User userId Server", req.body.params.userId);
	// console.log("User email Server", req.body.params.email);
	// console.log("User refId Server", req.body.params.refId);
	// console.log("User amount Server", req.body.params.amount);
	// console.log("User stripeId Server", req.body.params.stripeId);
    var userId = req.body.params.userId;
	var email = req.body.params.email;

    var refId = req.body.params.refId;
	var amount = req.body.params.amount;
	var customerProfileId = req.body.params.stripeId;
   
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
	const profile = new ApiContracts.CustomerProfilePaymentType();
    profile.setCustomerProfileId(customerProfileId);
	
	var transactionRequestType = new ApiContracts.TransactionRequestType();
	transactionRequestType.setTransactionType(ApiContracts.TransactionTypeEnum.AUTHCAPTURETRANSACTION);
	transactionRequestType.setAmount(amount);
    transactionRequestType.setCustomer(customerData);
	transactionRequestType.setOrder(orderType);
	transactionRequestType.setProfile(profile); // Set the customer profile here
	
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
	var savePaymentOptionsSetting = new ApiContracts.SettingType();
	savePaymentOptionsSetting.setSettingName('hostedPaymentCustomerOptions');
	savePaymentOptionsSetting.setSettingValue('{ "addPaymentProfile": true, "profileSavePolicy": "addUpdate" }');

	var settingList = [];
	settingList.push(setting1);
	settingList.push(setting2);
    settingList.push(returnUrlSetting); // Add the return URL setting to the list
	settingList.push(paymentOptionsSetting); // Include the payment options setting
	settingList.push(savePaymentOptionsSetting); // Include the save payment options setting

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
				console.log('🔑 Hosted payment page token Retrieved 🔑');
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
	console.log(req.body);
    const transactionId = req.body.payload.id;
    let customerId = 0;


    getTransactionDetails(transactionId, (response) => {
        console.log('response', response);
		console.log(response.transaction.customer.email)
        // if(response.getTransaction() !== null){
        //     customerId = response.getTransaction().getCustomer().getEmail();
        // }
        // console.log('custumer Email', response);
        // res.json(response);
    });
	createCustomerProfileFromTransaction(transactionId, (response) => {
		console.log('response', response);
		// if(response.getTransaction() !== null){
		const	customerProfileId = response.getCustomerProfileId();
		console.log('Customer Profile ID', customerProfileId);
		
		res.json(response);
	});
    
}