const crypto = require('crypto');
const {promisify} = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Email = require('../utils/email');

const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
     expiresIn: process.env.JWT_EXPIRESIN
  });
}

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRESIN *24 * 60 * 60 *1000
    ),
    httpOnly: true //browser can't modify cookie
  };
  if(process.env.NODE_ENV === 'production')
    cookieOptions.secure = true; //send only via Https

  user.password = undefined; //don't show password in response

  res.cookie('jwt', token, cookieOptions); //send JWT with a cookie to a user
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
}

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({   //Only accept needed fields from the user input
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });
  //Send greeter email
  const url =`${req.protocol}://${req.get('host')}/me`;
  console.log(url);
  await new Email(newUser, url).sendWelcome();

  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const {email, password} = req.body;

  //1.Check if email and password exist
  if(!email || !password) {
    return next( new AppError('Please provide email and password!', 400));   
  }
  //2. Check if user exists and password correct
  const user = await User.findOne({email}).select('+password');

  if(!user || !(await user.checkPassword(password, user.password))) //if user does not exist checkPassword won't be called
    return next( new AppError('Incorrect email or password', 401));

  //3. If everything is ok, send JWT token
  createSendToken(user, 200, res);
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'looged out', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  res.status(200).json({
    status: 'success'
  })
}
//Only for rendered pages, no errors logged 
exports.isLoggedIn = async (req, res, next) => {
  try {
    //1. Verify token
    if(req.cookies.jwt) {
      const decoded = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET);
      //2. Check if the user still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) 
        return next();
      //3. Check if user changed the password after token has been issued
      if (await currentUser.changedPasswordAfter(decoded.iat))
        return next();
      //4. There is a logged in user, send his data to client
      res.locals.user = currentUser;
    }
    return next();
  } catch(err) {
    return next(); 
  }
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    //roles is an array ['admin', 'user' etc ]
    if(!roles.includes(req.user.role))
      return next(new AppError('You do not have permission to perform this action', 403));
    next();
  };
}

exports.protected = catchAsync(async (req, res, next) => {
  //1. Get the token
  let token;
  if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if(req.cookies.jwt) {
    token = req.cookies.jwt//search for token in cookies
  }
  if (!token) {
    next( new AppError('You are not logged in. Please log in to get access', 401));
  }
  //2. Verification
  //promisify with node utils to not deal with callbacks
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  //3. Check if the user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) return next( new AppError ('Token belongs to deleted user', 401));
  //4. Check if user changed the password after token has been issued
  if (await currentUser.changedPasswordAfter(decoded.iat))
    return next( new AppError ('User recently has changed his password. Please login again', 401));
  //5. Provide access
  req.user = currentUser;//saving logged user document/data in a request for a further use
  res.locals.user = currentUser;//do the same for the website
  next(); 
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    //roles is an array ['admin', 'user' etc ]
    if(!roles.includes(req.user.role))
      return next(new AppError('You do not have permission to perform this action', 403));
    next();
  };
}

exports.forgotPassword = catchAsync(async (req, res, next) => {
  //1. Get user based on posted email
  const user  = await User.findOne({ email: req.body.email });
  if(!user)
    return next(new AppError('User with this email does not exist', 404));
  //2. Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false }); //save tokens and expiration date, ignore other fields
  
  //3. Send it to users email
  const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
  try {
    await new Email(user, resetUrl).sendPasswordReset();
    res.status(200).json({
      status: 'success',
      message: 'Token sent to your email'
    });
  } catch(err) {
    console.log(err);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false }); //save tokens and expiration date, ignore other fields

    return next( new AppError('There was an error sending an email! Try again later', 500));
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  //1. Get user based on the token
  const hashedToken = crypto.createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: {$gt: Date.now()}
  });
  //2. If token is not expired and user exists, set the new password
  if(!user)
    return next( new AppError('Token is invalid or has expired', 400));

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();
  //3. Update the password and changedPasswordAt properties for the user
  //^^^^implemented in document middleware^^^^ 
  //4. Log the user in, send JWT
  createSendToken(user, 200, res);
})

exports.updateMyPassword = catchAsync(async (req, res, next) => {
  //1. Get user from database
  const user = await User.findById(req.user._id).select('+password');
  //2. Check if actual password is correct
  if(!user || !(await user.checkPassword(req.body.password, user.password))) 
    return next( new AppError('Incorrect password', 401));
  //3. Update the password
  user.password = req.body.newPassword;
  user.passwordConfirm = req.body.newPasswordConfirm;
  await user.save();
  //4. Log user using JWT 
  createSendToken(user, 200, res);
});







