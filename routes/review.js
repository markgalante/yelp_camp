const   express     = require('express'),
        router      = express.Router({mergeParams: true}),
        Campground  = require('../models/campground'),          
        Review      = require('../models/review'), 
        middleware  = require('../middleware'); 

    //To calculate the average of the reviews: 
    calculateAverage = (reviews) => {
        if(reviews.length === 0) {
            return 0; 
        } 
        var sum = 0; 
        reviews.forEach((element)=>{
            sum+= element.rating; 
        }); 
        return sum / reviews.length; 
    }

    //INDEX ROUTE: 
router.get("/", (req, res)=>{
    Campground.findOne({slug: req.params.slug}).populate({
        path: "reviews", 
        options: {sort: {createdAt: -1}} //Sorting the populated reviews to show the latest first. 
    }).exec((err, campground)=>{
        if(err || !campground){
            req.flash("error", "ERROR WITH GETTING RATING FOR CAMPGROUND" + err); 
            return res.redirect("back"); 
        }
        res.render("reviews/index", {campground: campground}); 
    });
});

    //NEW ROUTE
router.get("/new", middleware.isLoggedIn, middleware.checkReviewExistence, (req, res)=>{
    //checkReviewExistence checks if a user has already reviewed the campground, allowing only one review. 
    Campground.findOne({slug: req.params.slug}, (err, campground)=>{
        if(err){
            req.flash("error", "Unable to get /new review because: " + err); 
            return res.redirect("back"); 
        }
        res.render("reviews/new", {campground:campground}); 
    });
});

    //CREATE ROUTE 
router.post("/", middleware.isLoggedIn, middleware.checkReviewExistence, (req, res)=>{
    //lookup campground using SLUG
    Campground.findOne({slug: req.params.slug}).populate("reviews").exec((err, campground)=>{
        if(err){
            req.flash("error", "Unable to find campground for rating because: " + err.message); 
            return res.redirect("back"); 
        }
        Review.create(req.body.review, (err, review)=>{
            if(err){
                req.flash("error", "unable to post rating because: " + err.message); 
                return res.redirect("back"); 
            }
            
            //Add Author username/id to associate campground to the review 
            review.author.id        = req.user._id; 
            review.author.username  = req.user.username;
            review.campground       = campground; 

            //save review and add to campgroundSchema: 
            review.save(); 
            campground.reviews.push(review); 

            //Calculate the average review for a campground: 
            campground.rating = calculateAverage(campground.reviews); 

            //save campgrounds: 
            campground.save(); 

            req.flash("success", "Successfully added review to the campground"); 
            res.redirect("/campgrounds/" + campground.slug); 
        });
    });
});

    //EDIT ROUTE 
router.get("/:review_id/edit", middleware.checkReviewOwnership, (req, res)=>{
    Campground.findOne({slug:req.params.slug}, (err, campground)=>{
        if(err){
            console.log(err); 
            req.flash("error", "Unable to find campsite because " + err.message); 
            return res.redirect("back"); 
        }
        Review.findById(req.params.review_id, (err, foundReview)=>{
            if(err){
                req.flash("error", "Unable to find review because: " + err.message); 
                return res.redirect("back"); 
            } 
            res.render("reviews/edit", {slug: req.params.slug, review: foundReview, campground:campground}); 
        });
    });
});

    //UPDATE ROUTE 
router.put("/:review_id", middleware.checkReviewOwnership, (req, res)=>{
    Review.findByIdAndUpdate(req.params.review_id, req.body.review, {new: true}, (err, updatedReview)=>{
        if(err){
            console.log(err); 
            req.flash("error", "Unable to update review because of: " + err.message); 
            return res.redirect("back"); 
        }
        Campground.findOne({slug: req.params.slug}).populate("reviews").exec((err, campground)=>{
            if(err){
                req.flash("error", "Unable to find campground to edit review because" + err.message); 
                return res.redirect("back"); 
            }
            //recalculate campground average
            campground.rating = calculateAverage(campground.reviews); 

            //Save changes
            campground.save(); 
            req.flash("success", "Successfully updated review"); 
            res.redirect("/campgrounds/" + campground.slug); 
        });
    });
});

    //DELETE ROUTE
router.delete("/:review_id", middleware.checkReviewOwnership, (req, res)=>{
    Review.findByIdAndRemove(req.params.review_id, (err)=>{
        if(err){
            req.flash("error", "Unable to delete review because of: " + err.message); 
            return res.redirect("back"); 
        }
        Campground.findOneAndUpdate({slug: req.params.slug}, {$pull:{reviews: req.params.review_id}}, {new: true}).populate("reviews").exec((err, campground)=>{
            if(err){                                 //Pull to remove the deleted objectID review reference
                req.flash("error", "Unable to complete deltion because of: " + err.message); 
                return res.redirect("back"); 
            }
            //recalcuate campground average
            campground.rating = calculateAverage(campground.reviews); 
            
            //save changes 
            campground.save(); 
            req.flash("success", "Successfully deleted review"); 
            res.redirect("/campgrounds/"+campground.slug); 
        });
    });
});

module.exports= router; 