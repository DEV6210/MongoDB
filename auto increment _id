import mongoose from "mongoose";

import autoIncrement from 'mongoose-auto-increment';

const userSchema = mongoose.Schema({
    cname:String,
    mobile:String,
    mail:String,
    dob:Date,
    gender:String,
    rel:String,
    address:String,
    adate:Date,
    class:String,
    roll:String,
    image:String
});

autoIncrement.initialize(mongoose.connection);
userSchema.plugin(autoIncrement.plugin, 'sms');

const user = mongoose.model('sms', userSchema);

export default user;
