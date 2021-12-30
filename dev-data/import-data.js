const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({path: 'config.env'});

const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const Review = require('../models/reviewModel');
const port = process.env.PORT;
const DB = process.env.DATABASE_LOCAL;
mongoose.connect(DB).then(() => {
  console.log('DB connection successful');
});

const tours = JSON.parse(fs.readFileSync(`${__dirname}/data/tours.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/data/users.json`, 'utf-8'));
const reviews = JSON.parse(fs.readFileSync(`${__dirname}/data/reviews.json`, 'utf-8'));

const importData = async () => {
  try{
    await Tour.create(tours);
    await User.create(users, {validateBeforeSave: false}); //bypass validation (password confirm)
    await Review.create(reviews);
    console.log('Data successfully loaded!');
    process.exit();
  }catch(err) {
    console.log(err)
  }
}

const deleteData = async () => {
  try {
    await Tour.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();
    console.log('Data successfully deleted!');
    process.exit();
  } catch(err) {
    console.log(err)
  }
}

if(process.argv[2] === '--import')
  importData();
if(process.argv[2] === '--delete')
  deleteData();

console.log(process.argv);

