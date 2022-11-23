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

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.gp7ekja.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    const serviceCollection = client.db("nextrep").collection("categories");

    // APIs here
}

run().catch(err => console.log(err))


app.get('/', (req, res) => {
    res.send('NextRep server is running')
})

app.listen(port, () => {
    console.log(`NextRep server is running on port: ${port}`);
})