const express = require("express");
const router = express.Router();
const authenticateUser = require("../middleware/authentication"); //add this line for updateUser route
const testUser = require("../middleware/testUser"); //bring the testUser middleware
const { register, login, updateUser } = require("../controllers/auth"); //add updateUser route
const rateLimiter = require("express-rate-limit"); //step1. add the rateLimiter package


const apiLimiter = rateLimiter({
  //step2. add the rateLimiter package
  windowMs: 15 * 60 * 1000, // 15 minutes (convert 15ms to 15 min)
  max: 10, //Limit each IP to 10 requests per `window` (here, per 15 minutes)
  //we send a message as an object since frontend expect this
  message: {
    msg: "Too many requests from this IP, please try again after 15 minutes",
  },
});
router.post("/register", apiLimiter, register); //step3. add the rateLimiter package
router.post("/login", apiLimiter, login); //step3. add the rateLimiter package
router.patch("/updateUser", authenticateUser, testUser, updateUser); //add the patch route for updateUser and authenticateUser before updating user-also add the testUSer
module.exports = router;
