const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const session = require("express-session");
const mongoDbSession = require("connect-mongodb-session")(session);
require("dotenv").config();

//file transfer
const { userValidation, isEmailRgex } = require("./utils/userValidation");
const {userModel,sessionModel }= require("./Models/userModel");
const { isAuth } = require("./middleware/authMiddleware");
const todoModel = require("./Models/todoModel");
const todoValidation = require("./utils/todoValidation");

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
app.use(express.static("public"));
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
    return res.redirect("/login");
  } catch (error) {
    if (error.keyValue.username || error.keyValue.email)
      return res.send({
        status: 400,
        message: error.keyValue.username
          ? "Username already taken"
          : "Email already registered",
      });
  }
});
//login
app.get("/", (req, res) => {
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
    return res.redirect("/dashboard");
  } catch (error) {
    console.log(error);
    return res.send({
      status: 500,
      message: "Server error",
    });
  }
});
//dashboard
app.get("/dashboard", isAuth, (req, res) => {
  return res.render("dashboard");
});
//create-item
app.post("/create-item", isAuth, async (req, res) => {
  const todo = req.body.todo;
  const username = req.session.user.username;
  try {
    await todoValidation({ todo });
  } catch (error) {
    return res.send({
      status: 400,
      message: error,
    });
  }
  try {
    const todoObj = new todoModel({
      todo,
      username,
    });
    const todoDB = await todoObj.save();
    return res.send({
      status: 200,
      data: todoDB,
    });
  } catch (error) {
    return res.send({
      status: 500,
      message: "Internal Server Error Ocuur",
    });
  }
});
//read-item
app.get("/read-item", isAuth, async (req, res) => {
  const username = req.session.user.username;
  const SKIP = Number(req.query.skip) || 0;
  const LIMIT = 2;
  try {
    const todoList = await todoModel.aggregate([
      { $match: { username } },
      {
        $facet: {
          data: [{ $skip: SKIP }, { $limit: LIMIT }],
        },
      },
    ]);
    console.log(todoList[0].data);
    if (todoList[0].data.length === 0) {
      return res.send({
        status: 400,
        message: "No Todo Found, Add Todo",
      });
    }
    // const todoList = await todoModel.find({ username });
    return res.send({
      status: 200,
      message: "read data",
      data: todoList[0].data,
    });
  } catch (error) {
    return res.send({
      status: 500,
      message: "Internal server error occur",
      error: error,
    });
  }
});
//edit todo
app.post("/edit-item", isAuth, async (req, res) => {
  const { todo, todoId } = req.body;
  const username = req.session.user.username;
  try {
    await todoValidation({ todo });
  } catch (error) {
    return res.send({
      status: 400,
      error: error,
    });
  }
  try {
    const todoDB = await todoModel.findOne({ _id: todoId });
    if (username !== todoDB.username) {
      return res.send({
        status: 403,
        message: "Forbidden action for current user",
      });
    }
    const updatedTodo = await todoModel.findOneAndUpdate(
      { _id: todoId },
      { todo }
    );
    return res.send({
      status: 200,
      message: "Upated successfull",
      data: updatedTodo,
    });
  } catch (error) {
    return res.send({
      status: 500,
      message: "Internal Server Error",
      error: error,
    });
  }
});
//delete todo
app.post("/delete-item", isAuth, async (req, res) => {
  const { todoId } = req.body;
  // console.log(todoId);
  const username = req.session.user.username;
  try {
    const todoDB = await todoModel.findOne({ _id: todoId });
    if (username !== todoDB.username) {
      return res.send({
        status: 403,
        message: "Forbidden action for current user",
      });
    }
    const updatedTodo = await todoModel.findOneAndDelete({ _id: todoId });
    return res.send({
      status: 201,
      message: "Upated successfull",
      data: updatedTodo,
    });
  } catch (error) {
    return res.send({
      status: 500,
      message: "Internal Server Error",
      error: error,
    });
  }
});
//logout
app.post("/logout",isAuth,(req,res)=>{
  req.session.destroy((error)=>{
    if(error) return res.send({
      status : 500,
      message : "Database server error occur"
    })
    return res.redirect("/login")
  })
})
//logout_from_all_devices
app.post("/logout_from_all_devices",isAuth,async (req,res)=>{
  const username = req.session.user.username
  console.log(req.session.user.username);
  try {
 const deleteCount =await sessionModel.deleteMany(({"session.user.username":username}))
 console.log(deleteCount);
    return res.redirect('/login')
  } catch (error) {
    res.status(500).json("Internal server error occur")
  }
})