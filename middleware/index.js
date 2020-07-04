const       middlewareObj   = {}, 
            Campground      = require("../models/campground"),
            Review          = require("../models/review"), 
            Comment         = require("../models/comment");             


middlewareObj.checkCampgroundOwnership = (req, res, next) => {
        if (req.isAuthenticated()){ //comes from passport-local-mongoose
            Campground.findOne({slug: req.params.slug}, (err, foundCampground)=>{
                if(err || !foundCampground){
                    req.flash("error", "Campground not found"); 
                    res.redirect("back");
                } else{
                    if(foundCampground.author.id.equals(req.user._id) || req.user.isAdmin){ //either the owner or 
                                                                                            //"isAdmin"
                        next(); //moves onto the code. 
                    } else {
                        req.flash("error", "You don't have permission to do that"); 
                        res.redirect("back");
                    }
                }
            });
        } else {
            req.flash("error", "You need to be logged in to do that"); 
            res.redirect("back"); //takes user back to the previous page they were on. 
        }
}

middlewareObj.checkCommentOwnership = (req, res, next) => {
    if (req.isAuthenticated()){ //comes from passport-local-mongoose
		Comment.findById(req.params.comment_id, (err, foundComment)=>{
			if(err || !foundComment){
                req.flash("error", "Comment not found"); 
                res.redirect("back");
			} else{
				if(foundComment.author.id.equals(req.user._id) || req.user.isAdmin){
					next(); //moves onto the code. 
				} else {
                    req.flash("error", "You don't have permission to do that"); 
					res.redirect("back"); 
				}
			}
		});
	} else {
        req.flash("error", "You need to be logged in")
		res.redirect("back"); //takes user back to the previous page they were on. 
	}
}

middlewareObj.checkReviewOwnership = (req, res, next) =>{
    if(req.isAuthenticated()){
        Review.findById(req.params.review_id, (err, foundReview)=>{
            if(err || !foundReview){
                req.flash("error", "No review found"); 
                res.redirect("back"); 
            } else{
                if(foundReview.author.id.equals(req.user._id) || req.user.isAdmin){
                    next(); 
                } else{
                    req.flash("error", "You do not have permission to do that"); 
                    res.redirect("back"); 
                }
            }
        });
    } else {
        req.flash("error", "You need to be logged in to do that"); 
        res.redirect("back"); 
    }
}

middlewareObj.checkReviewExistence = (req, res, next) => {
    if(req.isAuthenticated()){
        Campground.findOne({slug: req.params.slug}).populate("reviews").exec((err, foundCampground)=>{
            if(err || !foundCampground){ //campground found and populated with reviews.  
                req.flash("error", "Unable to find campground because"+err.message); 
                res.redirect("back"); 
            } else{
                //Chack if req.user._id exists in foundCampground.reviews
                var foundUserReview = foundCampground.reviews.some(review => {
                    return review.author.id.equals(req.user.id)
                });
                if(foundUserReview){
                    req.flash("error", "You already wrote a review");
                    return res.redirect("back"); 
                } 
                //foundUserReview is false, meaning that the review was not found
                next(); 
            }
        });
    } else {
        req.flash("error", "You need to be logged in to do that"); 
        res.redirect("back"); 
    }
}

middlewareObj.isLoggedIn = (req, res, next) =>{
    if(req.isAuthenticated()){
		return next(); 
    }
    //Add something to the flash 
    req.flash("error", "You need to be logged in to do that"); 
	res.redirect("/login"); //comment added
}

module.exports = middlewareObj; 