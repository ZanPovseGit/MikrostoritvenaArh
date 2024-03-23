const express = require('express');
const bodyParser = require('body-parser');
const { MongoClient } = require('mongodb');
const { body, validationResult } = require('express-validator');

const app = express();
const port = 3001;

const mongoURI = 'mongodb+srv://zanpovse11:vajaPodat@pts.jyeuzzi.mongodb.net/?retryWrites=true&w=majority';

let products;





const initializeMongoDB = async (req, res, next) => {
  try {
    const client = await MongoClient.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB Atlas');
    const db = client.db('sua');
    req.products = db.collection('izdelki');
    next();
  } catch (err) {
    console.error('Error connecting to MongoDB:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};


app.use(initializeMongoDB);
app.use(bodyParser.json());

// Validation middleware for POST and PUT requests
const validateProduct = [
  body('product.id').isNumeric().withMessage('ID must be a number'),
  body('product.name').notEmpty().withMessage('Name is required'),
  body('product.price').isNumeric().withMessage('Price must be a number'),
];

app.get('/api/products', async (req, res) => {
  if (!req.products) {
    return res.status(500).json({ error: 'Products collection not initialized' });
  }

  const productList = await req.products.find({}).toArray();
  res.json(productList);
});

app.get('/api/products/:id', async (req, res) => {
  const productId = req.params.id;
  const product = await req.products.findOne({ id: parseInt(productId) });
  res.json(product);
});

app.post('/api/products', async (req, res) => {
  const newProduct = req.body;
  newProduct.id = (await req.products.find().count()) + 1;
  await req.products.insertOne(newProduct);
  res.json(newProduct);
});

/*
{
    "id": 2,
    "name": "cokolada",
    "price": 2.5
}
*/

app.put('/api/products/:id', async (req, res) => {
  const productId = parseInt(req.params.id);
  const updatedProduct = req.body;
  const result = await req.products.updateOne({ id: productId }, { $set: updatedProduct });

  if (result.matchedCount === 1) {
    res.json(updatedProduct);
  } else {
    res.status(404).json({ error: 'Product not found.' });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  const productId = parseInt(req.params.id);
  const result = await req.products.deleteOne({ id: productId });

  if (result.deletedCount === 1) {
    res.json({ message: 'Product deleted successfully.' });
  } else {
    res.status(404).json({ error: 'Product not found.' });
  }
});

app.get('/api/products/:id/price', async (req, res) => {
  const productId = req.params.id;
  const product = await req.products.findOne({ id: parseInt(productId) });

  if (product) {
    res.json({ price: product.price });
  } else {
    res.status(404).json({ error: 'Product not found.' });
  }
});

app.head('/health', (req, res) => {
  res.sendStatus(200);
});

app.listen(port, () => {
  console.log(`Product service is listening at http://localhost:${port}`);
});
