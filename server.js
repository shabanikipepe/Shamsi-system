const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(__dirname));

// Database Setup
const db = new sqlite3.Database('./shamsi.db', (err) => {
    if (err) console.error("Database error:", err.message);
    else console.log("✅ Database ya Stoo Kuu ya SHAMSI imefunguka.");
});

// Database Schema - Internal Depot & Subcontractor Focus
db.serialize(() => {
    // 1. Master Spares Catalog
    db.run(`CREATE TABLE IF NOT EXISTS spares (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        part_number TEXT UNIQUE NOT NULL,
        oem_number TEXT,
        name TEXT NOT NULL,
        vehicle_model TEXT,
        unit TEXT,
        min_stock INTEGER DEFAULT 0,
        current_stock INTEGER DEFAULT 0,
        location TEXT
    )`);

    // 2. Vehicles List
    db.run(`CREATE TABLE IF NOT EXISTS vehicles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        plate_number TEXT UNIQUE NOT NULL,
        model TEXT NOT NULL,
        chassis_number TEXT,
        engine_number TEXT,
        department TEXT
    )`);

    // 3. Suppliers List
    db.run(`CREATE TABLE IF NOT EXISTS suppliers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        company_name TEXT NOT NULL,
        contact_person TEXT,
        phone TEXT
    )`);

    // 4. Sub-Contractors List
    db.run(`CREATE TABLE IF NOT EXISTS subcontractors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        service_type TEXT,
        phone TEXT
    )`);

    // 5. Store Transactions (Receive & Issue)
    db.run(`CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        trans_type TEXT NOT NULL,
        part_number TEXT NOT NULL,
        qty INTEGER NOT NULL,
        plate_number TEXT,
        job_card TEXT,
        issued_to_mechanic TEXT,
        supplier_id TEXT,
        date DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // 6. Sub-Contractor Jobs (Kazi za Nje)
    db.run(`CREATE TABLE IF NOT EXISTS subcontractor_jobs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        subcontractor_name TEXT NOT NULL,
        plate_number TEXT NOT NULL,
        item_description TEXT NOT NULL,
        issue_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        return_date TEXT,
        status TEXT DEFAULT 'PENDING',
        repair_cost REAL DEFAULT 0,
        notes TEXT
    )`);
});

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

// --- MASTER DATA APIS ---
app.post('/api/spares', (req, res) => {
    const { part_number, oem_number, name, vehicle_model, unit, min_stock, location } = req.body;
    const sql = `INSERT INTO spares (part_number, oem_number, name, vehicle_model, unit, min_stock, current_stock, location) VALUES (?, ?, ?, ?, ?, ?, 0, ?)`;
    db.run(sql, [part_number, oem_number, name, vehicle_model, unit, min_stock, location], function(err) {
        if (err) return res.status(400).json({ success: false, message: "Part Number hii ipo tayari!" });
        res.json({ success: true, message: "Spea imesajiliwa kwenye Katalogi!" });
    });
});

app.post('/api/vehicles', (req, res) => {
    const { plate_number, model, chassis_number, engine_number, department } = req.body;
    db.run(`INSERT INTO vehicles (plate_number, model, chassis_number, engine_number, department) VALUES (?, ?, ?, ?, ?)`, 
    [plate_number, model, chassis_number, engine_number, department], function(err) {
        if (err) return res.status(400).json({ success: false, message: "Namba ya lori ipo tayari!" });
        res.json({ success: true, message: "Lori limesajiliwa kikamilifu!" });
    });
});

app.post('/api/suppliers', (req, res) => {
    const { company_name, contact_person, phone } = req.body;
    db.run(`INSERT INTO suppliers (company_name, contact_person, phone) VALUES (?, ?, ?)`, [company_name, contact_person, phone], function(err) {
        if (err) return res.status(400).json({ success: false, message: err.message });
        res.json({ success: true, message: "Msambazaji imesajiliwa!" });
    });
});

app.post('/api/subcontractors', (req, res) => {
    const { name, service_type, phone } = req.body;
    db.run(`INSERT INTO subcontractors (name, service_type, phone) VALUES (?, ?, ?)`, [name, service_type, phone], function(err) {
        if (err) return res.status(400).json({ success: false, message: err.message });
        res.json({ success: true, message: "Sub-contractor imesajiliwa!" });
    });
});

// --- TRANSACTIONS APIS ---
app.post('/api/transactions/receive', (req, res) => {
    const { part_number, qty, supplier_id } = req.body;
    const quantity = parseInt(qty);
    db.run(`INSERT INTO transactions (trans_type, part_number, qty, supplier_id) VALUES ('RECEIVE', ?, ?, ?)`,
    [part_number, quantity, supplier_id], function(err) {
        if (err) return res.status(400).json({ success: false, message: err.message });
        db.run(`UPDATE spares SET current_stock = current_stock + ? WHERE part_number = ?`, [quantity, part_number]);
        res.json({ success: true, message: `Zimepokelewa Spea ${quantity} Stoo Kuu!` });
    });
});

app.post('/api/transactions/issue', (req, res) => {
    const { part_number, qty, plate_number, job_card, mechanic } = req.body;
    const quantity = parseInt(qty);
    db.get(`SELECT current_stock FROM spares WHERE part_number = ?`, [part_number], (err, row) => {
        if (!row || row.current_stock < quantity) {
            return res.status(400).json({ success: false, message: "Stock haitoshi stoo!" });
        }
        db.run(`INSERT INTO transactions (trans_type, part_number, qty, plate_number, job_card, issued_to_mechanic) VALUES ('ISSUE', ?, ?, ?, ?, ?)`,
        [part_number, quantity, plate_number, job_card, mechanic], function(err) {
            if (err) return res.status(400).json({ success: false, message: err.message });
            db.run(`UPDATE spares SET current_stock = current_stock - ? WHERE part_number = ?`, [quantity, part_number]);
            res.json({ success: true, message: `Spea imetolewa na kusajiliwa kwenda Lori ${plate_number}!` });
        });
    });
});

// --- SUB-CONTRACTOR JOBS APIS ---
app.post('/api/subcontractor-jobs', (req, res) => {
    const { subcontractor_name, plate_number, item_description, repair_cost, notes } = req.body;
    db.run(`INSERT INTO subcontractor_jobs (subcontractor_name, plate_number, item_description, repair_cost, notes) VALUES (?, ?, ?, ?, ?)`,
    [subcontractor_name, plate_number, item_description, repair_cost || 0, notes], function(err) {
        if (err) return res.status(400).json({ success: false, message: err.message });
        res.json({ success: true, message: "Kazi ya fundi wa nje imesajiliwa!" });
    });
});

app.post('/api/subcontractor-jobs/return', (req, res) => {
    const { job_id, repair_cost } = req.body;
    db.run(`UPDATE subcontractor_jobs SET status = 'RETURNED', return_date = CURRENT_TIMESTAMP, repair_cost = ? WHERE id = ?`,
    [repair_cost, job_id], function(err) {
        if (err) return res.status(400).json({ success: false, message: err.message });
        res.json({ success: true, message: "Spea/Sehemu imerejea kutoka kwa Sub-contractor!" });
    });
});

// --- GET APIS ---
app.get('/api/spares', (req, res) => db.all(`SELECT * FROM spares ORDER BY name ASC`, [], (err, rows) => res.json({ success: true, data: rows })));
app.get('/api/vehicles', (req, res) => db.all(`SELECT * FROM vehicles ORDER BY plate_number ASC`, [], (err, rows) => res.json({ success: true, data: rows })));
app.get('/api/suppliers', (req, res) => db.all(`SELECT * FROM suppliers ORDER BY company_name ASC`, [], (err, rows) => res.json({ success: true, data: rows })));
app.get('/api/subcontractors', (req, res) => db.all(`SELECT * FROM subcontractors ORDER BY name ASC`, [], (err, rows) => res.json({ success: true, data: rows })));
app.get('/api/subcontractor-jobs', (req, res) => db.all(`SELECT * FROM subcontractor_jobs ORDER BY id DESC`, [], (err, rows) => res.json({ success: true, data: rows })));

app.get('/api/history/vehicle/:plate_number', (req, res) => {
    const plate = req.params.plate_number;
    db.all(`SELECT t.*, s.name as spare_name FROM transactions t LEFT JOIN spares s ON t.part_number = s.part_number WHERE t.plate_number = ? ORDER BY t.id DESC`, [plate], (err, rows) => {
        if (err) return res.status(400).json({ success: false, message: err.message });
        res.json({ success: true, data: rows });
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
        department TEXT
    )`);

    // 3. Suppliers List
    db.run(`CREATE TABLE IF NOT EXISTS suppliers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        company_name TEXT NOT NULL,
        contact_person TEXT,
        phone TEXT
    )`);

    // 4. Sub-Contractors List
    db.run(`// Post Subcontractor Job
app.post('/api/subcontractor-jobs', (req, res) => {
    const { subcontractor_name, plate_number, item_description, repair_cost, notes } = req.body;
    const sql = `INSERT INTO subcontractor_jobs (subcontractor_name, plate_number, item_description, repair_cost, notes) VALUES (?, ?, ?, ?, ?)`;
    db.run(sql, [subcontractor_name, plate_number, item_description, repair_cost || 0, notes], function(err) {
        if (err) return res.status(400).json({ success: false, message: err.message });
        res.json({ success: true, message: "Kazi ya Sub-contractor imesajiliwa kikamilifu!" });
    });
});

// Update Status pale spea/sehemu inaporudi kutoka kwa fundi wa nje
app.post('/api/subcontractor-jobs/return', (req, res) => {
    const { job_id, repair_cost } = req.body;
    const sql = `UPDATE subcontractor_jobs SET status = 'RETURNED', return_date = CURRENT_TIMESTAMP, repair_cost = ? WHERE id = ?`;
    db.run(sql, [repair_cost, job_id], function(err) {
        if (err) return res.status(400).json({ success: false, message: err.message });
        res.json({ success: true, message: "Taarifa zimesasishwa: Spea imerejea stoo!" });
    });
});

// Get Subcontractor Jobs List
app.get('/api/subcontractor-jobs', (req, res) => {
    db.all(`SELECT * FROM subcontractor_jobs ORDER BY id DESC`, [], (err, rows) => res.json({ success: true, data: rows }));
});

// Get Maintenance History for a Specific Vehicle
app.get('/api/history/vehicle/:plate_number', (req, res) => {
    const plate = req.params.plate_number;
    const sqlTrans = `SELECT t.*, s.name as spare_name FROM transactions t LEFT JOIN spares s ON t.part_number = s.part_number WHERE t.plate_number = ? ORDER BY t.id DESC`;
    db.all(sqlTrans, [plate], (err, rows) => {
        if (err) return res.status(400).json({ success: false, message: err.message });
        res.json({ success: true, data: rows });
    });
});

    )`);

    // 5. Store Transactions (Goods Received & Issued to Vehicle)
    db.run(`CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        trans_type TEXT NOT NULL, -- 'RECEIVE' au 'ISSUE'
        part_number TEXT NOT NULL,
        qty INTEGER NOT NULL,
        plate_number TEXT, -- Inajazwa pale tu spea inapotolewa kwenda kwenye lori
        job_card TEXT,
        issued_to_mechanic TEXT,
        supplier_id TEXT,
        date DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
});

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

// --- APIS FOR MASTER DATA ---
app.post('/api/spares', (req, res) => {
    const { part_number, oem_number, name, vehicle_model, unit, min_stock, location } = req.body;
    const sql = `INSERT INTO spares (part_number, oem_number, name, vehicle_model, unit, min_stock, current_stock, location) VALUES (?, ?, ?, ?, ?, ?, 0, ?)`;
    db.run(sql, [part_number, oem_number, name, vehicle_model, unit, min_stock, location], function(err) {
        if (err) return res.status(400).json({ success: false, message: "Part Number hii ipo tayari!" });
        res.json({ success: true, message: "Spea imesajiliwa kwenye Katatlogu ya Stoo!" });
    });
});

app.post('/api/vehicles', (req, res) => {
    const { plate_number, model, chassis_number, engine_number, department } = req.body;
    db.run(`INSERT INTO vehicles (plate_number, model, chassis_number, engine_number, department) VALUES (?, ?, ?, ?, ?)`, 
    [plate_number, model, chassis_number, engine_number, department], function(err) {
        if (err) return res.status(400).json({ success: false, message: "Namba ya lori ipo tayari!" });
        res.json({ success: true, message: "Lori limesajiliwa kikamilifu!" });
    });
});

app.post('/api/suppliers', (req, res) => {
    const { company_name, contact_person, phone } = req.body;
    db.run(`INSERT INTO suppliers (company_name, contact_person, phone) VALUES (?, ?, ?)`, [company_name, contact_person, phone], function(err) {
        if (err) return res.status(400).json({ success: false, message: err.message });
        res.json({ success: true, message: "Msambazaji imesajiliwa!" });
    });
});

app.post('/api/subcontractors', (req, res) => {
    const { name, service_type, phone } = req.body;
    db.run(`INSERT INTO subcontractors (name, service_type, phone) VALUES (?, ?, ?)`, [name, service_type, phone], function(err) {
        if (err) return res.status(400).json({ success: false, message: err.message });
        res.json({ success: true, message: "Sub-contractor imesajiliwa!" });
    });
});

// --- APIS FOR STORE TRANSACTIONS ---

// 1. Kuingiza Spea Stoo (Receive Goods)
app.post('/api/transactions/receive', (req, res) => {
    const { part_number, qty, supplier_id } = req.body;
    const quantity = parseInt(qty);

    db.run(`INSERT INTO transactions (trans_type, part_number, qty, supplier_id) VALUES ('RECEIVE', ?, ?, ?)`,
    [part_number, quantity, supplier_id], function(err) {
        if (err) return res.status(400).json({ success: false, message: err.message });
        
        // Ongeza idadi kwenye Current Stock
        db.run(`UPDATE spares SET current_stock = current_stock + ? WHERE part_number = ?`, [quantity, part_number]);
        res.json({ success: true, message: `Zimepokelewa Spea ${quantity} Stoo Kuu!` });
    });
});

// 2. Kutoa Spea Kwenda Kwenye Lori (Issue to Vehicle)
app.post('/api/transactions/issue', (req, res) => {
    const { part_number, qty, plate_number, job_card, mechanic } = req.body;
    const quantity = parseInt(qty);

    // Angalia kama stock ipo ya kutosha
    db.get(`SELECT current_stock FROM spares WHERE part_number = ?`, [part_number], (err, row) => {
        if (!row || row.current_stock < quantity) {
            return res.status(400).json({ success: false, message: "Stock haitoshi stoo!" });
        }

        db.run(`INSERT INTO transactions (trans_type, part_number, qty, plate_number, job_card, issued_to_mechanic) VALUES ('ISSUE', ?, ?, ?, ?, ?)`,
        [part_number, quantity, plate_number, job_card, mechanic], function(err) {
            if (err) return res.status(400).json({ success: false, message: err.message });
            
            // Punguza idadi kwenye Current Stock
            db.run(`UPDATE spares SET current_stock = current_stock - ? WHERE part_number = ?`, [quantity, part_number]);
            res.json({ success: true, message: `Spea imetolewa na kusajiliwa kwenda Lori ${plate_number}!` });
        });
    });
});

// GET APIS
app.get('/api/spares', (req, res) => {
    db.all(`SELECT * FROM spares ORDER BY name ASC`, [], (err, rows) => res.json({ success: true, data: rows }));
});
app.get('/api/vehicles', (req, res) => {
    db.all(`SELECT * FROM vehicles ORDER BY plate_number ASC`, [], (err, rows) => res.json({ success: true, data: rows }));
});
app.get('/api/suppliers', (req, res) => {
    db.all(`SELECT * FROM suppliers ORDER BY company_name ASC`, [], (err, rows) => res.json({ success: true, data: rows }));
});
app.get('/api/subcontractors', (req, res) => {
    db.all(`SELECT * FROM subcontractors ORDER BY name ASC`, [], (err, rows) => res.json({ success: true, data: rows }));
});
app.get('/api/transactions', (req, res) => {
    db.all(`SELECT * FROM transactions ORDER BY id DESC LIMIT 50`, [], (err, rows) => res.json({ success: true, data: rows }));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
