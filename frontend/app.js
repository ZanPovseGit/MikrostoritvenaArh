const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const app = express();
const port = 3333;

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({ secret: 'your-secret-key', resave: true, saveUninitialized: true }));

app.set('view engine', 'ejs');

let savedToken = null;

// Middleware to check if the user is logged in
const requireLogin = (req, res, next) => {
  if (!req.session.userId) {
    res.redirect('/login');
  } else {
    next();
  }
};

app.get('/', requireLogin, async (req, res) => {
  try {
    console.log("eat ass");

    // Fetch products from the first service API
    const response = await axios.get('http://localhost:11224/api/products', {
      headers: {
        Authorization: `${savedToken}`,
      },
    });

    const items = response.data;
    console.log(items);
    console.log(req.session.username);

    // Call the /createBasket API
    let createBasketResponse;  // Pravilna definicija spremenljivke
    try {
      createBasketResponse = await axios.post('http://localhost:11227/integration/createBasket', { uporabniskoIme: req.session.username }, {
        headers: {
          Authorization: savedToken,
        },
      });

      console.log('createBasketResponse:', createBasketResponse.data);
    } catch (createBasketError) {
      console.error('Error creating basket:', createBasketError.message);
      // Lahko dodate tudi nadaljnjo obdelavo napake za ustrezno rokovanje
    }

    res.render('index', { items, userId: req.session.userId, username: req.session.username });
  } catch (error) {
    console.error('Error fetching items:', error.message);
    res.status(500).send('Internal Server Error');
  }
});




