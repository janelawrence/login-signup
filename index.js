const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const User = require("./models/user");
const { auth } = require("./middlewares/auth");
const app = express();

//app use
app.use(express.json()); //Used to parse JSON bodies
app.use(express.urlencoded({ extended: true })); //Parse URL-encoded bodies
app.use(cookieParser());

//database connection
// mongoose.Promise = global.Promise; //not needed for mongoose >= 5.0
mongoose.connect(
  process.env.MONODB_URI,
  { useNewUrlParser: true, useUnifiedTopology: true },
  function (err) {
    if (err) console.log(err);
    console.log("Database is connected");
  }
);

app.get("/", async function (req, res) {
  try {
    const user = await User.find();
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//New user
app.post("/api/register", function (req, res) {
  const newUser = new User(req.body);
  if (newUser.password != newUser.password2)
    return res.status(400).json({ message: "password not match" });

  User.findOne({ email: newUser.email }, function (err, user) {
    if (user)
      return res.status(400).json({ auth: false, message: "email exits" });

    newUser.save((err, doc) => {
      if (err) {
        return res.status(400).json({ success: false });
      }
      res.status(200).json({
        succes: true,
        user: doc,
      });
    });
  });
});
//Login user
app.post("/api/login", async function (req, res) {
  let user = await User.findOne({ email: req.body.email });
  if (!user) {
    return res.json({
      isAuth: false,
      message: "Auth failed, email not found",
    });
  }
  //check whether pw matches
  user.comparePassword(req.body.password, (err, isMatch) => {
    if (!isMatch)
      return res.json({
        isAuth: false,
        message: "password doesn't match",
      });
    //If pw is correct, let the user log in and generate token for this login
    user.generateToken((err, user) => {
      if (err) return res.status(400).send(err);
      res.cookie("auth", user.token).json({
        isAuth: true,
        id: user._id,
        email: user.email,
      });
    });
  });
});

//Get logged in user
app.get("/api/profile", auth, function (req, res) {
  res.json({
    isAuth: true,
    id: req.user._id,
    email: req.user.email,
    name: req.user.firstname + req.user.lastname,
  });
});

//logout user
app.get("/api/logout", auth, function (req, res) {
  req.user.deleteToken(req.token, (err, user) => {
    //check whether token exist
    if (err) return res.status(400).send(err);
    res
      .status(200)
      .json({ message: `${req.user.firstname}, You've successfully logout` });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`App is live at ${PORT}`);
});
