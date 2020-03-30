const       express     = require("express"),
            router      = express.Router({mergeParams: true}); //merge params from campgrounds and comments.js  
            Campground  = require('../models/campground'); 
			Comment     = require('../models/comment'),
			middleware	= require('../middleware'); 

// create comments page
router.get("/new", middleware.isLoggedIn, (req, res)=>{
	//find campground by id
	Campground.findOne({slug: req.params.slug}, (err, campground)=>{
		if(err){
			console.log(err); 
		} else{
			res.render("comments/new", {campground: campground}); 
		}
	}); 
});

//submit post request to create comment
router.post("/", middleware.isLoggedIn, (req, res)=>{
	//look up campground using id 
	Campground.findOne({slug: req.params.slug}, (err, campground)=>{
		if(err){
			console.log(err); 
			res.redirect("/campgrounds"); 
		} else{
			Comment.create(req.body.comment, (err, comment)=>{
				if(err){
					req.flash("error", "Something went wrong"); 
					console.log("ERROR ERROR ERROR: " + err);
				} else {
					//add username and id to comments 
					comment.author.id = req.user._id; 
					comment.author.username = req.user.username; 

					//save comment. 
					comment.save(); 

					//connect new comment to campground SAVE COMMENT. 
					campground.comments.push(comment);
					campground.save();
					//redirect to campground show page 
					console.log(comment); 
					req.flash("success", "Successfully added comment!")
					res.redirect("/campgrounds/" + campground.slug);  
				}
			});
		}
	});
});

	//COMMENTS EDIT ROUTE
router.get("/:comment_id/edit", middleware.checkCommentOwnership, (req, res)=>{
	Campground.findOne({slug: req.params.slug}, (err, foundCampground)=>{
		if(err || !foundCampground){
			req.flash("error", "Cannot find that campground :(");
			return res.redirect("back");  
		}
	Comment.findById(req.params.comment_id, (err, foundComment)=>{
		if(err || !foundComment){
			res.redirect("back");
		}else {
			req.flash("success", "Successfully edited comment!")
			res.render("comments/edit", {campground_slug: req.params.slug, comment:foundComment}); 
		}
	}); 	
	});
});

	//UPDATE COMMENT 
router.put("/:comment_id", middleware.checkCommentOwnership, (req, res)=>{
	Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, (err, updatedComments)=>{
		if(err){
			res.redirect("back"); 
		} else {
			res.redirect("/campgrounds/" + req.params.slug);
		}
	});
});

	//DESTROY ROUTE
router.delete("/:comment_id", middleware.checkCommentOwnership, (req, res)=>{
	Comment.findByIdAndRemove(req.params.comment_id, (err)=>{
		if(err){
			res.redirect("back"); 
		} else {
			req.flash("success", "Comment deleted!"); 
			res.redirect("/campgrounds/" + req.params.slug); 
		}
	});
}); 

module.exports = router; 