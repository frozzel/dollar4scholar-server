const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { sendError} = require('../utils/helper');


const YOUR_DOMAIN = 'http://localhost:5173';

// Calculate the total amount charged
function calculateTotalAmount(transactionAmount) {
      // Calculate the Stripe fee
  const stripeFee = (transactionAmount + 0.3) / (1 - 0.029) - transactionAmount;
  // Calculate the total amount charged
  const totalAmountCharged = transactionAmount + stripeFee;  
  return Number(totalAmountCharged.toFixed(2)); // Round to 2 decimal places
}

//create stripe session
exports.createSession = async (req, res) => {
    const transactionAmount = req.body.transactionAmount; // Assuming you're sending this in the request body

    try {
        const totalAmountCharged = calculateTotalAmount(transactionAmount);

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            ui_mode: 'embedded',
            line_items: [{
                price_data: {
                  currency: 'usd',
                  product_data: {
                    name: 'Wallet Funds',
                    description: 'Credit Card Transaction Fees are added into your Total', // Add description here
                    images: ['https://www.trusselltrust.org/wp-content/uploads/sites/2/2020/11/tfc-wallet-icon@2x-300x300.png'], // Add image URL here

                  },
                  unit_amount: totalAmountCharged * 100, // Convert to cents
                },
                quantity: 1,
              }],
              metadata: {'userId': req.body.userId, 'client_reference_id': req.body.client_reference_id, 'amount': req.body.amount},
              customer_email: req.body.email, // Prepopulated email
              client_reference_id: req.body.client_reference_id, // This is for your internal reference
            mode: 'payment',
            return_url: `${YOUR_DOMAIN}/return?session_id={CHECKOUT_SESSION_ID}`,
        });
        if(!session) return res.status(404).send('No session found');
        res.send({clientSecret: session.client_secret});
    } catch (error) {
        res.status(400).json({ message: 'Error creating session', error });
    }
};

//get session status
exports.getSessionStatus = async (req, res) => {
    try {
        const session = await stripe.checkout.sessions.retrieve(req.query.session_id);
        if(!session) return res.status(404).send('No session found');
        
        res.send({
            status: session.status,
            customer_email: session.customer_details.email,
            session
        });
    } catch (error) {
        res.status(400).json({ message: 'Error getting session status', error });
    }
};