const mongoose = require("mongoose");
require("dotenv").config();
exports.connectDB = async()=>{
    try{
        const conn = await mongoose.connect(process.env.DATABASE_URL,{
            useNewUrlParser:true,
            useUnifiedTopology:true
        })
        console.log(`connection established successfully`)
    }catch(error){
        console.log(`error in establishing connection`);
    }
}