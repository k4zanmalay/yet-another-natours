const multer = require('multer');
const sharp = require('sharp');
const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

//Or in a memory buffer (req.file.buffer)
const multerStorage = multer.memoryStorage();

//Configure filter to only receive mages
const multerFilter = (req, file, callback) => {
  if(file.mimetype.startsWith('image')){
    callback(null, true);
  } else {
    callback(new AppError('Not an image! Please upload only images.', 400), false);
  }
};
//Create a multer 
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter
});

exports.uploadTourImages = upload.fields([
  {name: 'imageCover', maxCount: 1},
  {name: 'images', maxCount: 3}
]);

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  if(!req.files.imageCover || !req.files.images) return next(); 
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
  //Sharp is image processing library
  //1. Process cover image
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000,1333)
    .toFormat('jpeg')
    .jpeg({quality: 90})
    .toFile(`public/img/tours/${req.body.imageCover}`);
  //2. Process images
  req.body.images = [];
  await Promise.all(req.files.images.map(async (el, index) => {
    const filename = `tour-${req.params.id}-${Date.now()}-${index+1}.jpeg`;
    await sharp(el.buffer)
      .resize(2000,1333)
      .toFormat('jpeg')
      .jpeg({quality: 90})
      .toFile(`public/img/tours/${filename}`);
    req.body.images.push(filename);
  }));
  next();
});

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty,duration';
  next();
}

exports.getAllTours = factory.getAll(Tour);

exports.getTour = factory.getOne(Tour, 'reviews');

exports.createTour = factory.createOne(Tour);

exports.updateTour = factory.updateOne(Tour);

exports.deleteTour = factory.deleteOne(Tour);

exports.getToursWithin = catchAsync(async (req,res, next) => {
  const {distance, latlng, unit} = req.params;
  const [lat, lng] = latlng.split(',');
  if(!lat || !lng)
    next(new AppError('Please provide coordinates in tha format lat,lng', 404));
  //Geospatial query
  const radius = unit === 'mi' ? distance/3963.2 : distance/6378.1;//convert to radians distance/earth radius
  const tours = await Tour.find({
    startLocation: {
      $geoWithin: { 
        $centerSphere: [[lng, lat], radius]
      }
    } 
  });
  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      documents: tours
    }
  });
});

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: {ratingsAverage: {$gte: 4.5} }
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty'},
        numTours: { $sum: 1},
        numRatings: { $sum: '$ratingsQuantity'},
        avgRating: { $avg: '$ratingsAverage'},
        avgPrice: { $avg: '$price'},
        minPrice: { $min: '$price'},
        maxPrice: { $max: '$price'}
      }
    },
    {
      $sort: { avgPrice: 1} //1 for ascending
    },
   // {
   //   $match: { _id: {$ne: 'EASY'}}
   // }
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      stats
    }
  });
});

exports.getMonthlyPlan =catchAsync(async (req, res, next) => {
  const year = req.params.year*1;
  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates'
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`)
        }
      }
    },
    {
      $group: {
        _id: { $month: '$startDates'},
        numTourStarts: { $sum: 1},
        tours: { $push: '$name'}
      }
    },
    {
      $addFields: { month: '$_id'}    
    },
    {
      $project: {
        _id: 0
      }
    },
    {
      $sort: {numTourStarts: -1}
    },
    {
      $limit: 12
    }
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      plan
    }
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const {latlng, unit} = req.params;
  const [lat, lng] = latlng.split(',');
  if(!lat || !lng)
    next(new AppError('Please provide coordinates in tha format lat,lng', 404));
  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;
  const distances = await Tour.aggregate([
    {
      //always the first stage
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng*1, lat*1]
        },
        spherical: true,
        distanceField: 'distance',
        distanceMultiplier: multiplier
      }
    },
    {
      $project: {
        distance: 1,
        name: 1
      }
    }
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      documents: distances
    }
  });
});



