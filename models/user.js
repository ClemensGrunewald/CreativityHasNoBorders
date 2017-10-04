var config    = require('../config');

//- Mongoose Database Integration
var mongoose  = require('mongoose');
var Schema    = mongoose.Schema;
mongoose.connect('mongodb://localhost/'+config.mongodb);

//- Encrypting & Securing Data
var bcrypt    = require('bcrypt'),
SALT_WORK_FACTOR = 10;

//- Create a User Schema
var userSchema = new Schema({
  name: {
    first: String,
    last:String
  },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isAdmin: { type: Boolean, default: false },
  isMod: { type: Boolean, default: false },
  isActive: { type: Boolean, default: false },
  isBlocked: { type: Boolean, default: false },
  isAgencyUser: { type: Boolean, default: false },
  access_token: String,
  access_token_expires: Date,
  reset_password_token: String,
  reset_password_token_expires: Date,
  meta: {
    profile_img: String,
    cover_img: String,
    title: String,
    description: String,
    age: Number,
    gender: String,
    location: String,
    facebook: String,
    linkedin: String,
    twitter: String,
    instagram: String,
    website: String,
  },
  created_at: Date,
  updated_at: Date
});

//- Password Hashing before saving
userSchema.pre('save', function(next){
  var user = this;
  if(!user.created_at){
    user.created_at = new Date();
  }
  user.updated_at = new Date();

  if (!user.isModified('password')) return next(); //- Only hash password if it is new

  bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) { //- generate a salt
    if (err) return next(err);

    bcrypt.hash(user.password, salt, function(err, hash) { //- hash the password along with our new salt
      if (err) return next(err);
      user.password = hash; //- override the cleartext password with the hashed one
      next();
    });
  });
});


//- Add function to compare Password
userSchema.methods.comparePassword = function(candidatePassword, cb) {
  bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
    if (err) return cb(err);
      cb(null, isMatch);
  });
};




//- Create User Model
var User = mongoose.model('User', userSchema);

//- Export
module.exports = User;
