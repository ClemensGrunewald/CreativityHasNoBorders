
//- Index Page
module.exports.render_index = function(req, res) {
  //- Put user database request here to make the experience more personalized

  //- Database request to get the data structure of the main page

  res.render('index/index',{ title: 'Creativity Has No Borders', error:null, data: {user: {username: req.user.username}, page: "index", modules:[{order: 1, name:"the_project_module", title: "THE PROJECT."}], timestamp: 1 } })
};

//- All Portfolios Page
module.exports.render_portfolios = function(req, res) {
  res.json({ Portfolios: 'all' });
};






//- Redirects

//- To Login-Page
module.exports.redirect_login = function(req, res) {
  res.redirect("auth/login");
};

//- To SignUp Page
module.exports.redirect_register = function(req, res) {
  res.redirect("auth/register");
};

//- Logout
module.exports.redirect_logout = function(req, res) {
  res.redirect("auth/logout");
};
