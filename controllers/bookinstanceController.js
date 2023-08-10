const BookInstance = require("../models/bookinstance");
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");
const Book = require("../models/book");

// Display list of all BookInstances.
exports.bookinstance_list = asyncHandler(async (req, res, next) => {
  const allBookInstances = await BookInstance.find().populate("book").exec();
  res.render("bookinstance_list", {
    title: "Book Instance List",
    bookinstance_list: allBookInstances,
  });
});

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = asyncHandler(async (req, res, next) => {
  const bookInstance = await BookInstance.findById(req.params.id)
    .populate("book")
    .exec();

  if (bookInstance === null) {
    const err = new Error("There's no copy of this book");
    err.status = 404;
    return next(err);
  }
  res.render("bookinstance_detail", {
    title: "Book:",
    bookinstance: bookInstance,
  });
});

// Display BookInstance create form on GET.
exports.bookinstance_create_get = asyncHandler(async (req, res, next) => {
  const allBooks = await Book.find().exec();
  res.render("bookinstance_form", {
    title: "Create a Book Instance",
    book_list: allBooks,
  });
});

// Handle BookInstance create on POST.
exports.bookinstance_create_post = [
  body("book", "Book must be Specified").trim().isLength({ min: 1 }).escape(),
  body("imprint", "Imprint must be specified")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("status").escape(),
  body("due_back", "Invalid date")
    .optional({ values: "falsy" })
    .isISO8601()
    .toDate(),

  asyncHandler(async (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a BookInstance object with escaped and trimmed data.
    const bookInstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back,
    });

    // There are errors.
    // Render form again with sanitized values and error messages.

    if (!errors.isEmpty()) {
      const allBooks = await Book.find({}, "title").exec();
      res.render("bookinstance_form", {
        title: "Create Book Instance ",
        book_list: allBooks,
        selected_book: bookInstance.book._id,
        errors: errors.array(),
        bookInstance: bookInstance,
      });
      return;
    } else {
      await bookInstance.save();
      res.redirect(bookInstance.url);
    }
  }),
];

// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = asyncHandler(async (req, res, next) => {
  const bookInstance = await BookInstance.findById(req.params.id).exec();

  if (!bookInstance) {
    res.redirect("/catalog/bookinstances");
  }

  res.render("bookinstance_delete", {
    title: "Delete Book Instance",
    book_instance: bookInstance,
  });
});

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = asyncHandler(async (req, res, next) => {
  const bookInstance = await BookInstance.findById(req.params.id).exec();

  try {
    await BookInstance.findByIdAndRemove(req.body.bookinstanceid);
    res.redirect("/catalog/bookinstances");
  } catch (err) {
    next(err);
  }
});

// Display BookInstance update form on GET.
exports.bookinstance_update_get = asyncHandler(async (req, res, next) => {
  const [bookInstance, book] = await Promise.all([
    BookInstance.findById(req.params.id).populate("book").exec(),
    Book.find().exec(),
  ]);
  console.log("bookInstance", bookInstance);
  console.log("book", book);
  if (!bookInstance) {
    const err = new Error("No BookInstance Record");
    err.status = 404;
    return next(err);
  }
  res.render("bookinstance_update", {
    title: "Update Book Instance",
    book: book,
    book_instance: bookInstance,
  });
});

// Handle bookinstance update on POST.
exports.bookinstance_update_post = [
  //Convert bookInstance to an Array
  (req, res, next) => {
    if (!req.body.book instanceof Array) {
      if (typeof req.body.book === "undefined") {
        req.body.book = [];
      } else {
        req.body.book = new Array(req.body.book);
      }
    }
    next();
  },
  // Validate and sanitize fields.
  body("book", "Book must not be empty").trim().isLength({ min: 1 }).escape(),
  body("imprint", "Imprint must not be empty")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("status", "Please select a status for the BookInstance")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("due_back", "Select a valid future date").isISO8601(),

  // Process request after validation and sanitization.
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    // Create a BookInstance object with escaped/trimmed data and old id.
    const bookInstance = new BookInstance({
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back,
      book: typeof req.body.book == "undefined" ? [] : req.body.book,
      _id: req.params.id, // This is required, or a new ID will be assigned!
    });

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values/error messages
      // Get all Books for form
      const allBooks = await Book.find().exec();

      res.render("bookinstance_update", {
        title: "Update BookInstance",
        book: allBooks,
      });
      return;
    } else {
      // Data from form is valid. Update the record.
      const updatedBookInstance = await BookInstance.findByIdAndUpdate(
        req.params.id,
        bookInstance,
        {}
      );
      // redirect to book page
      res.redirect(updatedBookInstance.url);
    }
  }),
];
