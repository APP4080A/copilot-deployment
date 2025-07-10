const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();

const app = express();
app.use(cors());
app.use(express.json());

const db = new sqlite3.Database("./db/copilot.db", (err) => {
    if (err) console.error("Failed to connect to DB:", err.message);
    else console.log("Connected to SQLite DB");
});

// Test route
app.get("/api/tasks", (req, res) => {
    db.all("SELECT * FROM tasks", [], (err, rows) => {
        if (err) res.status(500).json({ error: err.message });
        else res.json(rows);
    });
});

app.listen(3001, () => console.log("🚀 Backend listening on http://localhost:3001"));