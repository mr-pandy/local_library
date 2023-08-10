const { DateTime } = require("luxon");
const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const AuthorSchema = new Schema({
  first_name: { type: String, required: true, maxLength: 100 },
  family_name: { type: String, required: true, maxLength: 100 },
  date_of_birth: { type: Date },
  date_of_death: { type: Date },
});

// Virtual for Author's Fullname
AuthorSchema.virtual("name").get(function () {
  let fullname = "";
  if (this.first_name && this.family_name) {
    fullname = `${this.first_name}, ${this.family_name}`;
  }
  return fullname;
});

// Virtual for author's URL
AuthorSchema.virtual("url").get(function () {
  return `/catalog/author/${this._id}`;
});

AuthorSchema.virtual("formattedDate").get(function () {
  const DOB = this.date_of_birth
    ? this.date_of_birth.toISOString().split("T")[0]
    : "";
  const DOD = this.date_of_death
    ? this.date_of_death.toISOString().split("T")[0]
    : "";
  return { DOB, DOD };
});

const Author = mongoose.model("Author", AuthorSchema);

module.exports = Author;
