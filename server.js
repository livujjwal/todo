const express = require("express");
const mongoose = require("mongoose");
const userValidation = require("./utils/userValidation");
const userModel = require("./Models/userModel");
require("dotenv").config();

//variables
const app = express();
const PORT = process.env.PORT;

//middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set("view engine", "ejs");
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
    const userObj = new userModel({
      name,
      email,
      username,
      password,
    });
    const userDb = await userObj.save();

    return res.send({
      status: 200,
      message: "User Sign Up Successfully",
      data: userDb,
    });
  } catch (error) {
    return res.send({
      status: 400,
      error,
    });
  }
  console.log(name, email, username, password);
});
//login
app.get("/login", (req, res) => {
  return res.render("loginPage");
});
app.post("/login", (req, res) => {
  console.log(req.body);
  return res.send("loginPage");
});
