const express = require("express");

const mysql = require("mysql");


const app = express();
app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);

// set view engine to ejs, allows us to use ejs in the public folder
app.set('views', __dirname + '/public');
app.set('view engine', 'ejs');


var connectionPool = mysql.createPool({
  connectionLimit: 300,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// app listens on the port
app.listen(process.env.PORT);