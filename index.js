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
    const usersCollection = client.db("nextrep").collection("users");

    // to load the brands
    app.get('/categories', async (req, res) => {
        const query = {};
        const result = await categoriesCollection.find(query).toArray();
        res.send(result);
    })

    // to load the products of brands
    app.get('/category/:id', async (req, res) => {
        const id = parseInt(req.params.id);
        console.log(id);
        const query = { brandId: id };
        const products = await productsCollection.find(query).toArray();
        // console.log(products);
        res.send(products);
    })

    // to update a product with id
    app.put('/products/:id', async(req, res)=>{
        const id = req.params.id;
            const query = { _id: ObjectId(id)};
            const product = req.body;
            console.log(product);
            const option = {upsert: true};
            const updateProduct = {
                $set: {
                    status: product.status
                }
            }
            const result = await productsCollection.updateOne(query, updateProduct, option);
            res.send(result);
    })

    // to post new product
    app.post('/products', async (req, res) => {
        const product = req.body;
        console.log(product);
        const result = await productsCollection.insertOne(product);
        res.send(result);
    });

    // to get the advertised products
    app.get('/advertisedProducts', async(req, res)=>{
        const query = {advertised: true, status: 'available'};
        const products = await productsCollection.find(query).toArray();
        res.send(products);
    })

    // to load my products from seller account
    app.get('/myProducts', async(req, res)=>{
        const email = req.query.email;
        console.log(email);
        const query = {sellerEmail: email};
        const products = await productsCollection.find(query).toArray();
        res.send(products);
    })

    // to get the booked products
    app.get('/bookings', async (req, res) => {
        const email = req.query.email;
        console.log(email);
        const query = { buyerEmail: email };
        const bookings = await bookingsCollection.find(query).toArray();
        res.send(bookings);
    });

    // to post the booked products
    app.post('/bookings', async (req, res) => {
        const booking = req.body;
        const result = await bookingsCollection.insertOne(booking);
        res.send(result);
    })


    // to get the sellers
    app.get('/sellers', async (req, res) => {
        const query = { accountType: 'Seller' };
        const users = await usersCollection.find(query).toArray();
        res.send(users);
    });

    // to get the buyers
    app.get('/buyers', async (req, res) => {
        const query = { accountType: 'Buyer' };
        const users = await usersCollection.find(query).toArray();
        res.send(users);
    });

    // to post the users
    app.post('/users', async (req, res) => {
        const user = req.body;
        const result = await usersCollection.insertOne(user);
        res.send(result);
    })


    // to verify admin
    app.get('/users/accTypeCheck/:email', async (req, res) => {
        const email = req.params.email;
        const query = { email };
        const user = await usersCollection.findOne(query);
        res.send({accountType: user?.accountType});
    })

}

run().catch(err => console.log(err))


app.get('/', (req, res) => {
    res.send('NextRep server is running')
})

app.listen(port, () => {
    console.log(`NextRep server is running on port: ${port}`);
})