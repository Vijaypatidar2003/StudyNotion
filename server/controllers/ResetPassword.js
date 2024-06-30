const User = require("../models/User")
const bcrypt = require('bcrypt');
const mailSender = require('../utils/mailSender')

exports.resetPasswordToken = async(req,res)=>{
    try{
        const {email} = req.body;

        const existingUser = await User.findOne({email});

        //email id is not registered
        if(!existingUser){
            return res.json({
                success: false,
                message: `This Email: ${email} is not Registered With Us Enter a Valid Email `,
            })
        }

        //generate token
        const token = crypto.randomUUID();

        //update User by adding token and expiration time
        const updatedUserDetails = await User.findOneAndUpdate({email},{
            token:token,
            resetPasswordExpires:Date.now()+5*60*1000,
        },{new:true});

        //create url
        //url for every user would be different that's why we will generate unique token  and it is different than jwt token
        const url=`http://localhost:3000/update-password/${token}`;

        //send mail containing url
        await mailSender(email,"Password Reset Link",`Password Reset Link:${url}`);

        //return res
        return res.status(200).json({
            success:true,
            message:'mail sent successfully. Please check mail and reset password'
        })

    }catch(error){
        return res.status(500).json({
            error: error.message,
            success: false,
            message: `Some Error in Sending the Reset Message`,
          })
    }
}

exports.resetPassword = async (req,res)=>{
    try{
        //fetch data from req.body
        const {password,confirmPassword,token}=req.body;

        if(password!==confirmPassword){
            return res.json({
                success:false,
                message:'new Password and confirm Password must be same'
            })
        }

        //get userdetails from database using token
        const userDetails = await User.findOne({token});

        if (!userDetails) {
            return res.json({
              success: false,
              message: "Token is Invalid",
            })
        }

        //token time check
        if(userDetails.resetPasswordExpires<Date.now()){
            return res.json({
                success:false,
                message:'token expired'
            })
        }

        //hash password
        const hashedPassword= await bcrypt.hash(password,10);

        //update password in database
        const newUserDetails=await User.findOneAndUpdate({token},
            {password:hashedPassword},
            {new:true})

        //return response
        return res.json({
            success:true,
            message:'Password reset successfully'
        })
    }catch(error){
        return res.json({
            error: error.message,
            success: false,
            message: `Some Error in Updating the Password`,
        })
    }
}