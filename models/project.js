var config    = require('../config');

//- Mongoose Database Integration
var mongoose  = require('mongoose');
var Schema    = mongoose.Schema;
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost/'+config.mongodb, {useMongoClient: true});


//- Create a Challenge Schema
var projectSchema = new Schema({
  name: {type:String, required: true, unique:true},
  challenge_name: {type: String, required:true},
  username: {type: String, required: true},
  title: {type: String, required: true},
  description: {type: String, default: "no description available"},
  media: {type: Array, default: []},
  comments: {type: Array, default: []},
  likes: {type: Array, default:[]},
  isWinner: {type: Boolean, default: false},
  created_at: {type: Date, default: new Date()},
  updated_at: Date,
  isActive: {type: Boolean, default:true},
  isBlocked: {type: Boolean, default:false},
  reportedBy:Array,
  thumbnail: String,
  profile_img: String
});

//- Password Hashing before saving
projectSchema.pre('save', function(next){
  var project = this;
  project.updated_at = new Date();

  var err = new Error('something went wrong');
  next();
});


//- Create User Model
var Project = mongoose.model('Project', projectSchema);

//- Export
module.exports = Project;
