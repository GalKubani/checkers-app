const mongoose= require('mongoose')
const bcrypt=require('bcryptjs')
const jwt= require('jsonwebtoken')

const userSchema= new mongoose.Schema({
    username:{type: String,required:true,trim:true,unique:true},
    ratings:{type: Number,default: 0},
    password:{type: String,required:true,trim:true,
        validate(value) {
            const passRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{0,}$/;
            if (!passRegex.test(value)) {
                throw new Error("password must contain big and small characters and numbers");
            }
        }},
    tokens:[{
        token:{type: String,
              required:true
        }
    }],
}, {timestamps:true}
);
userSchema.methods.generateAuthToken= async function(){
    const token= jwt.sign({_id: this._id.toString()},'secret',{expiresIn: "6h", })
    this.tokens= this.tokens.concat({token});
    await this.save();
    return token;
}
userSchema.methods.toJSON= function(){
    const userObj= this.toObject();
    delete userObj.password;
    delete userObj.tokens;
    return userObj
}
userSchema.pre('save',async function(next){
    if(this.isModified('password')){
        this.password=await bcrypt.hash(this.password,8)
    }
    next()
})
userSchema.statics.findByCredentials= async(username,password)=>{
    const user= await User.findOne({username})
    if(!user){
        throw new Error("Unable to login, user not found")
    }
    const isMatch= await bcrypt.compare(password,user.password)
    if(!isMatch){
        throw new Error("Unable to login, invalid password")
    }
    return user;
}
const User= mongoose.model('User',userSchema);
module.exports=User