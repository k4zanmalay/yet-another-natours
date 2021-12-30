const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

exports.deleteOne = Model => catchAsync(async (req, res, next) => {
  const doc = await Model.findByIdAndDelete(req.params.id);
  if(!doc)
    return next( new AppError('No document was found with that ID', 404));

  res.status(204).json({
    status: 'success',
    data: null
  });
});


exports.createOne = Model => catchAsync(async (req, res, next) => {
  const newDoc = await Model.create(req.body);
  res.status(201).json({
    status: 'success',
    data: {
      document: newDoc
    }
  });
});

exports.updateOne = Model => catchAsync(async (req, res, next) => {
  const docId = req.params.id;
  const doc = await Model.findByIdAndUpdate(docId, req.body, {
    new: true,
    runValidators: true
  });

  if(!doc)
    return next( new AppError('No document was found with that ID', 404));

  res.status(200).json({
    status: 'success',
    data: {
      document: doc
    }
  });
});

exports.getOne = (Model, popOptions) => catchAsync(async(req, res, next) => {
  const docId = req.params.id;  //Build query
  let query = Model.findById(docId);

  if(popOptions) query = query.populate(popOptions);
  const doc = await query;  //Execute query

  if(!doc)
    return next( new AppError('No document was found with that ID', 404));

  res.status(200).json({
    status: 'success',
    data: {
      document: doc
    }
  });
});

exports.getAll = Model => catchAsync(async (req, res, next) => {
  /*const query = await Tour.find()   //Mongoose way of querying
    .where('duration')
    .equals(duration)
    .where('difficulty')
    .equals(difficulty);
  */
  //BUILD QUERY
  //Allow nested tour routes (hack)
  let filter = {};
  if(req.params.tourId) filter = {tour: req.params.tourId};

  const feature = new APIFeatures(Model.find(filter), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();
  //EXECUTE QUERY
  //const docs = await feature.query.explain(); //get mongodb query statistics
  const docs = await feature.query; //consume chained promises from before

  //SEND RESPONSE
  res.status(200).json({
    status: 'success',
    requestedAt: req.requestTime,
    results: docs.length,
    data: {
      documents: docs 
    }
  });
});

