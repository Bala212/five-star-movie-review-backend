const mongoose = require('mongoose');
const bcrypt = require('bcrypt');


const emailVerificationTokenSchema = mongoose.Schema({
    owner: {
        //type of this _id is different so we explixitly set it
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", //it is of user more specifically
        required: true
    },
    token: { //OTP
        type: String,
        required: true
    },
    expiry: { //Expiry of OTP
        type: Date,
        expires: 3600, //expires after 1 hr.
        default: Date.now() //expiry will start from that current time.
    }
});

// Hashing a token i.e OTP !!
emailVerificationTokenSchema.pre('save', async function (next) {
    if (this.isModified('token')) {
        const hash = await bcrypt.hash(this.token, 10);
        this.token = hash;
    }
    next();
});

emailVerificationTokenSchema.methods.compareToken = async function (token) {
    const result = await bcrypt.compare(token, this.token);
    return result;
}

module.exports = mongoose.model('EmailVerificationToken', emailVerificationTokenSchema);