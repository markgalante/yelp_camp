const   mongoose                = require("mongoose"), 
        passportLocalMongoose   = require("passport-local-mongoose"); 

const UserSchema = new mongoose.Schema({
    username: String, 
    password: String, 
    image: String, 
    imageId: String, //Delete if not working 
    firstName: String, 
    lastName: String, 
    email: {type: String, unique: true}, //required to change password
    resetPasswordToken: String, //required to change password
    resetPasswordExpires: Date, //required to change password
    isAdmin: {type: Boolean, default: false} //Creating admin roles 
});

UserSchema.plugin(passportLocalMongoose); //Takes this package and adds methods 
//from package to schema

module.exports = mongoose.model("User", UserSchema); 