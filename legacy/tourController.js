const fs = require('fs');

const tours = JSON.parse(fs.readFileSync(
  `${__dirname}/../dev-data/data/tours-simple.json`,
  'utf-8'
  ));

exports.checkId = (req, res, next, val) => {
  const tour = tours.find(element => element.id === val*1);
  if(!tour)
    return res.status(404).json({
      status: 'failure',
      message: 'invalid ID'
    });
  next();
}

exports.checkBody = (req, res, next) => {
  if (!req.body.name || !req.body.price)
    return res.status(400).json({
      status: 'failure',
      message: ' name OR price not specified'
    });
  next();
}

exports.getAllTours = (req, res) => {
  res.status(200).json({
    status: 'success',
    requestedAt: req.requestTime,
    results: tours.length,
    data: {
      tours //ES6 representation of tours: tours
    }
  });
};

exports.getTour = (req, res) => {
  const tourId = req.params.id * 1; //multiply by 1 to convert from string to number 
  const tour = tours.find(element => element.id === tourId);
  res.status(200).json({
    status: 'success',
    data: {
      tour
    }
  });
};

exports.createTour = (req, res) => {
  const newId = tours[tours.length - 1].id +1;
  const newTour = Object.assign({id: newId}, req.body);
  
  tours.push(newTour);
  fs.writeFile(
    `${__dirname}/dev-data/data/tours-simple.json`,
    JSON.stringify(tours),
    err => {
      res.status(201).json({
        status: 'success',
        data: {
          tour: newTour
        }
      });
    });
};

exports.updateTour = (req, res) => {
  res.status(200).json({
    status: 'success',
    data: {
      tour: '---> Updated tour here <---'
    }
  });
};

exports.deleteTour = (req, res) => {
  res.status(204).json({
    status: 'success',
    data: null
  });
};



