const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const secretKey = 'kluc'; 


const app = express();
const PORT = process.env.PORT || 3003;


const users = [
  { id: 1, username: 'user1', password: 'pass1' },
  { id: 2, username: 'user2', password: 'pass2' },
];
app.use(express.json());

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

//token aut
const authenticateToken = (req, res, next) => {
  const token = req.header('Authorization');

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized - Token not provided' });
  }

  jwt.verify(token, secretKey, (err, user) => {
    if (err) {
      return res.status(401).json({ error: 'Unauthorized - Invalid token' });
    }

    req.user = user;
    next();
  });
};

app.use('/api/products', authenticateToken);
app.use('/api/products/:id', authenticateToken);
app.use('/api/products/:id/price', authenticateToken);
app.use('/health1', authenticateToken);
app.use('/products/:userId', authenticateToken);
app.use('/api/cart', authenticateToken);
app.use('/api/cart/:userID', authenticateToken);
app.use('/api/cart/:userID/checkout', authenticateToken);
app.use('/api/cart/:userID/add_products', authenticateToken);
app.use('/messages', authenticateToken);
app.use('/messages/:id', authenticateToken);
app.use('/messages/:id/resolve', authenticateToken);
app.use('/refund-request', authenticateToken);
app.use('head3', authenticateToken);



app.post('/login', (req, res) => {
  const { username, password } = req.body;

  const user = users.find(u => u.username === username && u.password === password);

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign({ userId: user.id, username: user.username }, secretKey, { expiresIn: '1h' });

  res.json({ token });
});


// pridobi izdelke vse
app.get('/api/products', authenticateToken ,async (req, res) => {
  try {
    const response = await axios.get('http://localhost:3001/api/products');
    res.json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch data from the first service.' });
  }
});

//pridobi en izdelek
app.get('/api/products/:id',authenticateToken, async (req, res) => {
  try {
    const response = await axios.get(`http://localhost:3001/api/products/${req.params.id}`);
    res.json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch data from the first service.' });
  }
});

//dodaj izdelek { "id": 1, "name":"imeizd","price":1}
app.post('/api/products',authenticateToken , async (req, res) => {
  try {
    const response = await axios.post('http://localhost:3001/api/products', req.body);
    res.json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create a product in the first service.' });
  }
});

//spremeni izdelek { "id": 1, "name":"imeizd","price":1}
app.put('/api/products/:id',authenticateToken, async (req, res) => {
    try {
      const response = await axios.put(`http://localhost:3001/api/products/${req.params.id}`, req.body);
      res.json(response.data);
    } catch (error) {
      console.error(error);
      res.status(error.response?.status || 500).json({ error: 'Failed to update the product.' });
    }
  });
  
  // izbrisi izdelek
  app.delete('/api/products/:id',authenticateToken, async (req, res) => {
    try {
      const response = await axios.delete(`http://localhost:3001/api/products/${req.params.id}`);
      res.json(response.data);
    } catch (error) {
      console.error(error);
      res.status(error.response?.status || 500).json({ error: 'Failed to delete the product.' });
    }
  });
  
  // pridobi ceno izdelka
  app.get('/api/products/:id/price',authenticateToken, async (req, res) => {
    try {
      const response = await axios.get(`http://localhost:3001/api/products/${req.params.id}/price`);
      res.json(response.data);
    } catch (error) {
      console.error(error);
      res.status(error.response?.status || 500).json({ error: 'Failed to fetch the product price.' });
    }
  });
  
  // pridobi oceno ce dela prvi api
  app.head('/health1',authenticateToken, async (req, res) => {
    try {
      const response = await axios.head('http://localhost:3001/health');
      res.json(response.data);
    } catch (error) {
      console.error(error);
      res.status(error.response?.status || 500).json({ error: 'Failed to fetch health status.' });
    }
  });

// Second Service

//pridobi cart
app.get('/products/:userId',authenticateToken, async (req, res) => {
  try {
    const response = await axios.get(`http://127.0.0.1:3002/api/cart/${req.params.userId}`);
    res.json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch data from the second service.' });
  }
});

//dodaj kosarico {    "id":1,   "products":[1,2],   "user":2}
app.post('/api/cart',authenticateToken, async (req, res) => {
  try {
    const response = await axios.post('http://127.0.0.1:3002/api/products', req.body);
    res.json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create a product in the second service.' });
  }
});

