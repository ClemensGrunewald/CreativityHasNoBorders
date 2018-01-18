var config          = require('../config');
var User            = require('../models/user.js');
var Project         = require('../models/project.js');
var Challenge       = require('../models/challenge.js');
var cookieSession   = require('cookie-session');
var validator       = require('validator');
var crypto          = require('crypto');
var sendmail        = require('sendmail')();
var email           = require('./email.js');


//- GET Log In Page
module.exports.render_login = function(req, res) {
  res.render('auth/login',{ title: 'Login | Creativity Has No Borders', error:null, data: {user: req.user}})
};

//- POST Log In Page
module.exports.process_login = function(req, res) {

  //- Variables
  var raw_data = req.body;
  raw_data.email = req.sanitize(req.body.email);

  //- User Data Validation
  if(raw_data.email.toLowerCase() != '' && (raw_data.password != null && raw_data.password != '')){

    //- Find user
    User.findOne({$or: [{ username: raw_data.email },{ email: raw_data.email }], isActive: true}, function(err, user) {
      if(!user){
        return res.render('auth/login',{ title: 'Login | Creativity Has No Borders', error:"Invalid Username, Email or Password", data: {user: req.user, email:raw_data.email}})
      }
      if(user.isBlocked){
        return res.render('auth/login',{ title: 'Login | Creativity Has No Borders', error:"Your Account was blocked.", data: {user: req.user, email:raw_data.email}})
      }

      //- Test if Passwords Match
      user.comparePassword(raw_data.password, function(err, isMatch) {
        if(!isMatch){
          return res.render('auth/login',{ title: 'Login | Creativity Has No Borders', error:"Invalid Username, Email or Password", data: {user: req.user, email:raw_data.email}})
        }

        //- Set new access token if needed
        if(user.access_token_expires < Date.now()){
          user.access_token = crypto.randomBytes(20).toString('hex');
          user.access_token_expires = Date.now() + 3600000*24*30; //- Valid for 30 Days
        }

        //- Save and Redirect
        user.save(function (err) {
          if(err) {return res.redirect("/auth/login");}

          //- Set Up Session Cookie
          var obj = {};
          obj.username = user.username;
          obj.email = user.email;
          obj.token = user.access_token;
          obj.isAuthenticated = true;
          req.session.user = obj;

          res.redirect("/u/"+user.username);
        });
      });

    })

  }
};

//- GET Sign Up Page
module.exports.render_register = function(req, res) {
  res.render('auth/register',{ title: 'Register | Creativity Has No Borders', error:null, data: {user: req.user}})
};

//- POST Sign Up Page
module.exports.process_register = function(req, res) {

  //- Variables
  var raw_data = req.body;

  //- User Data Validation
  if(raw_data.terms === 'on' &&
     !validator.isEmpty(raw_data.username) &&
     !validator.isEmpty(raw_data.first_name) &&
     !validator.isEmpty(raw_data.last_name) &&
     validator.isEmail(raw_data.email) &&
     raw_data.password.length >= 8 && raw_data.password === raw_data.confirm_password
    ){
      var user = {};
      user.username = req.sanitize(req.body.username).toLowerCase();
      user.first = req.sanitize(req.body.first_name);
      user.last = req.sanitize(req.body.last_name);
      user.email = req.sanitize(req.body.email);
      user.password = raw_data.password;

      user.address = req.sanitize(req.body.address);
      user.age = req.sanitize(req.body.age);
      if(req.sanitize(req.body.gender) != "Gender") user.gender = req.sanitize(req.body.gender);
      user.profession = req.sanitize(req.body.profession);
    }


    //- All fields where validated
    if(Object.keys(user).length >= 5){

    //- Check if user already exists
    User.find({ $or: [{username: user.username},{email:user.email}]}, function(err, users) {

      if(users.length === 0){

        //- Set initial Access token which also gets used as registration token
        var access_token = crypto.randomBytes(20).toString('hex');
        var access_token_expires = Date.now() + 3600000;

        //- create a new user
        var newUser = new User({
          name: {
            first: user.first,
            last: user.last
          },
          username: user.username,
          email: user.email,
          password: user.password,
          access_token: access_token,
          access_token_expires: access_token_expires,
          meta: {
            age: user.age,
            gender: user.gender,
            title: user.profession,
            status: "career starter"
          }
        });

        //- save user to database
        newUser.save(function(err) {
          if (err){
            console.log(err);
            res.render('auth/register',{ title: 'Register | Creativity Has No Borders', error:"Something went wrong.", data:raw_data}); //- If Saving fails
          } else {
            res.render('auth/confirm_registration',{ title: 'Confirm Registration | Creativity Has No Borders', data:{email:user.email}}) //- Redirect at Success

            //- Send activation Email
            sendmail({
                from: 'no-reply@creativityhasnoborders.com',
                to: user.email,
                subject: '[CHNB] Activate your Account',
                html: email.activate(config.host, access_token),
              }, function(err, reply) {});
          }

        });

      } else {

        //- If user already exists
        res.render('auth/register',{ title: 'Register | Creativity Has No Borders', error:"User already exists.", data:raw_data});

      }

    });

  } else {

    //- If input validation failed
    res.render('auth/register',{ title: 'Register | Creativity Has No Borders', error:"Review your inputs. Have you used any prohibited characters?", data:raw_data });

  }
};

