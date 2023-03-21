const express = require('express')
const testUser = require("../middleware/testUser");  //add testUser middleware
const router = express.Router()
const {
  createJob,
  deleteJob,
  getAllJobs,
  updateJob,
  getJob,
  showStats,
} = require('../controllers/jobs')

router.route('/').post(testUser, createJob).get(getAllJobs)
//add showStats route
router.route('/stats').get(showStats)
router.route('/:id').get(getJob).delete(testUser, deleteJob).patch(testUser, updateJob)

module.exports = router
