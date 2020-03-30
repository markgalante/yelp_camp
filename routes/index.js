const       express     = require('express'),
            router      = express.Router(); 
            passport    = require('passport'), 
			User        = require('../models/user'), 
			Campground 	= require('../models/campground'),
			async 		= require('async'), //Needed to change password
			nodemailer	= require('nodemailer'), //Needed to change password
			crypto		= require('crypto'),  //Needed to change password, crypto is a part of node. 
			multer		= require('multer'),
			cloudinary	= require("cloudinary"); 

//configure multer
const storage = multer.diskStorage({
	filename: (req, file, callback)=>{
		callback(null, Date.now() + file.originalname);
	}
}); 

const imageFilter = (req, file, cb) =>{
	//accept image files only
	if(!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)){
		return cb(new Error ("Only image files are allowed"), false); 
	};
	cb(null, true); 
}

const upload = multer({ storage: storage, fileFilter: imageFilter}); 

//set up cloudinary: 
cloudinary.config({
	cloud_name: 'dbpkz1rnm', 
	api_key: 479674634572721, 
	api_secret: 'zyBsxCMOAqCEZ-BCVr3Rc2GjBZw'
}); 

//root route
router.get("/", (req,res)=>{
	res.render("landing");
});

										//AUTH ROUTES //
//show register form: 
router.get("/register", function(req, res){
	res.render("register", {page: 'register'}); 
 });

//  //handle sign up logic: 
//  router.post("/register", (req, res)=>{
// 	const	newUser	= new User({
// 		username: 	req.body.username, 
// 		firstName:	req.body.firstName,
// 		lastName: 	req.body.lastName, 
// 		avatar: 	req.body.avatar, 
// 		email: 		req.body.email 
// 	}); //refers to User mongoose model 
// 	if(req.body.adminCode === 'secretcode123'){
// 		newUser.isAdmin = true; 
// 	}
// 	User.register(newUser, req.body.password, (err, user)=>{ //provided by passport-local
// 		if(err){
// 			console.log(err); 
// 			return res.render("register", {error: err.message}); 
// 		}
// 		passport.authenticate("local")(req, res, () => {
// 			req.flash("success", "Successfully registered! Welcome to YelpCamp " + user.username + "!"); 
// 			res.redirect("/campgrounds"); 	
// 		});
// 	}); 
//  });

  //handle sign up logic WITH IMAGE UPLOAD: 
  router.post("/register", upload.single("avatar"), (req, res)=>{
	cloudinary.v2.uploader.upload(req.file.path, (err, result)=>{
		if(err){
			req.flash("error", "failed to upload an image"); 
			console.log(err.message);
			res.redirect("back");  
		}
		req.body.avatar = result.secure_url; 
		req.body.avatar_id = result.public_id; 
	});
	const	newUser	= new User({
		username: 	req.body.username, 
		firstName:	req.body.firstName,
		lastName: 	req.body.lastName, 
		// avatar: 	req.body.avatar, 
		email: 		req.body.email 
	}); //refers to User mongoose model 
	if(req.body.adminCode === 'secretcode123'){
		newUser.isAdmin = true; 
	}
	User.register(newUser, req.body.password, (err, user)=>{ //provided by passport-local
		if(err){
			console.log(err); 
			return res.render("register", {error: err.message}); 
		}
		passport.authenticate("local")(req, res, () => {
			req.flash("success", "Successfully registered! Welcome to YelpCamp " + user.username + "!"); 
			res.redirect("/campgrounds"); 	
		});
	}); 
 });

 //get request for login form:
 router.get("/login", (req, res)=>{
    res.render("login", {page: 'login'}); 
}); 
// {message: req.flashs("error")}

//handling login logic 
router.post("/login", passport.authenticate("local", { //uses middleware from passport.authenticate
	successRedirect: "/campgrounds",
	failureRedirect: "/login",
	}), (req, res)=>{ 	

});

//SHOW USER PROFILE: 
router.get("/users/:id", (req, res)=>{
	User.findById(req.params.id, (err, foundUser)=>{
		if(err){
			req.flash("error", "This user does not exist!"); 
			res.redirect("back"); 
		}
		else{
			Campground.find().where('author.id').equals(foundUser.id).exec((err, campgrounds)=>{
				if(err){
					req.flash("error", "This user does not exist!"); 
					res.redirect("back"); 
				}
				res.render("users/show", {user:foundUser, campgrounds: campgrounds});
			});
		}
	});
});

				//CHANGE PASSWORD 
//get request to form to submit the email address
router.get("/forgot", (req, res)=>{
	res.render("forgot"); 
}); 

