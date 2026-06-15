import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { TwinkleStars } from "../components/TwinkleStars";
import { TypingEffect } from "../components/TypingEffect";
import { CounterItem } from "../components/CounterItem";
import { useToast } from "../components/ToastContext";
import { FaInstagram, FaWhatsapp } from "react-icons/fa";
import { MdAccessTime, MdEmail, MdLocationOn } from "react-icons/md";

// API BASE URL
const isLocalhost = ["localhost", "127.0.0.1", "::1"].includes(
  window.location.hostname,
);
const API_BASE_URL = isLocalhost ? "http://localhost:8001" : "";
const API_URL = `${API_BASE_URL}/api`;

interface Announcement {
  id: number;
  title: string;
  content: string;
  image_url?: string;
  link_url?: string;
  link_label?: string;
  created_at: string;
}

interface Program {
  id: number;
  icon: string;
  title: string;
  category: string;
  description: string;
  schedule?: string;
}

interface GalleryItem {
  id: number;
  title: string;
  category: string;
  image_url: string;
  description?: string;
}

export const Home: React.FC = () => {
  const { showToast } = useToast();

  // Page loader state
  const [pageLoading, setPageLoading] = useState(true);

  // Navbar states
  const [isNavbarScrolled, setIsNavbarScrolled] = useState(false);
  const [isNavbarOpen, setIsNavbarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("beranda");
  const navbarRef = useRef<HTMLElement | null>(null);

  // Announcements state
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [anncLoading, setAnncLoading] = useState(true);

  // Program states
  const [programs, setPrograms] = useState<Program[]>([]);
  const [programFilter, setProgramFilter] = useState("all");
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);

  // Gallery states
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [galleryFilter, setGalleryFilter] = useState("all");
  const [galleryPage, setGalleryPage] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [galleryLoading, setGalleryLoading] = useState(true);
  const GALLERY_PAGE_SIZE = 12;

  // Carousel state for profile
  const [carouselIndex, setCarouselIndex] = useState(0);
  const carouselImages = [
    {
      src: "/img/foto1.jpeg",
      title: "Latihan Mingguan",
      desc: "Kedisiplinan adalah kunci utama kami.",
    },
    {
      src: "/img/foto2.jpeg",
      title: "Perkemahan Sabtu Minggu",
      desc: "Membangun kemandirian di alam terbuka.",
    },
    {
      src: "/img/foto3.jpeg",
      title: "Bakti Masyarakat",
      desc: "Silih asah, silih asuh, silih asih.",
    },
  ];

  const contributors = [
    {
      id: 1,
      name: "M. Hafizh Raihan Hidayat",
      role: "Project Manager & Analyst",
      image: "/img/hafiz.jpeg",
    },
    {
      id: 2,
      name: "Najwa Hulgusri",
      role: "Front-end Dev",
      image: "/img/najwa.jpeg",
    },
    {
      id: 3,
      name: "Salma Dita Khairunnisa", 
      role: "UI/UX Designer",
      image: "/img/salma.jpeg",
    },
    {
      id: 4,
      name: "Zainal",
      role: "Back-end Dev",
      image: "/img/zainal.png",
    },
  ];
  const contributorLoop = [...contributors, ...contributors];

  // Forms state
  const [daftarForm, setDaftarForm] = useState({
    name: "",
    nis: "",
    class_name: "",
    phone: "",
    address: "",
    motivation: "",
  });
  const [daftarSubmitting, setDaftarSubmitting] = useState(false);

  const [kontakForm, setKontakForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [kontakSubmitting, setKontakSubmitting] = useState(false);

  // Intersection observer refs for reveal animations
  const revealRefs = useRef<HTMLElement[]>([]);
  revealRefs.current = [];

  const addToRevealRefs = (el: HTMLElement | null) => {
    if (el && !revealRefs.current.includes(el)) {
      revealRefs.current.push(el);
    }
  };

  // 1. Initial Page Load
  useEffect(() => {
    const timer = setTimeout(() => {
      setPageLoading(false);
    }, 1800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const closeNavbarOnOutsideClick = (event: MouseEvent | TouchEvent) => {
      if (!isNavbarOpen || !navbarRef.current) return;
      const target = event.target as Node;
      if (!navbarRef.current.contains(target)) {
        setIsNavbarOpen(false);
      }
    };

    document.addEventListener("mousedown", closeNavbarOnOutsideClick);
    document.addEventListener("touchstart", closeNavbarOnOutsideClick);
    return () => {
      document.removeEventListener("mousedown", closeNavbarOnOutsideClick);
      document.removeEventListener("touchstart", closeNavbarOnOutsideClick);
    };
  }, [isNavbarOpen]);

  // 2. Fetch API Data
  useEffect(() => {
    // Fetch Announcements
    axios
      .get(`${API_URL}/announcements/?limit=6`)
      .then((res) => {
        setAnnouncements(res.data);
        setAnncLoading(false);
      })
      .catch(() => {
        setAnnouncements([]); // Fallback to empty, shows empty state
        setAnncLoading(false);
      });

    // Fetch Programs
    axios
      .get(`${API_URL}/programs/`)
      .then((res) => {
        setPrograms(res.data);
      })
      .catch(() => {
        // Fallback sample data
        setPrograms([
          {
            id: 1,
            icon: "🤝",
            title: "Bakti Sosial",
            category: "Rutin",
            description:
              "Aksi nyata membantu masyarakat sekitar sebagai bentuk pengamalan Dasa Darma kedua. Dilaksanakan setiap bulan.",
            schedule: "Setiap Bulan",
          },
          {
            id: 2,
            icon: "🏕️",
            title: "Latihan Rutin",
            category: "Rutin",
            description:
              "Pengembangan teknik kepramukaan (scout skill) setiap akhir pekan, mencakup PPGD, baris berbaris, dan survival skill.",
            schedule: "Setiap Sabtu",
          },
          {
            id: 3,
            icon: "🔥",
            title: "Kemah Tahunan",
            category: "Tahunan",
            description:
              "Ajang mempererat persaudaraan dan melatih kemandirian di alam terbuka. Diikuti seluruh anggota aktif.",
            schedule: "Setiap Tahun",
          },
          {
            id: 4,
            icon: "⚜️",
            title: "Pramuka Garuda",
            category: "Prestasi",
            description:
              "Program pencapaian tingkatan tertinggi bagi anggota Pramuka yang berprestasi dan berkomitmen tinggi.",
            schedule: "Berkelanjutan",
          },
          {
            id: 5,
            icon: "🏆",
            title: "Lomba Tingkat",
            category: "Prestasi",
            description:
              "Berpartisipasi dalam berbagai ajang perlombaan antar pangkalan, dari tingkat ranting hingga nasional.",
            schedule: "Menyesuaikan",
          },
          {
            id: 6,
            icon: "🌍",
            title: "Jambore",
            category: "Tahunan",
            description:
              "Pertemuan pramuka penggalang dalam bentuk perkemahan besar bersama gugus depan lain se-Indonesia.",
            schedule: "2 Tahunan",
          },
        ]);
      });

    // Fetch Gallery
    axios
      .get(`${API_URL}/gallery/`)
      .then((res) => {
        setGallery(res.data);
        setGalleryLoading(false);
      })
      .catch(() => {
        // Fallback gallery items
        setGallery([
          {
            id: 1,
            title: "Latihan Mingguan",
            category: "Latihan",
            image_url: "/img/foto1.jpeg",
            description: "Sesi latihan baris berbaris dan skill pramuka",
          },
          {
            id: 2,
            title: "Perkemahan Sabtu Minggu",
            category: "Kemah",
            image_url: "/img/foto2.jpeg",
            description: "PERSAMI di alam terbuka",
          },
          {
            id: 3,
            title: "Bakti Masyarakat",
            category: "Bakti Sosial",
            image_url: "/img/foto3.jpeg",
            description: "Kegiatan sosial bersama warga",
          },
          {
            id: 4,
            title: "Lomba Tingkat IV",
            category: "Lomba",
            image_url: "/img/foto1.jpeg",
            description: "Juara 1 Lomba Tingkat kabupaten",
          },
          {
            id: 5,
            title: "Upacara Pelantikan",
            category: "Acara",
            image_url: "/img/foto2.jpeg",
            description: "Pelantikan Pramuka Penggalang Ramu",
          },
          {
            id: 6,
            title: "Kemah Bhakti Nasional",
            category: "Kemah",
            image_url: "/img/foto3.jpeg",
            description: "Kegiatan kemah antar-pangkalan",
          },
        ]);
        setGalleryLoading(false);
      });
  }, []);

  // 3. Scroll & Navbar Logic
  useEffect(() => {
    const handleScroll = () => {
      setIsNavbarScrolled(window.scrollY > 50);

      // Section highlighting
      const sections = [
        "beranda",
        "pengumuman",
        "tentang",
        "program",
        "gallery",
        "daftar",
        "kontak",
      ];
      const scrollPos = window.scrollY + 100;

      for (const id of sections) {
        const el = document.getElementById(id);
        if (el) {
          const top = el.offsetTop;
          const bottom = top + el.offsetHeight;
          if (scrollPos >= top && scrollPos < bottom) {
            setActiveSection(id);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 4. Reveal Animation Observer
  useEffect(() => {
    if (pageLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, i) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              entry.target.classList.add("visible");
            }, i * 90);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -60px 0px" },
    );

    revealRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [pageLoading, announcements, programs, gallery]);

  // 5. Automatic Sliding for Carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % carouselImages.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  // 6. Handle Form Submits
  const handleDaftarSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDaftarSubmitting(true);

    try {
      await axios.post(`${API_URL}/members/`, {
        name: daftarForm.name,
        nis: daftarForm.nis,
        class_name: daftarForm.class_name,
        phone: daftarForm.phone || null,
        address: daftarForm.address || null,
        motivation: daftarForm.motivation || null,
      });

      showToast(
        "✅ Pendaftaran berhasil! Kami akan menghubungi kamu segera.",
        "success",
      );
      setDaftarForm({
        name: "",
        nis: "",
        class_name: "",
        phone: "",
        address: "",
        motivation: "",
      });
    } catch (err: any) {
      const errMsg =
        err.response?.data?.detail || err.message || "Error occurred";
      showToast(`❌ Gagal mengirim: ${errMsg}`, "error");
    } finally {
      setDaftarSubmitting(false);
    }
  };

  const handleKontakSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setKontakSubmitting(true);

    try {
      await axios.post(`${API_URL}/messages/`, {
        name: kontakForm.name,
        email: kontakForm.email,
        subject: kontakForm.subject || null,
        message: kontakForm.message,
      });

      showToast("✅ Pesan terkirim! Kami akan membalas segera.", "success");
      setKontakForm({
        name: "",
        email: "",
        subject: "",
        message: "",
      });
    } catch (err: any) {
      const errMsg =
        err.response?.data?.detail || err.message || "Error occurred";
      showToast(`❌ Gagal mengirim pesan: ${errMsg}`, "error");
    } finally {
      setKontakSubmitting(false);
    }
  };

  // Filter lists
  const filteredPrograms =
    programFilter === "all"
      ? programs
      : programs.filter((p) => p.category === programFilter);

  const filteredGallery =
    galleryFilter === "all"
      ? gallery
      : gallery.filter((g) => g.category === galleryFilter);

  const paginatedGallery = filteredGallery.slice(
    0,
    (galleryPage + 1) * GALLERY_PAGE_SIZE,
  );
  const hasMoreGallery = paginatedGallery.length < filteredGallery.length;

  // Smooth scroll helper
  const scrollTo = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    setIsNavbarOpen(false);
  };

  return (
    <>
      {/* Loader screen */}
      {pageLoading && (
        <div
          id="loader-screen"
          style={{
            opacity: 1,
            visibility: "visible",
            transition: "all 0.4s ease",
          }}
        >
          <div className="loader-logo">
            <img src="/img/logo.png" alt="Logo Pramuka MAN 1 INHIL" />
          </div>
          <div className="loader-text">MEMUAT HALAMAN...</div>
          <div className="loader-bar">
            <div
              className="loader-bar-fill"
              style={{ width: "100%", transition: "width 1.5s ease-in-out" }}
            />
          </div>
        </div>
      )}

      {/* Navbar */}
      <nav
        ref={navbarRef}
        className={`navbar navbar-expand-lg navbar-dark sticky-top ${isNavbarScrolled ? "scrolled" : ""}`}
        id="mainNavbar"
      >
        <div className="container">
          <a
            className="navbar-brand d-flex align-items-center gap-2"
            href="#beranda"
            onClick={(e) => scrollTo(e, "beranda")}
          >
            <span className="logo-container">
              <img src="/img/logo.png" alt="Logo" className="nav-logo" />
            </span>
            <span
              className="fw-bold text-uppercase"
              style={{ fontSize: "0.95rem" }}
            >
              PRAMUKA MAN 1 INHIL
            </span>
          </a>
          <button
            className="navbar-toggler border-0"
            type="button"
            onClick={() => setIsNavbarOpen(!isNavbarOpen)}
            aria-expanded={isNavbarOpen}
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div
            className={`collapse navbar-collapse ${isNavbarOpen ? "show" : ""}`}
            id="navbarNav"
          >
            <ul className="navbar-nav ms-auto align-items-center gap-1">
              <li className="nav-item">
                <a
                  className={`nav-link ${activeSection === "beranda" ? "active" : ""}`}
                  href="#beranda"
                  onClick={(e) => scrollTo(e, "beranda")}
                >
                  Beranda
                </a>
              </li>
              <li className="nav-item">
                <a
                  className={`nav-link ${activeSection === "pengumuman" ? "active" : ""}`}
                  href="#pengumuman"
                  onClick={(e) => scrollTo(e, "pengumuman")}
                >
                  📢 Pengumuman
                </a>
              </li>
              <li className="nav-item">
                <a
                  className={`nav-link ${activeSection === "tentang" ? "active" : ""}`}
                  href="#tentang"
                  onClick={(e) => scrollTo(e, "tentang")}
                >
                  Tentang
                </a>
              </li>
              <li className="nav-item">
                <a
                  className={`nav-link ${activeSection === "program" ? "active" : ""}`}
                  href="#program"
                  onClick={(e) => scrollTo(e, "program")}
                >
                  Program
                </a>
              </li>
              <li className="nav-item">
                <a
                  className={`nav-link ${activeSection === "gallery" ? "active" : ""}`}
                  href="#gallery"
                  onClick={(e) => scrollTo(e, "gallery")}
                >
                  Galeri
                </a>
              </li>
              <li className="nav-item">
                <a
                  className={`nav-link ${activeSection === "daftar" ? "active" : ""}`}
                  href="#daftar"
                  onClick={(e) => scrollTo(e, "daftar")}
                >
                  Daftar
                </a>
              </li>
              <li className="nav-item">
                <a
                  className={`nav-link ${activeSection === "kontak" ? "active" : ""}`}
                  href="#kontak"
                  onClick={(e) => scrollTo(e, "kontak")}
                >
                  Kontak
                </a>
              </li>
            </ul>
          </div>
          <div className="d-flex align-items-center ms-2">
            <a
              className="nav-link btn-hero-primary"
              href="/login"
              style={{
                padding: "6px 16px",
                borderRadius: "8px",
                color: "#001220",
                fontWeight: "bold",
                whiteSpace: "nowrap",
              }}
            >
              Login
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section" id="beranda">
        <div id="hero-bg"></div>
        <TwinkleStars />

        {/* Aurora effect */}
        <div className="aurora-bg">
          <div className="aurora-1"></div>
          <div className="aurora-2"></div>
          <div className="aurora-3"></div>
        </div>

        {/* Geometric rings (right only) */}
        <div
          className="hero-geo"
          style={{ bottom: "15%", right: "5%", opacity: 0.25 }}
        >
          <div className="geo-ring-2"></div>
        </div>

        <div className="hero-wrapper">
          {/* LEFT: Main content */}
          <div className="hero-left">
            <div className="hero-badge">
              <span className="dot"></span>
              Gugus Depan 15-009 dan 15-010
            </div>
            <h1 className="hero-title">
              <span className="highlight">Sedia,</span> Waspada,
              <br />
              Kesatria
            </h1>
            <p className="hero-subtitle">
              Gerakan Pramuka MAN 1 Indragiri Hilir
            </p>
            <TypingEffect />
            <div className="hero-buttons">
              <a
                href="#tentang"
                onClick={(e) => scrollTo(e, "tentang")}
                className="btn-hero-primary"
              >
                ✨ Profil Kami
              </a>
              <a
                href="#daftar"
                onClick={(e) => scrollTo(e, "daftar")}
                className="btn-hero-outline"
              >
                📝 Daftar Sekarang
              </a>
            </div>
          </div>

          {/* RIGHT: Stats panel */}
          <div className="hero-right">
            {!pageLoading && (
              <div className="hero-stats-panel">
                <div className="hero-stat-item">
                  <CounterItem target={150} />
                  <div className="hero-stat-label">
                    ANGGOTA
                    <br />
                    AKTIF
                  </div>
                </div>
                <div className="hero-stat-divider"></div>
                <div className="hero-stat-item">
                  <CounterItem target={50} />
                  <div className="hero-stat-label">PRESTASI</div>
                </div>
                <div className="hero-stat-divider"></div>
                <div className="hero-stat-item">
                  <CounterItem target={10} />
                  <div className="hero-stat-label">
                    PROGRAM/
                    <br />
                    TAHUN
                  </div>
                </div>
                <div className="hero-stat-divider"></div>
                <div className="hero-stat-item">
                  <CounterItem target={49} />
                  <div className="hero-stat-label">
                    TAHUN
                    <br />
                    BERDIRI
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Scroll indicator */}
        <div
          className="scroll-indicator"
          onClick={(e) => {
            e.preventDefault();
            const target = document.getElementById("pengumuman");
            if (target) target.scrollIntoView({ behavior: "smooth" });
          }}
          style={{ cursor: "pointer" }}
        >
          <div className="scroll-mouse">
            <div className="scroll-wheel"></div>
          </div>
          <span className="scroll-text">SCROLL</span>
        </div>
      </section>

      {/* Announcements Section */}
      <section
        id="pengumuman"
        ref={addToRevealRefs}
        className="section-padding annc-section reveal"
      >
        <div className="container">
          <div className="text-center mb-5">
            <span className="section-badge">📢 Info Terkini</span>
            <h2 className="section-title">Pengumuman & Berita</h2>
            <div className="section-divider mx-auto"></div>
            <p className="mt-3 text-muted">
              Informasi kegiatan dan pendaftaran terbaru dari Pramuka MAN 1
              INHIL
            </p>
          </div>

          {anncLoading ? (
            <div className="annc-grid">
              <div className="annc-card annc-skeleton"></div>
              <div className="annc-card annc-skeleton"></div>
              <div className="annc-card annc-skeleton"></div>
            </div>
          ) : announcements.length > 0 ? (
            <div className="annc-grid">
              {announcements.map((a, idx) => {
                const isNew =
                  Date.now() - new Date(a.created_at).getTime() <
                  7 * 24 * 3600 * 1000;
                const dateStr = new Date(a.created_at).toLocaleDateString(
                  "id-ID",
                  {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  },
                );

                return (
                  <div
                    key={a.id}
                    className="annc-card"
                    style={{ animationDelay: `${idx * 80}ms` }}
                  >
                    <div className="annc-img-wrap">
                      {a.image_url ? (
                        <img
                          src={
                            a.image_url.startsWith("/uploads")
                              ? `${API_BASE_URL}${a.image_url}`
                              : a.image_url
                          }
                          alt={a.title}
                          loading="lazy"
                          onError={(e) => {
                            (e.target as HTMLElement).parentElement!.innerHTML =
                              '<div class="annc-img-placeholder">📢</div>';
                          }}
                        />
                      ) : (
                        <div className="annc-img-placeholder">📢</div>
                      )}
                    </div>
                    {isNew && <span className="annc-badge-new">🔴 Baru</span>}
                    <div className="annc-body">
                      <div className="annc-date">📅 {dateStr}</div>
                      <div className="annc-title">{a.title}</div>
                      <div className="annc-content">{a.content}</div>
                      {a.link_url && (
                        <a
                          href={a.link_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="annc-link"
                        >
                          📝 {a.link_label || "Daftar Sekarang"} →
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div id="annc-empty" className="text-center py-5">
              <div
                style={{
                  fontSize: "3.5rem",
                  marginBottom: "16px",
                  opacity: 0.4,
                }}
              >
                📭
              </div>
              <p className="text-muted">Belum ada pengumuman saat ini.</p>
            </div>
          )}
        </div>
      </section>

      {/* Tentang Section */}
      <section id="tentang" className="section-padding">
        <div className="container">
          <div className="row g-5 align-items-center mb-5">
            <div ref={addToRevealRefs} className="col-lg-6 reveal-left">
              <span className="section-badge">Profil Organisasi</span>
              <h2 className="section-title">
                Membentuk Karakter
                <br />
                Generasi Muda Unggul
              </h2>
              <div
                className="section-divider"
                style={{ margin: "16px 0 28px" }}
              />
              <p
                className="text-muted mb-4"
                style={{ lineHeight: 1.9, fontSize: "0.97rem" }}
              >
                Gerakan Pramuka MAN 1 INHIL berfokus pada pengembangan diri,
                kepemimpinan, dan pengabdian masyarakat berdasarkan nilai-nilai
                <strong>Tri Satya</strong> dan <strong>Dasa Darma</strong>. Kami
                aktif dalam berbagai kegiatan dari tingkat gugus depan hingga
                nasional.
              </p>

              {/* Values grid */}
              <div className="row g-3 mb-4">
                <div className="col-6">
                  <div className="value-card">
                    <span className="value-icon">⚜️</span>
                    <div className="value-title">Tri Satya</div>
                    <div className="value-desc">
                      Janji setia seorang Pramuka
                    </div>
                  </div>
                </div>
                <div className="col-6">
                  <div className="value-card">
                    <span className="value-icon">🌟</span>
                    <div className="value-title">Dasa Darma</div>
                    <div className="value-desc">10 ketentuan moral Pramuka</div>
                  </div>
                </div>
                <div className="col-6">
                  <div className="value-card">
                    <span className="value-icon">🤝</span>
                    <div className="value-title">Persaudaraan</div>
                    <div className="value-desc">Silih asah, asuh, asih</div>
                  </div>
                </div>
                <div className="col-6">
                  <div className="value-card">
                    <span className="value-icon">🏆</span>
                    <div className="value-title">Prestasi</div>
                    <div className="value-desc">
                      45+ prestasi tingkat regional
                    </div>
                  </div>
                </div>
              </div>

              <div className="d-flex gap-3 flex-wrap">
                <a
                  href="#program"
                  onClick={(e) => scrollTo(e, "program")}
                  className="btn-outline-primary"
                >
                  Lihat Program Kami →
                </a>
                <a
                  href="#gallery"
                  onClick={(e) => scrollTo(e, "gallery")}
                  className="btn-outline-primary"
                >
                  Galeri Kegiatan 📸
                </a>
              </div>
            </div>

            <div ref={addToRevealRefs} className="col-lg-6 reveal-right">
              {/* Custom Image Carousel */}
              <div
                className="carousel slide shadow-lg rounded-4 overflow-hidden"
                style={{ position: "relative" }}
              >
                <div className="carousel-indicators" style={{ zIndex: 15 }}>
                  {carouselImages.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={carouselIndex === idx ? "active" : ""}
                      onClick={() => setCarouselIndex(idx)}
                    />
                  ))}
                </div>
                <div className="carousel-inner">
                  {carouselImages.map((img, idx) => (
                    <div
                      key={idx}
                      className={`carousel-item ${carouselIndex === idx ? "active" : ""}`}
                      style={{
                        display: carouselIndex === idx ? "block" : "none",
                        transition: "opacity 0.6s ease-in-out",
                        opacity: carouselIndex === idx ? 1 : 0,
                      }}
                    >
                      <img
                        src={img.src}
                        className="d-block w-100 carousel-img"
                        alt={img.title}
                      />
                      <div className="carousel-caption d-none d-md-block bg-dark-overlay">
                        <h5>{img.title}</h5>
                        <p>{img.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  className="carousel-control-prev"
                  type="button"
                  onClick={() =>
                    setCarouselIndex((prev) =>
                      prev === 0 ? carouselImages.length - 1 : prev - 1,
                    )
                  }
                >
                  <span className="carousel-control-prev-icon"></span>
                </button>
                <button
                  className="carousel-control-next"
                  type="button"
                  onClick={() =>
                    setCarouselIndex(
                      (prev) => (prev + 1) % carouselImages.length,
                    )
                  }
                >
                  <span className="carousel-control-next-icon"></span>
                </button>
              </div>
            </div>
          </div>

          {/* Timeline Sejarah Singkat */}
          <div ref={addToRevealRefs} className="reveal">
            <div className="timeline-section-header">
              <h4 className="fw-bold" style={{ color: "var(--navy-dark)" }}>
                📅 Sejarah Singkat
              </h4>
              <p className="text-muted" style={{ fontSize: "0.9rem" }}>
                Perjalanan panjang menuju kejayaan
              </p>
            </div>
            <div className="row g-4 mt-2">
              <div className="col-md-3 col-sm-6">
                <div className="timeline-card">
                  <div className="timeline-card-icon">🏕️</div>
                  <div className="timeline-card-year">2018</div>
                  <div className="timeline-card-title">
                    Pendirian Gugus Depan
                  </div>
                  <div className="timeline-card-desc">
                    Gugus Depan 15-009 dan 15-010 resmi dibentuk di MAN 1 INHIL.
                  </div>
                </div>
              </div>
              <div className="col-md-3 col-sm-6">
                <div className="timeline-card">
                  <div className="timeline-card-icon">🥇</div>
                  <div className="timeline-card-year">2020</div>
                  <div className="timeline-card-title">Prestasi Pertama</div>
                  <div className="timeline-card-desc">
                    Juara 1 Lomba Tingkat III se-Kabupaten Indragiri Hilir.
                  </div>
                </div>
              </div>
              <div className="col-md-3 col-sm-6">
                <div className="timeline-card">
                  <div className="timeline-card-icon">🌟</div>
                  <div className="timeline-card-year">2023</div>
                  <div className="timeline-card-title">Jambore Nasional</div>
                  <div className="timeline-card-desc">
                    Pertama kali mengirimkan utusan ke Jambore Nasional.
                  </div>
                </div>
              </div>
              <div className="col-md-3 col-sm-6">
                <div className="timeline-card">
                  <div className="timeline-card-icon">🚀</div>
                  <div className="timeline-card-year">2026</div>
                  <div className="timeline-card-title">Era Digital</div>
                  <div className="timeline-card-desc">
                    Peluncuran website resmi dan digitalisasi sistem organisasi.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Program Section */}
      <section id="program" className="section-padding">
        <div className="container-fluid px-4 px-lg-5">
          <div ref={addToRevealRefs} className="text-center mb-5 reveal">
            <span className="section-badge light">Aktivitas Kami</span>
            <h2 className="section-title text-white">Program Kerja</h2>
            <div className="section-divider mx-auto"></div>
            <p className="mt-3 text-white-50">
              Semua program dirancang untuk membentuk karakter dan keterampilan
              anggota
            </p>
          </div>

          {/* Program Filters */}
          <div ref={addToRevealRefs} className="program-filter-wrap reveal">
            {["all", "Rutin", "Tahunan", "Prestasi"].map((cat) => (
              <button
                key={cat}
                className={`prog-filter-btn ${programFilter === cat ? "active" : ""}`}
                onClick={() => setProgramFilter(cat)}
              >
                {cat === "all" ? "Semua" : cat}
              </button>
            ))}
          </div>

          {/* Program Cards Grid */}
          <div className="program-grid" id="program-grid">
            {filteredPrograms.length > 0 ? (
              filteredPrograms.map((p, idx) => (
                <div
                  key={p.id}
                  className="program-card reveal visible"
                  style={{ animationDelay: `${idx * 80}ms`, cursor: "pointer" }}
                  onClick={() => setSelectedProgram(p)}
                >
                  <span className="program-icon">{p.icon || "🏕️"}</span>
                  <span className="program-category">{p.category}</span>
                  <h4>{p.title}</h4>
                  <p>{p.description}</p>
                  {p.schedule && (
                    <div className="program-schedule">📅 {p.schedule}</div>
                  )}
                </div>
              ))
            ) : (
              <div
                style={{
                  gridColumn: "1/-1",
                  textAlign: "center",
                  color: "rgba(255,255,255,0.5)",
                  padding: "80px 0",
                }}
              >
                <div style={{ fontSize: "3.5rem", marginBottom: "16px" }}>
                  📋
                </div>
                <p>Belum ada program tersedia.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Program Modal (Custom React implementation) */}
      {selectedProgram && (
        <div
          className="modal fade show"
          style={{
            display: "block",
            backgroundColor: "rgba(0,0,0,0.6)",
            zIndex: 1050,
          }}
          tabIndex={-1}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{selectedProgram.title}</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setSelectedProgram(null)}
                ></button>
              </div>
              <div className="modal-body text-center">
                <div
                  className="prog-modal-icon"
                  style={{ fontSize: "4rem", marginBottom: "15px" }}
                >
                  {selectedProgram.icon || "🏕️"}
                </div>
                <div className="mb-3">
                  <span className="prog-modal-cat">
                    {selectedProgram.category}
                  </span>
                </div>
                <p
                  className="text-muted"
                  style={{ fontSize: "0.95rem", lineHeight: 1.6 }}
                >
                  {selectedProgram.description}
                </p>
                {selectedProgram.schedule && (
                  <div
                    className="program-schedule"
                    style={{
                      color: "var(--navy-dark)",
                      justifyContent: "center",
                      marginTop: "15px",
                    }}
                  >
                    📅 Jadwal: {selectedProgram.schedule}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-outline-primary"
                  onClick={() => setSelectedProgram(null)}
                >
                  Tutup
                </button>
                <a
                  href="#daftar"
                  className="btn-primary"
                  onClick={(e) => {
                    setSelectedProgram(null);
                    scrollTo(e, "daftar");
                  }}
                  style={{ padding: "10px 24px", textDecoration: "none" }}
                >
                  Daftar Sekarang
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gallery Section */}
      <section id="gallery" className="section-padding">
        <div className="container">
          <div ref={addToRevealRefs} className="text-center mb-5 reveal">
            <span className="section-badge">Dokumentasi</span>
            <h2 className="section-title">Galeri Kegiatan</h2>
            <div className="section-divider mx-auto"></div>
            <p className="mt-3 text-muted">
              Dokumentasi berbagai kegiatan dan momen berharga kami
            </p>
          </div>

          {/* Gallery Filters */}
          <div ref={addToRevealRefs} className="gallery-filter-wrap reveal">
            {[
              { id: "all", label: "🌐 Semua" },
              { id: "Kemah", label: "🏕️ Kemah" },
              { id: "Lomba", label: "🏆 Lomba" },
              { id: "Bakti Sosial", label: "🤝 Bakti Sosial" },
              { id: "Latihan", label: "💪 Latihan" },
              { id: "Acara", label: "🎉 Acara" },
            ].map((f) => (
              <button
                key={f.id}
                className={`gal-filter-btn ${galleryFilter === f.id ? "active" : ""}`}
                onClick={() => {
                  setGalleryFilter(f.id);
                  setGalleryPage(0);
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Masonry Grid */}
          <div
            className="masonry-grid"
            id="gallery-grid"
            style={{ minHeight: "200px" }}
          >
            {galleryLoading ? (
              <div
                style={{
                  gridColumn: "1/-1",
                  textAlign: "center",
                  padding: "60px",
                }}
              >
                <p>Memuat Galeri...</p>
              </div>
            ) : paginatedGallery.length > 0 ? (
              paginatedGallery.map((item, idx) => (
                <div
                  key={item.id}
                  className="masonry-item"
                  style={{ animationDelay: `${idx * 60}ms`, cursor: "pointer" }}
                  onClick={() => setLightboxIndex(gallery.indexOf(item))}
                >
                  <img
                    src={
                      item.image_url.startsWith("/uploads")
                        ? `${API_BASE_URL}${item.image_url}`
                        : item.image_url
                    }
                    alt={item.title}
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/img/foto1.jpeg";
                    }}
                  />
                  <div className="masonry-overlay">
                    <div className="masonry-title">{item.title}</div>
                    <div className="masonry-cat">{item.category}</div>
                  </div>
                  <div className="masonry-zoom">🔍</div>
                </div>
              ))
            ) : (
              <div
                className="gallery-empty"
                style={{
                  gridColumn: "1/-1",
                  textAlign: "center",
                  padding: "50px 0",
                }}
              >
                <div
                  className="icon"
                  style={{ fontSize: "3rem", marginBottom: "10px" }}
                >
                  🖼️
                </div>
                <p className="text-muted">Belum ada foto di kategori ini.</p>
              </div>
            )}
          </div>

          {/* Load More Button */}
          {hasMoreGallery && (
            <div className="text-center mt-5" id="gallery-load-more-wrap">
              <button
                className="btn-outline-primary"
                onClick={() => setGalleryPage((prev) => prev + 1)}
              >
                📂 Muat Lebih Banyak
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Lightbox Overlay */}
      {lightboxIndex !== null && (
        <div className="lightbox-overlay active" id="lightbox">
          <button
            className="lightbox-close"
            onClick={() => setLightboxIndex(null)}
          >
            ✕
          </button>
          <button
            className="lightbox-nav lightbox-prev"
            onClick={() =>
              setLightboxIndex((prev) =>
                prev !== null && prev > 0 ? prev - 1 : prev,
              )
            }
            disabled={lightboxIndex === 0}
            style={{ opacity: lightboxIndex === 0 ? 0.3 : 1 }}
          >
            ‹
          </button>

          <div className="lightbox-container">
            <img
              src={
                gallery[lightboxIndex].image_url.startsWith("/uploads")
                  ? `${API_BASE_URL}${gallery[lightboxIndex].image_url}`
                  : gallery[lightboxIndex].image_url
              }
              alt={gallery[lightboxIndex].title}
              className="lightbox-img"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/img/foto1.jpeg";
              }}
            />
            <div className="lightbox-caption">
              <strong>{gallery[lightboxIndex].title}</strong>
              {gallery[lightboxIndex].description
                ? ` — ${gallery[lightboxIndex].description}`
                : ""}
              <br />
              <span style={{ color: "var(--gold)", fontSize: "0.8rem" }}>
                {gallery[lightboxIndex].category}
              </span>
            </div>
          </div>

          <button
            className="lightbox-nav lightbox-next"
            onClick={() =>
              setLightboxIndex((prev) =>
                prev !== null && prev < gallery.length - 1 ? prev + 1 : prev,
              )
            }
            disabled={lightboxIndex === gallery.length - 1}
            style={{ opacity: lightboxIndex === gallery.length - 1 ? 0.3 : 1 }}
          >
            ›
          </button>
        </div>
      )}

      {/* Pendaftaran Section */}
      <section id="daftar" className="section-padding">
        <div className="container">
          <div ref={addToRevealRefs} className="text-center mb-5 reveal">
            <span className="section-badge light">Bergabung Bersama Kami</span>
            <h2 className="section-title text-white">Daftar Jadi Anggota</h2>
            <div className="section-divider mx-auto"></div>
            <p className="mt-3 text-white-50">
              Isi form di bawah ini untuk mendaftar sebagai anggota Pramuka MAN
              1 INHIL
            </p>
          </div>

          <div className="row justify-content-center">
            <div ref={addToRevealRefs} className="col-lg-8 reveal">
              <div className="form-card">
                <form onSubmit={handleDaftarSubmit}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">
                        Nama Lengkap <span className="text-gold">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Nama lengkap kamu"
                        value={daftarForm.name}
                        onChange={(e) =>
                          setDaftarForm({ ...daftarForm, name: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">
                        NIS (Nomor Induk Siswa){" "}
                        <span className="text-gold">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Contoh: 12111409202"
                        value={daftarForm.nis}
                        onChange={(e) =>
                          setDaftarForm({ ...daftarForm, nis: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">
                        Kelas <span className="text-gold">*</span>
                      </label>
                      <select
                        className="form-select"
                        value={daftarForm.class_name}
                        onChange={(e) =>
                          setDaftarForm({
                            ...daftarForm,
                            class_name: e.target.value,
                          })
                        }
                        required
                      >
                        <option value="">-- Pilih Kelas --</option>
                        {[
                          "X IPA 1",
                          "X IPA 2",
                          "X IPA 3",
                          "X IPS 1",
                          "X IPS 2",
                          "X IPS 3",
                          "XI IPA 1",
                          "XI IPA 2",
                          "XI IPS 1",
                          "XII IPA 1",
                          "XII IPA 2",
                          "XII IPS 1",
                        ].map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">No. WhatsApp</label>
                      <input
                        type="tel"
                        className="form-control"
                        placeholder="08xxxxxxxxxx"
                        value={daftarForm.phone}
                        onChange={(e) =>
                          setDaftarForm({
                            ...daftarForm,
                            phone: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Alamat</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Alamat tempat tinggal"
                        value={daftarForm.address}
                        onChange={(e) =>
                          setDaftarForm({
                            ...daftarForm,
                            address: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Motivasi Bergabung</label>
                      <textarea
                        className="form-control"
                        rows={3}
                        placeholder="Ceritakan mengapa kamu ingin bergabung..."
                        value={daftarForm.motivation}
                        onChange={(e) =>
                          setDaftarForm({
                            ...daftarForm,
                            motivation: e.target.value,
                          })
                        }
                      ></textarea>
                    </div>
                    <div className="col-12 mt-2">
                      <button
                        type="submit"
                        className="btn-submit"
                        disabled={daftarSubmitting}
                      >
                        {daftarSubmitting
                          ? "Mengirim..."
                          : "📝 Kirim Pendaftaran"}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Kontak Section */}
      <section id="kontak" className="section-padding">
        <div className="container">
          <div ref={addToRevealRefs} className="text-center mb-5 reveal">
            <span className="section-badge">Hubungi Kami</span>
            <h2 className="section-title">Ada Pertanyaan?</h2>
            <div className="section-divider mx-auto"></div>
          </div>

          <div className="row g-5">
            {/* Info Kontak */}
            <div ref={addToRevealRefs} className="col-lg-5 reveal-left">
              <div className="contact-card h-100">
                <h4
                  className="fw-bold mb-4"
                  style={{ color: "var(--navy-dark)" }}
                >
                  Informasi Kontak
                </h4>
                <div className="contact-info-item animate-hover">
                  <div className="contact-icon">
                    <MdLocationOn aria-hidden="true" />
                  </div>
                  <div>
                    <div className="fw-600">Alamat</div>
                    <div
                      className="text-muted"
                      style={{ fontSize: "0.875rem" }}
                    >
                      Jl. pelajar, MAN 1 Indragiri Hilir,
                      <br />
                      Tembilahan, Riau
                    </div>
                  </div>
                </div>
                <div className="contact-info-item animate-hover">
                  <div className="contact-icon">
                    <FaWhatsapp aria-hidden="true" />
                  </div>
                  <div>
                    <div className="fw-600">WhatsApp</div>
                    <div
                      className="text-muted"
                      style={{ fontSize: "0.875rem" }}
                    >
                      +62 853-8949-6882
                    </div>
                  </div>
                </div>
                <div className="contact-info-item animate-hover">
                  <div className="contact-icon">
                    <MdEmail aria-hidden="true" />
                  </div>
                  <div>
                    <div className="fw-600">Email</div>
                    <div
                      className="text-muted"
                      style={{ fontSize: "0.875rem" }}
                    >
                      pramuka@man1inhil.sch.id
                    </div>
                  </div>
                </div>
                <div className="contact-info-item animate-hover">
                  <div className="contact-icon">
                    <MdAccessTime aria-hidden="true" />
                  </div>
                  <div>
                    <div className="fw-600">Jam Aktif</div>
                    <div
                      className="text-muted"
                      style={{ fontSize: "0.875rem" }}
                    >
                      Senin – Sabtu: 08.00 – 16.00 WIB
                    </div>
                  </div>
                </div>

                {/* Social media */}
                <div className="social-links mt-4">
                  <a
                    href="mailto:pramuka@man1inhil.sch.id"
                    className="social-btn social-mail"
                    title="Email"
                    aria-label="Email"
                  >
                    <MdEmail aria-hidden="true" />
                  </a>
                  <a
                    href="https://wa.me/6285389496882"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-btn social-wa"
                    title="WhatsApp"
                    aria-label="WhatsApp"
                  >
                    <FaWhatsapp aria-hidden="true" />
                  </a>
                  <a
                    href="https://instagram.com/pramukaman1inhil"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-btn social-ig"
                    title="Instagram"
                    aria-label="Instagram"
                  >
                    <FaInstagram aria-hidden="true" />
                  </a>
                </div>
              </div>
            </div>

            {/* Form Kontak */}
            <div ref={addToRevealRefs} className="col-lg-7 reveal-right">
              <div className="contact-card h-100">
                <h4
                  className="fw-bold mb-4"
                  style={{ color: "var(--navy-dark)" }}
                >
                  Kirim Pesan
                </h4>
                <form onSubmit={handleKontakSubmit}>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label text-muted">
                        Nama Lengkap
                      </label>
                      <input
                        type="text"
                        className="form-control contact-field"
                        placeholder="Nama kamu"
                        value={kontakForm.name}
                        onChange={(e) =>
                          setKontakForm({ ...kontakForm, name: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label text-muted">Email</label>
                      <input
                        type="email"
                        className="form-control contact-field"
                        placeholder="emailkamu@gmail.com"
                        value={kontakForm.email}
                        onChange={(e) =>
                          setKontakForm({
                            ...kontakForm,
                            email: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div className="col-12 mb-3">
                      <label className="form-label text-muted">
                        Subjek (opsional)
                      </label>
                      <input
                        type="text"
                        className="form-control contact-field"
                        placeholder="Topik pesan..."
                        value={kontakForm.subject}
                        onChange={(e) =>
                          setKontakForm({
                            ...kontakForm,
                            subject: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="col-12 mb-3">
                      <label className="form-label text-muted">Pesan</label>
                      <textarea
                        className="form-control contact-field"
                        rows={5}
                        placeholder="Tulis pesanmu di sini..."
                        value={kontakForm.message}
                        onChange={(e) =>
                          setKontakForm({
                            ...kontakForm,
                            message: e.target.value,
                          })
                        }
                        required
                      ></textarea>
                    </div>
                    <div className="col-12">
                      <button
                        type="submit"
                        className="btn-primary w-100"
                        style={{ padding: "14px" }}
                        disabled={kontakSubmitting}
                      >
                        {kontakSubmitting
                          ? "Mengirim..."
                          : "📨 Kirim Pesan Sekarang"}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contributors Section */}
      <section id="kontributor" className="section-padding">
        <div className="container">
          <div ref={addToRevealRefs} className="text-center mb-5 reveal">
            <span className="section-badge">Kontributor</span>
            <h2 className="section-title">Tim Pembuat Website</h2>
            <div className="section-divider mx-auto"></div>
            <p className="mt-3 text-muted">
              Empat orang yang merancang, mendesain, dan mengembangkan situs
              organisasi ini.
            </p>
          </div>

          <div ref={addToRevealRefs} className="contributor-slider reveal">
            <div className="contributor-track">
              {contributorLoop.map((person, index) => (
                <div
                  key={`${person.id}-${index}`}
                  className="contributor-slide"
                >
                  <div className="contributor-card">
                    <div className="contributor-image">
                      <img src={person.image} alt={person.name} />
                    </div>
                    <div className="contributor-info">
                      <h5>{person.name}</h5>
                      <p>{person.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer>
        <div className="container">
          <div className="row g-4">
            <div className="col-lg-4">
              <div className="footer-brand">
                <div className="footer-logo">
                  <img
                    src="/img/logo.png"
                    alt="Logo"
                    className="footer-logo-img"
                  />
                  <span className="footer-logo-text">PRAMUKA MAN 1 INHIL</span>
                </div>
                <p className="footer-desc">
                  Gugus Depan 15-009 – 15-010 MAN 1 Indragiri Hilir. Membentuk
                  generasi muda yang tangguh, berakhlak, dan berprestasi
                  berdasarkan nilai-nilai Tri Satya dan Dasa Darma.
                </p>
                <div className="social-links mt-3">
                  <a
                    href="mailto:pramuka@man1inhil.sch.id"
                    className="social-btn social-mail"
                    title="Email"
                    aria-label="Email"
                  >
                    <MdEmail aria-hidden="true" />
                  </a>
                  <a
                    href="https://wa.me/6285389496882"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-btn social-wa"
                    title="WhatsApp"
                    aria-label="WhatsApp"
                  >
                    <FaWhatsapp aria-hidden="true" />
                  </a>
                  <a
                    href="https://instagram.com/pramukaman1inhil"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-btn social-ig"
                    title="Instagram"
                    aria-label="Instagram"
                  >
                    <FaInstagram aria-hidden="true" />
                  </a>
                </div>
              </div>
            </div>

            <div className="col-lg-2 col-6">
              <div className="footer-title">Navigasi</div>
              <ul className="footer-links">
                <li>
                  <a href="#beranda" onClick={(e) => scrollTo(e, "beranda")}>
                    Beranda
                  </a>
                </li>
                <li>
                  <a href="#tentang" onClick={(e) => scrollTo(e, "tentang")}>
                    Tentang
                  </a>
                </li>
                <li>
                  <a href="#program" onClick={(e) => scrollTo(e, "program")}>
                    Program
                  </a>
                </li>
                <li>
                  <a href="#gallery" onClick={(e) => scrollTo(e, "gallery")}>
                    Galeri
                  </a>
                </li>
                <li>
                  <a href="#daftar" onClick={(e) => scrollTo(e, "daftar")}>
                    Daftar
                  </a>
                </li>
                <li>
                  <a href="#kontak" onClick={(e) => scrollTo(e, "kontak")}>
                    Kontak
                  </a>
                </li>
              </ul>
            </div>

            <div className="col-lg-3 col-6">
              <div className="footer-title">Program</div>
              <ul className="footer-links">
                <li>
                  <a href="#program" onClick={(e) => scrollTo(e, "program")}>
                    🤝 Bakti Sosial
                  </a>
                </li>
                <li>
                  <a href="#program" onClick={(e) => scrollTo(e, "program")}>
                    🏕️ Latihan Rutin
                  </a>
                </li>
                <li>
                  <a href="#program" onClick={(e) => scrollTo(e, "program")}>
                    🔥 Kemah Tahunan
                  </a>
                </li>
                <li>
                  <a href="#program" onClick={(e) => scrollTo(e, "program")}>
                    ⚜️ Pramuka Garuda
                  </a>
                </li>
                <li>
                  <a href="#program" onClick={(e) => scrollTo(e, "program")}>
                    🏆 Lomba Tingkat
                  </a>
                </li>
                <li>
                  <a href="#program" onClick={(e) => scrollTo(e, "program")}>
                    🌍 Jambore
                  </a>
                </li>
              </ul>
            </div>

            <div className="col-lg-3">
              <div className="footer-title">Kontak</div>
              <ul className="footer-links">
                <li>
                  <a href="#kontak" onClick={(e) => scrollTo(e, "kontak")}>
                    📍 Tembilahan, Riau
                  </a>
                </li>
                <li>
                  <a
                    href="https://wa.me/6285389496882"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    📱 +62 853-8949-6882
                  </a>
                </li>
                <li>
                  <a href="mailto:pramuka@man1inhil.sch.id">
                    Email pramuka@man1inhil.sch.id
                  </a>
                </li>
                <li>
                  <a
                    href="https://instagram.com/pramukaman1inhil"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    IG @pramukaman1inhil
                  </a>
                </li>
                <li>
                  <a href="#kontak" onClick={(e) => scrollTo(e, "kontak")}>
                    Jam aktif Senin-Sabtu, 08:00-16:00
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <hr className="footer-divider" />

          <div className="footer-bottom">
            <span className="footer-copy">
              © 2026 <strong>Pramuka MAN 1 INHIL</strong>. All Rights Reserved.
            </span>
            <span className="footer-credit">
              Dibuat dengan ❤️ oleh{" "}
              <a href="#beranda" onClick={(e) => scrollTo(e, "beranda")}>
                TIM WEB GACOR
              </a>
            </span>
          </div>
        </div>
      </footer>
    </>
  );
};