//- GET to Confirm Registration
module.exports.process_confirmation = function(req, res) {

  //- Update Database entry - Activate User
  User.update({access_token: req.sanitize(req.params.token), access_token_expires: { $gt: Date.now() }},{ $set: { isActive: true }},{multi: false}, function(err, users) {

    //- If activation process was successfull -> redirect to the login page
    if(users.ok > 0){
      res.redirect("/auth/login")
    }

    //- else redirect him to the main page (without error)
    else {
      res.redirect("/");
    }

  });

};

//- GET Password Reset
module.exports.render_password_reset = function(req, res) {
  res.render('auth/password_reset',{ title: 'Password Reset | Creativity Has No Borders', error:null, data: {user: req.user}})
};

//- POST Password Reset
module.exports.process_password_reset = function(req, res) {
  var raw_data = req.body;

  //- Validate e-mail adress
  if(!validator.isEmail(raw_data.email) || !isAlphanumericExtended(raw_data.email) || raw_data.email.toLowerCase() === '' || raw_data.email.toLowerCase() === undefined || raw_data.email.toLowerCase() === null){
    return res.render('auth/password_reset',{ title: 'Password Reset | Creativity Has No Borders', error:"The provided e-mail address is invalid. Please try again.", data: {user: req.user, email:req.body.email}})
  }

  //- Find user with specific e-mail
  User.findOne({ email: req.sanitize(raw_data.email) }, function(err, user) {
    if(!user){
      return res.render('auth/password_reset',{ title: 'Password Reset | Creativity Has No Borders', error:"The provided e-mail address does not exist. Please try again.", data: {user: req.user, email:req.body.email}})
    }

    //- Create and save Token to Database
    user.reset_password_token = crypto.randomBytes(20).toString('hex');
    user.reset_password_token_expires = Date.now() + 3600000; // 1 hour
    user.save(function (err) {
      if(err) return res.render('auth/password_reset',{ title: 'Password Reset | Creativity Has No Borders', error:"Something went wrong. Please try again.", data: {user: req.user, email:req.body.email}})

      //- Send activation Email
      sendmail({
        from: 'no-reply@creativityhasnoborders.com',
        to: user.email,
        subject: '[CHNB] Reset your Password',
        html: email.pw_reset(config.host, user.reset_password_token),
      }, function(err, reply) {});

      //- Render confirmation page
      res.render('auth/confirm_reset',{ title: 'Password Reset | Creativity Has No Borders', data:{user: req.user, email:user.email}}) //- Redirect at Success
    });

  });

};

//- GET Confirmed Password Reset
module.exports.render_password_reset_new = function(req, res) {

  //- find user with the right token
  User.findOne({ reset_password_token: req.sanitize(req.params.token), reset_password_token_expires: { $gt: Date.now() } }, function(err, user) {
    if(!user) {
      return res.redirect("/auth/password_reset");
    }
    res.render('auth/password_reset_new',{ title: 'Password Reset | Creativity Has No Borders', error:null, data: {user: req.user}})
  });

};

//- POST Confirmed Password Reset
module.exports.process_password_reset_new = function(req, res) {

  //- Find User with the provided Token
  User.findOne({ reset_password_token: req.sanitize(req.params.token), reset_password_token_expires: { $gt: Date.now() } }, function(err, user) {
    if(!user){
      return res.redirect(req.originalUrl);
    }

    //- Save new (valid) password to database
    if (req.body.password === req.body.confirm_password && req.body.password != '' && req.body.password.length >= 8){
      user.password = req.body.password;
      user.reset_password_token = null;
      user.reset_password_token_expires = null;
      user.save(function (err) {
        res.redirect("/auth/login")
      });
    } else {
      res.redirect(req.originalUrl)
    }

  });

};

//- GET Logout
module.exports.render_logout = function(req, res) {
  req.session = null;
  res.redirect("/login");
};

//- Helperfunctions
function isAlphanumeric(string){
    if( /[^A-Za-z0-9_\-]/.test(string) && string === '' ) {
       return false;
    }
    return true;
}

function isAlphanumericExtended(string){
    if( /[^A-Za-z0-9_.@\-]/.test(string) && string === '' ) {
       return false;
    }
    return true;
}
