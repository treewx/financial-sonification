const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;
const AV_KEY = process.env.ALPHAVANTAGE_API_KEY || '';

const cache = {};
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function getCached(key) {
  const entry = cache[key];
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    delete cache[key];
    return null;
  }
  return entry.data;
}

function setCached(key, data) {
  cache[key] = { data, timestamp: Date.now() };
}

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/earnings/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const cacheKey = 'earnings:' + symbol;
    const cached = getCached(cacheKey);
    if (cached) {
      console.log(`Cache hit: ${cacheKey}`);
      return res.json(cached);
    }
    console.log(`Cache miss: ${cacheKey} — calling Alpha Vantage`);
    const url = `https://www.alphavantage.co/query?function=EARNINGS&symbol=${encodeURIComponent(symbol)}&apikey=${AV_KEY}`;
    const r = await fetch(url);
    const data = await r.json();
    setCached(cacheKey, data);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/overview/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const cacheKey = 'overview:' + symbol;
    const cached = getCached(cacheKey);
    if (cached) {
      console.log(`Cache hit: ${cacheKey}`);
      return res.json(cached);
    }
    console.log(`Cache miss: ${cacheKey} — calling Alpha Vantage`);
    const url = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${encodeURIComponent(symbol)}&apikey=${AV_KEY}`;
    const r = await fetch(url);
    const data = await r.json();
    setCached(cacheKey, data);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
