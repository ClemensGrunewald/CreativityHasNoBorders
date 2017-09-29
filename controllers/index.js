var User      = require('../models/user.js');
var sendmail  = require('sendmail')();


//- Index Page
module.exports.render_index = function(req, res) {
  //res.json({ hello: 'world' });
  res.render('public/index',{ title: 'Creativity Has No Borders', error:null, data: null})
};

//- All Portfolios Page
module.exports.render_portfolios = function(req, res) {
  res.json({ Portfolios: 'all' });
};


/*
//- GET Sign Up Page
module.exports.render_register = function(req, res) {
  res.render('register',{ title: 'Register', error:null, user: null})
};

//- POST Sign Up Page
module.exports.process_register = function(req, res) {

  //- Variables
  console.log(req.body);
  var error_msg = null;
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
        var reg_token = Math.random().toString(36).replace(/[^a-zA-Z0-9]+/g, '').substr(0, 10);

        //- create a new user
        var newUser = new User({
          name: {
            first: user.first,
            last: user.last
          },
          username: user.username,
          email: user.email,
          password: user.password,
          reg_token: reg_token
        });


        //- save user to database
        newUser.save(function(err) {
          if (err){
            console.log(err);
            res.render('register',{ title: 'Register', error:"Something went wrong.", data:raw_data}); //- If Saving fails
          } else {
            res.redirect("/register/success?"+"email="+user.email); //- Redirect at Success

            //- Send activation Email
            sendmail({
                from: 'no-reply@creativityhasnoborders.com',
                to: user.email,
                subject: '[CHNB] Activate your Account',
                html: 'Click here to activate your Account: http://localhost:3000/auth/'+reg_token,
              }, function(err, reply) {});
          }

        });

      } else {

        //- If user already exists
        res.render('register',{ title: 'Register', error:"User already exists.", data:raw_data});

      }

    });

  } else {

    //- If input validation failed
    res.render('register',{ title: 'Register', error:"Review your inputs. Have you used any prohibited characters?", data:raw_data });

  }
};

//- GET Sign Up Success Page
module.exports.render_register_success = function(req, res) {
  res.render('register_success',{ title: 'Register', error:null, user: null})
};







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


/*
//- fetch user and test password verification
User.findOne({ username: newUser.username }, function(err, user) {
  if (err) throw err;

  // test a matching password
  user.comparePassword('passwd', function(err, isMatch) {
    if (err) throw err;
    console.log('passwd:', isMatch); // -&gt; Password123: true
  });

  // test a failing password
  user.comparePassword('123Password', function(err, isMatch) {
    if (err) throw err;
    console.log('123Password:', isMatch); // -&gt; 123Password: false
  })
});*/
