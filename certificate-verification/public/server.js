import express from "express";
import fetch from "node-fetch";

const app = express();
const PORT = 3000;

// Secret URL & API key (only in backend)
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxAV25ask9JlFGBkY2YiqmQGLZHVFyPXwll-phC-1DFR5Waq9oy42WhoBY0AQjJqROG/exec";
const API_KEY = "MY_SECRET_KEY"; // must match what you set in Apps Script

// Middleware: allow both JSON and form submissions
app.use(cors()); // allow all origins for testing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Verify route (GET)
app.get("/verify", async (req, res) => {
  const certNo = req.query.certificateNo;
  if (!certNo) {
    return res.status(400).json({ error: "certificateNo is required" });
  }

  try {
    const response = await fetch(
      `${SCRIPT_URL}?key=${API_KEY}&action=verify&certificateNo=${encodeURIComponent(certNo)}`
    );
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("Error verifying:", err);
    res.status(500).json({ error: "Verification failed" });
  }
});


// ✅ Save route (POST)
// app.post("/save", express.json(), async (req, res) => {
//   try {
//     const response = await fetch(`${SCRIPT_URL}?key=${API_KEY}`, {
//       method: "POST",
//       body: new URLSearchParams(req.body), // convert JSON to URL-encoded for Apps Script
//     });
//     const text = await response.text();
//     res.send(text);
//   } catch (err) {
//     res.status(500).send("Error saving data");
//   }
// });

app.post("/save", async (req, res) => {
  try {
    const response = await fetch(`${SCRIPT_URL}?key=${API_KEY}`, {
      method: "POST",
      body: new URLSearchParams(req.body), // convert JSON to URL-encoded
    });
    const text = await response.text();
    res.send(text);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error saving data");
  }
});

// GET route: fetch data from Google Sheets
app.get("/fetch", async (req, res) => {
  try {
    const response = await fetch(`${SCRIPT_URL}?key=${API_KEY}`);
    const data = await response.json(); // expect Apps Script to return JSON
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching data");
  }
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`✅ Proxy running at http://localhost:${PORT}`);
});
