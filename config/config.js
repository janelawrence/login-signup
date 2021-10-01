// Contain the database url along with our secret key for jwt verification
require("dotenv").config();

const config = {
  production: {
    SECRET: process.env.SECRET,
    DATABASE: process.env.MONODB_URI,
  },
  default: {
    SECRET: "",
    DATABASE: process.env.MONODB_URI,
  },
};

// console.log(config["production"]);

exports.get = function get(env) {
  return config[env] | config.default;
};
