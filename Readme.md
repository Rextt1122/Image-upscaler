# AI Image Upscaler

AI Image Upscaler Pro adalah aplikasi web berbasis Artificial Intelligence untuk meningkatkan resolusi gambar (image upscaling) hingga 4x menggunakan engine Real-ESRGAN.

Aplikasi ini memanfaatkan GPU NVIDIA dengan Vulkan API sehingga proses upscaling lebih cepat dibandingkan menggunakan CPU.

---

## Fitur

### Multi Scale Upscaling

Mendukung beberapa tingkat peningkatan resolusi:

- 2x
- 3x
- 4x

### GPU Accelerated

Menggunakan GPU NVIDIA dengan Vulkan API untuk mempercepat proses AI inference.

### Auto Organization

Semua hasil gambar otomatis tersimpan pada folder:

```
results/
```

### Clean Interface

Interface sederhana dan minimalis dengan indikator proses.

---

## Struktur Proyek

```
upscale_web
│
├── main.py
├── index.html
├── static/
│
├── results/
│
├── venv/
│
└── README.md
```

---

## Cara Menjalankan

### 1. Masuk ke Folder Proyek

Buka terminal di VS Code lalu jalankan:

```bash
cd upscale_web
```

### 2. Aktifkan Virtual Environment

Langkah ini penting supaya semua library Python terbaca.

```bash
.\venv\Scripts\Activate.ps1
```

Jika berhasil, terminal akan menampilkan:

```
(venv)
```

### 3. Install Dependencies

Jika pertama kali menjalankan proyek:

```bash
pip install fastapi uvicorn python-multipart
```

### 4. Jalankan Server

Start backend server dengan perintah:

```bash
uvicorn main:app --reload
```
---

## Note

Pastikan sebelum menjalankan proyek:

- GPU NVIDIA sudah tersedia
- Driver GPU terbaru
- Vulkan Runtime sudah terinstall
- File executable Real-ESRGAN tersedia di dalam proyek

---