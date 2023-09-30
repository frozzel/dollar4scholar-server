const Brevo = require('@getbrevo/brevo');// import brevo


// generate OTP
exports.generateOPT = (otp_len= 6 ) => {

    let OTP = ""
    for (let i = 1; i <= otp_len; i++) {
        randnum = Math.round(Math.random() * 9)
        OTP += randnum
    }
    return OTP
  }

// send email using sendinblue/brevo api 
exports.sendEmail = async (email, name, subject, htmlContent) => {
    const defaultClient = Brevo.ApiClient.instance;
  
    // Configure API key authorization: api-key
    const apiKey = defaultClient.authentications['api-key'];
    apiKey.apiKey = process.env.BREVO_API;
  
    // Uncomment below two lines to configure authorization using: partner-key
    // var partnerKey = defaultClient.authentications['partner-key'];
    // partnerKey.apiKey = 'YOUR API KEY';
  
    const apiInstance = new Brevo.TransactionalEmailsApi();
  
    const sendSmtpEmail = new Brevo.SendSmtpEmail(); // SendSmtpEmail | Values to send a transactional email
  
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = htmlContent;
    sendSmtpEmail.sender = {name: "dollar4scholar", email: process.env.OFFICIAL_EMAIL};
    sendSmtpEmail.to = [{email, name}];
    
  
    return  await apiInstance.sendTransacEmail(sendSmtpEmail)
  }