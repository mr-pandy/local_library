const mongoose = require("mongoose");

mongoose.set("strictQuery", false);

async function connectToDatabase() {
  try {
    const mongoDBURI = process.env.MONGODB_URI;

    if (!mongoDBURI) {
      throw new Error("mongoDB_URI environment variable is not defined.");
    }

    await mongoose.connect(mongoDBURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const connection = mongoose.connection;

    connection.on("connected", () => {
      console.log("MongoDB Connected Successfully");
    });

    connection.on("error", (err) => {
      console.error("MongoDB Connection Error:", err);
      process.exit(1); // Exit the process with an error code
    });
  } catch (err) {
    console.error("Error connecting to MongoDB:", err);
    process.exit(1); // Exit the process with an error code
  }
}

module.exports = connectToDatabase;
