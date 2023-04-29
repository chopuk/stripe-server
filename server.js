require('dotenv').config()
const express = require('express')
const cors = require('cors')
const Stripe = require('stripe')
const stripe = Stripe(process.env.STRIPE_SECRET_KEY)
const app = express()
const PORT = 3000

app.use("/stripe", express.raw({ type: "*/*" }))
app.use(express.json())
app.use(cors())

app.get('/', (req,res) => {
    res.send("Welcome to Chop's Stripe Server!")
})

app.post('/paymentintent', async (req,res) => {
    try {
		const {amount, email} = req.body

        const myMetaData = {
            email: email,
            company: 'My Amazing Company Ltd',
            mainoffice: 'London',
            Director: 'Fred Flintstone'
        }

        const metaData = JSON.stringify(myMetaData)

        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount,
            currency: 'gbp',
            payment_method_types: ['card'],
            metadata: {email}
        })
        const clientSecret = paymentIntent.client_secret
        res.json({message: 'Payment initiated', clientSecret})
    } catch (error) {
        console.error(error)
        res.status(500).json({message: 'Internal server error'})
    }
})

app.post('/stripe', async (req,res) => {
    const sig = req.headers['stripe-signature']
    let event = await stripe.webhooks.constructEvent(
        req.body, 
        sig, 
        process.env.STRIPE_WEBHOOK_SECRET
        )
    try {
        
    } catch (error) {
        console.error(error)
        res.status(400).json({message: error.message})
    }

    // Event when a payment is initiated
    if (event.type === "payment_intent.created") {
        console.log(`${event.data.object.metadata.email} initated payment!`)
    }
    // Event when a payment is succeeded
    if (event.type === "payment_intent.succeeded") {
        console.log(`${event.data.object.metadata.email} succeeded payment!`)
        // fulfilment
    }
    res.json({ ok: true })
})

app.listen(PORT, () => console.log(`Stripe Server running on port ${PORT}`))