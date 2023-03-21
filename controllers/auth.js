const User = require("../models/User");
const { StatusCodes } = require("http-status-codes");  //for removing try and catch from routes
const { BadRequestError, UnauthenticatedError } = require("../errors");

const register = async (req, res) => {
  const user = await User.create({ ...req.body });
  const token = user.createJWT(); //see models>User.js
  res.status(StatusCodes.CREATED).json({
    user: {
      email: user.email,
      lastName: user.lastName,
      location: user.location,
      name: user.name,
      token,
    },
  });
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new BadRequestError("Please provide email and password");
  }
  const user = await User.findOne({ email });
  if (!user) {
    throw new UnauthenticatedError("Invalid Credentials");
  }
  const isPasswordCorrect = await user.comparePassword(password);
  if (!isPasswordCorrect) {
    throw new UnauthenticatedError("Invalid Credentials");
  }
  // compare password
  const token = user.createJWT();
  res.status(StatusCodes.CREATED).json({
    user: {
      email: user.email,
      lastName: user.lastName,
      location: user.location,
      name: user.name,
      token,
    },
  });
};

const updateUser = async (req, res) => {
  const{email,name,lastName,location} = req.body
  if(!email || !name || !lastName || !location){
    throw new BadRequestError('plesase provide all values')
  }
  const user = await User.findOne({_id:req.user.userId});
  user.email = email;
  user.name = name;
  user.lastName = lastName;
  user.location = location;

  await user.save();   //.save() method we create a new document in mongodb
  const token = user.createJWT();
    res.status(StatusCodes.CREATED).json({
      user: {
        email: user.email,
        lastName: user.lastName,
        location: user.location,
        name: user.name,
        token,
      },
  });
};


module.exports = {
  register,
  login,
  updateUser,
};
