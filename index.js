const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();


const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors())
app.use(express.json())

// const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.gp7ekja.mongodb.net/?retryWrites=true&w=majority`;
const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    const categoriesCollection = client.db("nextrep").collection("categories");
    const productsCollection = client.db("nextrep").collection("products");
    const bookingsCollection = client.db("nextrep").collection("bookings");

    // to load the brands
    app.get('/categories', async(req, res)=>{
        const query = {};
        const result = await categoriesCollection.find(query).toArray();
        res.send(result);
    })

    // to load the products of brands
    app.get('/category/:id', async(req,res)=>{
        const id = parseInt(req.params.id);
        console.log(id);
        const query ={ brandId: id};
        const products = await productsCollection.find(query).toArray();
        // console.log(products);
        res.send(products);
    })

    // to post the booked products
    app.post('/bookings', async(req, res)=>{
        const booking = req.body;
            console.log(booking);
            const result = await bookingsCollection.insertOne(booking);
            res.send(result);
    })
}

run().catch(err => console.log(err))


app.get('/', (req, res) => {
    res.send('NextRep server is running')
})

app.listen(port, () => {
    console.log(`NextRep server is running on port: ${port}`);
})