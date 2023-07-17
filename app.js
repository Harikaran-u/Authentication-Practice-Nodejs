const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());

let db = null;

const dbPath = path.join(__dirname, "userData.db");

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is started!!!");
    });
  } catch (e) {
    console.log(e.message);
    process.exit(1);
  }
};

initializeDbAndServer();

///Register API///

app.post("/register", async (request, response) => {
  const newUserData = request.body;
  const { username, name, password, gender, location } = newUserData;
  const lengthOfPwd = password.length;
  const encryptedPwd = await bcrypt.hash(password, 10);
  const isPresentQuery = `SELECT * FROM user
  WHERE username = "${username}";`;
  const isPresent = await db.get(isPresentQuery);
  console.log(isPresent);
  if (isPresent !== undefined) {
    response.status(400);
    response.send("User already exists");
  } else if (lengthOfPwd < 5) {
    response.status(400);
    response.send("Password is too short");
  } else {
    const createNewUserQuery = `INSERT INTO user
      (username, name, password, gender, location) 
      VALUES ("${username}", "${name}", "${encryptedPwd}", "${gender}", "${location}");`;
    await db.run(createNewUserQuery);
    response.send("User created successfully");
  }
});

///Login API///

app.post("/login", async (request, response) => {
  const userData = request.body;
  const { username, password } = userData;
  const isPresentQuery = `SELECT * FROM user
  WHERE username = "${username}";`;
  const isPresent = await db.get(isPresentQuery);
  if (isPresent === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isSamePwd = await bcrypt.compare(password, isPresent.password);
    console.log(isSamePwd);
    if (isSamePwd === false) {
      response.status(400);
      response.send("Invalid password");
    } else {
      response.send("Login success!");
    }
  }
});

///change password API///

app.put("/change-password", async (request, response) => {
  const updateData = request.body;
  const { username, oldPassword, newPassword } = updateData;
  const length = newPassword.length;
  const isPresentQuery = `SELECT * FROM user
  WHERE username = "${username}";`;
  const isPresent = await db.get(isPresentQuery);
  const isSame = await bcrypt.compare(oldPassword, isPresent.password);
  const newEncryptPwd = await bcrypt.hash(newPassword, 10);
  if (isSame === false) {
    response.status(400);
    response.send("Invalid current password");
  } else if (length < 5) {
    response.status(400);
    response.send("Password is too short");
  } else {
    const updatePwdQuery = `UPDATE user
      SET password = "${newEncryptPwd}"
      WHERE username = "${username}";`;
    await db.run(updatePwdQuery);
    response.send("Password updated");
  }
});

module.exports = app;
