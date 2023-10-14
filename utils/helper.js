const Brevo = require('@getbrevo/brevo');// import brevo
const crypto = require("crypto");// import crypto
const cloudinary = require("../cloud");// import cloudinary



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
  sendSmtpEmail.sender = {name: "dollar 4 scholar", email: process.env.OFFICIAL_EMAIL};
  sendSmtpEmail.to = [{email, name}];

  return  await apiInstance.sendTransacEmail(sendSmtpEmail)
}

// send error message status
exports.sendError = (res, error, statusCode = 401) =>
  res.status(statusCode).json({ error });

// generate random byte string
exports.generateRandomByte = () => {
  return new Promise((resolve, reject) => {
    crypto.randomBytes(30, (err, buff) => {
      if (err) reject(err);
      const buffString = buff.toString("hex");

      resolve(buffString);
    });
  });
};

// handle not found error
exports.handleNotFound = (req, res) => {
  this.sendError(res, "Not found", 404);
};

// upload image to cloudinary
exports.uploadImageToCloud = async (file) => {
  const { secure_url: url, public_id } = await cloudinary.uploader.upload(
    file,
    { gravity: "face", height: 500, width: 500, crop: "thumb" }
  );

  return { url, public_id };
};
 
// upload image to cloudinary for logo of Donor
exports.uploadImageToCloudLogo = async (file) => {
  const { secure_url: url, public_id } = await cloudinary.uploader.upload(
    file,
    {  height: 240, width: 400,  crop: "mfit"}
  );

  return { url, public_id };
};

// format user from form data
exports.formatUser = (user) => {
  const { name, phone, address, birth, school, major, email, _id, avatar } = user;
  return {
    id: _id,
    name,
    phone,
    address,
    birth,
    school,
    major,
    email,
    avatar: avatar?.url,
  };
};

