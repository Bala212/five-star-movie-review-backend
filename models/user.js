const mongoose  = require("mongoose");
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    name :{
        type:String,
        trim: true,
        required:true
    },
    email:{
        type:String,
        trim: true,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true
    },
    isVerified:{
        type:Boolean,
        required:true,
        default: false
    },
    role:{
        type:String,
        required:true,
        default:"user", //default role is user
        enum : ["admin","user"] // i.e role can be either admin or user
    }
});

//Hashing a password!!
userSchema.pre('save',async function(next){
    if(this.isModified('password')){
        const hash = await bcrypt.hash(this.password,10);
        this.password = hash;
    }
    next();
});

//compare password
userSchema.methods.comparePassword = async function (password) {
    const result = await bcrypt.compare(password, this.password);
    return result;
}

module.exports = mongoose.model('User',userSchema);