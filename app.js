const path = require('path');
const express = require('express');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const morgan = require('morgan');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const viewRouter = require('./routes/viewRoutes');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

const limiter = rateLimit({
  max: 100, //100 requests
  windowMs: 1 * 60 * 60 *1000, //in one hour 
  message: 'Too many requests from one IP, wait one hour'
})

//0 GLOBAL MIDDLEWARE
//Use CORS
app.use(cors());
//Serving static websites
app.use(express.static(path.join(__dirname, 'public'))); //serve static files
//Security headers
app.use(helmet()); //helmet() returns middleware, therefore braces
//Request rate limiter
app.use('/api', limiter); //DDOS protection
//Development logging
if(process.env.NODE_ENV === 'development')
  app.use(morgan('dev'));
//URL parser
app.use(express.urlencoded({extended: true, limit: '10 kb'}));
//Cookie parser, reading data from cookies
app.use(cookieParser());
//Body parser, reading data from body into req.body
app.use(express.json({limit: '10kb'})); //json middleware
//Data sanitization against NoSQL query injections
app.use(mongoSanitize());
//Data sanitization against XSS 
app.use(xss());
//Prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration', 
      'ratingsAverage', 
      'ratingsQuantity', 
      'difficulty', 
      'price'
    ]
  })
);
//Compress response
app.use(compression());
//Get request timestamp
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});
//1 ROUTES
//app.get('/api/v1/tours', getAllTours); //Most basic CRUD requests 
//app.get('/api/v1/tours/:id', getTour);
//app.post('/api/v1/tours', createTour);
//app.patch('/api/v1/tours/:id', updateTour);
//app.delete('/api/v1/tours/:id', deleteTour);
//Website route
app.use('/', viewRouter);
//API routes
app.use('/api/v1/tours', tourRouter); //Mounting the routers
app.use('/api/v1/users', userRouter); //Route state middleware, subprogramms for specified route
app.use('/api/v1/reviews', reviewRouter);

//Handling error requests
app.all('*', (req, res, next) => {     //all stands for all methods, * is any
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
  //if we pass error to next function it will skip all middleware to the error handler
  //middleware
});


app.use(globalErrorHandler);

module.exports = app;