app.post('/createBasket', requireLogin, async (req, res) => {
  const uporabniskoIme = req.body.uporabniskoIme;

  try {
    await axios.post('http://localhost:11227/integration/createBasket', { uporabniskoIme }, {
      headers: {
        Authorization: `${savedToken}`,
      },
    });

    console.log('Basket creation request sent successfully.');
    res.status(200).json({ message: 'Basket creation request sent successfully.' });
  } catch (error) {
    console.error('Error creating basket:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



app.post('/addItem', requireLogin, async (req, res) => {
  const newItem = {
    id: parseInt(req.body.itemId),
    name: req.body.itemName,
    price: parseFloat(req.body.itemPrice),
    urlSlike: req.body.itemImageUrl,
  };

  try {
    // Add item using the first service API
    await axios.post(`$http://localhost:11224/api/products`, newItem, {
      headers: {
        Authorization: `${savedToken}`,
      },
    });

    res.redirect('/');
  } catch (error) {
    console.error('Error adding item:', error.message);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/login', (req, res) => {
  res.render('login');
});



app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const response = await axios.post('http://localhost:11227/integration/userLogin', { username, password });
    savedToken = response.data.token;
    console.log(savedToken);
    req.session.userId = savedToken;
    req.session.username = username;


    req.session.save(() => {
      res.redirect('/');
    });
  } catch (error) {
    console.error('Error authenticating user:', error.message);
    res.redirect('/login');
  }
});


// Metoda za registracijo - prikaz obrazca
app.get('/registracija', (req, res) => {
  const successMessage = req.query.successMessage; // Pridobi sporočilo iz URL-ja

  res.render('registracija', { successMessage });
});

// Metoda za registracijo - obdelava obrazca
app.post('/registracija', async (req, res) => {
  try {
    // Klic metode za ustvarjanje uporabnika
    const newUser = await axios.post('http://localhost:11227/integration/createUser', req.body);

    // Če je ustvarjanje uporabnika uspešno, prikaži podatke o novem uporabniku
    res.redirect('/login?successMessage=Uspešna registracija'); // Preusmeri na stran za prijavo s sporočilom
  } catch (error) {
    console.error('Error creating user account:', error);
    res.status(500).json({ error: 'Error creating user account' });
  }
});

app.get('/podrobnosti_izdelka/:id', async (req, res) => {
  try {
    const itemId = req.params.id;

    // Kličite API in pridobite podatke
    const productDetailsResponse = await axios.get(`http://localhost:11227/integration/getProduct/${itemId}`, {
      headers: {
        Authorization: `${savedToken}`,
      },
    });

    const podrobnostiIzdelka = productDetailsResponse.data;

    // Prenesite podatke v view
    res.render('podrobnosti_izdelka', { podrobnostiIzdelka });
  } catch (error) {
    console.error('Napaka pri pridobivanju podrobnosti izdelka:', error.response ? error.response.data : error.message);
    res.status(500).send('Napaka pri pridobivanju podrobnosti izdelka.');
  }
});



// Dodajte novo pot za dodajanje izdelka v košarico
app.get('/dodajVkrosarico', async (req, res) => {
  try {
    const itemId = req.query.itemId;
    const naslov = req.query.naslov;
    const opis = req.query.opis;
    const proizvajalec = req.query.proizvajalec;
    const teza = req.query.teza;
    const barva = req.query.barva;

    const uporabniskoIme = req.session.username;

    // Pripravite podatke za klic drugega API-ja
    const izdelek = {
      naslov: naslov,
      opis: opis,
      proizvajalec: proizvajalec,
      teza: parseFloat(teza),
      barva: barva,
      slikaUrl: req.query.slikaUrl || 'https://via.placeholder.com/150', // Uporabi podano sliko ali rezervno sliko
    };

    // Klicanje /addProductToBasket API
    const addProductToBasketResponse = await axios.post(
      'http://localhost:11227/integration/addProductToBasket',
      {
        uporabniskoIme,
        izdelek,
      },
      {
        headers: {
          Authorization: `${savedToken}`, // Dodajte avtentikacijske glave
        },
      }
    );

    if (addProductToBasketResponse.status === 200) {
      
      res.redirect('/');
      
      
    } else {
      console.error('Napaka pri dodajanju izdelka v košarico:', addProductToBasketResponse.statusText);
      res.status(500).json({ error: 'Napaka pri dodajanju izdelka v košarico' });
    }
  } catch (error) {
    console.error('Napaka pri obdelavi zahtevka:', error.message);
    res.status(500).json({ error: 'Napaka pri obdelavi zahtevka' });
  }
});


app.get('/mojaKosarica', async (req, res) => {
  try {
    const uporabniskoIme = req.session.username;
    

    // Klicanje metode za pridobitev košarice
    const kosaricaResponse = await axios.get(`http://localhost:11227/integration/getBasket/${uporabniskoIme}`, {
      headers: {
        Authorization: `${savedToken}`, // Dodajte avtentikacijske glave
      },
    });

    // Pridobite podatke iz odgovora
    const kosaricaData = kosaricaResponse.data;

    // Tukaj lahko uporabite kosaricaData za prikaz na strani mojaKosarica
    res.render('mojaKosarica', { kosaricaData });
  } catch (error) {
    console.error('Error getting basket:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Error getting basket' });
  }
});




app.get('/odstraniIzkrosarice', async (req, res) => {
  try {
    const izdelekId = req.query.itemId;
    const uIme = req.session.username;

    // Klicanje drugega API-ja za brisanje izdelka iz košarice
    const deleteProductResponse = await axios.post('http://localhost:11227/integratration/izbrisiIzdelekIzKosarice', {
      uporabniskoIme: uIme,
      izdelekId: izdelekId,
    }, {
      headers: {
        Authorization: `${savedToken}`, // Dodajte avtentikacijske glave
      },
    });

    // Preverjanje odgovora in po potrebi obdelava rezultata
    if (deleteProductResponse.status === 200) {
      // Redirect na '/mojaKosarica' ob uspehu
      res.redirect('/mojaKosarica');
    } else {
      console.error('Napaka pri brisanju izdelka iz košarice:', deleteProductResponse.statusText);
      res.status(500).json({ error: 'Napaka pri brisanju izdelka iz košarice' });
    }
  } catch (error) {
    console.error('Napaka pri odstranjevanju izdelka iz košarice:', error.message);
    res.status(500).json({ error: 'Napaka pri odstranjevanju izdelka iz košarice' });
  }
});



app.get('/kupiIzKosarice', requireLogin, async (req, res) => {
  try {
      const idUporabnika = req.session.username;

      // Step: Create order from cart
      const response = await axios.post(`http://localhost:11227/integration/createOrderFromCart/${idUporabnika}`, null, {
          headers: {
              Authorization: `${savedToken}`,
          },
      });

      
          

          res.redirect('/mojaKosarica'); // Redirect to the shopping cart page or another appropriate page
       
      }
  catch (error) {
      console.error('Error handling buy action:', error.message);
      res.status(500).json({ error: 'Error handling buy action' });
  }
});





app.get('/pridobiNarocila', async (req, res) => {
  try {
      // Step 1: Check if userId is not undefined or null
      const idd = req.session.username;

      // Step 3: Add console logs for debugging
      console.log('User ID:', idd);
      console.log('Saved Token:', savedToken);

      // Step 4: Make the API request
      const ordersResponse = await axios.get(`http://localhost:11227/integration/getOrder/${idd}`, {
          headers: {
              Authorization: savedToken ? `${savedToken}` : '',
          },
      });

      console.log('Orders Response:', ordersResponse.data);

      // Step 5: Render the view with orders
      const orders = ordersResponse.data;
      res.render('mojaNarocila', { orders });
  } catch (error) {
      console.error('Error getting orders by user ID:', error);
      res.status(500).json({ error: 'Error getting orders by user ID' });
  }
});



app.get('/messages', requireLogin, async (req, res) => {
  try {
    // Fetch messages for the logged-in user (replace this with your actual API call)
    const messagesResponse = await axios.get('http://localhost:11224/messages', {
      headers: {
        Authorization: `${savedToken}`,
      },
    });

    const messages = messagesResponse.data;
    res.render('messages', { messages });
  } catch (error) {
    console.error('Error fetching messages:', error.message);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/deleteMessage/:id', requireLogin, async (req, res) => {
  const messageId = req.params.id;

  try {
    await axios.delete(`http://localhost:11224/messages/${messageId}`, {
      headers: {
        Authorization: `${savedToken}`,
      },
    });

    res.redirect('/messages');
  } catch (error) {
    console.error('Error deleting message:', error.message);
    res.status(500).send('Internal Server Error');
  }
});






app.get('/odstraniNarocilo', async (req, res) => {
  // Pridobivanje parametra orderId iz zahteve
  const orderId = req.query.orderId;

  try {
    const result = await axios.delete(`http://localhost:11227/integration/deleteOrder/${orderId}`, {
      headers: {
        Authorization: savedToken ? `${savedToken}` : '',
      },
    });

    // Preusmeritev na drugo stran po uspešnem brisanju
    res.redirect('/pridobiNarocila');
    
  } catch (error) {
    console.error('Napaka pri brisanju naročila:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Napaka pri brisanju naročila' });
  }
});

app.get('/statistika', async (req, res) => {
  try {
    
    const response = await axios.get('https://statistikaapi-36asd5wmjq-ey.a.run.app/steviloKlicev');

    const moj = await axios.get('https://logapizan-36asd5wmjq-ey.a.run.app/calls-count');

    
    const statistikaData = response.data;
    const statistikaDataMess = moj.data;

    
    res.render('statistika', { statistikaData,statistikaDataMess });
  } catch (error) {
    console.error('Napaka pri pridobivanju statistike:', error);
    res.status(500).send('Napaka pri pridobivanju statistike.');
  }
});








app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
