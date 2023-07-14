require("dotenv").config();
const express = require("express");
const mysql = require("mysql");
const session = require("express-session");
const mySQlStore = require("express-mysql-session")(session);
var taskController = require("./app/task/taskController");
const flash = require("connect-flash");

const app = express();
app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);

// set view engine to ejs, allows us to use ejs in the public folder
app.set("views", __dirname + "/public");
app.set("view engine", "ejs");

//include middleware for serving static files (css/images folder and error pages folder)
app.use(express.static(__dirname + "/public/views"));
app.use(express.static(__dirname + "/public/error-pages"));

var connectionPool = mysql.createPool({
  connectionLimit: 300,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

//initiailize the sessionStore, which will allow express-mysql-session to store session data into the database
const sessionStore = new mySQlStore(
  {
    createDatabaseTable: false,
  },
  connectionPool
);

/******************** ROUTES *******************/

// displays app home page
app.get("/", (req, res, next) => {
  res.sendFile(__dirname + "/public/index.html");
});
// renders login page
app.get("/login", (req, res, next) => {
  let flashError = req.flash("error");
  let flashMessage = req.flash("message");
  res.render("login.ejs", {
    flashError: flashError,
    flashMessage: flashMessage,
  });
});
// app listens on the port
app.listen(process.env.PORT);
