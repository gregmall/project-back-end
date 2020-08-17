require('dotenv').config();
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
    message: `in this protected route, we get the user's id like so: ${req.userId}`
  });
});
const fakeUser = {
  id: 1,
  email: 'dawg@house.net',
  hash: 'r2d2c3po',

};


app.get('/beers', async(req, res) => {
  const data = await client.query(`
    SELECT b.id, image, b.name, domestic, price, c.name AS category
        FROM beers AS b
        JOIN category AS c
        ON b.category_id=c.id
       
     `);

  res.json(data.rows);
});

app.get('/category', async(req, res) => {
  const data = await client.query(`
      SELECT * FROM category`);
    
  res.json(data.rows);

});




app.get('/beers/:id', async(req, res) =>  {
  const beerId = req.params.id;
  const data = await client.query(`
  
      SELECT b.id, image, b.name, domestic, price, c.name AS category
        FROM beers AS b
        JOIN category AS c
        ON b.category_id=c.id
        WHERE b.id=$1
  `, [beerId]);
  
  
  res.json(data.rows[0]);
});

app.delete('/beers/:id', async(req, res) => {
  const beerId = req.params.id;

  const data = await client.query('DELETE FROM beers WHERE beers.id=$1'[beerId]);

  res.json(data.rows[0]);
});

app.put('/beers/:id', async(req, res) => {
  const beerId = req.params.id;
  try {
    const updateBeer = {
      image: req.body.image,
      name: req.body.name,
      domestic: req.body.domestic,
      price: req.body.price,
      category_id: req.body.category_id

    };

    const data = await client.query(`
      UPDATE beers
        SET image=$1, name=$2, domestic=$3, price=$4, category_id=$5
        WHERE beers.id=$6
        RETURNING *
  `,  [updateBeer.image, updateBeer.name, updateBeer.domestic,
      updateBeer.price, updateBeer.category_id, beerId]);

    res.json(data.rows[0]);

  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});



app.post('/beers', async(req, res) => {
  try {
    const newBeer = {
      image: req.body.image,
      name: req.body.name,
      domestic: req.body.domestic,
      price: req.body.price,
      category_id: req.body.category_id
      
   
    };

    const data = await client.query(`INSERT INTO beers(image, name, domestic,  price, owner_id, category_id)
    VALUES($1, $2, $3, $4, $5, $6)
    RETURNING * `, [newBeer.image, newBeer.name, newBeer.domestic, newBeer.price, fakeUser.id, newBeer.category_id]);

    res.json(data.rows[0]);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});



app.use(require('./middleware/error'));

module.exports = app;
