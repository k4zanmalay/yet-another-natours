const multer = require('multer');
const sharp = require('sharp');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

//Configure storage, where we store uploaded files, and how we name them
//We can either store image on a disk
/*const multerStorage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, 'public/img/users');
  },
  filename: (req, file, callback) => {
    const extension = file.mimetype.split('/')[1];
    callback(null, `user-${req.user._id}-${Date.now()}.${extension}`);
  }
});*/
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

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if(allowedFields.includes(el))
      newObj[el] = obj[el];
  });
  return newObj;
};


exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);
//DO NOT UPDATE PASSWORDS WITH THIS
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);

exports.getMe = (req, res, next) => {
  req.params.id = req.user._id;
  next();
}

exports.updateMe = catchAsync(async (req, res, next) => {
  //1. Create error if user wants to update his password
  if(req.body.password)
    return next( new AppError('This route is not for password updates, baka! Please use /updateMyPassword, 400'));
  //2. Sanitize user input, only allowed fields are go through
  const filteredBody = filterObj(req.body, 'name', 'email'); //sanitize user input
  if(req.file) filteredBody.photo = req.file.filename;//include photo 
  //3. Update user
  const updatedUser = await User.findByIdAndUpdate(req.user._id, filteredBody, {
    new: true,
    runValidators: true
  });
  res.status(200).json({
    status: 'success',
    data: {
      updatedUser
    }
  });
})

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if(!req.file) return next();
  req.file.filename = `user-${req.user._id}-${Date.now()}.jpeg`;
  //Sharp is image processing library
  await sharp(req.file.buffer)
    .resize(500,500)
    .toFormat('jpeg')
    .jpeg({quality: 90})
    .toFile(`public/img/users/${req.file.filename}`);
  next();
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user._id, {active: false})
  res.status(204).json({
    status: 'success',
    data: null
  })
})


