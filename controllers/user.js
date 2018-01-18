var config          = require('../config');
var User            = require('../models/user.js');
var Project         = require('../models/project.js');
var Challenge       = require('../models/challenge.js');
var crypto          = require('crypto');
var querystring     = require('querystring');
var sharp           = require('sharp');

//- Users Page
module.exports.render_user = function(req, res) {

  //- Get Profile Information
  User.findOne({username: req.sanitize(req.params.username), isActive:true}, function(err,user){
    if(err || !user) return res.redirect("/error");

    //- Get Projects
    Project.find({username: req.sanitize(req.params.username), isActive:true, isBlocked: false}).sort({created_at:-1}).exec(function(err, projects){

      //- Find the Picture with the smalles order number as thumbnail
      for(var i=0; i<projects.length; i++){

        var smallestOrder;
        var counter = 0;
        projects[i].media.forEach(function(item){
          if(item.type === "image" && item.isActive){
            if(counter === 0){
              smallestOrder = item.order;
              projects[i].thumbnail = item.path;
              counter++;
            }
            if(item.order >= 0 && item.order < smallestOrder){
              smallestOrder = item.order;
              projects[i].thumbnail = item.path;
            }
          }
        })

      }

      res.render('user/profile',{ title: 'Creativity Has No Borders', error:null, data: {user: req.user, profile: user, projects: projects } })
    })

  });

};

//- GET User Edit Page
module.exports.render_user_edit = function(req, res) {

  //- checks if user is authenticated
  if(req.user.isAuthenticated === false) return res.redirect("/login");
  if(!req.user.isAdmin && !req.user.isMod && req.params.username != req.user.username) return res.redirect("/u/"+req.user.username+"/edit");

  User.findOne({username: req.sanitize(req.params.username), isActive:true}, function(err, user){
    if(err || !user) return res.redirect("/error");

    res.render('user/profile_edit',{ title: 'Creativity Has No Borders', error:null, data: {user: req.user, profile: user} })
  });

};

//- POST User Edit Page
module.exports.process_user_edit = function(req, res) {

  //- checks if user is authenticated
  if(req.user.isAuthenticated === false) return res.redirect("/login");
  if(!req.user.isAdmin && !req.user.isMod && req.params.username != req.user.username) return res.redirect("/u/"+req.user.username+"/edit");


  //Sanitize input
  var user = {};
  user.email = req.sanitize(req.body.email);

  user.name = {};
  user.name.first = req.sanitize(req.body.firstname);
  user.name.last = req.sanitize(req.body.lastname);

  user.meta = {};
  user.meta.age = req.sanitize(req.body.age);
  user.meta.gender = req.sanitize(req.body.gender);
  user.meta.status = req.sanitize(req.body.status);
  if(req.sanitize(req.body.description)) user.meta.description = req.sanitize(req.body.description).substring(0,140);
  user.meta.facebook = req.sanitize(req.body.facebook);
  user.meta.instagram = req.sanitize(req.body.instagram);
  user.meta.twitter = req.sanitize(req.body.twitter);
  user.meta.linkedin = req.sanitize(req.body.linkedin);
  user.meta.website = req.sanitize(req.body.website);

  //Set new Password if available
  if(req.body.password != '' && req.body.password.length >= 8 && req.body.password === req.body.confirm_password){
    User.findOne({username: req.sanitize(req.params.username), isActive:true}, function(err, u){
      if(err || !u) return res.redirect("/u/"+req.user.username+"/edit");
      u.password = req.body.password;
      u.save(function (err) {});
    });
  }

  //save other Data to Database
  User.findOne({username: req.sanitize(req.params.username), isActive:true}, function(err, u){
    if(err || !u) return res.redirect("/u/"+req.user.username+"/edit");

    //Handle Image upload
    if(req.files.profile_img){
      var file = req.files.profile_img;
      file.name = file.name.toLowerCase();
      file.extension = file.name.substr(file.name.lastIndexOf('.')+1);

      //- Check if the media files belong to a allowed type.
      var allowed_mimetypes = ["image/png", "image/jpeg"];
      if(allowed_mimetypes.indexOf(file.mimetype) >= 0) {
        console.log("allowed type");
        file.name = req.user.username+"_"+crypto.randomBytes(5).toString('hex')+"."+file.extension;
        file.type = "image";
        sharp(file.data)
        .resize(1920, 1080)
        .max()
        .toFormat("png")
        .jpeg({ quality: 80, force: false })
        .webp({ quality: 80, force: false })
        .png({ compressionLevel: 8, adaptiveFiltering: false, force: false })
        .toFile('public/uploads/users/profile/'+file.name, (err, info) => {
          user.meta.profile_img = '/uploads/users/profile/'+file.name;
          User.update({username: req.sanitize(req.params.username), isActive:true},{ $set: user}, {multi: false}, function(err, u) {
            if(err) return res.redirect("/u/"+req.user.username+"/edit");
            res.redirect("/u/"+req.params.username);
          });
        });
      }
    } else {
      req.files.profile_img = false;
    }

    if(!req.files.profile_img){
      user.meta.profile_img = u.meta.profile_img;
      User.update({username: req.sanitize(req.params.username), isActive:true},{ $set: user}, {multi: false}, function(err, u) {
        if(err) return res.redirect("/u/"+req.user.username+"/edit");
        res.redirect("/u/"+req.params.username);
      });
    }

  })
};

