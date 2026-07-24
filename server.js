const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(__dirname));

// 1. Kutengeneza na Kuunganisha Database ya Shamsi
const db = new sqlite3.Database('./shamsi.db', (err) => {
    if (err) console.error("Error opening database:", err.message);
    else console.log("✅ Database ya SHAMSI imefunguka kikamilifu.");
});

// 2. Kutengeneza Tables Zote za Mfumo
db.serialize(() => {
    // Spares Table
    db.run(`CREATE TABLE IF NOT EXISTS spares (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        part_number TEXT UNIQUE NOT NULL,
        oem_number TEXT,
        name TEXT NOT NULL,
        vehicle_model TEXT,
        unit TEXT,
        min_stock INTEGER DEFAULT 0,
        buying_price REAL DEFAULT 0,
        location TEXT
    )`);

    // Vehicles Table
    db.run(`CREATE TABLE IF NOT EXISTS vehicles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        plate_number TEXT UNIQUE NOT NULL,
        model TEXT NOT NULL,
        chassis_number TEXT,
        engine_number TEXT,
        department TEXT
    )`);

    // Suppliers Table
    db.run(`CREATE TABLE IF NOT EXISTS suppliers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        company_name TEXT NOT NULL,
        contact_person TEXT,
        phone TEXT,
        email TEXT,
        tin TEXT
    )`);

    // Sub-Contractors Table
    db.run(`CREATE TABLE IF NOT EXISTS subcontractors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        service_type TEXT,
        phone TEXT,
        location TEXT
    )`);
});

// Homepage Endpoint
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// API 1: Kusajili Spea
app.post('/api/spares', (req, res) => {
    const { part_number, oem_number, name, vehicle_model, unit, min_stock, buying_price, location } = req.body;
    const sql = `INSERT INTO spares (part_number, oem_number, name, vehicle_model, unit, min_stock, buying_price, location) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    db.run(sql, [part_number, oem_number, name, vehicle_model, unit, min_stock, buying_price, location], function(err) {
        if (err) return res.status(400).json({ success: false, message: "Part Number hii tayari ipo!" });
        res.json({ success: true, message: "Spea imesajiliwa kikamilifu!" });
    });
});

// API 2: Kusajili Gari
app.post('/api/vehicles', (req, res) => {
    const { plate_number, model, chassis_number, engine_number, department } = req.body;
    const sql = `INSERT INTO vehicles (plate_number, model, chassis_number, engine_number, department) VALUES (?, ?, ?, ?, ?)`;
    db.run(sql, [plate_number, model, chassis_number, engine_number, department], function(err) {
        if (err) return res.status(400).json({ success: false, message: "Plate Number hii tayari ipo!" });
        res.json({ success: true, message: "Gari limesajiliwa kikamilifu!" });
    });
});

// API 3: Kusajili Msambazaji
app.post('/api/suppliers', (req, res) => {
    const { company_name, contact_person, phone, email, tin } = req.body;
    const sql = `INSERT INTO suppliers (company_name, contact_person, phone, email, tin) VALUES (?, ?, ?, ?, ?)`;
    db.run(sql, [company_name, contact_person, phone, email, tin], function(err) {
        if (err) return res.status(400).json({ success: false, message: err.message });
        res.json({ success: true, message: "Msambazaji imesajiliwa kikamilifu!" });
    });
});

// API 4: Kusajili Sub-Contractor
app.post('/api/subcontractors', (req, res) => {
    const { name, service_type, phone, location } = req.body;
    const sql = `INSERT INTO subcontractors (name, service_type, phone, location) VALUES (?, ?, ?, ?)`;
    db.run(sql, [name, service_type, phone, location], function(err) {
        if (err) return res.status(400).json({ success: false, message: err.message });
        res.json({ success: true, message: "Sub-Contractor imesajiliwa kikamilifu!" });
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server ya Shamsi ina-run kwenye port ${PORT}`);
});
