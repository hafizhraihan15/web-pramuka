import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useToast } from "../components/ToastContext";

const isLocalhost = ["localhost", "127.0.0.1", "::1"].includes(
  window.location.hostname,
);
const API_URL = isLocalhost ? "http://localhost:8000/api" : "/api";

type MemberStatus = "pending" | "accepted" | "rejected";
type AttendanceStatus = "Hadir" | "Izin" | "Alpha";
type Panel =
  | "overview"
  | "members"
  | "programs"
  | "attendance"
  | "letters"
  | "gallery"
  | "news"
  | "messages";

interface Member {
  id: number;
  name: string;
  nis: string;
  class_name: string;
  phone?: string;
  address?: string;
  motivation?: string;
  status: MemberStatus;
  created_at: string;
}

interface Program {
  id: number;
  title: string;
  category: string;
  icon: string;
  description: string;
  schedule?: string;
}

interface AttendanceRecord {
  id: number;
  member_id: number;
  member_name?: string;
  member_class?: string;
  attendance_date: string;
  status: AttendanceStatus;
  note?: string;
}

interface LetterRequest {
  id: number;
  member_id: number;
  letter_type: string;
  purpose: string;
  recipient?: string;
  status: "Pending" | "Selesai";
  created_at: string;
}

interface ProgramRegistration {
  id: number;
  member_id: number;
  member_name?: string;
  member_class?: string;
  program_id: number;
  program_title?: string;
  status: MemberStatus;
  registered_at: string;
}

interface GalleryItem {
  id: number;
  title: string;
  category: string;
  description?: string;
  image_url: string;
  uploaded_by?: string;
  created_at: string;
}

interface Announcement {
  id: number;
  title: string;
  content: string;
  image_url?: string;
  link_url?: string;
  link_label: string;
  is_active: boolean;
  created_by?: string;
  created_at: string;
}

interface ContactMessage {
  id: number;
  name: string;
  email: string;
  subject?: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

const shellStyle: React.CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  background: "#eef3f8",
  color: "#102033",
  fontFamily: "'Inter', sans-serif",
};

const cardStyle: React.CSSProperties = {
  background: "#ffffff",
  border: "1px solid #dfe7f0",
  borderRadius: "8px",
  boxShadow: "0 8px 24px rgba(16, 32, 51, 0.08)",
};

const buttonBase: React.CSSProperties = {
  border: "none",
  borderRadius: "8px",
  padding: "9px 12px",
  fontWeight: 800,
  cursor: "pointer",
};

const statusColor = (status: string) => {
  if (status === "accepted" || status === "Hadir" || status === "Selesai") {
    return { bg: "#dcfce7", fg: "#166534" };
  }
  if (status === "rejected" || status === "Alpha") {
    return { bg: "#fee2e2", fg: "#991b1b" };
  }
  return { bg: "#fef3c7", fg: "#92400e" };
};

