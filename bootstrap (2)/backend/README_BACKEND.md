# Backend FastAPI - Pramuka MAN 1 INHIL

## Setup

### 1. Buat database MySQL

Buka phpMyAdmin (`http://localhost/phpmyadmin`), lalu jalankan isi file `database.sql`.

### 2. Isi `.env`

Minimal:

```env
DATABASE_URL=mysql+pymysql://user:password@localhost/pramuka_db
SECRET_KEY=isi-dengan-random-minimal-32-karakter
ADMIN_EMAILS=admin@pramukainhi.id
ENV=development
```

Untuk production, set:

```env
ENV=production
CORS_ORIGINS=https://domain-frontend-kamu.com
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Buat akun admin pertama

```bash
python create_admin.py
```

Script akan meminta email dan password. Password minimal 8 karakter dan tidak ada password default.

### 5. Jalankan server

```bash
uvicorn main:app --reload
```

API berjalan di `http://localhost:8000`.
Dokumentasi Swagger tersedia di `/docs` saat `ENV=development`; otomatis mati saat `ENV=production`.
