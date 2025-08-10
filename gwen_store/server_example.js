// server_example.js
// Minimal Node/Express example (Stripe Checkout) - DO NOT RUN as-is with real keys
// Replace STRIPE_SECRET_KEY with your test secret key and install dependencies: express, stripe, cors, dotenv

/*
Example:
1. npm init -y
2. npm install express stripe cors dotenv
3. create .env file with STRIPE_SECRET_KEY=sk_test_xxx
4. node server_example.js
*/

const express = require('express');
const Stripe = require('stripe');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

app.post('/create-checkout-session', async (req, res) => {
  try {
    const { items } = req.body; // expect [{id, name, price, qty}]
    const line_items = items.map(i => ({
      price_data: {
        currency: 'usd',
        product_data: { name: i.name },
        unit_amount: Math.round(i.price * 100),
      },
      quantity: i.qty
    }));
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      success_url: 'http://localhost:3000/success.html',
      cancel_url: 'http://localhost:3000/cancel.html'
    });
    res.json({ url: session.url });
  } catch(err){
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(4242, ()=> console.log('Server listening on http://localhost:4242'));
