const mongoose = require('mongoose'); 

var reviewSchema = new mongoose.Schema({
    rating:{
        //set the field type
        type: Number, 

        //Making the star rating required
        required: "Please provide a rating (1 to 5 stars)", 

        //Define minimum and maximum values:
        min: 1, 
        max: 5,

        //Add validation to ensure that entry is an integer: 
        validate:{
            validator: Number.isInteger, 
            message: "{VALUE} is not an integer value"
        }
    }, 
    text:{
        type: String, 
    },
    author: {
        id:{
            type: mongoose.Schema.Types.ObjectID, 
            ref: "User"
        }, 
        username: String
    }, 
    campground: {
        type: mongoose.Schema.Types.ObjectID, 
        ref: "Campground", 
    }
}, {
    //timestamps: mongoose assings createdAt and updatedAt to the schema. 
    timestamps:true
});

var Review = mongoose.model("Review", reviewSchema); 

module.exports = Review; 