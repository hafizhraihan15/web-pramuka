-- ============================================================
-- DATABASE SCHEMA — Pramuka MAN 1 INHIL (FINAL v3)
-- Platform: Supabase (PostgreSQL)
-- Jalankan di: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLE: gallery
-- ============================================================
CREATE TABLE IF NOT EXISTS gallery (
  id          UUID        DEFAULT uuid_generate_v4() PRIMARY KEY,
  title       TEXT        NOT NULL,
  category    TEXT        NOT NULL DEFAULT 'Umum',
  description TEXT,
  image_url   TEXT        NOT NULL,
  public_id   TEXT,           -- Cloudinary public_id untuk delete
  width       INTEGER,
  height      INTEGER,
  uploaded_by TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gallery_category ON gallery(category);
CREATE INDEX IF NOT EXISTS idx_gallery_created  ON gallery(created_at DESC);

-- ============================================================
-- TABLE: programs
-- ============================================================
CREATE TABLE IF NOT EXISTS programs (
  id          UUID        DEFAULT uuid_generate_v4() PRIMARY KEY,
  title       TEXT        NOT NULL,
  category    TEXT        NOT NULL DEFAULT 'Rutin',
  description TEXT        NOT NULL,
  schedule    TEXT,
  icon        TEXT        DEFAULT '🏕️',
  color       TEXT        DEFAULT '#001f3f',
  sort_order  INTEGER     DEFAULT 99,
  is_active   BOOLEAN     DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Seed data
INSERT INTO programs (title, category, description, schedule, icon, sort_order) VALUES
  ('Bakti Sosial',   'Rutin',    'Aksi nyata membantu masyarakat sekitar sebagai bentuk pengamalan Dasa Darma kedua. Dilaksanakan setiap bulan bersama anggota aktif.', 'Setiap Bulan', '🤝', 1),
  ('Latihan Rutin',  'Rutin',    'Pengembangan teknik kepramukaan (scout skill) setiap akhir pekan bersama seluruh anggota aktif. Mencakup PPGD, baris berbaris, dan survival skill.', 'Setiap Sabtu', '🏕️', 2),
  ('Kemah Tahunan',  'Tahunan',  'Ajang mempererat persaudaraan dan melatih kemandirian di alam terbuka. Diikuti seluruh anggota aktif.', 'Setiap Tahun', '🔥', 3),
  ('Pramuka Garuda', 'Prestasi', 'Program pencapaian tingkatan tertinggi bagi anggota Pramuka yang berprestasi dan berkomitmen tinggi terhadap organisasi.', 'Berkelanjutan', '⚜️', 4),
  ('Lomba Tingkat',  'Prestasi', 'Berpartisipasi dalam berbagai ajang perlombaan antar pangkalan, dari tingkat ranting hingga nasional.', 'Menyesuaikan', '🏆', 5),
  ('Jambore',        'Tahunan',  'Pertemuan pramuka penggalang dalam bentuk perkemahan besar bersama gugus depan lain se-Indonesia.', '2 Tahunan', '🌍', 6)
ON CONFLICT DO NOTHING;

-- ============================================================
-- TABLE: messages (form kontak)
-- ============================================================
CREATE TABLE IF NOT EXISTS messages (
  id         UUID        DEFAULT uuid_generate_v4() PRIMARY KEY,
  name       TEXT        NOT NULL,
  email      TEXT        NOT NULL,
  subject    TEXT,
  message    TEXT        NOT NULL,
  is_read    BOOLEAN     DEFAULT FALSE,
  ip         TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_unread  ON messages(is_read);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);

-- ============================================================
-- TABLE: members (pendaftaran anggota)
-- ============================================================
CREATE TABLE IF NOT EXISTS members (
  id         UUID        DEFAULT uuid_generate_v4() PRIMARY KEY,
  name       TEXT        NOT NULL,
  nis        TEXT        NOT NULL,
  class      TEXT        NOT NULL,
  phone      TEXT,
  address    TEXT,
  motivation TEXT,
  photo_url  TEXT,
  status     TEXT        DEFAULT 'pending',  -- pending, accepted, rejected
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_members_status  ON members(status);
CREATE INDEX IF NOT EXISTS idx_members_created ON members(created_at DESC);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- === Gallery ===
ALTER TABLE gallery ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read gallery"
  ON gallery FOR SELECT
  USING (true);

CREATE POLICY "Authenticated can insert gallery"
  ON gallery FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can update gallery"
  ON gallery FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can delete gallery"
  ON gallery FOR DELETE
  USING (auth.role() = 'authenticated');

-- === Programs ===
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active programs"
  ON programs FOR SELECT
  USING (is_active = true);

CREATE POLICY "Authenticated can manage programs"
  ON programs FOR ALL
  USING (auth.role() = 'authenticated');

-- === Messages ===
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can insert messages"
  ON messages FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated can read messages"
  ON messages FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can update messages"
  ON messages FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can delete messages"
  ON messages FOR DELETE
  USING (auth.role() = 'authenticated');

-- === Members ===
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can insert members"
  ON members FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated can read members"
  ON members FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can update members"
  ON members FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can delete members"
  ON members FOR DELETE
  USING (auth.role() = 'authenticated');

-- ============================================================
-- TABLE: announcements (pengumuman/berita)
-- ============================================================
CREATE TABLE IF NOT EXISTS announcements (
  id          UUID        DEFAULT uuid_generate_v4() PRIMARY KEY,
  title       TEXT        NOT NULL,
  content     TEXT        NOT NULL,
  image_url   TEXT,                          -- URL gambar (dari mana saja)
  link_url    TEXT,                          -- Link pendaftaran / aksi (opsional)
  link_label  TEXT        DEFAULT 'Daftar Sekarang',
  is_active   BOOLEAN     DEFAULT TRUE,
  created_by  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_announcements_active  ON announcements(is_active);
CREATE INDEX IF NOT EXISTS idx_announcements_created ON announcements(created_at DESC);

-- RLS Announcements
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active announcements"
  ON announcements FOR SELECT
  USING (is_active = true);

CREATE POLICY "Authenticated can manage announcements"
  ON announcements FOR ALL
  USING (auth.role() = 'authenticated');

-- ============================================================
-- VERIFY TABLES
-- ============================================================
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

