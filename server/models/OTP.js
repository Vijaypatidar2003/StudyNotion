const mongoose = require("mongoose");
const mailSender = require("../utils/mailSender");

const OTPSchema = new mongoose.Schema({
    email:{
        type:String,
        required:true,
    },
    otp:{
        type:String,
        trim:true,
    },
    createdAt:{
        type:Date,
        default:Date.now,
        expires:60*5//document will automatically deleted after 5 minutes of its creation time
    }
})

//send mail before storing it into database
async function sendVerificationEmail(email,otp){
    try{
        const mailResponse = await mailSender(
            email,
            "Verification Email",
            emailTemplate(otp)
        );
        console.log("Email sent successfully: ", mailResponse.response);

    }catch(error){
        console.log("Error occurred while sending email: ", error);
		throw error;
    }
}

//create a  pre-save hook to send an email containning otp, before document gets saved in database.
OTPSchema.pre("save",async function(next){
    // send an email only when a new document is created 
    if(this.isNew)
        await sendVerificationEmail(this.email,this.otp);
    next();
});

module.exports = mongoose.model("OTP",OTPSchema);