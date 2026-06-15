-- ============================================================
-- DATABASE SCHEMA — Pramuka MAN 1 INHIL
-- Platform: MySQL (XAMPP)
-- Jalankan di phpMyAdmin atau MySQL CLI
-- ============================================================

CREATE DATABASE IF NOT EXISTS pramuka_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE pramuka_db;

-- TABLE: users (admin)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABLE: gallery
CREATE TABLE IF NOT EXISTS gallery (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(100) DEFAULT 'Umum',
  description TEXT,
  image_url TEXT NOT NULL,
  uploaded_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABLE: programs
CREATE TABLE IF NOT EXISTS programs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(100) DEFAULT 'Rutin',
  description TEXT NOT NULL,
  schedule VARCHAR(100),
  icon VARCHAR(20) DEFAULT '🏕️',
  sort_order INT DEFAULT 99,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Seed programs
INSERT INTO programs (title, category, description, schedule, icon, sort_order) VALUES
  ('Bakti Sosial', 'Rutin', 'Aksi nyata membantu masyarakat sekitar sebagai bentuk pengamalan Dasa Darma kedua.', 'Setiap Bulan', '🤝', 1),
  ('Latihan Rutin', 'Rutin', 'Pengembangan teknik kepramukaan setiap akhir pekan. Mencakup PPGD, baris berbaris, dan survival skill.', 'Setiap Sabtu', '🏕️', 2),
  ('Kemah Tahunan', 'Tahunan', 'Ajang mempererat persaudaraan dan melatih kemandirian di alam terbuka.', 'Setiap Tahun', '🔥', 3),
  ('Pramuka Garuda', 'Prestasi', 'Program pencapaian tingkatan tertinggi bagi anggota Pramuka yang berprestasi.', 'Berkelanjutan', '⚜️', 4),
  ('Lomba Tingkat', 'Prestasi', 'Berpartisipasi dalam berbagai ajang perlombaan antar pangkalan.', 'Menyesuaikan', '🏆', 5),
  ('Jambore', 'Tahunan', 'Pertemuan pramuka penggalang dalam bentuk perkemahan besar.', '2 Tahunan', '🌍', 6);

-- TABLE: members
CREATE TABLE IF NOT EXISTS members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  nis VARCHAR(50) NOT NULL,
  class VARCHAR(50) NOT NULL,
  phone VARCHAR(20),
  address TEXT,
  motivation TEXT,
  status ENUM('pending','accepted','rejected') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- TABLE: messages
CREATE TABLE IF NOT EXISTS messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  subject VARCHAR(255),
  message TEXT NOT NULL,
  is_read TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABLE: announcements
CREATE TABLE IF NOT EXISTS announcements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  link_url TEXT,
  link_label VARCHAR(100) DEFAULT 'Daftar Sekarang',
  is_active TINYINT(1) DEFAULT 1,
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- TABLE: ambalans (Hangtuah, Dang Merdu)
CREATE TABLE IF NOT EXISTS ambalans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed ambalans
INSERT INTO ambalans (name, description) VALUES
  ('Hangtuah', 'Ambalan Hangtuah - Laksana Panglima'),
  ('Dang Merdu', 'Ambalan Dang Merdu - Pembawa Keadilan');

-- UPDATE members table - add ambalan_id and user_id for member auth
ALTER TABLE members ADD COLUMN ambalan_id INT AFTER nis;
ALTER TABLE members ADD COLUMN user_id INT AFTER ambalan_id;
ALTER TABLE members ADD FOREIGN KEY (ambalan_id) REFERENCES ambalans(id) ON DELETE SET NULL;
ALTER TABLE members ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- TABLE: attendance - Pencatatan Absensi Anggota
CREATE TABLE IF NOT EXISTS attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  member_id INT NOT NULL,
  attendance_date DATE NOT NULL,
  status ENUM('Hadir', 'Izin', 'Alpha') DEFAULT 'Hadir',
  note TEXT,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
  UNIQUE KEY unique_daily_attendance (member_id, attendance_date)
);

-- TABLE: program_registrations - Daftar Peserta Program
CREATE TABLE IF NOT EXISTS program_registrations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  member_id INT NOT NULL,
  program_id INT NOT NULL,
  status ENUM('pending','accepted','rejected') DEFAULT 'pending',
  registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
  FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE,
  UNIQUE KEY unique_registration (member_id, program_id)
);

-- TABLE: letter_requests - Permintaan Surat Menyurat
CREATE TABLE IF NOT EXISTS letter_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  member_id INT NOT NULL,
  letter_type VARCHAR(100) NOT NULL,
  purpose TEXT NOT NULL,
  recipient VARCHAR(255),
  status ENUM('Pending', 'Selesai') DEFAULT 'Pending',
  file_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
);
