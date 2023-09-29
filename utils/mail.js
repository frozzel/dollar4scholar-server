
// generate OTP
exports.generateOPT = (otp_len= 6 ) => {

    let OTP = ""
    for (let i = 1; i <= otp_len; i++) {
        randnum = Math.round(Math.random() * 9)
        OTP += randnum
    }
    return OTP
  }