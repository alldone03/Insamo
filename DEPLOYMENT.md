# Insamo Production Deployment Guide

Panduan langkah-langkah untuk melakukan deployment, migrasi database, dan seeding data di lingkungan produksi.

## 1. Persiapan Lingkungan

Pastikan file `.env` sudah terkonfigurasi dengan benar di server.

```bash
# SSH ke server
ssh -p 22 kalian@kalian.my.id

# Masuk ke direktori project
cd Insamo
```

## 2. Deployment dengan Docker

Gunakan `docker-compose.prod.yml` untuk menjalankan layanan di produksi.

```bash
# Build dan jalankan containers
docker-compose -f docker-compose.prod.yml up -d --build

# Cek status container
docker ps
```

## 3. Database Management (Migration & Seed)

Karena aplikasi berjalan di dalam Docker, cara paling aman adalah menjalankan perintah melalui `npx` dengan PATH Node yang sesuai di server, atau masuk ke dalam container.

### A. Migrasi Database
Menjalankan migrasi untuk memperbarui skema database sesuai dengan model terbaru.

```bash
# Melalui SSH langsung (menggunakan Node v24)
export PATH="/home/aldan/.nvm/versions/node/v24.14.0/bin:$PATH"
cd ~/Insamo/backend
npx tsx src/database/migrate.ts
```

### B. Seeding Data Awal (Default)
Menjalankan seeder utama untuk data master (Roles, Users, Initial Devices).

```bash
cd ~/Insamo/backend
npx tsx src/database/seed.ts
```

### C. Seeding Data Jawa Timur (20 Devices)
Menjalankan seeder khusus untuk 20 perangkat di area Jawa Timur.

```bash
cd ~/Insamo/backend
npx tsx src/database/seedEastJava.ts
```

## 4. Simulasi Perangkat

Untuk menjalankan simulator data di server (pastikan `device_simulator.py` sudah diupdate):

```bash
cd ~/Insamo
python3 device_simulator.py
```

> [!IMPORTANT]
> Pastikan `API_URL` di dalam `device_simulator.py` mengarah ke `https://apiapp.insamo.id/api/sensor-readings` untuk produksi.

## 5. Troubleshooting

- **Cek Log Backend:** `docker logs -f insamo-backend-prod`
- **Cek Log Database:** `docker logs -f insamo-db-prod`
- **Restart Service:** `docker-compose -f docker-compose.prod.yml restart app`
