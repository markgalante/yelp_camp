const       express     = require("express"),
            router      = express.Router(),
			Campground  = require('../models/campground'),
			Comment		= require('../models/comment'), 
			Review		= require('../models/review'),
			middleware	= require('../middleware'),
			multer 		= require('multer'),
			cloudinary 	= require('cloudinary');

//configure multer
const storage = multer.diskStorage({
  filename: (req, file, callback) => {
    callback(null, Date.now() + file.originalname);
  }
});
const imageFilter = (req, file, cb) => {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
const upload = multer({ storage: storage, fileFilter: imageFilter})

//setting up cloudinary
cloudinary.config({ 
  cloud_name: 'dbpkz1rnm', 
  api_key: 479674634572721 /*process.env.CLOUDINARY_API_KEY*/, 
  api_secret: 'zyBsxCMOAqCEZ-BCVr3Rc2GjBZw' /*process.env.CLOUDINARY_API_SECRET*/ 
});
//environment variables to hide cofidential information .env node modules
escapeRegex = (text) => {
	return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")
}

//INDEX ROUTE - show all campgrounds
router.get("/", (req,res)=>{
	var perPage = 8; 
	var pageQuery = parseInt(req.query.page); 
	var pageNumber = pageQuery ? pageQuery : 1; 
	var noMatch = null; //null if search query found; returns an error message if query not found. 
	if(req.query.search){
		const regex = new RegExp(escapeRegex(req.query.search), "gi");
		Campground.find({name: regex}).skip((perPage * pageNumber)-perPage).limit(perPage).exec((err, allCampgrounds)=>{
			Campground.countDocuments().exec((err, count)=>{
				if(err){
					console.log(err);
					res.redirect("back"); 
				}else{ 
					if(allCampgrounds.length < 1){
						noMatch = "Campsite not found with your query. Please try again.";
					}
					res.render("campgrounds/index", {
						campgrounds:allCampgrounds, 
						noMatch:noMatch, 
						page: 'campgrounds',
						current: pageNumber, 
						pages: Math.ceil(count/perPage),
						search: req.query.search 
					});
				}
			}); 
	});
	} else{
		//Get all campgrounds from databases and render the file.
		Campground.find({}).skip((perPage*pageNumber)-perPage).limit(perPage).exec((err, allCampgrounds)=>{
			Campground.countDocuments().exec((err, count)=>{
				if(err){
					console.log(err);
					res.redirect("back");  
				}else{
					res.render("campgrounds/index", {
						campgrounds:allCampgrounds, 
						noMatch:noMatch, 
						page: 'campgrounds',
						current: pageNumber,
						pages: Math.ceil(count/ perPage), 
						search: false 
					});
				}
			});
	});
	}
});

	//NEW - show form to create new campground. 
router.get("/new", middleware.isLoggedIn,(req, res)=>{
	res.render("campgrounds/new"); 
});

			//CREATE ROUTE - Add new campgrounds to database. 
router.post("/", middleware.isLoggedIn, upload.single("image"), (req, res)=>{ //image refers to the image on the form
	 
	cloudinary.v2.uploader.upload(req.file.path, (err, result) => { //req.file comes from multer
      if(err) {
        req.flash('error', "You can't upload an image " + err.message);
        return res.redirect('back');
      }
      // add cloudinary url for the image to the campground object under image property
      req.body.campground.image = result.secure_url;
      // add image's public_id to campground object
      req.body.campground.imageId = result.public_id;
      // add author to campground
      req.body.campground.author = {
        id: req.user._id,
        username: req.user.username
	  }
	
	//Create a new campground and save to Database: 
	Campground.create(req.body.campground, (err, newlyCreated)=>{
		if(err){
			req.flash("error", "You cannot create a campground because: " + err.message); 
			return res.redirect("back"); 
		}else{
			//redirect back to campground page.
			console.log(newlyCreated);
			res.redirect("/campgrounds/" + newlyCreated.slug); 
		}
	});	
});
}); 

			//SHOW - shows more information about the campsite. 
router.get("/:slug", (req, res)=>{
	Campground.findOne({slug: req.params.slug}).populate("comments").populate({
		path: "reviews", 
		options: {sort:{createdAt: -1}}
	}).exec((err, foundCampground)=>{
		if(err || !foundCampground){
			console.log("ERROR", err); 
			req.flash("error", "Campground not found"); 
			res.redirect("back"); 
		} else{
            console.log(foundCampground); 
			res.render("campgrounds/show", {campground:foundCampground})
		}
	});
});

			// EDIT CAMPGROUND ROUTE  - form 
router.get("/:slug/edit", middleware.checkCampgroundOwnership, (req, res)=>{
	Campground.findOne({slug: req.params.slug}, (err, foundCampground)=>{
		res.render("campgrounds/edit", {campground:foundCampground}); 
	}); 
});

			// UPDATE CAMPGROUND ROUTE - form submits
router.put("/:slug", middleware.checkCampgroundOwnership, upload.single('image'), (req, res)=>{
	delete req.body.campground.rating; 
	Campground.findOne({slug: req.params.slug}, async (err, updatedCampground)=>{
		if(err){
			req.flash("error", "Error with finding campground because: " + err.message); 
			res.redirect("/campgrounds");
		} else {
			updatedCampground.name 			= req.body.campground.name; 
			updatedCampground.description	= req.body.campground.description; 
			updatedCampground.price			= req.body.campground.price;
			if(req.file){ //seeing if theres a request for a file. 
				try{
					await cloudinary.v2.uploader.destroy(updatedCampground.imageId); //destroying the image in the cloud. 	
					let result = await cloudinary.v2.uploader.upload(req.file.path); //uplodaind a new file
					updatedCampground.imageId 	= result.public_id; 
					updatedCampground.image		= result.secure_url; 
				} catch(err){
					req.flash("error", "error with uploading campground because of image" + err.message); 
					return res.redirect("/campgrounds");
				}		
			} 
			updatedCampground.save(); //save campground in the database.  
			req.flash("success", "Successfully updated campground");
			console.log(updatedCampground);  
			res.redirect("/campgrounds/" + updatedCampground.slug); //ZARKO CHANGE  
		}
	});
});

			// DESTROY ROUTE
router.delete("/:slug", middleware.checkCampgroundOwnership, (req, res)=>{
	Campground.findOneAndRemove({slug: req.params.slug}, async (err, campground)=>{
		if(err){
			req.flash("error", err.message); 
			return res.redirect("back");
		} 
		// $in finds all the comments and review database entries where the _id is in the campground comments and reviews 
		Comment.deleteOne({"_id": {$in: campground.comments}}, (err)=>{
			if(err){
				console.log(err); 
				return res.redirect("back"); 
			}
		});

		// deletes all reviews associated with the campground
		Review.deleteOne({"_id":{$in: campground.reviews}}, (err) => {
			if(err){
				console.log(err); 
				return res.redirect("back"); 
			}
		});
		try{ //if there's an error
			await cloudinary.v2.uploader.destroy(campground.imageId);
			campground.remove(); 
			req.flash("success", "Campground deleted successfully"); 
			res.redirect("/campgrounds");
		} catch(err){
			if(err){
				req.flash("error", err.message); 
				return res.redirect("back");
			} 
		}; 
	});
});

module.exports = router; 