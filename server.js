
const express = require('express');
const { MongoClient } = require('mongodb');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// REPLACE THIS with your MongoDB connection string from Atlas
const MONGODB_URI = 'mongodb+srv://rufusprince12345_db_user:MmpXZ5GXi1PQDvs0@cluster0.orlkesf.mongodb.net/?appName=Cluster0';
const DB_NAME = 'sdg_tracker';
const COLLECTION_NAME = 'clicks';

let db;
let clicksCollection;

// Connect to MongoDB
async function connectDB() {
  try {
    const client = await MongoClient.connect(MONGODB_URI);
    db = client.db(DB_NAME);
    clicksCollection = db.collection(COLLECTION_NAME);
    console.log('Connected to MongoDB');
    
    // Initialize click counts if they don't exist
    const existing = await clicksCollection.findOne({ _id: 'click_counts' });
    if (!existing) {
      await clicksCollection.insertOne({
        _id: 'click_counts',
        paneu: 0,
        fba: 0,
        sfp: 0,
        inventory: 0,
        transparency: 0,
        brand: 0,
        listings: 0,
        sponsored: 0
      });
    }
  } catch (error) {
    console.error('MongoDB connection error:', error);
  }
}

// Serve the SDG HTML page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index_1.html'));
});

// Get all click counts
app.get('/counts', async (req, res) => {
  try {
    const counts = await clicksCollection.findOne({ _id: 'click_counts' });
    res.json(counts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get counts' });
  }
});

// Increment a specific link's click count
app.get('/increment/:linkName', async (req, res) => {
  try {
    const linkName = req.params.linkName;
    const result = await clicksCollection.findOneAndUpdate(
      { _id: 'click_counts' },
      { $inc: { [linkName]: 1 } },
      { returnDocument: 'after' }
    );
    res.json({ success: true, counts: result });
  } catch (error) {
    res.status(500).json({ error: 'Failed to increment count' });
  }
});

// Start server after DB connection
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});

