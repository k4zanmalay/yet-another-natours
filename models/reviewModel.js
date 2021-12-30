const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema({
  review: {
    type: String,
    trim: true,
    required: [true, 'Did you like your tour? Write about it. Your opinion matters.']
  },
  rating: {
    type: Number,
    min: [1, 'Rating must be between 1 and 5'],
    max: [5, 'Rating must be between 1 and 5']
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  user: {
    type: mongoose.Schema.ObjectId, //parent reference
    ref: 'User',
    required: [true, 'Review must belong to a tour']
  },
  tour: {
    type: mongoose.Schema.ObjectId, //parent reference
    ref: 'Tour',
    required: [true, 'Review must belong to a user']
  }
},
{
  toJSON: {virtuals: true},
  toObject: {virtuals: true}
});
//Statics functions
reviewSchema.statics.calcAverageRatings = async function(tourId) {
  const stats = await this.aggregate([
    {
      $match: {tour: tourId}  //phase 1 match by tourId
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1},  //phase 2 get number of reviews and average
        avgRating: {$avg: '$rating'}
      }
    }
  ])
  if(stats.length>0) {
  await Tour.findByIdAndUpdate(tourId, {
    ratingsQuantity: stats[0].nRating,
    ratingsAverage: stats[0].avgRating
  });
  } else {
  await Tour.findByIdAndUpdate(tourId, { //if no reviews left
    ratingsQuantity: 0,                  //return to defaults
    ratingsAverage: 4.5
  });

  }
};
//Indexes
reviewSchema.index({user: 1, tour: 1}, {unique: true}); //No duplicate reviews 1 user = 1 tour review 
//Document middleware
reviewSchema.post('save', function() {
  this.constructor.calcAverageRatings(this.tour);//this.constructor point to Model(Review)
});
//Query middleware
//In order to include ratings change from update and delete operations
//document middleware is not enough
reviewSchema.pre(/^findOneAnd/, async function(next) {
  this.r = await this.clone().find();//we use clone to execute caught query second time
  next();
});

reviewSchema.post(/^findOneAnd/, async function(doc) {
  await this.r[0].constructor.calcAverageRatings(this.r[0].tour);
});
//Populate user and tour fields
reviewSchema.pre(/^find/, function(next) {
/*  this.populate({
    path: 'tour',
    select: 'name'
  });*/
  this.populate({
    path: 'user',
    select: 'name photo'
  });
  next();
});

const Review = mongoose.model('Review', reviewSchema); //models start with capital letters

module.exports = Review;






