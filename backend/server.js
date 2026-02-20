const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Limit besar karena data JSON bisa lumayan besar

// Koneksi ke MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ MongoDB connected successfully!'))
    .catch((err) => console.error('❌ MongoDB connection error:', err));

// Schema & Model untuk Menyimpan Data State Aplikasi
// Karena kita ingin menggantikan localStorage persis seperti aslinya,
// kita simpan satu JSON besar ke dalam satu dokumen terlebih dahulu.
const stateSchema = new mongoose.Schema({
    configId: { type: String, required: true, unique: true },
    appData: { type: mongoose.Schema.Types.Mixed, required: true } // Mixed type mengizinkan objek JSON apapun
}, { timestamps: true });

const AppState = mongoose.model('AppState', stateSchema);

// --- ROUTES API ---

// 1. Mengambil Data (GET)
app.get('/api/state', async (req, res) => {
    try {
        // Kita panggil configId 'main' sebagai ID utama data aplikasi
        const data = await AppState.findOne({ configId: 'main' });
        if (!data) {
            // Jika kosong, kirim respon kosong tapi sukses
            return res.status(200).json(null);
        }
        // Kirimkan isi appData
        res.status(200).json(data.appData);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Gagal mengambil data dari database' });
    }
});

// 2. Menyimpan/Memperbarui Data (POST)
app.post('/api/state', async (req, res) => {
    try {
        const newData = req.body;

        // Update data jika configId: 'main' sudah ada, atau buat baru (upsert) jika belum ada.
        await AppState.findOneAndUpdate(
            { configId: 'main' },
            { appData: newData },
            { upsert: true, new: true }
        );

        res.status(200).json({ message: 'Data berhasil disimpan ke cloud!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Gagal menyimpan data' });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server Backend berjalan di http://localhost:${PORT}`);
});
