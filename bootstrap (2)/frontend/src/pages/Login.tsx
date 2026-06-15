import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useToast } from "../components/ToastContext";

const isLocalhost = ["localhost", "127.0.0.1", "::1"].includes(
  window.location.hostname,
);
const API_BASE_URL = isLocalhost ? "http://localhost:8001" : "";
const API_URL = `${API_BASE_URL}/api`;

type Mode = "login" | "register";

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "rgba(255, 255, 255, 0.05)",
  border: "1.5px solid rgba(255, 255, 255, 0.1)",
  borderRadius: "12px",
  padding: "12px 16px",
  color: "white",
  fontSize: "0.9rem",
  outline: "none",
  transition: "all 0.2s",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.78rem",
  fontWeight: 700,
  color: "rgba(255, 255, 255, 0.72)",
  marginBottom: "8px",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

export const Login: React.FC = () => {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nis, setNis] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const saveSession = (data: any) => {
    localStorage.setItem("adminToken", data.access_token);
    localStorage.setItem("adminEmail", data.user_email);
    localStorage.setItem("userRole", data.is_admin ? "admin" : "member");
    if (data.member_id) {
      localStorage.setItem("memberId", data.member_id.toString());
    } else {
      localStorage.removeItem("memberId");
    }
  };

  const handleLogin = async () => {
    const res = await axios.post(`${API_URL}/auth/login`, { email, password });
    saveSession(res.data);
    showToast("Login berhasil. Selamat datang kembali.", "success");
    navigate(res.data.is_admin ? "/admin" : "/member");
  };

  const handleRegister = async () => {
    const res = await axios.post(`${API_URL}/auth/register`, {
      email,
      password,
      nis,
    });
    saveSession(res.data);
    showToast("Akun berhasil dibuat. Kamu sudah masuk.", "success");
    navigate("/member");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (mode === "login") {
        await handleLogin();
      } else {
        await handleRegister();
      }
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      const errMsg = Array.isArray(detail)
        ? detail.map((item: any) => item.msg).join(", ")
        : detail || err.message || "Terjadi kesalahan";
      showToast(`Gagal: ${errMsg}`, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const switchMode = (nextMode: Mode) => {
    setMode(nextMode);
    setPassword("");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "radial-gradient(circle at center, #002548 0%, #001220 100%)",
        fontFamily: "'Inter', sans-serif",
        padding: "20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: mode === "register" ? "520px" : "420px",
          background: "rgba(255, 255, 255, 0.03)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "1px solid rgba(255, 215, 0, 0.15)",
          borderRadius: "24px",
          padding: "36px 30px",
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.4)",
          textAlign: "center",
          animation: "fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        }}
      >
        <div style={{ marginBottom: "22px" }}>
          <img
            src="/img/logo.png"
            alt="Logo"
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              background: "white",
              padding: "6px",
              border: "2px solid #ffd700",
              boxShadow: "0 0 20px rgba(255, 215, 0, 0.4)",
            }}
          />
        </div>

        <h3
          style={{
            color: "white",
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 800,
            marginBottom: "8px",
          }}
        >
          {mode === "login" ? "LOGIN" : "DAFTAR AKUN"}
        </h3>
        <p
          style={{
            color: "rgba(255, 255, 255, 0.55)",
            fontSize: "0.85rem",
            marginBottom: "28px",
          }}
        >
          Gugus Depan MAN 1 Indragiri Hilir
        </p>

        <form onSubmit={handleSubmit} style={{ textAlign: "left" }}>
          {mode === "register" && (
            <div style={{ marginBottom: "18px" }}>
              <label style={labelStyle}>NIS Anggota</label>
              <input
                type="text"
                placeholder="NIS yang sudah diterima admin"
                value={nis}
                onChange={(e) => setNis(e.target.value)}
                required
                style={inputStyle}
              />
            </div>
          )}

          <div style={{ marginBottom: "18px" }}>
            <label style={labelStyle}>Email Member</label>
            <input
              type="email"
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: mode === "register" ? "18px" : "28px" }}>
            <label style={labelStyle}>Password</label>
            <input
              type="password"
              placeholder="Minimal 8 karakter"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              style={inputStyle}
            />
          </div>

          {mode === "register" && (
            <p
              style={{
                color: "rgba(255,255,255,0.52)",
                fontSize: "0.82rem",
                lineHeight: 1.6,
                margin: "0 0 24px",
              }}
            >
              Daftar akun hanya untuk anggota yang pendaftarannya sudah
              diterima admin. Kalau belum mendaftar anggota, gunakan form
              pendaftaran di halaman utama.
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: "100%",
              background: "linear-gradient(135deg, #c9a800, #ffd700)",
              color: "#001220",
              border: "none",
              borderRadius: "12px",
              padding: "14px",
              fontSize: "0.95rem",
              fontWeight: 800,
              cursor: submitting ? "wait" : "pointer",
              boxShadow: "0 4px 15px rgba(255, 215, 0, 0.3)",
              transition: "all 0.25s",
              opacity: submitting ? 0.75 : 1,
            }}
          >
            {submitting
              ? "Memproses..."
              : mode === "login"
                ? "Masuk Sekarang"
                : "Daftar dan Masuk"}
          </button>
        </form>

        <div
          style={{
            marginTop: "22px",
            color: "rgba(255, 255, 255, 0.62)",
            fontSize: "0.85rem",
          }}
        >
          {mode === "login" ? "Belum punya akun? " : "Sudah punya akun? "}
          <button
            type="button"
            onClick={() => switchMode(mode === "login" ? "register" : "login")}
            style={{
              background: "none",
              border: "none",
              color: "#ffd700",
              cursor: "pointer",
              fontWeight: 800,
              padding: 0,
              textDecoration: "underline",
            }}
          >
            {mode === "login" ? "Daftar di sini" : "Masuk di sini"}
          </button>
        </div>

        <div style={{ marginTop: "18px" }}>
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              navigate("/");
            }}
            style={{
              color: "rgba(255, 255, 255, 0.42)",
              fontSize: "0.8rem",
              textDecoration: "none",
              transition: "color 0.2s",
            }}
          >
            Kembali ke Beranda
          </a>
        </div>
      </div>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        input::placeholder, textarea::placeholder {
          color: rgba(255, 255, 255, 0.35);
        }
      `}</style>
    </div>
  );
};
