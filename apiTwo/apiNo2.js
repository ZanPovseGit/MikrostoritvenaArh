const express = require('express');
const { MongoClient } = require('mongodb');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

const mongoURI = 'mongodb+srv://zanpovse11:vajaPodat@pts.jyeuzzi.mongodb.net/sua?retryWrites=true&w=majority';

let messagesCollection;

const initializeMongoDB = async (req, res, next) => {
  try {
    const client = await MongoClient.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB Atlas');
    const db = client.db();
    messagesCollection = db.collection('messages');
    req.messagesCollection = messagesCollection;
    next();
  } catch (err) {
    console.error('Error connecting to MongoDB:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

app.use(initializeMongoDB);
app.use(bodyParser.json());

// GET all messages
app.get('/messages', async (req, res) => {
  try {
    const messages = await messagesCollection.find().toArray();
    res.json(messages);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// GET a specific message by ID
app.get('/messages/:id', async (req, res) => {
  const messageId = parseInt(req.params.id);

  try {
    const message = await messagesCollection.findOne({ id: messageId });
    if (message) {
      res.json(message);
    } else {
      res.status(404).send('Message not found');
    }
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// POST a new message
app.post('/messages', async (req, res) => {
  const { id, message, refund } = req.body;

  try {
    const newMessage = { id, message, refund };
    const result = await messagesCollection.insertOne(newMessage);
    res.status(201).json(result.ops[0]);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// PUT (update) a message by ID
app.put('/messages/:id', async (req, res) => {
  const messageId = parseInt(req.params.id);
  const { message, refund } = req.body;

  try {
    const result = await messagesCollection.updateOne(
      { id: messageId },
      { $set: { message, refund } }
    );

    if (result.modifiedCount > 0) {
      res.json({ message: 'Message updated successfully' });
    } else {
      res.status(404).send('Message not found');
    }
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// DELETE a message by ID
app.delete('/messages/:id', async (req, res) => {
  const messageId = parseInt(req.params.id);

  try {
    const result = await messagesCollection.deleteOne({ id: messageId });

    if (result.deletedCount > 0) {
      res.json({ message: 'Message deleted successfully' });
    } else {
      res.status(404).send('Message not found');
    }
  } catch (error) {
    res.status(500).send(error.message);
  }
});

//id procesirane requesti
app.put('/messages/:id/resolve', async (req, res) => {
    const messageId = parseInt(req.params.id);
  
    try {
      const result = await messagesCollection.updateOne(
        { id: messageId },
        { $set: { message: 'odpravljena pritožba', resolved: true } }
      );
  
      if (result.modifiedCount > 0) {
        res.json({ message: 'Message marked as resolved' });
      } else {
        res.status(404).send('Message not found');
      }
    } catch (error) {
      res.status(500).send(error.message);
    }
  });
  

//gets all the refund req
app.get('/refund-requests', async (req, res) => {
    try {
      const refundRequests = await messagesCollection.find({ refund: true }).toArray();
      res.json(refundRequests);
    } catch (error) {
      res.status(500).send(error.message);
    }
});

  // HEAD endpoint for checking server availability
app.head('/health', (req, res) => {
    res.sendStatus(200);
  });
  
  


app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
