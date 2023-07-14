require("dotenv").config();
const express = require("express");
const mysql = require("mysql");
const session = require("express-session");
const mySQlStore = require("express-mysql-session")(session);
var taskController = require("./app/task/taskController");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const flash = require("connect-flash");

const app = express();
app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);

//include middleware for serving static files (css/images folder and error pages folder)
app.use(express.static(__dirname + "/public/views"));
app.use(express.static(__dirname + "/public/error-pages"));

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
const sessionStore = new mySQlStore(
  {
    createDatabaseTable: false,
  },
  connectionPool
);

function register(username, password, confirmPassword) {
  return new Promise((resolve, reject) => {
    if (password != confirmPassword) {
      reject(new Error("Passwords need to match."));
    } else {
      userExists(username)
        .then((response) => {
          if (response) {
            reject(new Error(`This user already exists.`));
          } else {
            insertUser(username, password)
              .then((response) => {
                insertSettings(response.user_id)
                  .then(() => {
                    resolve({
                      body: {
                        message: `Successfully registered.`,
                      },
                    });
                  })
                  .catch((error) => {
                    reject(new Error(error.message));
                  });
              })
              .catch((error) => {
                reject(new Error(error.message));
              });
          }
        })
        .catch((error) => {
          reject(new Error(error.message));
        });
    }
  });
}

function userExists(username) {
  return new Promise((resolve, reject) => {
    findUser(username)
      .then((response) => {
        if (response.length > 0) {
          resolve(true);
        } else {
          resolve(false);
        }
      })
      .catch((error) => {
        reject(new Error(error.message));
      });
  });
}
// retrieves user data by username, returns empty array if user does not exist 
function findUser(username) {
    return new Promise((resolve, reject) => {
        connectionPool.getConnection((err, connection) => {
            if (err) {
                connection.release();
                reject(new Error(err.message));
            }
            else {
                connection.query("SELECT * FROM users WHERE USERNAME=?", username, function(error, results, fields) {
            
                    if (error) {
                        reject(new Error(error.message));
                    }
                    else {
                        resolve(results);
                    }

                    connection.release();
                });
            }
        });
    });
}
// inserts a user into the database
function insertUser(username, password) {
  return new Promise((resolve, reject) => {
    genPassword(password)
      .then((response) => {
        const salt = response.salt;
        const hash = response.hash;

        connectionPool.getConnection((err, connection) => {
          if (err) {
            connection.release();
            reject(new Error(err.message));
          } else {
            connection.query(
              "INSERT INTO users (USERNAME, HASH, SALT, IS_ADMIN) VALUES (?, ?, ?, 0)",
              [username, hash, salt],
              function (error, results, fields) {
                if (error) {
                  reject(new Error(error.message));
                } else {
                  resolve({
                    message: "User successfully inserted",
                    user_id: results.insertId,
                  });
                }

                connection.release();
              }
            );
          }
        });
      })
      .catch((error) => {
        reject(new Error(error.message));
      });
  });
}

/************** MIDDLEWARE *********************/
// stores session data into the database
app.use(
  session({
    key: "myKey",
    secret: "session_cookie_secret",
    name: "mycookie",
    store: sessionStore,
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 6000000,
    },
  })
);
app.use(passport.initialize());
// replaces session id in request object with user data pulled from deserialize user
app.use(passport.session());
// enable flash message systm
app.use(flash());

/******************** ROUTES *******************/

// displays app home page
app.get("/", (req, res, next) => {
  res.sendFile(__dirname + "/public/index.html");
});
// renders login page
app.get("/login", (req, res, next) => {
  let flashError = req.flash("error");
  let flashMessage = req.flash("message");
  res.render("public/login.ejs", {
    flashError: flashError,
    flashMessage: flashMessage,
  });
});
// displays register page
app.get("/register", (req, res, next) => {
  res.sendFile(__dirname + "/public/register.html");
});
// middleware to catch all other undefined routes, sends a 404 not found error and its error page
app.use((req, res, next) => {
  res.status(404).sendFile(__dirname + "/public/error-pages/not-found.html");
});
// app listens on the port
app.listen(process.env.PORT);
