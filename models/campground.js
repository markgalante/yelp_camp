const   mongoose    = require("mongoose"), 
        Comment     = require("./comment"), 
        Review      = require('./review'); 

//SCHEMA SETUP: 
const campgroundSchema = new mongoose.Schema({
    // name: String, //erased by Zarko
    name: { //from Zarko 
        type: String, 
        required: "This field cannot be left blank"
    },
    image: String, 
    imageId: String, 
    description: String,
    price: String,
    createdAt: { type: Date, default: Date.now}, 
    author: {
        id: {
            type: mongoose.Schema.Types.ObjectId, 
            ref: "User", 
        }, 
        username: String
    },
    comments: [
        {
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Comment"
        }
    ],
    slug: {
        type: String, 
        unique: true, 
        trim: true
    },
    reviews: [
        {
            type: mongoose.Schema.Types.ObjectId, 
            ref: "Review"
        }
    ], 
    rating: {
        type: Number, 
        default: 0
    }
});

// add a slug before the campground gets saved to the database
campgroundSchema.pre('save', async function (next) {
    try {
        // check if a new campground is being saved, or if the campground name is being modified
        if (this.isNew /*|| this.isModified("name")*/ || this.wasNew) {
            this.slug = await generateUniqueSlug(this._id, this.name);
        }
        next();
    } catch (err) {
        next(err);
    }
});

var Campground = mongoose.model("Campground", campgroundSchema);

module.exports = Campground;

async function generateUniqueSlug(id, campgroundName, slug) {
    try {
        // generate the initial slug
        if (!slug) {
            slug = slugify(campgroundName);
        }
        // check if a campground with the slug already exists
        var campground = await Campground.findOne({slug: slug});
        // check if a campground was found or if the found campground is the current campground
        if (!campground || campground._id.equals(id)) {
            return slug;
        }
        // if not unique, generate a new slug
        var newSlug = slugify(campgroundName);
        // check again by calling the function recursively
        return await generateUniqueSlug(id, campgroundName, newSlug);
    } catch (err) {
        throw new Error(err);
    }
}

function slugify(text) {
    var slug = text.toString().toLowerCase()
      .replace(/\s+/g, '-')        // Replace spaces with -
      .replace(/[^\w\-]+/g, '')    // Remove all non-word chars
      .replace(/\-\-+/g, '-')      // Replace multiple - with single -
      .replace(/^-+/, '')          // Trim - from start of text
      .replace(/-+$/, '')          // Trim - from end of text
      .substring(0, 75);           // Trim at 75 characters
    return slug + "-" + Math.floor(1000 + Math.random() * 9000);  // Add 4 random digits to improve uniqueness
}

// slugify = (text) =>{
//     var slug = text.toString().toLowerCase() 
//         .replace(/\s+/g, '-')        // Replace spaces with -
//         .replace(/[^\w\-]+/g, '')    // Remove all non-word chars
//         .replace(/\-\-+/g, '-')      // Replace multiple - with single -
//         .replace(/^-+/, '')          // Trim - from start of text
//         .replace(/-+$/, '')          // Trim - from end of text
//         .substring(0, 75);           // Trim at 75 characters
//     return slug + "-" + Math.floor(1000+ Math.random()* 9000); //Add four random digist to improve uniqueness
// }

// //To generate a unique slug based on the campground name: 
// generateUniqueSlug = async (id, campgroundName, slug) => {
//     try{
//         //generate initial slug 
//         if(!slug){
//             slug = slugify(campgroundName); 
//         }

//         //check if a campground name with the slug already exists 
//         var campground = await Campground.findOne({ slug }); 

//         //check if a campground was found OR if the found campground is the current campground 
//         if(!campground || campground._id.equals(id)){
//             return slug; 
//         }

//         //if not unique, generate a new slug
//         var newSlug = slugify(campgroundName); 

//         //chack again by calling the function recursively 
//         return await generateUniqueSlug(id, campgroundName, newSlug); 
//     } catch(err){
//         throw new Error(err); 
//     }
// }

// // add a slug before the campground gets saved to the database: 
// campgroundSchema.pre("save", async (next) => {
//     try{
//         //check if a new campground is being saved, or if the campground name is being modified
//         if(this.isNew || this.isModified("name")){
//             this.slug = await generateUniqueSlug(this._id, this.name); 
//         }
//         next(); 
//     } catch(err){
//         next(err); 
//     }
// });

module.exports = mongoose.model("Campground", campgroundSchema);