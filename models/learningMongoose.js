const mongoose = require("mongoose");
const mongodb = require("mongodb");

//filter properties not in the schema
mongoose.set("strictQuery", false);

// Define the database URL to connect to.
const mongoDBURL = "mongodb://localhost:27017/locallibrary";

// Wait for database to connect, logging an error if there is a problem
main().catch((err) => console.log(err));

 async function main() {
  await mongoose.connect(mongoDBURL);
}

module.exports = {main}
