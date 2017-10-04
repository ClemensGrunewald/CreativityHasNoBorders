var User      = require('../models/user.js');


//- Index Page
module.exports.render_index = function(req, res) {
  console.log(req.session.user);

  //- Put user database request here to make the experience more personalized

  //- Database request to get the data structure of the main page

  res.render('public/index',{ title: 'Creativity Has No Borders', error:null, data: null})
};

//- All Portfolios Page
module.exports.render_portfolios = function(req, res) {
  res.json({ Portfolios: 'all' });
};








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
