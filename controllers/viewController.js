const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.getOverview = catchAsync(async (req, res, next) => {
  //1 Get tour data from collection
  const tours = await Tour.find();
  //2 Build template

  //3 Render template using data from DB
  res.status(200).render('overview', {
    title: 'All tours',
    tours
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  //1. Get tour from db
  const tour = await Tour.findOne({slug: req.params.slug}).populate({
    path: 'reviews',
    fields: 'review rating user'
  });

  if(!tour)
    return next( new AppError('No tour was found with that name', 404));

  //2. Build template

  //3, Render template
  res.status(200).render('tour', {
    title: tour.name,
    tour
  });
});

exports.getLoginForm = (req, res) => {
  res.status(200).render('login', {
    title: 'Log in'
  });
};

exports.getAccount = (req, res) => {
  res.status(200).render('account', {
    title: 'Your account'
  });
};

exports.updateUserData = catchAsync(async (req, res, next) => {
  //Update user data via form in website account dashboard
  const updatedUser = await User.findByIdAndUpdate(req.user._id, {
    name: req.body.name,
    email: req.body.email
  }, 
  {
    new: true,
    runValidators: true
  });
  res.status(200).render('account', {
    title: 'Your account',
    user: updatedUser
  });
});