// GET Block/Unblock User
module.exports.user_un_block = function(req, res) {
  //- checks if user is authenticated
  if(req.user.isAuthenticated === false) return res.redirect("/login");
  if(!req.user.isAdmin && !req.user.isMod && req.params.username != req.user.username) return res.redirect("/u/"+req.params.username+"/");

  User.findOne({username: req.sanitize(req.params.username)}, function(err, user){
    if(err || !user) return res.redirect("/u/"+req.params.username+"/");

    //- (Un)Block User
    User.update({username: user.username},{$set: {isBlocked:!user.isBlocked}}, function(err, u){
      return res.redirect("/u/"+req.params.username+"/");
    })

  })

}

// GET Delete User
module.exports.user_delete = function(req, res) {

  //- checks if user is authenticated
  if(req.user.isAuthenticated === false) return res.redirect("/login");
  if(!req.user.isAdmin && !req.user.isMod && req.params.username != req.user.username) return res.redirect("/u/"+req.params.username+"/");

  User.findOne({username: req.sanitize(req.params.username)}, function(err, user){
    if(err || !user) return res.redirect("/u/"+req.params.username+"/");

    //- Delete User
    User.update({username: user.username},{$set: {isActive:!user.isActive}}, function(err, u){
      if(!u.isActive) return res.redirect("/portfolios");
      if(u.isActive) return res.redirect("/u/"+req.params.username+"/");
    })

  })

}

//- GET Upload New Case Page
module.exports.render_project_new = function(req, res) {

    //- checks if user is authenticated
    if(req.user.isAuthenticated === false) return res.redirect("/login");
    if(req.params.username != req.user.username) return res.redirect("/u/"+req.user.username+"/new");

    //- if user was linked to upload a solution to a specific challenge
    var preselected;
    if(req.query.challenge) preselected = req.query.challenge;

    //- Get challenges and send result to frontend
    Challenge.find({active_until: { $gte: new Date().toISOString() }, isActive:true}).sort({active_until:1}).exec(function(err, challenges){
      res.render('user/project_upload',{ title: 'Upload | Creativity Has No Borders', error:req.query.error, data: {user: req.user, page: "upload", modules:[{order: 1, name:"Upload", title: "Upload", challenges: challenges, selected: preselected, userdata: req.query}], timestamp: 1 } })
    });

};

