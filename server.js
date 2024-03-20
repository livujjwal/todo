const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const session = require("express-session");
const mongoDbSession = require("connect-mongodb-session")(session);
require("dotenv").config();
const { userValidation, isEmailRgex } = require("./utils/userValidation");
const userModel = require("./Models/userModel");
const { isAuth } = require("./middleware/authMiddleware");

//variables
const app = express();
const PORT = process.env.PORT;
const store = new mongoDbSession({
  uri: process.env.MONGO_URI,
  collection: "sessions",
});
//middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set("view engine", "ejs");
app.use(
  session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: false,
    store,
  })
);

app.listen(PORT, () => {
  console.log("Server running at PORT:" + PORT);
});

//mongodb connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Mongodb connected");
  })
  .catch((err) => {
    console.log(err);
  });

//home
app.get("/", (req, res) => {
  return res.send("Home page");
});
//signup
app.get("/signup", (req, res) => {
  return res.render("signupPage");
});
app.post("/signup", async (req, res) => {
  const { name, email, username, password } = req.body;
  try {
    await userValidation({ name, email, username, password });
  } catch (error) {
    return res.send({
      status: 400,
      message: "Validation fails",
      error,
    });
  }
  try {
    const hashPassword = await bcrypt.hash(
      password,
      parseInt(process.env.SALT)
    );
    const userObj = new userModel({
      name,
      email,
      username,
      password: hashPassword,
    });
    const userDb = await userObj.save();
    return res.send({
      status: 201,
      message: "User Sign Up Successfully",
      data: userDb,
    });
  } catch (error) {
    if (error.keyValue.username || error.keyValue.email)
      return res.send({
        status: 400,
        message: error.keyValue.username
          ? "Username already taken"
          : "Email already registered",
      });
  }
  console.log(name, email, username, password);
});
//login
app.get("/login", (req, res) => {
  return res.render("loginPage");
});
app.post("/login", async (req, res) => {
  const { loginId, password } = req.body;
  let userDB;
  try {
    if (isEmailRgex({ email: loginId })) {
      userDB = await userModel.findOne({ email: loginId });
    } else {
      userDB = await userModel.findOne({ username: loginId });
    }
    if (!userDB)
      return res.send({
        status: 400,
        message: "Incorrect Login Credentials",
      });
    //compare password
    const isPasswordMatch = await bcrypt.compare(password, userDB.password);
    if (!isPasswordMatch)
      return res.send({
        status: 400,
        message: "Incorrect Password",
      });
    //session change and save to DB
    req.session.isAuth = true;
    req.session.user = {
      userId: userDB._id,
      email: userDB.email,
      username: userDB.username,
    };
    console.log(req.session);
    return res.send({
      status: 200,
      message: "User Login Successfully",
      user: userDB,
    });
  } catch (error) {
    console.log(error);
    return res.send({
      status: 500,
      message: "Server error",
    });
  }
});

app.get("/dashboard", isAuth, (req, res) => {
  return res.send({
    status: 201,
    message: "Api working fine",
  });
});