const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(__dirname)); // Inaruhusu kusoma index.html

// 1. Database Connection
const db = new sqlite3.Database('./shamsi.db', (err) => {
    if (err) console.error("Shida ya database:", err.message);
    else console.log("✅ Imefanikiwa kuunganishwa na Database ya SHAMSI.");
});

// 2. Kutengeneza Tables (Database Schema)
db.serialize(() => {
    // Spares Master Table
    db.run(`CREATE TABLE IF NOT EXISTS spares (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        part_number TEXT UNIQUE NOT NULL,
        oem_number TEXT,
        name TEXT NOT NULL,
        vehicle_model TEXT,
        location TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
});

// Endpoint ya kuwasilisha HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// API ya Kusajili Spea Mpya
app.post('/api/spares', (req, res) => {
    const { part_number, oem_number, name, vehicle_model, location } = req.body;
    const sql = `INSERT INTO spares (part_number, oem_number, name, vehicle_model, location) VALUES (?, ?, ?, ?, ?)`;
    
    db.run(sql, [part_number, oem_number, name, vehicle_model, location], function(err) {
        if (err) {
            return res.status(400).json({ success: false, message: err.message });
        }
        res.json({ success: true, id: this.lastID, message: "Spea imesajiliwa kikamilifu!" });
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server ya Shamsi ina-run kwenye port ${PORT}`);
});