//- POST Upload New Case Page
module.exports.process_project_new = function(req, res) {

    //- checks if user is authenticated
    if(req.user.isAuthenticated === false) return res.redirect("/login");
    if(req.params.username != req.user.username) return res.redirect("/u/"+req.user.username+"/new");

    //- Validate User Data
    var project = {}
    project.name = req.sanitize(req.body.title).replace(/[&\/\\#,!=+()$~%.'":*?<>{}]/g,'').replace(/ /g,"-").replace(/_/g,"-").toLowerCase();
    if(req.sanitize(req.body.challenge) === "new") project.challenge_name = "personal-project";
    if(req.sanitize(req.body.challenge) != "new") project.challenge_name = req.sanitize(req.body.challenge);;
    project.username = req.user.username;
    project.title = req.sanitize(req.body.title);
    project.description = req.sanitize(req.body.description);
    project.media = [];
    project.videolink = req.sanitize(req.body.videolink);

    //checks if user has permission to upload his project to certain challenge
    //if the Challenge short mode is enabled, and the countdown at 0, the user only uploads the project as personal project
    if(project.challenge_name != "personal-project"){
      Challenge.findOne({name: project.challenge_name, isActive:true}, function(err, c){
        if(!c){
          project.challenge_name === "personal-project";
        } else {
          if(c.shortMode.enabled){
            for(var i=0; i<c.participants.length;i++){
              if(c.participants[i].username === req.user.username) {
                if(new Date() > new Date(c.participants[i].endtime)){
                  project.challenge_name = "personal-project";
                } else {
                  c.participants[i].completed = true;
                  Challenge.update({name: project.challenge_name, isActive:true},{$set:c}, {multi:false},function(err,up){});
                }
              }
            }
          }

        }
      })
    }


    //- Check if Project-name already exists to adjust it (just in case)
    Project.find({name: project.name}, function(err, projects) {
      if(projects.length > 0){
        project.name = project.name+"-"+Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5);
      }


      //- Check if images are available
      var order = -1;
      if(req.files.file){

        //- Convert MediaFile obj to unified Array
        if(!Array.isArray(req.files.file)){
          var tmp = [];
          tmp.push(req.files.file);
          req.files.file = tmp;
        }

        //- Process & Validate Media Files
        var allowed_mimetypes = ["image/png", "image/jpeg"];
        if(Array.isArray(req.files.file)){
          var files = req.files.file;
          for (var i in files) {
            var file = files[i];
            file.name = file.name.toLowerCase();
            file.extension = file.name.substr(file.name.lastIndexOf('.')+1);

            //- Check if the media files belong to a allowed type.
            if(allowed_mimetypes.indexOf(file.mimetype) >= 0) {
              order++;
              file.name = crypto.randomBytes(20).toString('hex')+"."+file.extension;
              file.type = "image";
              file.order = order;
              file.path = '/uploads/projects/'+file.name;
              file.isActive = true;
              project.media.push(file);
            }
          }
        }
      }

      //- Process Videolink
      if(project.videolink){
        if(project.videolink.indexOf("https://youtube.com/") > -1 || project.videolink.indexOf("https://www.youtube.com/") > -1){
          var videoId = project.videolink.replace("www.", "").replace("https://youtube.com/watch?v=", "").substring(0,project.videolink.length);
          if(videoId.indexOf("&") > -1){
            var ext = videoId.substring(videoId.indexOf("&"),videoId.length);
            videoId = videoId.replace(ext, "");
          }
          project.videolink = "https://youtube.com/embed/"+videoId+"?showinfo=0";
        }
        else if(project.videolink.indexOf("https://vimeo.com/") > -1 || project.videolink.indexOf("https://www.vimeo.com/") > -1){
          var videoId = project.videolink.replace("www.", "").replace("https://vimeo.com/","").substring(0,project.videolink.length);
          project.videolink = "https://player.vimeo.com/video/"+videoId+"?title=0&byline=0&portrait=0";
        }
        else {
          project.videolink = "";
        }
      }

      //- Update Media -> Video
      if(project.videolink){
        var video = {};
        video.order = project.media.length;
        video.type = "video";
        video.name = crypto.randomBytes(20).toString('hex');
        video.path = project.videolink;
        video.isActive = true;
        project.media.push(video);
      }

      var helpcounter = -1;
      for(var n=0; n<project.media.length; n++){
        if(project.media[n].type === "image"){
          sharp(project.media[n].data)
          .resize(1920, 1080)
          .max()
          .toFormat("png")
          .jpeg({ quality: 80, force: false })
          .webp({ quality: 80, force: false })
          .png({ compressionLevel: 8, adaptiveFiltering: false, force: false })
          .toFile('public/uploads/projects/'+project.media[n].name, (err, info) => {
            helpcounter++;

            //all pictures were uploaded -> save now to db
            if(helpcounter === order){

              //delete the image buffer from the db object
              project.media.forEach(function(media){
                if(media.type === "image"){
                  delete media["data"];
                  delete media["encoding"];
                  delete media["mv"];
                }
              })

              //Save to DB
              var newProject = new Project(project);
              newProject.save(function(err) {
                if (err) {
                  console.log(err);
                  var query = querystring.stringify({
                    "challenge": req.query.challenge,
                    "error": "Something went wrong while saving everything to the Database.",
                    "title": req.sanitize(req.body.title),
                    "description": req.sanitize(req.body.description),
                  });
                  return res.redirect("/u/"+req.user.username+"/new/?"+query);
                }

                //- Forward User to Project Page
                res.redirect("/u/"+req.user.username+"/"+project.name);
              });
            }
          });
        }
      }
    });
};

//- GET Project Page
module.exports.render_project = function(req, res) {

  if(req.user.isAdmin || req.user.isMod){

    Project.findOne({name: req.sanitize(req.params.projectId), isActive:true}, function(err, project){
      if(err || !project) return res.redirect("/u/"+req.params.username)

      //don't load deactivated comments
      project.comments = project.comments.filter(function (comment) {
        return comment.isActive === true;
      });

      res.render('user/project',{ title: 'Creativity Has No Borders', error:null, data: {user: req.user, project: project} })
    });


  } else {

    Project.findOne({name: req.sanitize(req.params.projectId), isActive:true, isBlocked: false}, function(err, project){
      if(err || !project) return res.redirect("/u/"+req.params.username)

      //don't load deactivated comments
      project.comments = project.comments.filter(function (comment) {
        return comment.isActive === true;
      });

      res.render('user/project',{ title: 'Creativity Has No Borders', error:null, data: {user: req.user, project: project} })
    });

  }

};

//- GET Project Edit Page
module.exports.render_project_edit = function(req, res) {

  //- checks if user is authenticated
  if(req.user.isAuthenticated === false) return res.redirect("/login");
  if(!req.user.isAdmin && !req.user.isMod && req.params.username != req.user.username) return res.redirect("/u/"+req.user.username+"/"+req.params.projectId);

  Project.findOne({name: req.sanitize(req.params.projectId), isActive:true, isBlocked:false}, function(err, project){
    if(err || !project) return res.redirect("/error")

    res.render('user/project_edit',{ title: 'Creativity Has No Borders', error:null, data: {user: req.user, project: project} })
  });

};

//- POST Project Edit Page
module.exports.process_project_edit = function(req, res) {

  //- checks if user is authenticated
  if(req.user.isAuthenticated === false) return res.redirect("/login");
  if(!req.user.isAdmin && !req.user.isMod && req.params.username != req.user.username) return res.redirect("/u/"+req.user.username+"/"+req.params.projectId);

  Project.findOne({name: req.sanitize(req.params.projectId),  isActive:true, isBlocked:false}, function(err, project){
    if(err || !project) return res.redirect("/u/"+req.user.username+"/");

    //- User disables the Project
    if(req.body.delete){
      Project.update({name:project.name, isActive:true}, {$set: {isActive: false}}, {multi:false}, function(err, p){});
      return res.redirect("/u/"+req.user.username+"/");
    }

    //- Media File Sorting
    var newOrder = [];
    if(req.body.order) newOrder = JSON.parse(req.body.order);
    project.title = req.sanitize(req.body.title);
    project.description = req.sanitize(req.body.description);

    //- Sort medialist and count deleted items
    newOrder = newOrder.sort(function(a, b){return parseInt(a.order)-(b.order)}); //sort
    var count = 0;
    newOrder.forEach(function(item){
      if(item.order.indexOf('-1') > -1 && item.order.lastIndexOf('-1') > -1){
        count = parseInt(item.order.lastIndexOf('-1'))+1;
      }
    })

    //give new order numbers
    for(var i = count; i < newOrder.length; i++){
      if(count === 0) newOrder[i].order = i;
      if(count > 0) newOrder[i].order = i-1;
    }

    //-compare and update with extisting ones
    for(var j = 0; j < project.media.length; j++){
      newOrder.forEach(function(item){
        if(project.media[j].name === item.name){
          project.media[j].order = item.order;
          if(project.media[j].order === "-1"){
            project.media[j].order = -1;
            project.media[j].isActive = false;
          }
        }
      });
    }

    //update DB entry new order
    Project.update({name:project.name, isActive: true}, {$set: project}, {multi:false}, function(err, p){});


    //Get the highest media order number
    var order = 0;
    for(var x=0; x<project.media.length;x++){
      if(project.media[x].order > 0){
        order = project.media[x].order;
      }
    }

    //check if new images are available
    if(req.files.file){

      //- Convert MediaFile obj to unified Array
      if(!Array.isArray(req.files.file)){
        var tmp = [];
        tmp.push(req.files.file);
        req.files.file = tmp;
      }

      //- Process & Validate Media Files
      var allowed_mimetypes = ["image/png", "image/jpeg"];
      if(Array.isArray(req.files.file)){
        var files = req.files.file;
        for (var i in files) {
          var file = files[i];
          file.name = file.name.toLowerCase();
          file.extension = file.name.substr(file.name.lastIndexOf('.')+1);

          //- Check if the media files belong to a allowed type.
          if(allowed_mimetypes.indexOf(file.mimetype) >= 0) {
            order++;
            file.name = crypto.randomBytes(20).toString('hex')+"."+file.extension;
            file.type = "image";
            file.order = order;
            file.path = '/uploads/projects/'+file.name;
            file.isActive = true;
            project.media.push(file);
          }
        }
      }
    }

    //- Process Videolink
    project.videolink = req.sanitize(req.body.videolink);
    if(project.videolink){
      if(project.videolink.indexOf("https://youtube.com/") > -1 || project.videolink.indexOf("https://www.youtube.com/") > -1){
        var videoId = project.videolink.replace("www.", "").replace("https://youtube.com/watch?v=", "").substring(0,project.videolink.length);
        if(videoId.indexOf("&") > -1){
          var ext = videoId.substring(videoId.indexOf("&"),videoId.length);
          videoId = videoId.replace(ext, "");
        }
        project.videolink = "https://youtube.com/embed/"+videoId+"?showinfo=0";
      }
      else if(project.videolink.indexOf("https://vimeo.com/") > -1 || project.videolink.indexOf("https://www.vimeo.com/") > -1){
        var videoId = project.videolink.replace("www.", "").replace("https://vimeo.com/","").substring(0,project.videolink.length);
        project.videolink = "https://player.vimeo.com/video/"+videoId+"?title=0&byline=0&portrait=0";
      }
      else {
        project.videolink = "";
      }
    }

    //- Update Media -> Video
    var video = {};
    if(project.videolink){
      video.order = project.media.length;
      video.type = "video";
      video.name = crypto.randomBytes(20).toString('hex');
      video.path = project.videolink;
      video.isActive = true;
      project.media.push(video);
    }


    //check if files have to be uploaded and updated
    if(!req.files.file && !project.videolink){
      return res.redirect("/u/"+req.user.username+"/"+project.name);
    } else if(!req.files.file && project.videolink){
      Project.update({name: project.name, isActive:true},{ $push: {media: video }}, {multi: false}, function(err, p) {
        return res.redirect("/u/"+req.user.username+"/"+project.name);
      });
    }


    var helpcounter = 0;
    var newImagesCount = 0;
    project.media.forEach(function(media){
      if(media.type === "image" && media.data) newImagesCount++;
    })

    for(var n=0; n<project.media.length; n++){
      if(project.media[n].type === "image" && project.media[n].data){
        sharp(project.media[n].data)
        .resize(1920, 1080)
        .max()
        .toFormat("png")
        .jpeg({ quality: 80, force: false })
        .webp({ quality: 80, force: false })
        .png({ compressionLevel: 8, adaptiveFiltering: false, force: false })
        .toFile('public/uploads/projects/'+project.media[n].name, (err, info) => {
          helpcounter++;

          //all pictures were uploaded -> save now to db
          if(helpcounter === newImagesCount){

            //delete the image buffer from the db object
            project.media.forEach(function(media){
              if(media.type === "image"){
                delete media["data"];
                delete media["encoding"];
                delete media["mv"];
              }
            })

            //Save to DB
            Project.update({name: project.name, isActive:true},{ $set: {media: project.media }}, {multi: false}, function(err, p) {
              return res.redirect("/u/"+req.user.username+"/"+project.name);
            });
          }
        });
      }
    }
  });
};

//- GET Project Reports
module.exports.project_report = function(req, res) {

  //- checks if user is authenticated
  if(req.user.isAuthenticated === false) return res.redirect("/login");

  Project.findOne({name: req.sanitize(req.params.projectId)}, function(err, project){
    if(err || !project) return res.redirect("/u/"+req.params.username+"/"+req.params.projectId);

    //- Delete Project
    project.reportedBy.push({name: req.user.username, timestamp: new Date()});
    if(project.reportedBy.length >= 3){
      project.isBlocked = true;
    }
    Project.update({name: project.name},{$set: project}, function(err, p){
      if(err || !p) return res.redirect(req.headers.referer);

      if(req.headers.referer && req.headers.referer.indexOf("/u/"+project.username+"/"+project.name) === -1) {
        return res.redirect(req.headers.referer);
      } else {
        return res.redirect("/u/"+project.username+"/");
      }

    })

  })

}

//- POST Project Reports
module.exports.project_ajax_report = function(req, res) {

  //- checks if user is authenticated
  if(req.user.isAuthenticated === false) return res.json({success: false});

  Project.findOne({name: req.sanitize(req.params.projectId)}, function(err, project){
    if(err || !project) return res.redirect("/u/"+req.params.username+"/"+req.params.projectId);

    //- Delete Project
    project.reportedBy.push({name: req.user.username, timestamp: new Date()});
    if(project.reportedBy.length >= 3){
      project.isBlocked = true;
    }
    Project.update({name: project.name},{$set: project}, function(err, p){
      if(err || !p) return res.json({success: false});
        return res.json({success: true});
    })

  })

}

//- GET Project unblock
module.exports.project_unblock = function(req, res) {

  //- checks if user is authenticated
  if(req.user.isAuthenticated === false) return res.redirect("/login");
  if(!req.user.isAdmin && !req.user.isMod) return res.redirect("/u/"+req.params.username+"/"+req.params.projectId);

  Project.findOne({name: req.sanitize(req.params.projectId)}, function(err, project){
    if(err || !project) return res.redirect("/u/"+req.params.username+"/"+req.params.projectId);

    //- unblock project
    project.reportedBy = [];
    project.isBlocked = false;
    Project.update({name: project.name},{$set: project}, function(err, p){
      if(err || !p) return res.redirect("/u/"+p.username+"/"+p.name);
      res.redirect("/u/"+project.username+"/"+project.name);
    })

  })

}

//- GET Project Delete
module.exports.project_delete = function(req, res) {

  //- checks if user is authenticated
  if(req.user.isAuthenticated === false) return res.redirect("/login");
  if(!req.user.isAdmin && !req.user.isMod && req.params.username != req.user.username) return res.redirect("/u/"+req.params.username+"/"+req.params.projectId);

  Project.findOne({name: req.sanitize(req.params.projectId)}, function(err, project){
    if(err || !project) return res.redirect("/u/"+req.params.username+"/"+req.params.projectId);

    //- Delete Project
    Project.update({name: project.name},{$set: {isActive:!project.isActive}}, function(err, p){
      if(!p.isActive) return res.redirect("/u/"+req.params.username);
      if(p.isActive) return res.redirect("/u/"+req.params.username+"/"+req.params.projectId);
    })

  })

}

//- POST like the current project
module.exports.project_like = function(req, res) {

  //- Check if user is authenticated
  if(!req.user.isAuthenticated) return res.json({success:false});

  //- Get Project from Database
  Project.findOne({name: req.sanitize(req.params.projectId), isActive:true, isBlocked:false}, function(err, project){
    if(err || !project) return res.json({success:false});

    //-Check if user already liked the project
    if(project.likes.indexOf(req.user.username) === -1 ){
      var l = project.likes;
      l.push(req.user.username);

      //update project likes
      Project.update({name: req.sanitize(req.params.projectId), isActive:true}, {$set:{likes:l}}, {multi: false}, function(err, success){
        if(err) return res.json({success:false});
        return res.json({success:true});
      })
    }
  })
}

//- POST comment the current project
module.exports.project_comment = function(req, res) {

  //- Check if user is authenticated
  if(!req.user.isAuthenticated) return res.json({success:false});

  //- Sanitize and validate
  var comment = {}
  comment.id = crypto.randomBytes(20).toString('hex');
  comment.username = req.user.username;
  comment.text = req.sanitize(req.body.text);
  if(comment.text.length < 3) return res.json({success:false});
  comment.timestamp = new Date();
  comment.isActive = true;

  //- Get Project from Database
  Project.findOne({name: req.sanitize(req.params.projectId), isActive: true, isBlocked:false}, function(err, project){
    if(err || !project) return res.json({success:false});
    var c = project.comments;
    c.push(comment);

    //- Push Comment to Database
    Project.update({name: req.sanitize(req.params.projectId), isActive:true}, {$set:{comments:c}}, {multi: false}, function(err, success){
      if(err) return res.json({success:false});
      return res.json({success:true});
    })

  });

}

// POST delete Comment
module.exports.project_comment_delete = function(req, res) {

  //- checks if user is authenticated
  if(req.user.isAuthenticated === false) return res.redirect("/login");
  if(!req.user.isAdmin && !req.user.isMod && req.params.username != req.user.username) return res.redirect("/u/"+req.params.username+"/"+req.params.projectId);

  var commentId = req.sanitize(req.params.commentId);

  Project.findOne({name: req.sanitize(req.params.projectId)}, function(err, project){
    if(err || !project) return res.redirect("/u/"+req.params.username+"/"+req.params.projectId);

    //find comment and deactivate it
    project.comments.forEach(function(comment){
      if(comment.id === commentId){
        comment.isActive = false;
      }
    })

    //- Delete Comment
    Project.update({name: project.name},{$set: {comments:project.comments}}, function(err, p){
      return res.redirect("/u/"+req.params.username+"/"+req.params.projectId);
    })
  })

}
