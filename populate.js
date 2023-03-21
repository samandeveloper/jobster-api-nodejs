//adding this files makes the mock-data.json upload into atlas mongo db

require("dotenv").config();

const mockData = require("./mock-data.json");

const Job = require("./models/Job");
const connectDB = require("./db/connect");

const start = async () => {
  try {
    await connectDB(process.env.MONGO_URI);  //connect to db

    await Job.create(mockData);  //after connecting to the db we use .create method to create the mock-data.json file 
    console.log("Success!!!");
    process.exit(0);  //exit the process after sucess since we want to read the mock-data.js file once
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

start();
