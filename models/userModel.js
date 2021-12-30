const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  active: {
    type: Boolean,
    default: true,
    select: false
  },
  name: {
    type: String,
    required: [true, 'Please provide your username'], //validators
    maxLength: [40, 'Username must have less OR 40 characters'],
    minLength: [3, 'Username must have more OR 3 characters'],
    trim: true
  },
  email: {
    type: String,
    lowercase: true,
    unique: true,
    required: [true, 'Please provide your email'], //validator
    validate: [validator.isEmail, 'Wrong email format']
  },
  password: {
    type: String,
    required: [true, 'Please provide your password'], //validator
    trim: true,
    select: false,
    //validate: [
    //  validator.isStrongPassword, 
    //  'Password must contain at least 8 characters, and at least one uppercase, one number and one symbol'
    //],
    min: [8, 'Password must contain at least 8 characters'],
    trim: true
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user'
  },
  photo: {
    type: String,
    default: 'default.jpg'
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      validator: function(pass) {
        return pass === this.password;
      },
      message: "Passsword didn't match"
    }
  },
  passwordChangedAt: {
    type: Date,
    select: false
  },
  passwordResetToken: String,
  passwordResetExpires: Date
}, {
  toJSON: {virtuals: true},
  toObject: {virtuals: true}
});
//Virtual properties
//INSTANCE METHODS
//Check if entered password is legit
userSchema.methods.checkPassword = async function(candidatePassword, correctpassword) {
  return await bcrypt.compare(candidatePassword, correctpassword);
};
//Check if password is newer than the issued token
userSchema.methods.changedPasswordAfter = async function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const passwordTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < passwordTimestamp;
  }
  return false; 
}
//
userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // token expires in 10 minutes
  
  console.log({ resetToken }, this.passwordResetToken);

  return resetToken; //we send token to user in plain
}
//DOCUMENT MIDDLEWARE: runs before save() and create() .insertMany()
userSchema.pre('save', async function(next) {
  if(this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12);    
    this.passwordConfirm = undefined;
    next();
  }
  next();
});
userSchema.pre('save', async function(next) {
  if(this.isModified('password') || !this.isNew) { //set timestamp only if we modify the password
    this.passwordChangedAt = Date.now() - 1000;    //and not creating a new one. Also substrat one sec
                                                   //to ensure that JWT token issued after the password change
    next();
  }
  next();
});
//Query middleware
//Don't show active status field to user
userSchema.pre(/^find/, function(next) {
  this.find({active: {$ne: false} });
  next();
});
const User = mongoose.model('User', userSchema); //models start with capital letters


module.exports = User;






