// user schema
var mongoose = require("mongoose");
require("dotenv").config();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const saltRounds = 10;
const secret = process.env.SECRET;
let userSchema = mongoose.Schema({
  firstname: {
    type: String,
    required: true,
    maxlength: 100,
  },
  lastname: {
    type: String,
    required: true,
    maxlength: 100,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    unique: 1,
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
  },
  password2: {
    type: String,
    required: true,
    minlength: 8,
  },

  token: {
    type: String,
  },
});

userSchema.pre("save", function (next) {
  var user = this;

  if (user.isModified("password")) {
    bcrypt.genSalt(saltRounds, function (err, salt) {
      if (err) return next(err);

      bcrypt.hash(user.password, salt, function (err, hash) {
        if (err) return next(err);
        user.password = hash;
        user.password2 = hash;
        next();
      });
    });
  } else {
    next();
  }
});

userSchema.methods.meow = function () {
  console.log("meeeeeoooooooooooow");
};

userSchema.methods.comparePassword = function (candidatePassword, cb) {
  bcrypt.compare(candidatePassword, this.password, function (err, isMatch) {
    if (err) return cb(err);
    cb(null, isMatch);
  });
};

// Generate token
userSchema.methods.generateToken = function (cb) {
  var user = this;
  var token = jwt.sign(this._id.toHexString(), secret);
  user.token = token;
  user.save(function (err, user) {
    if (err) return cb(err);
    cb(null, user);
  });
};

//Find by token
userSchema.statics.findByToken = function (token, cb) {
  var user = this;
  jwt.verify(token, secret, function (err, decode) {
    user.findOne(
      {
        _id: decode,
        token: token,
      },
      function (err, user) {
        if (err) return cb(err);
        cb(null, user);
      }
    );
  });
};

//delete token
userSchema.methods.deleteToken = function (token, cb) {
  var user = this;
  user.update({ token: "" }, function (err, user) {
    if (err) return cb(err);
    cb(null, user);
  });
};
module.exports = mongoose.model("User", userSchema);