// spremeni kosarico {    "id":1,   "products":[1,2],   "user":2}
app.put('/api/cart/:userID',authenticateToken, async (req, res) => {
    try {
      const response = await axios.put(`http://127.0.0.1:3002/api/cart/${req.params.userID}`, req.body);
      res.json(response.data);
    } catch (error) {
      console.error(error);
      res.status(error.response?.status || 500).json({ error: 'Failed to update the cart.' });
    }
  });
  
  // izbrisi kosarico po idju
  app.delete('/api/cart/:userID',authenticateToken, async (req, res) => {
    try {
      const response = await axios.delete(`http://127.0.0.1:3002/api/cart/${req.params.userID}`);
      res.json(response.data);
    } catch (error) {
      console.error(error);
      res.status(error.response?.status || 500).json({ error: 'Failed to delete the cart.' });
    }
  });
  
  // kupi vse v kosarici z user idejem
  app.post('/api/cart/:userID/checkout',authenticateToken, async (req, res) => {
    try {
      const response = await axios.post(`http://127.0.0.1:3002/api/cart/${req.params.userID}/checkout`);
      res.json(response.data);
    } catch (error) {
      console.error(error);
      res.status(error.response?.status || 500).json({ error: 'Failed to checkout the cart.' });
    }
  });
  
  //spremeni kosarica iteme [1,1]
  app.put('/api/cart/:userID/add_products',authenticateToken, async (req, res) => {
    try {
      const response = await axios.put(`http://127.0.0.1:3002/api/cart/${req.params.userID}/add_products`, req.body);
      res.json(response.data);
    } catch (error) {
      console.error(error);
      res.status(error.response?.status || 500).json({ error: 'Failed to add products to the cart.' });
    }
  });

// Third Service

//pridobi vsa sporocila
app.get('/messages',authenticateToken, async (req, res) => {
  try {
    const response = await axios.get('http://localhost:3000/messages');
    res.json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch data from the third service.' });
  }
});

//pridobi samo eno sporocilo z id
app.get('/messages/:id',authenticateToken, async (req, res) => {
  try {
    const response = await axios.get(`http://localhost:3000/messages/${req.params.id}`);
    res.json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch data from the third service.' });
  }
});

//dodaj sporocilo { "id":2, "message":"nekaj", "refund":true}
app.post('/messages',authenticateToken, async (req, res) => {
  try {
    const response = await axios.post('http://localhost:3000/messages', req.body);
    res.json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create a message in the third service.' });
  }
});

// spremeni sporocilo z idejem { "id":2, "message":"nekaj", "refund":true}
app.put('/messages/:id',authenticateToken, async (req, res) => {
    try {
      const response = await axios.put(`http://localhost:3000/messages/${req.params.id}`, req.body);
      res.json(response.data);
    } catch (error) {
      console.error(error);
      res.status(error.response?.status || 500).json({ error: 'Failed to update the message.' });
    }
  });
  
  // zbrisi sporocilo z idejem
  app.delete('/messages/:id',authenticateToken, async (req, res) => {
    try {
      const response = await axios.delete(`http://localhost:3000/messages/${req.params.id}`);
      res.json(response.data);
    } catch (error) {
      console.error(error);
      res.status(error.response?.status || 500).json({ error: 'Failed to delete the message.' });
    }
  });
  
  // spremeni sporocilo v staticno urejeno z idejem
  app.put('/messages/:id/resolve',authenticateToken, async (req, res) => {
    try {
      const response = await axios.put(`http://localhost:3000/messages/${req.params.id}/resolve`);
      res.json(response.data);
    } catch (error) {
      console.error(error);
      res.status(error.response?.status || 500).json({ error: 'Failed to resolve the message.' });
    }
  });
  
  // pokaze vsa sporocila z refund true zastavico
  app.get('/refund-request',authenticateToken, async (req, res) => {
    try {
      const response = await axios.get('http://localhost:3000/refund-requests');
      res.json(response.data);
    } catch (error) {
      console.error(error);
      res.status(error.response?.status || 500).json({ error: 'Failed to fetch refund requests.' });
    }
  });
  
  // pove ce storitev obvratuje
  app.head('/health3',authenticateToken, async (req, res) => {
    try {
      await axios.head('http://localhost:3000/health');
      res.status(200).send();
    } catch (error) {
      console.error(error);
      res.status(error.response?.status || 500).json({ error: 'Health check failed.' });
    }
  });

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
