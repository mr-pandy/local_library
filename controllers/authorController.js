const expressAsyncHandler = require("express-async-handler");
const Author = require("../models/author");
const Book = require("../models/book");
const { body, validationResult } = require("express-validator");

// Display list of Authors
exports.author_list = expressAsyncHandler(async (req, res, next) => {
  const allAuthors = await Author.find().exec();
  res.render("author_list", {
    title: "List of Authors",
    listOfAuthors: allAuthors,
  });
});

// Display detail page for a specific Author
exports.author_detail = expressAsyncHandler(async (req, res, next) => {
  const [author, allBooksByAuthor] = await Promise.all([
    Author.findById(req.params.id).exec(),
    Book.find({ author: req.params.id }, "title summary").exec(),
  ]);

  if (author == null) {
    const err = new Error("Author not found");
    err.status = 404;
    return next(err);
  }

  res.render("author_detail", {
    title: "Author Detail",
    author: author,
    author_books: allBooksByAuthor,
  });
});

//Display Author create form on GET
exports.author_create_get = expressAsyncHandler(async (req, res, next) => {
  res.render("author_form", { title: "Create Author" });
});

// Handle Author create on POST.
exports.author_create_post = [
  body("first_name")
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage("First name must be specified")
    .isAlphanumeric()
    .withMessage("First name has non-alphanumeric characters."),
  body("family_name")
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage("Family name must be specified")
    .isAlphanumeric()
    .withMessage("Family name has non-alphanumeric characters."),
  body("date_of_birth", "Invalid date of birth")
    .optional({ values: "falsy" })
    .isISO8601()
    .toDate(),
  body("date_of_death", "Invalid date of death")
    .optional({ values: "falsy" })
    .isISO8601()
    .toDate(),

  expressAsyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    const author = new Author({
      first_name: req.body.first_name,
      family_name: req.body.family_name,
      date_of_birth: req.body.date_of_birth,
      date_of_death: req.body.date_of_death,
    });
    console.log(errors.array());
    if (!errors.isEmpty()) {
      res.render("author_form", {
        title: "Create Author",
        author: author,
        errors: errors.array(),
      });

      return;
    } else {
      // Saves inputted data
      await author.save();

      // Redirect to new author record.
      res.redirect(author.url);
    }
  }),
];

// Display Author delete form on GET.
exports.author_delete_get = expressAsyncHandler(async (req, res, next) => {
  // Get details of author and all their books (in parallel)
  const [author, allBooksByAuthor] = await Promise.all([
    Author.findById(req.params.id).exec(),
    Book.find({ author: req.params.id }, "title summary").exec(),
  ]);

  if (author == null) {
    res.redirect("/catalog/authors");
  }

  res.render("author_delete", {
    title: "Delete Author",
    author: author,
    author_books: allBooksByAuthor,
  });
});
// Display Author delete form on GET.
exports.author_delete_post = expressAsyncHandler(async (req, res, next) => {
  // Get details of author and all their books (in parallel)

  const [author, allBooksByAuthor] = await Promise.all([
    Author.findById(req.params.id).exec(),
    Book.find({ author: req.params.id }, "title summary").exec(),
  ]);

  if (allBooksByAuthor.length > 0) {
    // Author has books. Render in same way as for GET route.
    res.render("author_delete", {
      title: "Delete Author",
      author: author,
      author_books: allBooksByAuthor,
    });

    return;
  } else {
    // Author has no books. Delete object and redirect to the list of authors.
    await Author.findByIdAndRemove(req.body.authorid);
    res.redirect("/catalog/authors");
  }
});
// Display Author Update form on GET.
exports.author_update_get = expressAsyncHandler(async (req, res, next) => {
  const [author, allBooksByAuthor] = await Promise.all([
    Author.findById(req.params.id).exec(),
    Book.find({ author: req.params.id }, "title summary"),
  ]);

  if (!author) {
    const err = new Error("No Author Found");
    err.status = 404;
    return next(err);
  }
  res.render("author_update", {
    title: "Update Author",
    author: author,
    author_books: allBooksByAuthor,
  });
});

// Display Author Update form on POST.
exports.author_update_post = [
  // Validation and sanitization
  body("first_name", "First Name is required")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("family_name", "Last Name is required")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("date_of_birth", "Invalid Date of Birth").isISO8601().toDate(),
  body("date_of_death", "Invalid Date of Death").isISO8601().toDate(),

  // Process request after validation and sanitization
  expressAsyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    const author = new Author({
      first_name: req.body.first_name,
      family_name: req.body.family_name,
      date_of_birth: req.body.date_of_birth,
      date_of_death: req.body.date_of_death,
      _id: req.params.id,
    });

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values/error messages.
      // Get the existing Author details for form
      const existingAuthor = await Author.findById(req.params.id).exec();

      res.render("author_update", {
        title: "Update Author",
        author: existingAuthor,
        errors: errors.array(),
      });
      return;
    } else {
      try {
        const updatedAuthor = await Author.findByIdAndUpdate(
          req.params.id,
          author,
          {}
        );
        // Redirect to the updated author's URL
        res.redirect(updatedAuthor.url);
      } catch (err) {
        console.log("It didn't update", err);
      }
    }
  }),
];
