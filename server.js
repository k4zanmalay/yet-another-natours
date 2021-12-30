const mongoose = require('mongoose');
/*
process.on('uncaughtException', err => {  
  console.log('UNCAUGHT EXCEPTION: shutting down...');
  console.log(err.name, err.message);
  process.exit(1)
})
*/
const dotenv = require('dotenv');
dotenv.config({path: 'config.env'});

const app = require ('./app');

const port = process.env.PORT;
const DB = process.env.DATABASE_LOCAL;
mongoose.connect(DB).then(() => {
  console.log('DB connection successful');
});

const server = app.listen(port, () => {
  console.log(`Ready at port ${port}...`);
});
/*
process.on('unhandledRejection', err => {
  console.log('UNHANDLED REJECTION: shutting down...');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1)
  });
});
*/




