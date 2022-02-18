require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require("mongoose-findorcreate");

const app = express();

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

// Setup session
app.use(session({
	secret: 'keyboard cat',
	resave: false,
	saveUninitialized: false,
}));

// Setup passport
app.use(passport.initialize());
app.use(passport.session());


// connect to mongoose database
mongoose.connect("mongodb://localhost:27017/userDB", {
	useNewUrlParser: true,
	useUnifiedTopology: true,
});

// create user schema
const userSchema = new mongoose.Schema({
	email: String,
	password: String,
	googleId: String
});

// create passport local mongoose strategy
userSchema.plugin(passportLocalMongoose);
// create findOrCreate method for passport local mongoose strategy
userSchema.plugin(findOrCreate);

// create user model
const User = new mongoose.model("User", userSchema);

// use passport local mongoose to serialize and deserialize user
passport.use(User.createStrategy());

// serialize and deserialize user
passport.serializeUser(function (user, done) {
	done(null, user.id);
});

passport.deserializeUser(function (id, done) {
	User.findById(id, function (err, user) {
		done(err, user);
	});
});

passport.use(new GoogleStrategy({
	clientID: process.env.CLIENT_ID,
	clientSecret: process.env.CLIENT_SECRET,
	callbackURL: "http://localhost:3000/auth/google/secrets",
	scope: [ 'profile' ],
	state: true
},
function(accessToken, refreshToken, profile, cb) {
	console.log(profile);
	User.findOrCreate({ googleId: profile.id }, function (err, user) {
		return cb(err, user);
	});
}
));

// create google authentication route
app.get("/auth/google",
	passport.authenticate("google", { scope: ["profile"] }));
	
// create google authentication callback route
app.get("/auth/google/secrets",
	passport.authenticate("google", { failureRedirect: "/login" }),
	function (req, res) {
		// Successful authentication, redirect Secrets.
		res.redirect("/secrets");
	});

app.get("/", function (req, res) {
	res.render("home");
});



app.get("/login", function (req, res) {
	res.render("login");
});

app.get("/register", function (req, res) {
	res.render("register");
});

// Setup "secrets" route
app.get("/secrets", function (req, res) {
	// check if user is logged in
	if (req.isAuthenticated()) {
		res.render("secrets");
	} else {
		res.redirect("/login");
	}
});

// setup logout route
app.get("/logout", function (req, res) {
	req.logout();
	res.redirect("/");
});

// setup register route
app.post("/register", function (req, res) {
	User.register({ username: req.body.username}, req.body.password, function (err, user) {
		if (err) {
			console.log(err);
			res.redirect("/register");
		} else {
			passport.authenticate("local")(req, res, function () {
				res.redirect("/secrets");
			});
		}
	});
});

// setup login route
app.post("/login", function (req, res) {
	const user = new User({
		username: req.body.username,
		password: req.body.password
	});
	req.login(user, function (err) {
		if (err) {
			console.log(err);
		} else {
			passport.authenticate("local")(req, res, function () {
				res.redirect("/secrets");
			});
		}
	});
});

app.listen(3000, function () {
	console.log("Server started at Port 3000");
})
