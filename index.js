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

function verifyJWT(req, res, next){
    const authHeader = req.headers.authorization;
    if(!authHeader){
        return res.status(401).send({message:'unauthorized access'});
    }
    const token = authHeader.split(' ')[1];
    console.log(token);
    jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded)=>{
        if(err){
            return res.status(403).send({message: 'forbidden access'})
        }
        req.decoded = decoded;
        next();
    })
}

async function run() {
    const categoriesCollection = client.db("nextrep").collection("categories");
    const productsCollection = client.db("nextrep").collection("products");
    const bookingsCollection = client.db("nextrep").collection("bookings");
    const usersCollection = client.db("nextrep").collection("users");
    const reportedItemsCollection = client.db("nextrep").collection("reportedItems");

    app.get('/jwt', async (req, res) => {
        const email = req.query.email;
        console.log(email);
        const query = { email: email };
        const user = await usersCollection.findOne(query);
        if (user) {
            const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '24h' })
            return res.send({ accessToken: token });
        }
        res.status(403).send({ accessToken: '' })
    });

    // to load the brands
    app.get('/categories', async (req, res) => {
        const query = {};
        const result = await categoriesCollection.find(query).toArray();
        res.send(result);
    })

    // to load the available products of brands
    app.get('/category/:id', async (req, res) => {
        const id = parseInt(req.params.id);
        const query = { brandId: id, status: 'Available'};
        const products = await productsCollection.find(query).toArray();
        res.send(products);
    })

    // to post new product
    app.post('/products', async (req, res) => {
        const product = req.body;
        const result = await productsCollection.insertOne(product);
        res.send(result);
    });

    // to update a product with id
    app.put('/products/:id', async (req, res) => {
        const id = req.params.id;
        const query = { _id: ObjectId(id) };
        const product = req.body;
        const option = { upsert: true };
        let updateProduct = {};
        if (product.status) {
            updateProduct = {
                $set: {
                    status: product.status
                }
            }
        }
        if (product.advertised) {
            updateProduct = {
                $set: {
                    advertised: product.advertised
                }
            }
        }
        const result = await productsCollection.updateOne(query, updateProduct, option);
        res.send(result);
    })

    // to update products with email
    // when user got verified, to update the products under that email
    app.put('/products/sellerVerification/:email', async (req, res) => {
        const email = req.params.email;
        const query = { sellerEmail: email };
        const sellerVerification = req.body;
        const option = { upsert: true };
        const updateProducts = {
            $set: {
                sellerVerified: sellerVerification.verified
            }
        };
        const result = await productsCollection.updateMany(query, updateProducts, option);
        res.send(result);
    })

    // to delete a product
    app.delete('/products/:id', async (req, res) => {
        const id = req.params.id;
        console.log(id);
        const query = { _id: ObjectId(id) };
        const result = await productsCollection.deleteOne(query);
        res.send(result);
    })

    // to get the advertised products
    app.get('/advertisedProducts', async (req, res) => {
        const query = { advertised: true, status: 'Available' };
        const products = await productsCollection.find(query).toArray();
        res.send(products);
    })

    // to load my products from seller account
    app.get('/myProducts', verifyJWT, async (req, res) => {
        const email = req.query.email;
        const query = { sellerEmail: email };
        const products = await productsCollection.find(query).toArray();
        res.send(products);
    })

    // to get the booked products by buyers
    app.get('/bookings', verifyJWT, async (req, res) => {
        const email = req.query.email;
        const decodedEmail = req.decoded.email;
        console.log(decodedEmail);
        if(email !== decodedEmail){
            return res.status(403).send({message: "forbidden access"})
        }
        const query = { buyerEmail: email };
        const bookings = await bookingsCollection.find(query).toArray();
        res.send(bookings);
    });

    // to post the booked products
    app.post('/bookings', async (req, res) => {
        const booking = req.body;
        const email = req.query.email;
        const id = req.query.productId;
        const bookingQuery = {buyerEmail: email, productId: id};

        const bookedAlready = await bookingsCollection.findOne(bookingQuery);
        if(bookedAlready){
            return res.send({message: "You've booked this item already"})
        }
        const result = await bookingsCollection.insertOne(booking);
        res.send(result);
    })

    // to load the reported items
    app.get('/reportedItems', verifyJWT, async(req, res)=>{
        const query = {};
        const items = await reportedItemsCollection.find().toArray();
        res.send(items);
    })

    // to post the reported items
    app.post('/reportedItems', async (req, res) => {
        const report = req.body;
        const email = req.query.email;
        const id = req.query.productId;
        const reportingQuery = {buyerEmail: email, productId: id};

        const reportedAlready = await reportedItemsCollection.findOne(reportingQuery);
        if(reportedAlready){
            return res.send({message: "You've reported this item already"})
        }
        const result = await reportedItemsCollection.insertOne(report);
        res.send(result);
    })

    // to delete the from reported items and productsCollection
    app.delete('/reportedItems/:id', async(req, res)=>{
        const id = req.params.id;
        console.log(id);
        const query = { productId: id};
        const result = await reportedItemsCollection.deleteOne(query);
        console.log(result);
        res.send(result);
    })


    // to get the sellers
    app.get('/sellers', verifyJWT, async (req, res) => {
        const query = { accountType: 'Seller' };
        const users = await usersCollection.find(query).toArray();
        res.send(users);
    });

    // to get the buyers
    app.get('/buyers', verifyJWT, async (req, res) => {
        const query = { accountType: 'Buyer' };
        const users = await usersCollection.find(query).toArray();
        res.send(users);
    });

    // to post the users
    app.post('/users', async (req, res) => {
        const user = req.body;
        const query = {email: user.email};
        const oldUser = await usersCollection.findOne(query);
        if(!oldUser){
            const result = await usersCollection.insertOne(user);
            return res.send(result);
        }
        return res.send({message: "You're an old user"});
    })

    // to update verified status of users
    app.put('/users/:email', async (req, res) => {
        const email = req.params.email;
        const query = { email: email };
        const verification = req.body;
        const option = { upsert: true };
        const updateUser = {
            $set: {
                verified: verification.verified
            }
        };
        const result = await usersCollection.updateOne(query, updateUser, option);
        res.send(result);
    })


    // to verify admin
    app.get('/users/accTypeCheck/:email', async (req, res) => {
        const email = req.params.email;
        const query = { email };
        const user = await usersCollection.findOne(query);
        res.send({ accountType: user?.accountType });
    })

}

run().catch(err => console.log(err))


app.get('/', (req, res) => {
    res.send('NextRep server is running')
})

app.listen(port, () => {
    console.log(`NextRep server is running on port: ${port}`);
})