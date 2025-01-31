const mongoose = require("mongoose");
// Define the schema correctly
const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  isPublished: {
    type: Boolean,
  },
  author: {
    type: String,
    // required: true,
  },
  status:{
    type:String,
    enum:["active", "inactive", "archived"],
    default:"active"
  },
  category:{
    type:String,
    enum:["web development", "data science", "machine learning","mobileApp"],
    default:"web development"
  },
  imgcourse:{
    type:String,
    default: `coursesimg/no-photo-available-icon-20.jpg`,
    require:false
  },
  quiz:{
    type:Array,
  },
  createdAt:{
    type:Date,
    default:Date.now,
    }
});

module.exports = mongoose.model("course", courseSchema);
//users ==>name of collection