export const Admin: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const token = localStorage.getItem("adminToken");
  const role = localStorage.getItem("userRole") || "member";
  const memberId = localStorage.getItem("memberId");
  const userEmail = localStorage.getItem("adminEmail") || "";
  const isAdmin = role === "admin";

  const [activePanel, setActivePanel] = useState<Panel>("overview");
  const [loading, setLoading] = useState(false);
  const [memberInfo, setMemberInfo] = useState<Member | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [letters, setLetters] = useState<LetterRequest[]>([]);
  const [programRegistrations, setProgramRegistrations] = useState<
    ProgramRegistration[]
  >([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [galleryForm, setGalleryForm] = useState({
    title: "",
    category: "Kegiatan",
    description: "",
    photo: null as File | null,
  });
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [announcementEditingId, setAnnouncementEditingId] = useState<number | null>(null);
  const [announcementForm, setAnnouncementForm] = useState({
    title: "",
    content: "",
    image_url: "",
    link_url: "",
    link_label: "Daftar Sekarang",
    is_active: true,
    photo: null as File | null,
  });
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [attendanceStatus, setAttendanceStatus] =
    useState<AttendanceStatus>("Hadir");
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);
  const [letterForm, setLetterForm] = useState({
    letter_type: "Surat Izin",
    purpose: "",
    recipient: "",
  });

  const headers = useMemo(
    () => ({ headers: { Authorization: `Bearer ${token}` } }),
    [token],
  );

  const logout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminEmail");
    localStorage.removeItem("memberId");
    localStorage.removeItem("userRole");
    navigate("/login");
  };

  const goHome = () => {
    navigate("/");
  };

  const loadData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      if (isAdmin) {
        const [
          membersRes,
          programsRes,
          attendanceRes,
          lettersRes,
          regsRes,
          galleryRes,
          announcementsRes,
          messagesRes,
        ] =
          await Promise.all([
            axios.get(`${API_URL}/members/`, headers),
            axios.get(`${API_URL}/programs/all`, headers),
            axios.get(`${API_URL}/attendance/`, headers),
            axios.get(`${API_URL}/letters/`, headers),
            axios.get(`${API_URL}/programs/registrations/all`, headers),
            axios.get(`${API_URL}/gallery/?limit=100`),
            axios.get(`${API_URL}/announcements/all`, headers),
            axios.get(`${API_URL}/messages/`, headers),
          ]);
        setMembers(membersRes.data);
        setPrograms(programsRes.data);
        setAttendance(attendanceRes.data);
        setLetters(lettersRes.data);
        setProgramRegistrations(regsRes.data);
        setGallery(galleryRes.data);
        setAnnouncements(announcementsRes.data);
        setMessages(messagesRes.data);
      } else if (memberId) {
        const [memberRes, programsRes, attendanceRes, lettersRes, regRes] =
          await Promise.all([
            axios.get(`${API_URL}/members/${memberId}`, headers),
            axios.get(`${API_URL}/programs/`),
            axios.get(`${API_URL}/attendance/${memberId}`, headers),
            axios.get(`${API_URL}/letters/${memberId}`, headers),
            axios.get(`${API_URL}/programs/${memberId}/registrations`, headers),
          ]);
        setMemberInfo(memberRes.data);
        setPrograms(programsRes.data);
        setAttendance(attendanceRes.data);
        setLetters(lettersRes.data);
        setProgramRegistrations(regRes.data);
      }
    } catch (err: any) {
      if (err.response?.status === 401) logout();
      else showToast(err.response?.data?.detail || err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token || (!isAdmin && !memberId)) {
      showToast("Silakan login terlebih dahulu.", "warning");
      navigate("/login");
      return;
    }
    loadData();
  }, [token, isAdmin, memberId]);

  useEffect(() => {
    const updateScreen = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", updateScreen);
    return () => window.removeEventListener("resize", updateScreen);
  }, []);

  const updateMemberStatus = async (id: number, status: MemberStatus) => {
    await runAction(`member-${id}-${status}`, async () => {
      await axios.patch(`${API_URL}/members/${id}`, { status }, headers);
      showToast("Status anggota diperbarui.", "success");
      await loadData();
    });
  };

  const updateProgramRegistration = async (id: number, status: MemberStatus) => {
    await runAction(`program-registration-${id}-${status}`, async () => {
      await axios.patch(`${API_URL}/programs/registrations/${id}`, { status }, headers);
      showToast("Status pendaftaran kegiatan diperbarui.", "success");
      await loadData();
    });
  };

  const updateLetterStatus = async (id: number, status: "Pending" | "Selesai") => {
    await runAction(`letter-${id}-${status}`, async () => {
      await axios.put(`${API_URL}/letters/${id}`, null, {
        ...headers,
        params: { status },
      });
      showToast("Status surat diperbarui.", "success");
      await loadData();
    });
  };

  const addAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberId) return;
    await runAction("admin-attendance", async () => {
      const today = new Date().toISOString().split("T")[0];
      await axios.post(
        `${API_URL}/attendance/${selectedMemberId}`,
        { attendance_date: today, status: attendanceStatus },
        headers,
      );
      showToast("Absensi berhasil dicatat.", "success");
      await loadData();
    });
  };

  const memberAttendanceNow = async () => {
    if (!memberId) return;
    await runAction("member-attendance", async () => {
      const today = new Date().toISOString().split("T")[0];
      await axios.post(
        `${API_URL}/attendance/${memberId}`,
        { attendance_date: today, status: "Hadir" },
        headers,
      );
      showToast("Absensi hari ini tercatat.", "success");
      await loadData();
    });
  };

  const registerProgram = async (programId: number) => {
    if (!memberId) return;
    await runAction(`member-program-${programId}`, async () => {
      await axios.post(`${API_URL}/programs/${programId}/register/${memberId}`, {}, headers);
      showToast("Pendaftaran kegiatan dikirim dan menunggu persetujuan admin.", "success");
      await loadData();
    });
  };

  const submitLetter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberId) return;
    await runAction("member-letter", async () => {
      await axios.post(`${API_URL}/letters/${memberId}`, letterForm, headers);
      setLetterForm({ letter_type: "Surat Izin", purpose: "", recipient: "" });
      showToast("Permintaan surat berhasil dikirim.", "success");
      await loadData();
    });
  };

  const uploadGallery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!galleryForm.photo) {
      showToast("Pilih foto terlebih dahulu.", "warning");
      return;
    }
    await runAction("gallery-upload", async () => {
      const form = new FormData();
      form.append("title", galleryForm.title);
      form.append("category", galleryForm.category);
      if (galleryForm.description) form.append("description", galleryForm.description);
      form.append("photo", galleryForm.photo as File);
      await axios.post(`${API_URL}/gallery/`, form, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      setGalleryForm({
        title: "",
        category: "Kegiatan",
        description: "",
        photo: null,
      });
      showToast("Foto berhasil diupload.", "success");
      await loadData();
    });
  };

  const deleteGallery = async (id: number) => {
    await runAction(`gallery-delete-${id}`, async () => {
      await axios.delete(`${API_URL}/gallery/${id}`, headers);
      showToast("Foto berhasil dihapus.", "success");
      await loadData();
    });
  };

  const saveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    await runAction("announcement-save", async () => {
      const form = new FormData();
      form.append("title", announcementForm.title);
      form.append("content", announcementForm.content);
      if (announcementForm.image_url) form.append("image_url", announcementForm.image_url);
      if (announcementForm.link_url) form.append("link_url", announcementForm.link_url);
      form.append("link_label", announcementForm.link_label || "Daftar Sekarang");
      form.append("is_active", String(announcementForm.is_active));
      if (announcementForm.photo) form.append("photo", announcementForm.photo);
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      };
      if (announcementEditingId) {
        await axios.put(`${API_URL}/announcements/${announcementEditingId}/upload`, form, config);
        showToast("Berita berhasil diperbarui.", "success");
      } else {
        await axios.post(`${API_URL}/announcements/upload`, form, config);
        showToast("Berita berhasil dibuat.", "success");
      }
      resetAnnouncementForm();
      await loadData();
    });
  };

  const editAnnouncement = (item: Announcement) => {
    setAnnouncementEditingId(item.id);
    setAnnouncementForm({
      title: item.title,
      content: item.content,
      image_url: item.image_url || "",
      link_url: item.link_url || "",
      link_label: item.link_label || "Daftar Sekarang",
      is_active: item.is_active,
      photo: null,
    });
    setActivePanel("news");
  };

  const resetAnnouncementForm = () => {
    setAnnouncementEditingId(null);
    setAnnouncementForm({
      title: "",
      content: "",
      image_url: "",
      link_url: "",
      link_label: "Daftar Sekarang",
      is_active: true,
      photo: null,
    });
  };

  const toggleAnnouncement = async (item: Announcement) => {
    await runAction(`announcement-toggle-${item.id}`, async () => {
      await axios.put(
        `${API_URL}/announcements/${item.id}`,
        {
          title: item.title,
          content: item.content,
          image_url: item.image_url || null,
          link_url: item.link_url || null,
          link_label: item.link_label || "Daftar Sekarang",
          is_active: !item.is_active,
        },
        headers,
      );
      showToast("Status berita diperbarui.", "success");
      await loadData();
    });
  };

  const deleteAnnouncement = async (id: number) => {
    await runAction(`announcement-delete-${id}`, async () => {
      await axios.delete(`${API_URL}/announcements/${id}`, headers);
      showToast("Berita berhasil dihapus.", "success");
      if (announcementEditingId === id) resetAnnouncementForm();
      await loadData();
    });
  };

  const markMessageRead = async (id: number) => {
    await runAction(`message-read-${id}`, async () => {
      await axios.patch(`${API_URL}/messages/${id}/read`, {}, headers);
      showToast("Pesan ditandai sudah dibaca.", "success");
      await loadData();
    });
  };

  const deleteMessage = async (id: number) => {
    if (!window.confirm("Hapus pesan ini?")) return;
    await runAction(`message-delete-${id}`, async () => {
      await axios.delete(`${API_URL}/messages/${id}`, headers);
      showToast("Pesan dihapus.", "success");
      await loadData();
    });
  };

  const runAction = async (key: string, action: () => Promise<void>) => {
    if (actionBusy) return;
    setActionBusy(key);
    try {
      await action();
    } catch (err: any) {
      showToast(err.response?.data?.detail || err.message || "Aksi gagal dijalankan", "error");
    } finally {
      setActionBusy(null);
    }
  };

  const pendingMembers = members.filter((member) => member.status === "pending");
  const pendingRegistrations = programRegistrations.filter(
    (registration) => registration.status === "pending",
  );
  const pendingLetters = letters.filter((letter) => letter.status === "Pending");

  const navItems: Array<{ id: Panel; label: string }> = isAdmin
    ? [
        { id: "overview", label: "Ringkasan" },
        { id: "members", label: "Pendaftar" },
        { id: "programs", label: "Kegiatan" },
        { id: "attendance", label: "Absensi" },
        { id: "letters", label: "Surat" },
        { id: "gallery", label: "Galeri" },
        { id: "news", label: "Berita" },
        { id: "messages", label: "Pesan" },
      ]
    : [
        { id: "overview", label: "Ringkasan" },
        { id: "programs", label: "Kegiatan" },
        { id: "attendance", label: "Absensi" },
        { id: "letters", label: "Surat" },
      ];

  return (
    <div
      style={{
        ...shellStyle,
        flexDirection: isMobile ? "column" : "row",
      }}
    >
      <aside
        style={{
          width: isMobile ? "100%" : "260px",
          background: "#102033",
          color: "white",
          padding: isMobile ? "14px 12px" : "22px 14px",
          minHeight: isMobile ? "auto" : "100vh",
          position: "sticky",
          top: 0,
          zIndex: 20,
        }}
      >
        <div
          style={{
            padding: isMobile ? "0 4px 12px" : "0 10px 22px",
            borderBottom: "1px solid #2b3d52",
          }}
        >
          <div style={{ fontWeight: 900, fontSize: "1rem" }}>
            {isAdmin ? "DEWAN AMBALAN" : "WARGA AMBALAN"}
          </div>
          <div style={{ color: "#9fb0c3", fontSize: "0.82rem", marginTop: "6px" }}>
            {isAdmin ? userEmail : memberInfo?.name || userEmail}
          </div>
        </div>
        <nav
          style={{
            display: "grid",
            gridTemplateColumns: isMobile
              ? "repeat(auto-fit, minmax(96px, 1fr))"
              : "1fr",
            gap: "8px",
            marginTop: isMobile ? "12px" : "20px",
          }}
        >
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActivePanel(item.id)}
              style={{
                ...buttonBase,
                textAlign: isMobile ? "center" : "left",
                background: activePanel === item.id ? "#f6c945" : "transparent",
                color: activePanel === item.id ? "#102033" : "#d7e2ee",
                fontSize: isMobile ? "0.82rem" : "0.92rem",
              }}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <button
          onClick={goHome}
          style={{
            ...buttonBase,
            width: "100%",
            marginTop: isMobile ? "12px" : "24px",
            background: "#dbeafe",
            color: "#1e3a8a",
          }}
        >
          Kembali ke Beranda
        </button>
        <button
          onClick={logout}
          style={{
            ...buttonBase,
            width: "100%",
            marginTop: "10px",
            background: "#fee2e2",
            color: "#991b1b",
          }}
        >
          Logout
        </button>
      </aside>

      <main
        style={{
          flex: 1,
          padding: isMobile ? "14px" : "28px",
          overflowX: "hidden",
          width: "100%",
        }}
      >
        <header
          style={{
            ...cardStyle,
            padding: isMobile ? "16px" : "22px",
            marginBottom: isMobile ? "14px" : "22px",
            display: "flex",
            justifyContent: "space-between",
            gap: "12px",
            alignItems: isMobile ? "flex-start" : "center",
            flexDirection: isMobile ? "column" : "row",
          }}
        >
          <div>
            <div style={{ color: "#64748b", fontWeight: 800, fontSize: "0.8rem" }}>
              PRAMUKA MAN 1 INHIL
            </div>
            <h1
              style={{
                margin: "4px 0 0",
                fontSize: isMobile ? "1.3rem" : "1.7rem",
                color: "#102033",
              }}
            >
              {isAdmin ? "Dashboard Admin" : "Dashboard Member"}
            </h1>
          </div>
          {loading && <span style={{ color: "#64748b", fontWeight: 700 }}>Memuat...</span>}
        </header>

        {activePanel === "overview" && (
          <section>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile
                  ? "repeat(2, minmax(0, 1fr))"
                  : "repeat(auto-fit, minmax(180px, 1fr))",
                gap: isMobile ? "10px" : "16px",
              }}
            >
              {(isAdmin
                ? [
                    ["Pendaftar Baru", pendingMembers.length],
                    ["Pengajuan Kegiatan", pendingRegistrations.length],
                    ["Surat Pending", pendingLetters.length],
                    ["Total Anggota", members.length],
                    ["Foto Galeri", gallery.length],
                    ["Berita Aktif", announcements.filter((item) => item.is_active).length],
                    ["Pesan Baru", messages.filter((item) => !item.is_read).length],
                  ]
                : [
                    [
                      "Program Diikuti",
                      programRegistrations.filter((item) => item.status === "accepted").length,
                    ],
                    ["Riwayat Absensi", attendance.length],
                    ["Pengajuan Surat", letters.length],
                    ["Status", memberInfo?.status || "-"],
                  ]
              ).map(([label, value]) => (
                <div key={label} style={{ ...cardStyle, padding: isMobile ? "14px" : "22px" }}>
                  <div style={{ color: "#64748b", fontWeight: 800, fontSize: "0.82rem" }}>
                    {label}
                  </div>
                  <div
                    style={{
                      fontSize: isMobile ? "1.45rem" : "2rem",
                      fontWeight: 900,
                      marginTop: "8px",
                      wordBreak: "break-word",
                    }}
                  >
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {activePanel === "members" && isAdmin && (
          <AdminMembers members={members} updateMemberStatus={updateMemberStatus} />
        )}

        {activePanel === "programs" &&
          (isAdmin ? (
            <AdminPrograms
              registrations={programRegistrations}
              updateProgramRegistration={updateProgramRegistration}
            />
          ) : (
            <MemberPrograms
              programs={programs}
              registrations={programRegistrations}
              registerProgram={registerProgram}
              actionBusy={actionBusy}
            />
          ))}

        {activePanel === "attendance" &&
          (isAdmin ? (
            <AdminAttendance
              members={members.filter((member) => member.status === "accepted")}
              attendance={attendance}
              selectedMemberId={selectedMemberId}
              setSelectedMemberId={setSelectedMemberId}
              attendanceStatus={attendanceStatus}
              setAttendanceStatus={setAttendanceStatus}
              addAttendance={addAttendance}
            />
          ) : (
            <MemberAttendance
              attendance={attendance}
              memberAttendanceNow={memberAttendanceNow}
              actionBusy={actionBusy}
            />
          ))}

        {activePanel === "letters" &&
          (isAdmin ? (
            <AdminLetters letters={letters} updateLetterStatus={updateLetterStatus} />
          ) : (
            <MemberLetters
              letters={letters}
              letterForm={letterForm}
              setLetterForm={setLetterForm}
              submitLetter={submitLetter}
              actionBusy={actionBusy}
            />
          ))}

        {activePanel === "gallery" && isAdmin && (
          <AdminGallery
            gallery={gallery}
            galleryForm={galleryForm}
            setGalleryForm={setGalleryForm}
            uploadGallery={uploadGallery}
            deleteGallery={deleteGallery}
            actionBusy={actionBusy}
          />
        )}

        {activePanel === "news" && isAdmin && (
          <AdminNews
            announcements={announcements}
            announcementForm={announcementForm}
            setAnnouncementForm={setAnnouncementForm}
            announcementEditingId={announcementEditingId}
            saveAnnouncement={saveAnnouncement}
            editAnnouncement={editAnnouncement}
            resetAnnouncementForm={resetAnnouncementForm}
            toggleAnnouncement={toggleAnnouncement}
            deleteAnnouncement={deleteAnnouncement}
            actionBusy={actionBusy}
          />
        )}

        {activePanel === "messages" && isAdmin && (
          <AdminMessages
            messages={messages}
            markMessageRead={markMessageRead}
            deleteMessage={deleteMessage}
            actionBusy={actionBusy}
          />
        )}
      </main>
    </div>
  );
};

function Badge({ status }: { status: string }) {
  const colors = statusColor(status);
  return (
    <span
      style={{
        background: colors.bg,
        color: colors.fg,
        padding: "4px 9px",
        borderRadius: "999px",
        fontSize: "0.78rem",
        fontWeight: 900,
      }}
    >
      {status}
    </span>
  );
}

function AdminMembers({
  members,
  updateMemberStatus,
}: {
  members: Member[];
  updateMemberStatus: (id: number, status: MemberStatus) => void;
}) {
  return (
    <GridList
      items={members}
      empty="Belum ada pendaftar."
      render={(member) => (
        <div style={{ ...cardStyle, padding: "18px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
            <strong>{member.name}</strong>
            <Badge status={member.status} />
          </div>
          <p style={{ color: "#64748b", margin: "8px 0" }}>
            NIS {member.nis} · {member.class_name}
          </p>
          <p style={{ margin: "0 0 14px", color: "#334155" }}>
            {member.motivation || "Tidak ada motivasi tertulis."}
          </p>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <ActionButton label="Terima" tone="success" onClick={() => updateMemberStatus(member.id, "accepted")} />
            <ActionButton label="Tolak" tone="danger" onClick={() => updateMemberStatus(member.id, "rejected")} />
          </div>
        </div>
      )}
    />
  );
}

function AdminPrograms({
  registrations,
  updateProgramRegistration,
}: {
  registrations: ProgramRegistration[];
  updateProgramRegistration: (id: number, status: MemberStatus) => void;
}) {
  return (
    <GridList
      items={registrations}
      empty="Belum ada pendaftaran kegiatan."
      render={(registration) => (
        <div style={{ ...cardStyle, padding: "18px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
            <strong>{registration.program_title}</strong>
            <Badge status={registration.status} />
          </div>
          <p style={{ color: "#64748b", margin: "8px 0 14px" }}>
            {registration.member_name} · {registration.member_class}
          </p>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <ActionButton label="Terima" tone="success" onClick={() => updateProgramRegistration(registration.id, "accepted")} />
            <ActionButton label="Tolak" tone="danger" onClick={() => updateProgramRegistration(registration.id, "rejected")} />
          </div>
        </div>
      )}
    />
  );
}

function AdminAttendance(props: {
  members: Member[];
  attendance: AttendanceRecord[];
  selectedMemberId: string;
  setSelectedMemberId: (value: string) => void;
  attendanceStatus: AttendanceStatus;
  setAttendanceStatus: (value: AttendanceStatus) => void;
  addAttendance: (e: React.FormEvent) => void;
}) {
  return (
    <div style={{ display: "grid", gap: "16px" }}>
      <form onSubmit={props.addAttendance} style={{ ...cardStyle, padding: "18px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <select value={props.selectedMemberId} onChange={(e) => props.setSelectedMemberId(e.target.value)} required style={fieldStyle}>
          <option value="">Pilih anggota</option>
          {props.members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name} - {member.class_name}
            </option>
          ))}
        </select>
        <select value={props.attendanceStatus} onChange={(e) => props.setAttendanceStatus(e.target.value as AttendanceStatus)} style={fieldStyle}>
          <option value="Hadir">Hadir</option>
          <option value="Izin">Izin</option>
          <option value="Alpha">Alpha</option>
        </select>
        <ActionButton label="Catat Absensi Hari Ini" tone="primary" submit />
      </form>
      <GridList
        items={props.attendance}
        empty="Belum ada absensi."
        render={(item) => (
          <div style={{ ...cardStyle, padding: "16px", display: "flex", justifyContent: "space-between", gap: "12px" }}>
            <div>
              <strong>{item.member_name || `Member ${item.member_id}`}</strong>
              <div style={{ color: "#64748b", marginTop: "4px" }}>
                {new Date(item.attendance_date).toLocaleDateString("id-ID")} · {item.member_class || "-"}
              </div>
            </div>
            <Badge status={item.status} />
          </div>
        )}
      />
    </div>
  );
}

function AdminLetters({
  letters,
  updateLetterStatus,
}: {
  letters: LetterRequest[];
  updateLetterStatus: (id: number, status: "Pending" | "Selesai") => void;
}) {
  return (
    <GridList
      items={letters}
      empty="Belum ada pengajuan surat."
      render={(letter) => (
        <div style={{ ...cardStyle, padding: "18px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
            <strong>{letter.letter_type}</strong>
            <Badge status={letter.status} />
          </div>
          <p style={{ color: "#64748b", margin: "8px 0" }}>Member ID {letter.member_id}</p>
          <p style={{ margin: "0 0 14px" }}>{letter.purpose}</p>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <ActionButton label="Tandai Pending" tone="neutral" onClick={() => updateLetterStatus(letter.id, "Pending")} />
            <ActionButton label="Selesai" tone="success" onClick={() => updateLetterStatus(letter.id, "Selesai")} />
          </div>
        </div>
      )}
    />
  );
}

function AdminGallery({
  gallery,
  galleryForm,
  setGalleryForm,
  uploadGallery,
  deleteGallery,
  actionBusy,
}: {
  gallery: GalleryItem[];
  galleryForm: {
    title: string;
    category: string;
    description: string;
    photo: File | null;
  };
  setGalleryForm: (value: {
    title: string;
    category: string;
    description: string;
    photo: File | null;
  }) => void;
  uploadGallery: (e: React.FormEvent) => void;
  deleteGallery: (id: number) => void;
  actionBusy: string | null;
}) {
  const uploading = actionBusy === "gallery-upload";

  return (
    <div style={{ display: "grid", gap: "16px" }}>
      <form
        onSubmit={uploadGallery}
        style={{
          ...cardStyle,
          padding: "18px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "10px",
          alignItems: "end",
        }}
      >
        <div>
          <label style={adminLabelStyle}>Judul Foto</label>
          <input
            value={galleryForm.title}
            onChange={(e) => setGalleryForm({ ...galleryForm, title: e.target.value })}
            placeholder="Latihan Mingguan"
            required
            style={{ ...fieldStyle, width: "100%" }}
          />
        </div>
        <div>
          <label style={adminLabelStyle}>Kategori</label>
          <select
            value={galleryForm.category}
            onChange={(e) => setGalleryForm({ ...galleryForm, category: e.target.value })}
            style={{ ...fieldStyle, width: "100%" }}
          >
            <option value="Kegiatan">Kegiatan</option>
            <option value="Latihan">Latihan</option>
            <option value="Kemah">Kemah</option>
            <option value="Prestasi">Prestasi</option>
            <option value="Dokumentasi">Dokumentasi</option>
          </select>
        </div>
        <div>
          <label style={adminLabelStyle}>Foto</label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) =>
              setGalleryForm({
                ...galleryForm,
                photo: e.target.files?.[0] || null,
              })
            }
            required
            style={{ ...fieldStyle, width: "100%" }}
          />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={adminLabelStyle}>Deskripsi</label>
          <input
            value={galleryForm.description}
            onChange={(e) =>
              setGalleryForm({ ...galleryForm, description: e.target.value })
            }
            placeholder="Opsional"
            style={{ ...fieldStyle, width: "100%" }}
          />
        </div>
        <div>
          <ActionButton
            label={uploading ? "Mengupload..." : "Upload Foto"}
            tone="primary"
            submit
            disabled={uploading}
          />
        </div>
      </form>

      <GridList
        items={gallery}
        empty="Belum ada foto galeri."
        render={(item) => {
          const deleting = actionBusy === `gallery-delete-${item.id}`;
          return (
            <div style={{ ...cardStyle, overflow: "hidden" }}>
              <img
                src={resolveImageUrl(item.image_url)}
                alt={item.title}
                style={{
                  width: "100%",
                  height: "180px",
                  objectFit: "cover",
                  display: "block",
                  background: "#dfe7f0",
                }}
              />
              <div style={{ padding: "14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "10px" }}>
                  <strong>{item.title}</strong>
                  <span style={{ color: "#64748b", fontSize: "0.82rem", fontWeight: 800 }}>
                    {item.category}
                  </span>
                </div>
                {item.description && (
                  <p style={{ color: "#64748b", margin: "8px 0 12px" }}>
                    {item.description}
                  </p>
                )}
                <ActionButton
                  label={deleting ? "Menghapus..." : "Hapus Foto"}
                  tone="danger"
                  onClick={() => deleteGallery(item.id)}
                  disabled={deleting}
                />
              </div>
            </div>
          );
        }}
      />
    </div>
  );
}

function AdminNews({
  announcements,
  announcementForm,
  setAnnouncementForm,
  announcementEditingId,
  saveAnnouncement,
  editAnnouncement,
  resetAnnouncementForm,
  toggleAnnouncement,
  deleteAnnouncement,
  actionBusy,
}: {
  announcements: Announcement[];
  announcementForm: {
    title: string;
    content: string;
    image_url: string;
    link_url: string;
    link_label: string;
    is_active: boolean;
    photo: File | null;
  };
  setAnnouncementForm: (value: {
    title: string;
    content: string;
    image_url: string;
    link_url: string;
    link_label: string;
    is_active: boolean;
    photo: File | null;
  }) => void;
  announcementEditingId: number | null;
  saveAnnouncement: (e: React.FormEvent) => void;
  editAnnouncement: (item: Announcement) => void;
  resetAnnouncementForm: () => void;
  toggleAnnouncement: (item: Announcement) => void;
  deleteAnnouncement: (id: number) => void;
  actionBusy: string | null;
}) {
  const saving = actionBusy === "announcement-save";

  return (
    <div style={{ display: "grid", gap: "16px" }}>
      <form
        onSubmit={saveAnnouncement}
        style={{ ...cardStyle, padding: "18px", display: "grid", gap: "12px" }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "10px",
          }}
        >
          <div>
            <label style={adminLabelStyle}>Judul Berita</label>
            <input
              value={announcementForm.title}
              onChange={(e) =>
                setAnnouncementForm({ ...announcementForm, title: e.target.value })
              }
              placeholder="Judul pengumuman"
              required
              style={{ ...fieldStyle, width: "100%" }}
            />
          </div>
          <div>
            <label style={adminLabelStyle}>URL Gambar</label>
            <input
              value={announcementForm.image_url}
              onChange={(e) =>
                setAnnouncementForm({ ...announcementForm, image_url: e.target.value })
              }
              placeholder="Opsional, bisa /uploads/gallery/..."
              style={{ ...fieldStyle, width: "100%" }}
            />
          </div>
          <div>
            <label style={adminLabelStyle}>Upload Foto</label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) =>
                setAnnouncementForm({
                  ...announcementForm,
                  photo: e.target.files?.[0] || null,
                })
              }
              style={{ ...fieldStyle, width: "100%" }}
            />
          </div>
          <div>
            <label style={adminLabelStyle}>Link Aksi</label>
            <input
              value={announcementForm.link_url}
              onChange={(e) =>
                setAnnouncementForm({ ...announcementForm, link_url: e.target.value })
              }
              placeholder="Opsional"
              style={{ ...fieldStyle, width: "100%" }}
            />
          </div>
          <div>
            <label style={adminLabelStyle}>Label Link</label>
            <input
              value={announcementForm.link_label}
              onChange={(e) =>
                setAnnouncementForm({ ...announcementForm, link_label: e.target.value })
              }
              placeholder="Daftar Sekarang"
              style={{ ...fieldStyle, width: "100%" }}
            />
          </div>
        </div>
        <div>
          <label style={adminLabelStyle}>Isi Berita</label>
          <textarea
            value={announcementForm.content}
            onChange={(e) =>
              setAnnouncementForm({ ...announcementForm, content: e.target.value })
            }
            placeholder="Tulis isi pengumuman atau berita..."
            required
            rows={4}
            style={{ ...fieldStyle, width: "100%", resize: "vertical" }}
          />
        </div>
        <label
          style={{
            display: "flex",
            gap: "8px",
            alignItems: "center",
            color: "#475569",
            fontWeight: 800,
          }}
        >
          <input
            type="checkbox"
            checked={announcementForm.is_active}
            onChange={(e) =>
              setAnnouncementForm({
                ...announcementForm,
                is_active: e.target.checked,
              })
            }
          />
          Tampilkan di halaman utama
        </label>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <ActionButton
            label={
              saving
                ? "Menyimpan..."
                : announcementEditingId
                  ? "Simpan Perubahan"
                  : "Tambah Berita"
            }
            tone="primary"
            submit
            disabled={saving}
          />
          {announcementEditingId && (
            <ActionButton
              label="Batal Edit"
              tone="neutral"
              onClick={resetAnnouncementForm}
              disabled={saving}
            />
          )}
        </div>
      </form>

      <GridList
        items={announcements}
        empty="Belum ada berita."
        render={(item) => {
          const toggling = actionBusy === `announcement-toggle-${item.id}`;
          const deleting = actionBusy === `announcement-delete-${item.id}`;
          return (
            <div style={{ ...cardStyle, padding: "18px" }}>
              {item.image_url && (
                <img
                  src={resolveImageUrl(item.image_url)}
                  alt={item.title}
                  style={{
                    width: "100%",
                    height: "150px",
                    objectFit: "cover",
                    borderRadius: "8px",
                    marginBottom: "12px",
                    background: "#dfe7f0",
                  }}
                />
              )}
              <div style={{ display: "flex", justifyContent: "space-between", gap: "10px" }}>
                <strong>{item.title}</strong>
                <Badge status={item.is_active ? "Selesai" : "Pending"} />
              </div>
              <p style={{ color: "#475569", margin: "10px 0 14px" }}>
                {item.content}
              </p>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <ActionButton label="Edit" tone="neutral" onClick={() => editAnnouncement(item)} />
                <ActionButton
                  label={item.is_active ? "Nonaktifkan" : "Aktifkan"}
                  tone="primary"
                  onClick={() => toggleAnnouncement(item)}
                  disabled={toggling}
                />
                <ActionButton
                  label={deleting ? "Menghapus..." : "Hapus"}
                  tone="danger"
                  onClick={() => deleteAnnouncement(item.id)}
                  disabled={deleting}
                />
              </div>
            </div>
          );
        }}
      />
    </div>
  );
}

function AdminMessages({
  messages,
  markMessageRead,
  deleteMessage,
  actionBusy,
}: {
  messages: ContactMessage[];
  markMessageRead: (id: number) => void;
  deleteMessage: (id: number) => void;
  actionBusy: string | null;
}) {
  return (
    <section style={{ display: "grid", gap: "16px" }}>
      <h2 style={{ margin: 0, fontSize: "1.25rem" }}>Pesan Masuk</h2>
      <GridList
        items={messages}
        empty="Belum ada pesan dari halaman kontak."
        render={(message) => (
          <div style={{ ...cardStyle, padding: "18px", display: "grid", gap: "10px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "12px",
                alignItems: "flex-start",
                flexWrap: "wrap",
              }}
            >
              <div>
                <strong>{message.name}</strong>
                <div style={{ color: "#64748b", fontSize: "0.86rem" }}>{message.email}</div>
              </div>
              <Badge status={message.is_read ? "Selesai" : "Pending"} />
            </div>
            <div>
              <div style={{ color: "#102033", fontWeight: 900 }}>
                {message.subject || "Tanpa subjek"}
              </div>
              <p style={{ color: "#475569", margin: "8px 0 0", whiteSpace: "pre-wrap" }}>
                {message.message}
              </p>
            </div>
            <div style={{ color: "#94a3b8", fontSize: "0.8rem" }}>
              {new Date(message.created_at).toLocaleString("id-ID")}
            </div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {!message.is_read && (
                <ActionButton
                  label={
                    actionBusy === `message-read-${message.id}` ? "Memproses..." : "Tandai Dibaca"
                  }
                  tone="success"
                  onClick={() => markMessageRead(message.id)}
                  disabled={actionBusy === `message-read-${message.id}`}
                />
              )}
              <a
                href={`mailto:${message.email}?subject=${encodeURIComponent(`Balasan: ${message.subject || "Pesan Pramuka MAN 1 INHIL"}`)}`}
                style={{
                  ...buttonBase,
                  textDecoration: "none",
                  background: "#f6c945",
                  color: "#102033",
                  display: "inline-flex",
                  alignItems: "center",
                }}
              >
                Balas Email
              </a>
              <ActionButton
                label={actionBusy === `message-delete-${message.id}` ? "Menghapus..." : "Hapus"}
                tone="danger"
                onClick={() => deleteMessage(message.id)}
                disabled={actionBusy === `message-delete-${message.id}`}
              />
            </div>
          </div>
        )}
      />
    </section>
  );
}

function MemberPrograms({
  programs,
  registrations,
  registerProgram,
  actionBusy,
}: {
  programs: Program[];
  registrations: ProgramRegistration[];
  registerProgram: (programId: number) => void;
  actionBusy: string | null;
}) {
  return (
    <GridList
      items={programs}
      empty="Belum ada program."
      render={(program) => {
        const registration = registrations.find((item) => item.program_id === program.id);
        const status = registration?.status;
        const busy = actionBusy === `member-program-${program.id}`;
        const disabled = Boolean(status) || busy;
        const label =
          status === "accepted"
            ? "Sudah Diterima"
            : status === "pending"
              ? "Menunggu Persetujuan"
              : status === "rejected"
                ? "Ditolak Admin"
                : busy
                  ? "Mengirim..."
                  : "Daftar Kegiatan";
        return (
          <div style={{ ...cardStyle, padding: "18px" }}>
            <div style={{ color: "#64748b", fontWeight: 800 }}>{program.category}</div>
            <h3 style={{ margin: "6px 0", color: "#102033" }}>{program.title}</h3>
            <p style={{ minHeight: "48px", color: "#475569" }}>{program.description}</p>
            {status && <div style={{ marginBottom: "12px" }}><Badge status={status} /></div>}
            <ActionButton
              label={label}
              tone={disabled ? "neutral" : "primary"}
              onClick={() => !disabled && registerProgram(program.id)}
              disabled={disabled}
            />
          </div>
        );
      }}
    />
  );
}

function MemberAttendance({
  attendance,
  memberAttendanceNow,
  actionBusy,
}: {
  attendance: AttendanceRecord[];
  memberAttendanceNow: () => void;
  actionBusy: string | null;
}) {
  const busy = actionBusy === "member-attendance";
  return (
    <div style={{ display: "grid", gap: "16px" }}>
      <div style={{ ...cardStyle, padding: "18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <strong>Absensi Kegiatan</strong>
        <ActionButton
          label={busy ? "Mencatat..." : "Absen Hari Ini"}
          tone="primary"
          onClick={memberAttendanceNow}
          disabled={busy}
        />
      </div>
      <GridList
        items={attendance}
        empty="Belum ada catatan absensi."
        render={(item) => (
          <div style={{ ...cardStyle, padding: "16px", display: "flex", justifyContent: "space-between" }}>
            <span>{new Date(item.attendance_date).toLocaleDateString("id-ID")}</span>
            <Badge status={item.status} />
          </div>
        )}
      />
    </div>
  );
}

function MemberLetters(props: {
  letters: LetterRequest[];
  letterForm: { letter_type: string; purpose: string; recipient: string };
  setLetterForm: (value: { letter_type: string; purpose: string; recipient: string }) => void;
  submitLetter: (e: React.FormEvent) => void;
  actionBusy: string | null;
}) {
  const busy = props.actionBusy === "member-letter";
  return (
    <div style={{ display: "grid", gap: "16px" }}>
      <form onSubmit={props.submitLetter} style={{ ...cardStyle, padding: "18px", display: "grid", gap: "10px" }}>
        <select
          value={props.letterForm.letter_type}
          onChange={(e) => props.setLetterForm({ ...props.letterForm, letter_type: e.target.value })}
          style={fieldStyle}
        >
          <option value="Surat Izin">Surat Izin</option>
          <option value="Surat Keterangan">Surat Keterangan</option>
          <option value="Surat Rekomendasi">Surat Rekomendasi</option>
        </select>
        <input
          value={props.letterForm.recipient}
          onChange={(e) => props.setLetterForm({ ...props.letterForm, recipient: e.target.value })}
          placeholder="Tujuan surat"
          style={fieldStyle}
        />
        <input
          value={props.letterForm.purpose}
          onChange={(e) => props.setLetterForm({ ...props.letterForm, purpose: e.target.value })}
          placeholder="Keperluan"
          required
          style={fieldStyle}
        />
        <ActionButton
          label={busy ? "Mengirim..." : "Kirim Pengajuan Surat"}
          tone="primary"
          submit
          disabled={busy}
        />
      </form>
      <GridList
        items={props.letters}
        empty="Belum ada pengajuan surat."
        render={(letter) => (
          <div style={{ ...cardStyle, padding: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <strong>{letter.letter_type}</strong>
              <Badge status={letter.status} />
            </div>
            <p style={{ color: "#475569" }}>{letter.purpose}</p>
          </div>
        )}
      />
    </div>
  );
}

function GridList<T>({
  items,
  render,
  empty,
}: {
  items: T[];
  render: (item: T) => React.ReactNode;
  empty: string;
}) {
  if (!items.length) {
    return <div style={{ ...cardStyle, padding: "28px", color: "#64748b" }}>{empty}</div>;
  }
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
        gap: "16px",
      }}
    >
      {items.map((item, index) => (
        <React.Fragment key={index}>{render(item)}</React.Fragment>
      ))}
    </div>
  );
}

function ActionButton({
  label,
  tone,
  onClick,
  submit = false,
  disabled = false,
}: {
  label: string;
  tone: "primary" | "success" | "danger" | "neutral";
  onClick?: () => void;
  submit?: boolean;
  disabled?: boolean;
}) {
  const palette = {
    primary: { bg: "#f6c945", fg: "#102033" },
    success: { bg: "#16a34a", fg: "white" },
    danger: { bg: "#dc2626", fg: "white" },
    neutral: { bg: "#e2e8f0", fg: "#102033" },
  }[tone];
  return (
    <button
      type={submit ? "submit" : "button"}
      onClick={onClick}
      disabled={disabled}
      style={{
        ...buttonBase,
        background: palette.bg,
        color: palette.fg,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.7 : 1,
      }}
    >
      {label}
    </button>
  );
}

const fieldStyle: React.CSSProperties = {
  minWidth: "180px",
  border: "1px solid #cbd5e1",
  borderRadius: "8px",
  padding: "10px 12px",
  font: "inherit",
  background: "white",
};

const adminLabelStyle: React.CSSProperties = {
  display: "block",
  color: "#475569",
  fontSize: "0.82rem",
  fontWeight: 900,
  marginBottom: "6px",
};

function resolveImageUrl(url: string) {
  if (url.startsWith("/uploads")) {
    return isLocalhost ? `http://localhost:8000${url}` : url;
  }
  return url;
}
