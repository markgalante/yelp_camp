var express 	= require("express"),
	app 		= express(),
	bodyParser 	= require("body-parser"), 
	mongoose 	= require("mongoose"),
	flash		= require ("connect-flash"), 
	passport 	= require("passport"),
	LocalStrategy = require("passport-local"), 
	methodOverride= require('method-override'),
    Campground 	= require("./models/campground"), //CAMPGROUND SCHEMA SET UP
	Comment 	= require("./models/comment"), 
	User		= require("./models/user");
	seedDB      = require("./seeds"); 

// requiring route files
const	campgroundRoutes	= require('./routes/campgrounds'),
		commentRoutes		= require('./routes/comments'),
		reviewRoutes		= require('./routes/review'), 
		indexRoutes			= require('./routes/index');  		

//CONFIGURE APPLICATION 
mongoose.connect("mongodb://localhost/yelpcamp_v18", {useUnifiedTopology: true, useNewUrlParser: true, useCreateIndex: true, useFindAndModify:false }); 
app.use(bodyParser.urlencoded({extended:true}));	
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public")); 	
app.use(methodOverride("_method")); // tells methodOverride to look for "_method"
//seedDB(); seed the database  
app.use(flash()); //

//MOMENT JS needs to go above the PASSPORT CONFIG
app.locals.moment = require('moment'); 

//PASSPORT CONFIG 
app.use(require("express-session")({ 
    secret: "Any message can go here apparently",   
    resave: false, 
    saveUninitialized: false
})); 
app.use(passport.initialize()); 
app.use(passport.session()); 
passport.use(new LocalStrategy(User.authenticate())); //comes from passport-local-mongoose
passport.serializeUser(User.serializeUser()); 
passport.deserializeUser(User.deserializeUser());

// Passes these objects into ALL routes. 
app.use( async (req, res, next)=>{ //allows the passing of objects into all routes.
	res.locals.currentUser = req.user; 
	// if(req.user){ //to get notifications in the application
	// 	try{
	// 		let user = await User.findById(req.user._id).populate('notifications', null, {isRead:false}).exec();
	// 		res.locals.notifications = user.notifications.reverse(); 
	// 	} catch(err){
	// 		console.log(err.message); 
	// 	}
	// }
	res.locals.error = req.flash("error");
	res.locals.success = req.flash("success"); 
	next(); 
});

app.use("/", indexRoutes); 
app.use("/campgrounds", campgroundRoutes); //takes all campground js and append "/campgrounds" in front of routes
app.use("/campgrounds/:slug/comments", commentRoutes); //removed :id and replaced with :slug as per Zarko's tutorial
app.use("/campgrounds/:slug/reviews", reviewRoutes);

app.listen(process.env.PORT || 3000, ()=>{
	console.log("Yelp Camp Server Has Started"); 
});