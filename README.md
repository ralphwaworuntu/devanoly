# Web Pinjaman - Loan Management System

Aplikasi manajemen pinjaman berbasis web dengan React + Vite + TypeScript.

## Fitur Utama
- **Dashboard**: Ringkasan finansial (Modal, Piutang, Profit).
- **Setup Panel**: Atur siklus (Gaji/Remon), bunga global (10%/20%), dan bulan aktif.
- **Database Peminjam**: Kelola data nasabah dan limit kredit.
- **Input Transaksi**:
  - Kalkulasi bunga otomatis sesuai setting global.
  - **Smart Merging**: Menggabungkan pinjaman baru ke transaksi yang sudah ada jika belum lunas.
  - **Limit Guard**: Peringatan jika total hutang melebihi limit pelangggan.
- **Tabel Pinjaman**: Status warna-warni (🔴 Belum Lunas, 🟡 Cicil, 🟢 Lunas) dan pembayaran parsial.

## Cara Menjalankan

Karena ini adalah proyek berbasis Node.js, pastikan Anda memiliki Node.js terinstal di komputer Anda.

1.  **Install Dependencies**
    Buka terminal di folder project ini dan jalankan:
    ```bash
    npm install
    ```

2.  **Jalankan Server Development**
    ```bash
    npm run dev
    ```

3.  **Buka di Browser**
    Buka link yang muncul di terminal (biasanya `http://localhost:5173`).

## Struktur Project
- `src/components`: Komponen UI (LoanForm, LoanTable, dll).
- `src/context`: State management global (AppContext).
- `src/utils`: Logika bisnis (kalkulasi bunga, format mata uang).
- `src/types.ts`: Definisi tipe data TypeScript.
