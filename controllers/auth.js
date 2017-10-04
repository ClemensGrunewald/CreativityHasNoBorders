var config          = require('../config');
var User            = require('../models/user.js');
var Project         = require('../models/project.js');
var Challenge       = require('../models/challenge.js');
var cookieSession   = require('cookie-session');
var crypto          = require('crypto');
var sendmail        = require('sendmail')();


//- GET Log In Page
module.exports.render_login = function(req, res) {
  res.render('login',{ title: 'Login | Creativity Has No Borders', error:null, data: null})
};

//- POST Log In Page
module.exports.process_login = function(req, res) {

  //- Variables
  var raw_data = req.body;

  //- User Data Validation
  if(raw_data.email.toLowerCase() != '' && (raw_data.password != null && raw_data.password != '')){

    //- Find user
    User.findOne({$or: [{ username: raw_data.email },{ email: raw_data.email }], isActive: true, isBlocked:false}, function(err, user) {
      if(!user){
        return res.render('login',{ title: 'Login | Creativity Has No Borders', error:"Invalid Username, Email or Password", data: {email:raw_data.email}})
      }

      //- Test if Passwords Match
      user.comparePassword(raw_data.password, function(err, isMatch) {
        if(!isMatch){
          return res.render('login',{ title: 'Login | Creativity Has No Borders', error:"Invalid Username, Email or Password", data: {email:raw_data.email}})
        }

        //- Set new access token if needed
        if(user.access_token_expires < Date.now()+24*60*60*1000){
          user.access_token = crypto.randomBytes(20).toString('hex');
          user.access_token_expires = Date.now() + 3600000*24*7;
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

          res.redirect("/");
        });
      });

    })

  }
};

//- GET Sign Up Page
module.exports.render_register = function(req, res) {
  res.render('register',{ title: 'Register | Creativity Has No Borders', error:null, data: null})
};

//- POST Sign Up Page
module.exports.process_register = function(req, res) {

  //- Variables
  var raw_data = req.body;

  //- User Data Validation
  var user = {};
  if (isAlphanumeric(raw_data.username)) user.username = raw_data.username.toLowerCase();
  if (isAlphanumeric(raw_data.first_name)) user.first = raw_data.first_name.toLowerCase();
  if (isAlphanumeric(raw_data.last_name)) user.last = raw_data.last_name.toLowerCase();
  if (isAlphanumericExtended(raw_data.email)) user.email = raw_data.email.toLowerCase();
  if (raw_data.password === raw_data.confirm_password && raw_data.password != '' && raw_data.password.length >= 8) user.password = raw_data.password;

  //- All fields where validated
  if(Object.keys(user).length === Object.keys(raw_data).length-2){

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
          access_token_expires: access_token_expires
        });

        //- save user to database
        newUser.save(function(err) {
          if (err){
            console.log(err);
            res.render('register',{ title: 'Register | Creativity Has No Borders', error:"Something went wrong.", data:raw_data}); //- If Saving fails
          } else {
            res.render('confirm_registration',{ title: 'Confirm Registration | Creativity Has No Borders', data:{email:user.email}}) //- Redirect at Success

            //- Send activation Email
            sendmail({
                from: 'no-reply@creativityhasnoborders.com',
                to: user.email,
                subject: '[CHNB] Activate your Account',
                html: 'Click here to activate your Account: '+config.host+'/auth/confirmation/'+access_token,
              }, function(err, reply) {});
          }

        });

      } else {

        //- If user already exists
        res.render('register',{ title: 'Register | Creativity Has No Borders', error:"User already exists.", data:raw_data});

      }

    });

  } else {

    //- If input validation failed
    res.render('register',{ title: 'Register | Creativity Has No Borders', error:"Review your inputs. Have you used any prohibited characters?", data:raw_data });

  }
};

//- GET to Confirm Registration
module.exports.process_confirmation = function(req, res) {

  //- Update Database entry - Activate User
  User.update({access_token: req.params.token, access_token_expires: { $gt: Date.now() }},{ $set: { isActive: true }},{multi: false}, function(err, users) {

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
  res.render('password_reset',{ title: 'Password Reset | Creativity Has No Borders', error:null, data: null})
};

//- POST Password Reset
module.exports.process_password_reset = function(req, res) {
  var raw_data = req.body;

  //- Validate e-mail adress
  if(isAlphanumericExtended(raw_data.email) && raw_data.email.toLowerCase() != '' && raw_data.email.toLowerCase() != undefined && raw_data.email.toLowerCase() != null){

    //- Find user with specific e-mail
    User.findOne({ email: raw_data.email }, function(err, user) {
      if(!user){
        return res.redirect("/auth/password-reset");
      }

      //- Create and save Token to Database
      user.reset_password_token = crypto.randomBytes(20).toString('hex');
      user.reset_password_token_expires = Date.now() + 3600000; // 1 hour
      user.save(function (err) {
        if(err) {return res.redirect("/auth/password-reset");}
      });

      //- Send activation Email
      sendmail({
        from: 'no-reply@creativityhasnoborders.com',
        to: user.email,
        subject: '[CHNB] Reset your Password',
        html: 'Click here to reset your Password: '+config.host+'/auth/password-reset/'+user.reset_password_token,
      }, function(err, reply) {});

      //- Render confirmation page
      res.render('confirm_reset',{ title: 'Password Reset | Creativity Has No Borders', data:{email:user.email}}) //- Redirect at Success

    });

  } else {
    res.render('password_reset',{ title: 'Password Reset | Creativity Has No Borders', error:"The provided e-mail address is invalid. Please try again.", data: {email:req.body.email}})
  }
};

//- GET Confirmed Password Reset
module.exports.render_password_reset_new = function(req, res) {

  //- find user with the right token
  User.findOne({ reset_password_token: req.params.token, reset_password_token_expires: { $gt: Date.now() } }, function(err, user) {
    if(!user) {
      return res.redirect("/");
    }
    res.render('password_reset_new',{ title: 'Password Reset | Creativity Has No Borders', error:null, data: null})
  });

};

//- POST Confirmed Password Reset
module.exports.process_password_reset_new = function(req, res) {

  //- Find User with the provided Token
  User.findOne({ reset_password_token: req.params.token, reset_password_token_expires: { $gt: Date.now() } }, function(err, user) {
    if(!user){
      return res.render('password_reset_new',{ title: 'Password Reset | Creativity Has No Borders', error:"Invalid Link or something else has happened", data: null})
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
      res.render('password_reset_new',{ title: 'Password Reset | Creativity Has No Borders', error:"The passwords have to be equal.", data: null})
    }

  });

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
