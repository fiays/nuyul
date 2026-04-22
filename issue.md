# Project Planning: Service Pencatatan Paket Harian

## Deskripsi Singkat
Tugas ini adalah untuk membuat sebuah aplikasi backend service baru yang berfungsi untuk mencatat jumlah paket harian berdasarkan referensi dari data `nuyul.ods`. Aplikasi ini akan dapat melakukan pencatatan secara harian, lalu mengakumulasi total paket dan mengkalkulasi total gaji berdasarkan tarif per paket (misal: x1100).

## Teknologi yang Digunakan
- **Runtime**: Bun
- **Web Framework**: Elysia
- **Database ORM**: Drizzle ORM
- **Database Engine**: MySQL

---

## High-Level Instruksi Implementasi

### 1. Inisialisasi Project (Setup)
- Buat project baru menggunakan Bun (`bun init` atau template create-elysia).
- Install dependency utama: `elysia`, `drizzle-orm`, dan driver MySQL yang kompatibel dengan Bun (seperti `mysql2`).
- Install development dependency: `drizzle-kit` untuk keperluan migrasi database.
- Siapkan koneksi *database* ke MySQL melalui Drizzle dan pastikan sudah bisa terkoneksi dengan membaca dari file `.env`.

### 2. Desain Database Schema (Drizzle)
Buat struktur skema database untuk menyimpan rekapan paket bulanan atau harian, misalnya:
- **Tabel `daily_records`**:
  - `id`: Primary key (Auto Increment / UUID)
  - `date`: Tanggal pencatatan (tipe Date)
  - `package_count`: Jumlah paket (tipe Integer)
  - `rate_per_package`: Harga per paket (tipe Integer, default 1100)
  - `created_at` / `updated_at`: Timestamp standar

### 3. Pembuatan API Endpoints (Elysia)
Gunakan framework Elysia untuk membuat kumpulan REST API berikut:
- **`POST /records`**: Menerima payload berupa tanggal dan jumlah paket harian yang akan disimpan ke database.
- **`GET /records`**: Menampilkan seluruh data rekapan (atau bisa ditambahkan filter kueri berdasarkan bulan/tahun tertentu seperti format *JANUARI 2026* di ODS).
- **`PUT /records/:id`** *(opsional)*: Untuk mengubah jumlah paket pada tanggal/record tertentu apabila terjadi kesalahan input.
- **`DELETE /records/:id`** *(opsional)*: Untuk menghapus row record.
- **`GET /summary`**: Mengembalikan kalkulasi akhir, yaitu:
  - Total paket dari keseluruhan/bulan tersebut.
  - Total gaji (Gajian) = Total paket × rate per paket (contoh: 3260 × 1100 = 3.586.000).

### 4. Hal-hal Lain yang Diperhatikan
- **Validasi Data**: Pastikan input dari API divalidasi dengan baik (tipe data tanggal, jumlah paket tidak negatif) memanfaatkan skema validasi bawaan yang didukung Elysia (TypeBox).
- **Struktur Kode**: Pisahkan *routing*, *schema* database, dan *logika koneksi* agar rapi (jangan gabung semua di satu file).
- **Dokumentasi/Swagger**: Silakan tambahkan plugin swagger di Elysia untuk kemudahan pengetesan API.

---

**Catatan untuk Programmer / Model AI:**
Silakan jalankan implementasi di folder ini sesuai arahan secara mandiri. Lakukan secara bertahap mulai dari setup *dependency*, skema tabel MySQL, hingga pembuatan rute REST API nya.
