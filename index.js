require("dotenv").config();
const express = require("express");
const mysql = require("mysql");
const session = require("express-session");

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

var connectionPool = mysql.createPool({
  connectionLimit: 300,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

//initiailize the sessionStore, which will allow express-mysql-session to store session data into the database
const sessionStore = new mySQlStore({
    createDatabaseTable: false
}, connectionPool);



// app listens on the port
app.listen(process.env.PORT);
