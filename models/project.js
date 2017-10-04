var config    = require('../config');

//- Mongoose Database Integration
var mongoose  = require('mongoose');
var Schema    = mongoose.Schema;
mongoose.connect('mongodb://localhost/'+config.mongodb);


//- Create a Challenge Schema
var projectSchema = new Schema({
  id: {type: Number, required: true, unique: true},
  challenge_id: {type: Number, required:true},
  user_id: {type: String, required: true},
  title: {type: String, required: true},
  description: {type: String, default: "no description available"},
  meta: {
    images: Array,
    videos: Array,
    documents: Array
  },
  created_at: {type: Date, default: new Date()},
  updated_at: Date,
});

//- Password Hashing before saving
projectSchema.pre('save', function(next){
  var challenge = this;
  project.updated_at = new Date();
});


//- Create User Model
var Project = mongoose.model('Project', projectSchema);

//- Export
module.exports = Project;
