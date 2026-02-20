const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Limit besar karena data JSON bisa lumayan besar

// Pool Koneksi MySQL
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'web_pinjaman',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Koneksi ke MySQL & Inisialisasi Tabel
async function initDB() {
    try {
        // Test koneksi & Buat tabel 'app_state' jika belum ada
        const createTableQuery = `
      CREATE TABLE IF NOT EXISTS app_state (
        configId VARCHAR(50) PRIMARY KEY,
        appData LONGTEXT NOT NULL,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `;
        await pool.query(createTableQuery);

        console.log('✅ MySQL connected and table ready!');
    } catch (err) {
        console.error('❌ MySQL connection error/Table creation error:', err);
    }
}

initDB();

// --- ROUTES API ---

// 1. Mengambil Data (GET)
app.get('/api/state', async (req, res) => {
    try {
        // Panggil data dengan configId 'main'
        const [rows] = await pool.query('SELECT appData FROM app_state WHERE configId = ?', ['main']);

        if (rows.length === 0) {
            // Jika kosong, kirim respon kosong tapi sukses
            return res.status(200).json(null);
        }

        // Parse hasil string LONGTEXT menjadi JSON objek kembali
        const data = JSON.parse(rows[0].appData);
        res.status(200).json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Gagal mengambil data dari database MySQL' });
    }
});

// 2. Menyimpan/Memperbarui Data (POST)
app.post('/api/state', async (req, res) => {
    try {
        const newDataStr = JSON.stringify(req.body);

        // Update data jika configId 'main' sudah ada, atau buat baru (INSERT ON DUPLICATE) 
        const query = `
      INSERT INTO app_state (configId, appData) 
      VALUES (?, ?) 
      ON DUPLICATE KEY UPDATE appData = ?
    `;

        await pool.query(query, ['main', newDataStr, newDataStr]);

        res.status(200).json({ message: 'Data berhasil disimpan ke cloud MySQL!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Gagal menyimpan data ke MySQL' });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server Backend berjalan di http://localhost:${PORT}`);
});
