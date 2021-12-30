const AppError = require('../utils/appError');

const handleCastErrorDB = prodErr => {
  const message = `Invalid ${prodErr.path}: ${prodErr.value}`;
  return new AppError(message, 400);
}

const handleDuplicateFieldsDB = (prodErr, mongoErr) => {
  const value = prodErr.message.match(/(?<=").+?(?=")/g); //extracting duplicate value
  const message = `Duplicate field value: ${value[0]}. Please use another value.`;
  return new AppError(message, 400);
}

const handleValidatorErrorDB = err => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
}

const handleWebTokenErrorJWT = () => new AppError('Invalid token. Please login again', 401);
const handleTokenExpiredErrorJWT = () => new AppError('Token is expired. Please login again', 401);

const sendErrorDev = (err, req, res) => {
  if(req.originalUrl.startsWith('/api')) {
    //API
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      stack: err.stack,
      message: err.message
    });
  } else {
    //Rendered website
    res.status(err.statusCode).render('error', {
      title: 'Yikes!',
      message: err.message
    });
  }
};

const sendErrorProd = (err, req, res) => {
  //Operational error: trusted to send message to the client
  if(req.originalUrl.startsWith('/api')) {
    if (err.isOperational) {
      res.status(err.statusCode).json({
        status: err.status,
        message: err.message
      });
    //Programm or other error: we don't want to leak data to the client
    } else {
      //Log error
      console.error('ERROR: ',err);
      //Send message to the client
      res.status(500).json({
        status: 'error',
        message: 'Oops, something went very wrong!'
      })
    }
  } else {
    if (err.isOperational) {
      res.status(err.statusCode).render('error', {
        title: 'Yikes',
        message: err.message
      });
    //Programm or other error: we don't want to leak data to the client
    } else {
      //Log error
      console.error('ERROR: ',err);
      //Send message to the client
      res.status(500).render('error', {
        status: 'Yikes',
        message: 'Please try again later.'
      })
    }
  }
};


//express automatically assumes that 4 params middleware is error handler
module.exports = (err, req, res, next) => {  
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  if(process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  }
  else if(process.env.NODE_ENV === 'production') {
    let prodError = {...err};
    prodError.name = err.name;
    prodError.message = err.message;
    if(prodError.name === 'CastError') prodError = handleCastErrorDB(prodError);
    if(prodError.code === 11000) prodError = handleDuplicateFieldsDB(prodError);
    if(prodError.name === 'ValidationError') prodError = handleValidatorErrorDB(prodError);
    if(prodError.name === 'JsonWebTokenError') prodError = handleWebTokenErrorJWT();
    if(prodError.name === 'TokenExpiredError') prodError = handleTokenExpiredErrorJWT();

    sendErrorProd(prodError, req, res);
  }
}