router.post("/forgot", (req, res, next)=>{
	async.waterfall([ //is an array of functions that get called one afte the other
		(done)=>{
			crypto.randomBytes(20, (err, buf)=>{ //crypto is a part of node. 
				var token = buf.toString('hex'); //a token that is sent as part of the URL. 
				done(err, token); //this token will be sent to the users email adress. 
			});
		},
		(token, done)=>{ //look for the email that the person as emailed. 
			User.findOne({email: req.body.email}, (err, user)=>{ //find the user by their email adress. 
				if(!user){ //if there is no user with the email adress. 
					req.flash("error", "An account with this email address (" + req.body.email +") does not exist");
					return res.redirect("/forgot");  //return out of the entire function. 
				}
				//if the user does exist 
				//the properties below are in the user.schema in models
				user.resetPasswordToken = token; 
				user.resetPasswordExpires = Date.now() + 36000000 //1 hour in miliseconds

				user.save((err)=>{
					done (err, token, user); //done is a function that takes these parameters. 
				});
			});
		},
		(token, user, done)=>{ 
			const smtpTransport = nodemailer.createTransport({ //nodemailer is the npm package that allows us to send mails
				service: "Gmail", //using gmail to send mail. 
				auth:{
					user: "markphysiopaedic@gmail.com", 
					pass: "physiopaedicg"/*process.env.GMAILPW*/ //dotemv npm package. or from termink: export GMAILPW = password 
				} 
			});
			const mailOptions = { //what the user will see when the email is sent from. 
				to: user.email, 
				from: "markphysiopaedic@gmail.com", 
				subject: "YelpCamp Password Reset", 
				text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
				'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
				'http://' + req.headers.host + '/reset/' + token + '\n\n' +
				'If you did not request this, please ignore this email and your password will remain unchanged.\n'
			}; 
			smtpTransport.sendMail(mailOptions, (err)=>{ //send the mail. 
				console.log("mail sent"); 
				req.flash("success", "An email has been sent to " + user.email + " with further instructions"); 
				done(err, 'done'); 
			});
		}
	],
	(err)=>{
		if(err){
			return next(err); 
		} else{
			res.redirect("/forgot"); 
		}
	});
}); 

//Getting a form with the token route in the url to reset the password
router.get("/reset/:token", (req, res)=>{
	User.findOne({resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() }}, (err, user)=>{
		if(!user){
			req.flash("error", "Password reset token is invalid or has expired"); 
			return res.redirect("/forgot"); 
		}
		res.render("reset", {token: req.params.token}); 
	});
});

//resetting password from the reset ejs file
router.post("/reset/:token", (req, res)=>{
	async.waterfall([ //array of functions that gets called in sequence
		(done)=>{
			User.findOne({resetPasswordToken: req.params.token, resetPasswordExpires: {$gt: Date.now()}}, (err, user)=>{
				if(!user){
					req.flash("error", "Password reset token is invalid or has expired"); 
					return res.redirect("back"); 
				}
			if(req.body.password === req.body.confirm){
				user.setPassword(req.body.password, (err)=>{ //this is a passport-local-mongoose feature //plm will do all the salting and hasing
					user.resetPasswordToken = undefined; //now, get rid. We no longer need. 
					user.resetPasswordToken = undefined; //now, get rid. We no longer need. 
					
					user.save((err)=>{ //save the user back into the database
						req.logIn(user, (err)=>{ //log the user in 
							done(err, user); 
						});
					});
				});
			} else{
				req.flash("error", "Passwords do not match."); 
				return res.redirect("back"); 
			}
			});
		}, 
		(user, done)=>{
			const smtpTransport = nodemailer.createTransport({
				service: "Gmail", 
				auth: {
					user: "markphysiopaedic@gmail.com", 
					pass: "physiopaedicg"/*process.env.GMAILPW*/ //dotemv npm package. or from termink: export GMAILPW = password
				}
			});
			const mailOptions = {
				to: user.email, 
				from: "markphysiopaedic@gmail.com", 
				subject: "Your email has been changed", 
				text:'Hello,\n\n' +
				'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
			}; 
			smtpTransport.sendMail(mailOptions, (err)=>{
				req.flash("success", "Success! Your email has been changed"); 
				done(err); 
			});
		}
	], 
	(err)=>{
		res.redirect("/campgrounds"); 
	});
}); 


//handle logout logic: 
router.get("/logout", (req, res)=>{
	req.logout(); //passport is detroying user data in the session. 
	req.flash("success", "Logged out"); //ALWAYS do this before redirecting
    res.redirect("/campgrounds"); 
});

module.exports = router; 