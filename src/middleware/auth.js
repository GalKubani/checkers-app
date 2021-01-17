const jwt= require('jsonwebtoken')
const User= require("../models/usermodel")

const auth= async(req,res,next)=>{
    try{
        const token= req.header("Authorization").replace("Bearer ", "");
        const data= jwt.verify(token, 'nvuskvg731h8')
        const user= await User.findOne({
            _id: data._id,
            "tokens.token": token,//checks if token exists in tokens array for that user
        })
        if(!user){
            throw new Error();
        }
        req.user=user;
        req.token=token;
        next();
    }
    catch(err){
        res.status(400).send({
            status:400,message:"authentication failed"
        })
    }
}
module.exports=auth;