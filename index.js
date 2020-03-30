const       middlewareObj   = {}, 
            Campground      = require("../models/campground"),
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

middlewareObj.isLoggedIn = (req, res, next) =>{
    if(req.isAuthenticated()){
		return next(); 
    }
    //Add something to the flash 
    req.flash("error", "You need to be logged in to do that"); 
	res.redirect("/login"); 
}

module.exports = middlewareObj; 