const express = require("express");
const app = express();
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const bcrypt = require("bcrypt");
app.use(express.json());

const dbPath = path.join(__dirname, "userData.db");

let db;

const initializeDBAndServer = async () => {
  try {
    db = await open({ filename: dbPath, driver: sqlite3.Database });
    app.listen(5000, () => {
      console.log("Server started running!!!");
    });
  } catch (err) {
    console.log(`DB Error: ${err.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

//Register User API
app.post("/register/", async (request, response) => {
  const { username, password, name, gender, location } = request.body;
  const hashedPwd = await bcrypt.hash(password, 10);
  const checkUserQuery = `SELECT * FROM user WHERE username = '${username}';`;
  const checkUser = await db.get(checkUserQuery);
  if (checkUser === undefined) {
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const createUserQuery = `INSERT INTO user(username,name,password,gender,location) VALUES ('${username}','${name}', '${hashedPwd}', '${gender}', '${location}'); `;
      await db.run(createUserQuery);
      response.status(200);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

//Login User API
app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const checkUserQuery = `SELECT * FROM user WHERE username = '${username}';`;
  const checkUser = await db.get(checkUserQuery);
  if (checkUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPwdMatched = await bcrypt.compare(password, checkUser.password);
    if (isPwdMatched) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

//Change Password API
app.put("/change-password/", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const getUserQuery = `SELECT * FROM user WHERE username = '${username}';`;
  const dbUser = await db.get(getUserQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("User not found");
  } else {
    const isPwdMatched = await bcrypt.compare(oldPassword, dbUser.password);
    if (isPwdMatched) {
      if (newPassword.length < 5) {
        response.status(400);
        response.send("Password is too short");
      } else {
        const hashedNewPwd = await bcrypt.hash(newPassword, 10);
        const updatePwdQuery = `UPDATE user SET password = '${hashedNewPwd}' WHERE username = '${username}';`;
        await db.run(updatePwdQuery);
        response.status(200);
        response.send("Password updated");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});

module.exports = app;
