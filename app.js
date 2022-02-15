require('dotenv').config()

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const md5 = require("md5"); // for hashing passwords
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(express.static("public"));

// connect to mongoose database
mongoose.connect("mongodb://localhost:27017/userDB", {
	useNewUrlParser: true,
	useUnifiedTopology: true,
});

// create user schema
const userSchema = new mongoose.Schema({
	email: String,
	password: String,
});

// create user model
const User = new mongoose.model("User", userSchema);

app.get("/", function (req, res) {
	res.render("home");
});

app.get("/login", function (req, res) {
	res.render("login");
});

app.get("/register", function (req, res) {
	res.render("register");
});

app.post("/register", function (req, res) {
	const newUser = new User({
		email: req.body.username,
		password: md5(req.body.password),
	});
	console.log(newUser);
	newUser.save(function (err) {
		if (err) {
			console.log(err);
		} else {
			console.log("saved succesfully");
			res.render("secrets");
		}
	});
});

// Post to login route
app.post("/login", function (req, res) {
	const username = req.body.username; /* get the username from the form */
	const password = md5(req.body.password); /* get the password from the form */

	// match the username and password
	User.findOne({ email: username }, function (err, foundUser) {
		if (err) {
			console.log(err);
		} else {
			if (foundUser) {
				// check if the password is correct
				if (foundUser.password === password) {
					res.render("secrets");
				}
			}
		}
	});
});

app.listen(3000, function () {
	console.log("Server started at Port 3000");
});
