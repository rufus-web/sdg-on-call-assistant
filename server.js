
const express = require('express');
const { MongoClient } = require('mongodb');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

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
    console.log('✅ Connected to MongoDB');
    
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
        sponsored: 0,
        deals: 0,
        helpdesk: 0
      });
      console.log('✅ Initialized click counts');
    }
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
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

// Track page visit
app.get('/track-visit', async (req, res) => {
  try {
    // Get current date in local timezone (IST, set via TZ environment variable)
    const today = new Date().toLocaleDateString('en-CA'); // en-CA gives YYYY-MM-DD format
    const now = new Date();

    // Increment total visits
    await clicksCollection.findOneAndUpdate(
      { _id: 'visit_stats' },
      {
        $inc: { total_visits: 1 },
        $set: { last_visit: now }
      },
      { upsert: true }
    );

    // Increment daily visits
    await clicksCollection.findOneAndUpdate(
      { _id: `daily_${today}` },
      {
        $inc: { visits: 1 },
        $set: { date: today }
      },
      { upsert: true }
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to track visit' });
  }
});

// Get visit statistics
app.get('/visit-stats', async (req, res) => {
  try {
    const totalStats = await clicksCollection.findOne({ _id: 'visit_stats' });

    // Get last 30 days of daily visits
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dateString = thirtyDaysAgo.toLocaleDateString('en-CA');

    const dailyStats = await clicksCollection
      .find({
        _id: { $regex: /^daily_/ },
        date: { $gte: dateString }
      })
      .sort({ date: -1 })
      .toArray();

    res.json({
      total_visits: totalStats?.total_visits || 0,
      last_visit: totalStats?.last_visit || null,
      daily_visits: dailyStats.map(d => ({
        date: d.date,
        visits: d.visits
      }))
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// Start server after DB connection
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
});

