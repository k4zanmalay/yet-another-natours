class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }
  filter() {
    //1A.Filtering
    const queryObj = {...this.queryString}; //destructuring the query object, simple = req.query won't work
                                         //because in JS we referencing and changing the reference will change
                                         //the object we reference e.g. req.query
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach(el => delete queryObj[el]);

    //1B. Advanced filtering
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gt|lt|gte|lte)\b/g, match => `$${match}`);
    this.query = this.query.find(JSON.parse(queryStr));

    return this; //So we can chain other methods filter().sort().limit() like this
  }
  sort() {
    if(this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');//setting query like below for Mongoose
      //sort('value' 'value2' 'value3') //sort with multiple criterias
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }
  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }
  paginate() {
    const page = this.queryString.page*1 || 1; // || 1 default value is 1
    const limit = this.queryString.limit*1 || 100;
    const skip = (page-1)*limit;
    this.query = this.query.skip(skip).limit(limit);
    return this;
  }
}

module.exports = APIFeatures;
