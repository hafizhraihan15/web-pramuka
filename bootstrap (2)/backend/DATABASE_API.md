# Database & API Documentation

## Database Schema

### 1. **users** — Admin/Member Authentication

- `id` (INT, PK)
- `email` (VARCHAR, UNIQUE)
- `password_hash` (VARCHAR)
- `created_at` (TIMESTAMP)

### 2. **ambalans** — Pramuka Group (Hangtuah, Dang Merdu)

- `id` (INT, PK)
- `name` (VARCHAR, UNIQUE) — "Hangtuah" or "Dang Merdu"
- `description` (TEXT)
- `created_at` (TIMESTAMP)

### 3. **members** — Anggota Pramuka

- `id` (INT, PK)
- `name` (VARCHAR)
- `nis` (VARCHAR) — Nomor Induk Siswa
- `class` (VARCHAR)
- `phone` (VARCHAR)
- `address` (TEXT)
- `motivation` (TEXT)
- `ambalan_id` (FK → ambalans)
- `user_id` (FK → users) — Link ke user account
- `status` (ENUM: pending, accepted, rejected)
- `created_at`, `updated_at` (TIMESTAMP)

### 4. **attendance** — Pencatatan Absensi

- `id` (INT, PK)
- `member_id` (FK → members)
- `attendance_date` (DATE)
- `status` (ENUM: Hadir, Izin, Alpha)
- `note` (TEXT)
- `recorded_at` (TIMESTAMP)
- **UNIQUE**: (member_id, attendance_date) — 1 absensi per member per hari

### 5. **programs** — Program Kegiatan (sudah ada)

- `id` (INT, PK)
- `title` (VARCHAR)
- `category` (VARCHAR): Rutin, Tahunan, Prestasi
- `description` (TEXT)
- `schedule` (VARCHAR)
- `icon` (VARCHAR)
- `sort_order` (INT)
- `is_active` (BOOLEAN)
- `created_at`, `updated_at` (TIMESTAMP)

### 6. **program_registrations** — Daftar Peserta Program

- `id` (INT, PK)
- `member_id` (FK → members)
- `program_id` (FK → programs)
- `registered_at` (TIMESTAMP)
- **UNIQUE**: (member_id, program_id) — 1 member per program registration

### 7. **letter_requests** — Permintaan Surat Menyurat

- `id` (INT, PK)
- `member_id` (FK → members)
- `letter_type` (VARCHAR): "Surat Izin", "Surat Keterangan", "Surat Rekomendasi"
- `purpose` (TEXT)
- `recipient` (VARCHAR): "Kepala Sekolah", "Ketua Pangkalan", dll
- `status` (ENUM: Pending, Selesai)
- `file_url` (TEXT) — URL file surat yang sudah selesai
- `created_at`, `updated_at` (TIMESTAMP)

### 8. **announcements** — Pengumuman (sudah ada)

### 9. **gallery** — Galeri Foto (sudah ada)

### 10. **messages** — Pesan Masuk (sudah ada)

---

## API Endpoints

### 🔐 Authentication (`/api/auth`)

- `POST /login` — Login dengan email & password
- `GET /me` — Get current user profile

### 👥 Members (`/api/members`)

- `GET /` — Get all members (admin only)
- `GET /{id}` — Get member details
- `POST /` — Register new member
- `PATCH /{id}` — Update member status (admin)
- `DELETE /{id}` — Delete member (admin)
- `GET /ambalans/` — Get all ambalans
- `GET /ambalans/{id}/members` — Get members by ambalan

### ✅ Attendance (`/api/attendance`)

- `GET /{member_id}` — Get attendance history
- `POST /{member_id}` — Create attendance record (1 per day)
- `PUT /{attendance_id}` — Update attendance record
- `DELETE /{attendance_id}` — Delete attendance record

### 📋 Programs (`/api/programs`)

- `GET /` — Get all active programs
- `GET /all` — Get all programs (admin)
- `POST /` — Create program (admin)
- `PUT /{id}` — Update program (admin)
- `DELETE /{id}` — Delete program (admin)
- **Registration:**
  - `POST /{program_id}/register/{member_id}` — Register member to program
  - `GET /{member_id}/registered` — Get member's registered programs
  - `DELETE /{program_id}/unregister/{member_id}` — Unregister from program

### 📄 Letters (`/api/letters`)

- `GET /{member_id}` — Get member's letter requests
- `POST /{member_id}` — Create letter request
- `PUT /{letter_id}` — Update letter status (admin)
- `DELETE /{letter_id}` — Delete letter request

### 📢 Announcements (`/api/announcements`)

### 🖼️ Gallery (`/api/gallery`)

### ✉️ Messages (`/api/messages`)

---

## Setup Instructions

### 1. Database Setup

```bash
# Run SQL script
mysql -u root -p < database.sql
```

### 2. Install Backend Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 3. Seed Test Data

```bash
python seed.py
```

Output:

```
✅ Database seeding completed!

Test Login Credentials:
  - Email: hangtuah@test.com | Password: generated at seed time
  - Email: dangmerdu@test.com | Password: generated at seed time
```

### 4. Start Backend Server

```bash
python main.py
# or
uvicorn main:app --reload
```

Server akan berjalan di `http://localhost:8000`

API Docs: `http://localhost:8000/docs` (Swagger UI, development only)

---

## Frontend API Integration

### Example: Get Member's Attendance

```typescript
const response = await axios.get(
  `http://localhost:8000/api/attendance/${memberId}`,
  { headers: { Authorization: `Bearer ${token}` } },
);
```

### Example: Register to Program

```typescript
const response = await axios.post(
  `http://localhost:8000/api/programs/${programId}/register/${memberId}`,
  {},
  { headers: { Authorization: `Bearer ${token}` } },
);
```

### Example: Create Letter Request

```typescript
const response = await axios.post(
  `http://localhost:8000/api/letters/${memberId}`,
  {
    letter_type: "Surat Izin",
    purpose: "Mengikuti kegiatan di luar sekolah",
    recipient: "Kepala Sekolah",
  },
  { headers: { Authorization: `Bearer ${token}` } },
);
```

---

## Notes

- Token disimpan di `localStorage` dengan key `adminToken`
- Endpoint admin memerlukan akun yang emailnya terdaftar di `ADMIN_EMAILS`
- Endpoint publik: login, daftar member, kirim pesan, program aktif, galeri, pengumuman aktif, dan daftar ambalan
- Ambalan default: "Hangtuah" (id=1) dan "Dang Merdu" (id=2)
- Attendance unique per member per hari (UNIQUE constraint)
- Program registration unique per member per program (UNIQUE constraint)
