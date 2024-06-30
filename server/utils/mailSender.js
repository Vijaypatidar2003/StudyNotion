const nodemailer = require("nodemailer");
require("dotenv").config();
async function mailSender(email,title,body){
    try{
        let transporter = nodemailer.createTransport({
            host: process.env.MAIL_HOST,
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS,
            },
            secure: false,
        })

        let info = transporter.sendMail({
            from:"StudyNotion",
            to:`${email}`,
            subject:`${title}`,
            html:`${body}`
        })
        console.log(info);
        return info;
    }catch(error){
        console.log(error.message);
    }
}
module.exports=mailSender;