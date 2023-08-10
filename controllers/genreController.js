const Genre = require("../models/genre");
const mongoose = require("mongoose");
const Book = require("../models/book");
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");

// Display list of all Genre.
exports.genre_list = asyncHandler(async (req, res, next) => {
  const genreList = await Genre.find().sort({ name: 1 }).exec();
  res.render("genre_list", {
    title: "List of Genres",
    listOfGenres: genreList,
  });
});

// Display detail page for a specific Genre.
exports.genre_detail = asyncHandler(async (req, res, next) => {
  // Get details of genre and all associated books (in parallel)

  const [genre, booksInGenre] = await Promise.all([
    Genre.findById(req.params.id).exec(),
    Book.find({ genre: req.params.id }, "title summary").exec(),
  ]);

  if (genre === null) {
    // no results
    const error = new Error("Genre not found");
    error.status = 404;
    return next(error);
  }

  res.render("genre_detail", {
    title: "Genre Detail",
    genre: genre,
    genre_books: booksInGenre,
  });
});

// Display Genre create form on GET.
exports.genre_create_get = (req, res, next) => {
  res.render("genre_form", {
    title: "Create Genre",
  });
};

// Handle Genre create on POST.
exports.genre_create_post = [
  //Validate and Sanitize field
  body("name", "Genre name must contain at least 3 characters")
    .trim()
    .isLength({ min: 3 })
    .escape(),

  // Process request after validation and sanitization.
  asyncHandler(async (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a genre object with escaped and trimmed data.
    const genre = new Genre({ name: req.body.name });

    if (!errors.isEmpty()) {
      // There are errors. Render the form again with sanitized values/error messages.
      res.render("genre_form", {
        title: "Create Genre",
        genre: genre,
        errors: errors.array(),
      });
      return;
    } else {
      // Data from form is valid.
      // Check if Genre with same name already exists. To prevent letter case (fAnTasy, Fantasy)
      const genreExists = await Genre.findOne({ name: req.body.name })
        .collation({ locale: "en", strength: 2 })
        .exec();

      if (genreExists) {
        // Genre exists, redirect to its detail page.
        res.redirect(genreExists.url);
      } else {
        await genre.save();
        // New genre saved. Redirect to genre detail page.
        res.redirect(genre.url);
      }
    }
  }),
];

// Display Genre delete form on GET.
exports.genre_delete_get = asyncHandler(async (req, res, next) => {
  const [genre, genreBooks] = await Promise.all([
    Genre.findById(req.params.id).exec(),
    Book.find({ genre: req.params.id }, "title summary").exec(),
  ]);

  if (!genre) {
    res.redirect("/catalog/genres");
    return;
  }

  res.render("genre_delete", {
    title: "Delete Genre",
    genre: genre,
    genre_books: genreBooks,
  });
});

// Handle Genre delete on POST.
exports.genre_delete_post = asyncHandler(async (req, res, next) => {
  const [genre, genreBooks] = await Promise.all([
    Genre.findById(req.params.id).exec(),
    Book.find({ genre: req.params.id }, "title summary").exec(),
  ]);

  if (genreBooks.length < 0) {
    res.render("genre_delete", {
      title: "Delete Genre",
      genre: genre,
      genre_books: genreBooks,
    });
    return;
  } else {
    try {
      // Convert req.body.genreid to a mongoose.Types.ObjectId
      const genreId = new mongoose.Types.ObjectId(req.body.genreid);
      await Genre.findByIdAndRemove(genreId);
      res.redirect("/catalog/genres");
    } catch (err) {
      console.log("There's an error while clicking the button", err);
    }
  }
});

// Display Genre update form on GET.
exports.genre_update_get = asyncHandler(async (req, res, next) => {
  const [genre, allBooksByGenre] = await Promise.all([
    Genre.findById(req.params.id).exec(),
    Book.find({ genre: req.params.id }, "title summary"),
  ]);

  console.log(genre, allBooksByGenre);
  if (!genre) {
    const err = new Error("No Genre");
    err.status = 404;
    throw err;
  }

  res.render("genre_update", {
    title: "Update Genre",
    genre: genre,
    genre_books: allBooksByGenre,
  });
});

// Handle Genre update on POST.
exports.genre_update_post = [
  body("name", "Genre not specified").trim().isLength({ min: 1 }).escape(),
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    const genre = new Genre({
      name: req.body.name,
      _id: req.params.id,
    });

    if (!errors.isEmpty()) {
      const allGenres = await Genre.find().exec();

      res.render("genre_update", {
        title: "Update Genre",
        genre: allGenres,
      });
      return;
    } else {
      try {
        const updatedGenre = await Genre.findByIdAndUpdate(
          req.params.id,
          genre,
          {}
        );
        res.redirect(updatedGenre.url);
      } catch (err) {
        return next(err);
      }
    }
  }),
];
