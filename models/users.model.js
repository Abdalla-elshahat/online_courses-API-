const mongoose = require("mongoose");
const validator = require("validator");
const Role = require("../utles/Role-users");
const loginSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    validate: [validator.isEmail, "Invalid email address"],
  },
  password: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required:false,
    minlength:10
  },
  token: {
    type: String,
    require: false,
  },
  role: {
    type: String,
    enum: [Role.USER, Role.MANGER, Role.ADMIN],
    default: Role.USER,
  },
  avatar: {
    type: String,
    default: `uplouds/no-photo-available-icon-20.jpg`,
  },
  job: {
    type: String,
  },
  country: {
    type: String,
    require:false
  },
  socialmedia: {
    type: Object,
    default: {},
    require: false,
  },
  favorites: {
    type: Array,
  },
  posts: {
    type: Array,
  },
  quiz:{
    type: Array,
  },
  quiztaken:{
    type: Array,
  },
  followers: {
    type: Array,
  },
  followRequests:{
    type:Array,
  },
  skills:{
    type:Array,
  }
});

module.exports = mongoose.model("Login", loginSchema);
