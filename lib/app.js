const express = require('express');
const cors = require('cors');
const client = require('./client.js');
const app = express();
const ensureAuth = require('./auth/ensure-auth');
const createAuthRoutes = require('./auth/create-auth-routes');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const authRoutes = createAuthRoutes();

// setup authentication routes to give user an auth token
// creates a /auth/signin and a /auth/signup POST route. 
// each requires a POST body with a .email and a .password
app.use('/auth', authRoutes);

// everything that starts with "/api" below here requires an auth token!
app.use('/api', ensureAuth);

// and now every request that has a token in the Authorization header will have a `req.userId` property for us to see who's talking
app.get('/api/test', (req, res) => {
  res.json({
    message: `in this proctected route, we get the user's id like so: ${req.userId}`
  });
});
const fakeUser = {
  id: 1,
  email: 'dawg@house.net',
  hash: 'r2d2c3po',

};


app.get('/beers', async(req, res) => {
  const data = await client.query('SELECT * from beers');

  res.json(data.rows);
});

app.get('/beers/:id', async(req, res) =>  {
  const beerId = req.params.id;
  const data = await client.query(`SELECT * from beers where id=${beerId}`);
  res.json(data.rows[0]);
});

app.post('/beers', async(req, res) => {
  const newBeer = {
    image: req.body.image,
    name: req.body.name,
    domestic: req.body.domestic,
    description: req.body.description,
    price: req.body.price,
  };

  const data = await client.query(`INSERT INTO beers(image, name, domestic, description, price, owner_id)
  VALUES($1, $2, $3, $4, $5)
  RETURNING * `, [newBeer.image, newBeer.name, newBeer.domestic, newBeer.description, newBeer.price, fakeUser.id]);

  res.json(data.rows[0]);
});



app.use(require('./middleware/error'));

module.exports = app;
