const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');
//const User = require('./userModel');

const tourSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A tour must have a name'], //validators
    maxLength: [40, 'A tour must have less OR 40 characters'],
    minLength: [10, 'A tour must have more OR 10 characters'],
//    validate: [validator.isAlpha, 'Tour name must only contain characters'],
    unique: true,
    trim: true
  },
  slug: String,
  duration: {
    type: Number,
    required: [true, 'A tour must have a duration'], //validator
  },
  maxGroupSize: {
    type: Number,
    required: [true, 'A tour must have a group size'], //validator
  },
  difficulty: {
    type: String,
    required: [true, 'A tour must have a difficulty'], //validator
    enum: {
      values: ['easy', 'medium', 'difficult'],
      message: 'Difficulty must be either easy, medium, hard or ultra'
    }
  },
  ratingsQuantity: {
    type: Number,
    default: 0
  },
  ratingsAverage: {
    type: Number,
    default: 0,
    min: [1, 'Rating must be above 1'],
    max: [5, 'Rating must be below 5'],
    set: val => Math.round(val * 10) / 10 //rounding function executes whenever ratings change
  },
  price: {
    type: Number,
    required: [true, 'A tour must have a price']
  },
  priceDiscount: {
    type: Number,
    validate: {               //This validtor only works with create and not update
      validator: function(val) {//because it's getting the price value which available on creation
        return val < this.price;//of the new document
      },
      message: `Price discount ({VALUE}) must be below regular price`
    }
  },
  summary: {
    type: String,
    trim: true,
    required: [true, 'A tour must have a summary'] //validator
  },
  description: {
    type: String,
    trim: true
  },
  imageCover: {
    type: String,
    trim: true,
    required: [true, 'A tour must have a cover image'] //validator
  },
  images: [String], //Short for type: [Strings]
  createdAt: {
    type: Date, 
    default: Date.now, //default js function
    select: false
  },
  startDates: [Date],
  secretTour: {
    type: Boolean,
    default: false,
    select: false
  },
  startLocation: {
    //GeoJSON embedded object
    type: {
      type: String,
      default: 'Point',
      enum: ['Point']
    },
    coordinates: [Number],
    address: String,
    description: String
  },
  locations: [  //we specify embedded documents with array
    {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point']
      },
      coordinates: [Number],
      address: String,
      description: String,
      day: Number
    }
  ],
  // guides: Array //will be embed via pre save middleware
  guides: [   //referencing document instead of embedding
    {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    }
  ]
}, {
  toJSON: {virtuals: true},
  toObject: {virtuals: true}
});
//Indexes
//tourSchema.index({price: 1});
tourSchema.index({price: 1, ratingsAverage: -1});
tourSchema.index({slug: 1});
tourSchema.index({startLocation: '2dsphere'});
//Virtual properties
tourSchema.virtual('durationWeeks').get(function() { //using regular function to have access to this property
  return this.duration/7;
});
//Virtual populate
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour', //in review model we store tour id in 'tour' field
  localField: '_id'     //in tour model we store tour id in '_id' field
});

//DOCUMENT MIDDLEWARE: runs before save() and create() .insertMany()
tourSchema.pre('save', function(next) {
  this.slug = slugify(this.name, {lower: true}); //here this is the reference to the document which we process
  next();
})
/*
tourSchema.pre('save', function(next) {
  console.log('Will save document...');
  next();
})

tourSchema.post('save', function(doc, next) {
  console.log(doc);
  next();
})
*/
/*/Embed guides
tourSchema.pre('save', async function(next) {
  const guidesPromises = this.guides.map(async id => await User.findById(id));
  this.guides = await Promise.all(guidesPromises);
  next();
});*/
//QUERY MIDDLEWARE
tourSchema.pre(/^find/, function(next) {  //apply to all methods containing find (findOne, findOneAndDelete etc)
//tourSchema.pre('find', function(next) {
  this.find({secretTour: {$ne: true}}); //this now is the reference to the current query
  this.start = Date.now();
  next();
});
//Populate the guides field
tourSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'guides',
    select: '-passwordChangedAt -__v'
  });
  next();
});
/*
tourSchema.post(/^find/, function(docs, next) {
  console.log(`Query took ${Date.now() - this.start} ms`); 
  console.log(docs);
  next();
});
*/
//AGREGATION MIDDLEWARE
/*tourSchema.pre('aggregate', function(next) {  //this now is the reference to the aggrecation object
  this.pipeline().unshift({ $match: { secretTour: {$ne: true} } }); //adding another stage to our aggregation
  next();
});
*/
const Tour = mongoose.model('Tour', tourSchema); //models start with capital letters


module.exports = Tour;





