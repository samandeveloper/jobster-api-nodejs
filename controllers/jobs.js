const Job = require("../models/Job");
const { StatusCodes } = require("http-status-codes");
const { BadRequestError, NotFoundError } = require("../errors");
//for the moment package add the two below lines
const mongoose = require("mongoose");
const moment = require("moment");

const getAllJobs = async (req, res) => {
  //After-for search field in "All jobs" dashboard tab
  const { search, status, jobType, sort } = req.query; //fields in the "All Job" tab in dashboard
  const queryObject = { createdBy: req.user.userId };
  if (search) {
    //if search exists
    queryObject.position = { $regex: search, $options: "i" }; 
  }

  //status and JobType fields in "All jobs" dashboard tab
  if (status && status !== "all") {
    //if the status exists and not equal to all
    queryObject.status = status;
  }
  if (jobType && jobType !== "all") {
    //if the jobType exists and not equal to all
    queryObject.status = status;
    queryObject.jobType = jobType;
  }

  //note: .find() must receive an object
  let result = Job.find(queryObject); //remove the await from here since we have the chain of methods

  //sort field in "All jobs" dashboard tab--this part should be after the result since we sort the result here
  if (sort === "latest") {
    result = result.sort("-createdAt");
  }
  if (sort === "oldest") {
    result = result.sort("createdAt");
  }
  if (sort === "a-z") {
    result = result.sort("position");
  }
  if (sort === "z-a") {
    result = result.sort("-position");
  }

  //set pagination1
  const page = Number(req.query.page) || 1; //by default we are on page 1
  const limit = Number(req.query.limit) || 10; //by default we set 10 jobs per page
  const skip = (page - 1) * limit; //this is how we get to page 2, 3, ...
  result = result.skip(skip).limit(limit);

  const jobs = await result; //await is added here since this is a final result

  //set pagination2-continue
  //Note:The countDocuments() function is used to count the number of documents that match the filter in a database collection.
  const totalJobs = await Job.countDocuments(queryObject); //shows how many jobs we have in this particular query so it gives us the total job based on the query
  const numOfPages = Math.ceil(totalJobs / limit); //shows how many pages in total we have.e.g. if totalJobs=25 and limit=10 then 25/10 and round this UP
  //set pagination3-continue-add totalJobs and numOfPages too
  res.status(StatusCodes.OK).json({ jobs, totalJobs, numOfPages }); //we want all the jobs and pages
};

const getJob = async (req, res) => {
  const {
    user: { userId },
    params: { id: jobId },
  } = req;

  const job = await Job.findOne({
    _id: jobId,
    createdBy: userId,
  });
  if (!job) {
    throw new NotFoundError(`No job with id ${jobId}`);
  }
  res.status(StatusCodes.OK).json({ job });
};

const createJob = async (req, res) => {
  req.body.createdBy = req.user.userId;
  const job = await Job.create(req.body);
  res.status(StatusCodes.CREATED).json({ job });
};

const updateJob = async (req, res) => {
  const {
    body: { company, position },
    user: { userId },
    params: { id: jobId },
  } = req;

  if (company === "" || position === "") {
    throw new BadRequestError("Company or Position fields cannot be empty");
  }
  const job = await Job.findByIdAndUpdate(
    { _id: jobId, createdBy: userId },
    req.body,
    { new: true, runValidators: true }
  );
  if (!job) {
    throw new NotFoundError(`No job with id ${jobId}`);
  }
  res.status(StatusCodes.OK).json({ job });
};

const deleteJob = async (req, res) => {
  const {
    user: { userId },
    params: { id: jobId },
  } = req;

  const job = await Job.findByIdAndRemove({
    _id: jobId,
    createdBy: userId,
  });
  if (!job) {
    throw new NotFoundError(`No job with id ${jobId}`);
  }
  res.status(StatusCodes.OK).send();
};

//add stats route for the stats tab in the dashboard frontend
const showStats = async (req, res) => {
  let stats = await Job.aggregate([
    //aggregate model is on the Job model
    { $match: { createdBy: mongoose.Types.ObjectId(req.user.userId) } },
    //this will give us all the jobs that belongs to the user that is logged in
    //match the document that belongs to the specific user which find by the userId
    { $group: { _id: "$status", count: { $sum: 1 } } }, //group the match result (all the jobs) based on the status and count them
    //count will count how many jobs have the status of interview, declined,etc.
  ]);
  stats = stats.reduce((acc, curr) => {
    //iterate over the data array
    const { _id: title, count } = curr; //we have the id and count properties from the pipeline
    acc[title] = count; //for every value of status (interview, pending,pending) we count them
    return acc; //as a result we get back the object
  }, {}); 

  //create showStats controller
  const defaultStats = {
    //if in this object there is no such a propert(pending, interview,decined) then we return 0
    pending: stats.pending || 0,
    interview: stats.interview || 0,
    declined: stats.declined || 0,
  };

  //monthly applications
  let monthlyApplications = await Job.aggregate([
    { $match: { createdBy: mongoose.Types.ObjectId(req.user.userId) } },
    {
      $group: {
        //createdAt comes from mock-data.json
        _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
        count: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": -1, "_id.month": -1 } }, //in the chart we want to display the last 6 month of the year (-1 means we go descending) so we display the last month first
    { $limit: 6 }, //the last 6 month
  ]);

  //refactor monthly applications-we use the momentjs package here
  monthlyApplications = monthlyApplications
    .map((item) => {
      //iterate throw the monthlyApplication array of object that we receive from the pipeline
      const {
        _id: { year, month }, //pull out the year and month and count
        count,
      } = item;

      const date = moment() //define a date using moment package
        .month(month - 1) //-1 is because this is the format of the moment if we don't add -1 we will miss the last month
        .year(year)
        .format("MMM Y"); //we format it in the way we want to show the month and year
      return { date, count }; //we return date and count since the frontend is looking for them
    })
    .reverse(); //in the frontend chart we want the last month as the last item on the chart 

  res
    .status(StatusCodes.OK)
    .json({ defaultStats, monthlyApplications });  
};

module.exports = {
  createJob,
  deleteJob,
  getAllJobs,
  updateJob,
  getJob,
  showStats,
};
