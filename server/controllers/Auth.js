const OTP = require("../models/OTP")
const User = require("../models/User")
const bcrypt = require('bcrypt');
const otpGenerator = require('otp-generator')
const jwt = require('jsonwebtoken');
require("dotenv").config();

exports.sendOtp = async(req,res)=>{
    try{
        const {email} = req.body;

        // check if the user is already registered
        const existingUser = await User.findOne({email});

        if(existingUser){
            return res.status(401).json({
                success: false,
                message: `User is Already Registered`,
            })
        }

        const otp = otpGenerator.generate(6,{
            upperCaseAlphabets:false,
            lowerCaseAlphabets:false,
            specialChars:false,
        })

        console.log(otp)

        //check unique otp or not
        var result=await OTP.findOne({otp:otp});

        while(result){
            otp=otpGenerator.generate(6,{
                upperCaseAlphabets:false,
                lowerCaseAlphabets:false,
                specialChars:false
            })
            result=await OTP.findOne({otp:otp});
        }

        const payload = {email,otp};
        const otpBody = await OTP.create(payload);

        res.status(200).json({
            success: true,
            message: `OTP Sent Successfully`,
            otp,
        })
    }catch(error){
        console.log(error.message)
        return res.status(500).json({
            success:false,
            message:error.message,
            error:error.message
        })
    }
}

exports.signup = async(req,res)=>{
    try{
        // Destructure fields from the request body
        const {
            firstName,
            lastName,
            email,
            password,
            confirmPassword,
            accountType,
            contactNumber,
            otp,
        } = req.body
        // Check if All Details are there or not
        if (
            !firstName ||
            !lastName ||
            !email ||
            !password ||
            !confirmPassword ||
            !otp
        ) {
            return res.status(403).send({
            success: false,
            message: "All Fields are required",
            })
        }

        // Check if password and confirm password match
        if (password !== confirmPassword) {
            return res.status(400).json({
            success: false,
            message:
                "Password and Confirm Password do not match. Please try again.",
            })
        }

        //check if user already exist
        const existingUser = await User.findOne({email});
        if (existingUser) {
            return res.status(400).json({
              success: false,
              message: "User already exists. Please sign in to continue.",
            })
        }

        //find most recent otp for mail
        const response = await OTP.find({email}).sort({createdAt:-1}).limit(1);
        console.log(response);

        if(response.length==0){
            // OTP not found for the email
            return res.status(400).json({
                success: false,
                message: "The OTP is not valid",
            })
        }else if(otp!==response[0].otp){
             // Invalid OTP
            return res.status(400).json({
                success: false,
                message: "The OTP is not valid",
            })
        }

        //hash password
        const hashedPassword = await bcrypt.hash(password,10);

        // Create the Additional Profile For User
        const profileDetails = await Profile.create({
            gender: null,
            dateOfBirth: null,
            about: null,
            contactNumber: null,
        })

        const user = await User.create({
            firstName,
            lastName,
            email,
            contactNumber,
            password: hashedPassword,
            accountType: accountType,
            additionalDetails: profileDetails._id,
            image: "",
          })

        return res.status(200).json({
           success: true,
           user,
           message: "User registered successfully",
        })

    }catch(error){
        return res.status(500).json({
            success:false,
            message:`error while signup - ${error}`
        })
    }
}

exports.login = async(req,res)=>{
    try{
        // Get email and password from request body
        const { email, password } = req.body

        // Check if email or password is missing
        if (!email || !password) {
            // Return 400 Bad Request status code with error message
            return res.status(400).json({
                success: false,
                message: `Please Fill up All the Required Fields`,
            })
        }

        // Find user with provided email
        const user = await User.findOne({ email }).populate("additionalDetails")

        // If user not found with provided email
        if (!user) {
            // Return 401 Unauthorized status code with error message
            return res.status(401).json({
                success: false,
                message: `User is not Registered with Us Please SignUp to Continue`,
            })
        }

        //after comparing generate jwtm token
        if(await bcrypt.compare(password,user.password)){
            //create token
            const token = jwt.sign(
                {email:user.email,id:user._id,role:user.role},
                process.env.JWT_SECRET,
                {expiresIn:"24h"}
            )

            //in below 2 statement we are not making entry in database rather we are adding properties in the object
            //fetched from database means database will have no effect
            user.token=token;
            user.password=undefined;
            //create cookie and response

            res.cookie("token",token,{
                expires:new Date(Date.now()+3*24*60*60*1000),
                httpOnly:true,
            }).status(200).json({
                success:true,
                token,
                user,
                message:"User login success"
            })
        }else{
            return res.status(401).json({
                success: false,
                message: `Password is incorrect`,
            })
        }
    }catch(error){
        console.error(error)
        // Return 500 Internal Server Error status code with error message
        return res.status(500).json({
          success: false,
          message: `Login Failure Please Try Again`,
        })
    }
}

