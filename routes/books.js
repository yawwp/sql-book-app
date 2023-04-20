const express = require('express');
const router = express.Router();
router.use(express.urlencoded({extended:true}));

//Locating the Book Model
const Book = require('../models').Book;

//Async Handler to handle call back functions and Error Handling
function asyncHandler(cb){
  return async(req,res,next)=> {
    try{
      await cb(req,res,next)
    } catch(error){
      res.status(500).send(error);
    }
  }
}

//Validation Handler from Books Model 
router.use((err, req, res, next) => {
  if (err instanceof Sequelize.ValidationError) {
    // Handle Sequelize validation errors
    res.render('error');
    return res.status(400).json({ errors: err.errors });
  } else if (err.status === 404) {
    // Handle 404 errors
    res.render('error');
    return res.status(404).send('Not found');
  } else {
    // Handle all other errors
    res.status(500).send('Internal server error');
    res.render('error');
  }
});


/* GET books listing. */
router.get('/', asyncHandler(async(req,res) => {
    const books = await Book.findAll();
    console.log(books);
    const data = books.map(book => book.toJSON());
    res.render('books', { data });
}));

/* GET new book page. */
router.get('/new', asyncHandler(async(req,res) => { 
  res.render('new-book',{ book: {}, title: "New Book" });
}));

/* POST new book page and validation handler. */
router.post('/new', asyncHandler(async(req,res) => {
  let book;
  try {
    book = await Book.create(req.body);
    res.redirect("/books");
  } catch (error) {
    if(error.name === "SequelizeValidationError") {
      book = await Book.build(req.body);
      res.render("new-book", { book, errors: error.errors, title: "New Book" })
    } else {
      throw error;
    }  
  }
}));

/* Get Book ID route */
router.get('/:id', async function(req, res){
  const data = await Book.findByPk(req.params.id);
  if(!data){
    const error = new Error("Book not found");
    error.status = 404;
    res.render('error', {error, message: error})
  } else {
    const bookData = await Book.findByPk(req.params.id);
    const book = bookData.toJSON()
    res.render('edit', { book, title: "Edit Book" });
  }
});

/* POST Book Edit Page and Validation Error Handling */
router.post('/:id', asyncHandler(async (req, res) => {
  let book;
  try {
    book = await Book.findByPk(req.params.id);
    if(book) {
      const bookId = req.params.id;
      const updatedInfo = req.body;
      await Book.update(updatedInfo, { where: { id: bookId }});
      res.redirect('/books');
    } else {
      res.sendStatus(404);
    }
  } catch (error) {
    if(error.name === "SequelizeValidationError") {
      book = await Book.build(req.body);
      book.id = req.params.id;
      
      res.render("edit", { book, errors: error.errors, title: "Edit Book" })
    } else {
      throw error;
    }
  }
}));

/* GET Delete Page */
router.get("/:id/delete", asyncHandler(async (req, res) => {
  const data = await Book.findByPk(req.params.id);
  if(data) {
    const book = data.toJSON();
    res.render('delete', { book, title: "Delete Book"})
  } else {
    res.sendStatus(404);
  }
}));

/* POST Delete Page */
router.post('/:id/delete', asyncHandler(async(req,res)=> {
  const book = await Book.findByPk(req.params.id);
  if (book) {
    await book.destroy();
    res.redirect('/books');
  } else {
    res.sendStatus(404);
  }}));

module.exports = router;