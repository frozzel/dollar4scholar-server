// This is your test secret API key.
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const express = require('express');
const router = express.Router();
const {isValidObjectId} = require('mongoose');
const User = require('../models/user');
const Scholarship = require('../models/scholarship');

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

router.post('/verify', express.raw({type: 'application/json'}), async (request, response) => {
    const payload = request.body;
    const sig = request.headers['stripe-signature'];
    
  
    let event;
  
    try {
      event = stripe.webhooks.constructEvent(payload, sig, endpointSecret);
      if (event.type === 'checkout.session.completed') {
        
        const {userId, client_reference_id, amount} = event.data.object.metadata;
        if (!isValidObjectId(userId)) return sendError(response, "User not found!");
        const user = await User.findOne({ _id: userId  });
        if (!user) return sendError(response, "Invalid request, record not found!");

        if (user.stripeId !== client_reference_id) return sendError(response, "Invalid request, record not found!");

        if (event.data.object.mode === 'payment') {
        const amountString = amount
        const amountNumber = parseFloat(amountString);
        const newWallet = user.wallet + amountNumber;

        user.wallet = newWallet;

        await user.save();
        } else if (event.data.object.mode === 'subscription') {
          const scholarship = await Scholarship.findOne().sort({createdAt: -1});
          if (!scholarship) return sendError(res, 'Scholarship not found!', 404)
            scholarship.studentsEntered.push(user._id);
            scholarship.pot += 1.50;
          
          await Scholarship.findByIdAndUpdate(scholarship._id, scholarship);

           user.subscriptionId = event.data.object.subscription;

           user.subscription = true;

          await user.save();
        }

        response.status(200).json({received: true}).end();
      }


      
    } catch (err) {
        console.log(err)
      return response.status(400).send(`Webhook Error: ${err.message}`);
    }
  
    response.status(200).end();
  });

  module.exports = router;