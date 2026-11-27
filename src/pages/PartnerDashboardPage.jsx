import React, { useState, useEffect, useMemo } from "react";
import { usePartnerAuth } from "../context/PartnerAuthContext";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../config/firebase";
import { formatINR, formatDatePretty } from "../utils/formatters";
import { QRCodeCanvas } from "qrcode.react";
import PartnerQrCard from "../components/PartnerQrCard";
import ChangePasswordModal from "../components/ChangePasswordModal";
import {
  normalizePartnerProject,
  calculatePartnerDashboardMetrics,
  FIXED_PARTNER_COMMISSION,
} from "../utils/partnerProjectNormalizer";
import { isWeddingCardTrashed } from "../utils/cardStatus";
import { TEMPLATES } from "../components/StepTemplateSelection";
import {
  Store,
  Layers,
  IndianRupee,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  Filter,
  Copy,
  ExternalLink,
  Check,
  Download,
  LogOut,
  Menu,
  X,
  Calendar,
  Heart,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  FolderOpen,
  KeyRound,
  QrCode,
  TrendingUp,
  CreditCard,
  Eye,
  Film,
  Phone,
  Mail,
  MapPin,
  Info,
} from "lucide-react";

export default function PartnerDashboardPage() {
  const { partnerProfile, logout } = usePartnerAuth();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // UI Navigation & Mobile Menu State
  const [currentTab, setCurrentTab] = useState("overview"); // "overview" | "projects" | "qr"
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  // Search, Filter, Sort & Pagination State
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all"); // "all" | "Verified" | "Verification Pending" | "Rejected"
  const [projectStatusFilter, setProjectStatusFilter] = useState("all"); // "all" | "Confirmed" | "Building" | "Completed" | "Cancelled"
  const [sortOption, setSortOption] = useState("newest"); // "newest" | "oldest" | "weddingDate"
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Copy toast state: maps projectId -> boolean
  const [copiedId, setCopiedId] = useState(null);

  // Selected project for QR modal
  const [selectedQrProject, setSelectedQrProject] = useState(null);

  // Selected project for Read-Only Details modal (Part 7)
  const [selectedProjectDetails, setSelectedProjectDetails] = useState(null);

  // Real-time Firestore Listener for this partner's projects
  useEffect(() => {
    if (!partnerProfile?.partnerCode && !partnerProfile?.partnerId && !partnerProfile?.id) {
      setLoading(false);
      return;
    }

    const partnerCode = (
      partnerProfile.partnerCode ||
      partnerProfile.partnerId ||
      partnerProfile.id ||
      ""
    ).toString().trim();

    setLoading(true);
    setError(null);

    // Query wedding_cards collection where partnerId == partner.partnerCode
    const q = query(
      collection(db, "wedding_cards"),
      where("partnerId", "==", partnerCode)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        // Filter out any trashed / soft-deleted cards so Partner Admin displays only active wedding projects
        const docs = snapshot.docs
          .map((docSnap) => ({ id: docSnap.id, data: docSnap.data() }))
          .filter(({ data }) => !isWeddingCardTrashed(data))
          .map(({ id, data }) => normalizePartnerProject(id, data));

        setProjects(docs);

        // If a project currently open in details or QR modal was moved to Trash, close modal automatically
        setSelectedProjectDetails((current) => {
          if (!current) return null;
          return docs.find((p) => p.id === current.id) || null;
        });

        setSelectedQrProject((current) => {
          if (!current) return null;
          return docs.find((p) => p.id === current.id) || null;
        });

        setLoading(false);
      },
      (err) => {
        console.error("Firestore error for partner cards:", err);
        if (err.code === "permission-denied" || err.message?.includes("permissions")) {
          setError(
            "Firestore Permission Denied: Unable to access wedding projects for this partner. Please contact WebRyza administrator."
          );
        } else {
          setError("Unable to sync wedding projects. Please check your internet connection.");
        }
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [partnerProfile]);

  // Handle Copy Website Link
  const handleCopyLink = (projectId, url) => {
    if (!url) return;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedId(projectId);
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  // Download High-Resolution QR Code (PNG) for Wedding Card Print Shop Display
  const handleDownloadProjectQr = (project) => {
    if (!project || !project.websiteUrl) return;

    const size = 600;
    const padding = 50;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size + 110;
    const ctx = canvas.getContext("2d");

    // Crisp white background
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Locate the rendered QR code canvas in DOM
    const existingQrCanvas = document.getElementById(`qr-canvas-${project.id}`);
    if (existingQrCanvas) {
      ctx.drawImage(existingQrCanvas, padding, padding, size - padding * 2, size - padding * 2);
    }

    // Text Header & Labels
    ctx.fillStyle = "#1A1714";
    ctx.font = "bold 26px serif";
    ctx.textAlign = "center";
    const coupleName =
      project.groomName && project.brideName
        ? `${project.groomName} & ${project.brideName}`
        : "Wedding Invitation";
    ctx.fillText(coupleName, size / 2, size + 25);

    ctx.fillStyle = "#8B6E32";
    ctx.font = "16px sans-serif";
    const weddingCode = project.weddingId ? `#${project.weddingId}` : "";
    ctx.fillText(`Scan with any camera to open invitation ${weddingCode}`, size / 2, size + 60);

    ctx.fillStyle = "#A89F91";
    ctx.font = "12px sans-serif";
    ctx.fillText("WebRyza Cards Studio • Digital Wedding Invitations", size / 2, size + 85);

    const dataUrl = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `WebRyza-QR-${project.weddingId || project.id}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // --------------------------------------------------------------------------
  // Financial Summary Metrics Cards (Part 2: Exact 4 Main Cards)
  // --------------------------------------------------------------------------
  const metrics = useMemo(() => {
    return calculatePartnerDashboardMetrics(projects, partnerProfile || {});
  }, [projects, partnerProfile]);

  // --------------------------------------------------------------------------
  // Filter, Search, and Sort Logic
  // --------------------------------------------------------------------------
  const filteredProjects = useMemo(() => {
    return projects
      .filter((p) => {
        // Search by bride name, groom name, or phone number
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const brideMatch = (p.brideName || "").toLowerCase().includes(q);
          const groomMatch = (p.groomName || "").toLowerCase().includes(q);
          const phoneMatch = (p.phone || "").includes(q);
          if (!brideMatch && !groomMatch && !phoneMatch) return false;
        }

        // Filter by Payment Status (Verified / Verification Pending / Rejected)
        if (paymentStatusFilter !== "all") {
          if (p.paymentStatus.toLowerCase() !== paymentStatusFilter.toLowerCase()) {
            return false;
          }
        }

        // Filter by Project Status
        if (projectStatusFilter !== "all") {
          if (p.projectStatus.toLowerCase() !== projectStatusFilter.toLowerCase()) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortOption === "newest") {
          return (b.createdMillis || 0) - (a.createdMillis || 0);
        }
        if (sortOption === "oldest") {
          return (a.createdMillis || 0) - (b.createdMillis || 0);
        }
        if (sortOption === "weddingDate") {
          const dateA = a.rawDateObj ? a.rawDateObj.getTime() : 0;
          const dateB = b.rawDateObj ? b.rawDateObj.getTime() : 0;
          return dateA - dateB;
        }
        return 0;
      });
  }, [projects, searchQuery, paymentStatusFilter, projectStatusFilter, sortOption]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredProjects.length / itemsPerPage));
  const paginatedProjects = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProjects.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProjects, currentPage]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const partnerCode = partnerProfile?.partnerCode || partnerProfile?.partnerId || "SHOP001";
  const shopName = partnerProfile?.shopName || "Partner Store";

  return (
    <div className="min-h-screen bg-[#0A0908] text-[#FAF7F2] flex flex-col md:flex-row antialiased selection:bg-[#39FF14] selection:text-[#0A0908]">
      {/* -------------------------------------------------------------------- */}
      {/* SIDEBAR: Modern SaaS Dark Sidebar with Neon Green Accent */}
      {/* -------------------------------------------------------------------- */}
      <aside className="hidden md:flex flex-col justify-between w-64 bg-[#12100E] border-r border-[#26211C] p-5 shrink-0 min-h-screen sticky top-0">
        <div>
          {/* Logo Branding */}
          <div className="flex items-center space-x-3 pb-6 border-b border-[#26211C]">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#39FF14]/30 via-[#10B981]/20 to-[#39FF14]/10 border border-[#39FF14]/50 p-[1.5px] shadow-[0_0_15px_rgba(57,255,20,0.2)] flex items-center justify-center">
              <div className="w-full h-full rounded-xl bg-[#0A0908] flex items-center justify-center">
                <Store size={18} className="text-[#39FF14]" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-serif text-lg font-bold tracking-tight text-[#FAF7F2]">
                  WebRyza
                </span>
                <span className="w-2 h-2 rounded-full bg-[#39FF14] shadow-[0_0_8px_#39FF14] animate-pulse"></span>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#39FF14]">
                Partner Admin
              </span>
            </div>
          </div>

          {/* Partner Info Summary in Sidebar */}
          <div className="my-5 p-3.5 rounded-2xl bg-[#181512] border border-[#39FF14]/20 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-between text-[11px] text-[#A89F91] mb-1">
              <span>Partner Store:</span>
              <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-[#39FF14] bg-[#39FF14]/10 border border-[#39FF14]/30 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-[#39FF14]"></span>
                <span>Active</span>
              </span>
            </div>
            <p className="font-semibold text-sm text-[#FAF7F2] truncate">
              {shopName}
            </p>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-xs text-[#39FF14] font-mono font-bold">
                {partnerCode}
              </span>
              <span className="text-[10px] text-[#7A7165]">
                @{partnerProfile?.username || "partner"}
              </span>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1.5">
            <button
              type="button"
              onClick={() => {
                setCurrentTab("overview");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                currentTab === "overview"
                  ? "bg-[#39FF14]/15 text-[#39FF14] border border-[#39FF14]/40 shadow-[0_0_12px_rgba(57,255,20,0.15)]"
                  : "text-[#A89F91] hover:bg-[#181512] hover:text-[#FAF7F2]"
              }`}
            >
              <Layers size={16} />
              <span>Dashboard Overview</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setCurrentTab("projects");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                currentTab === "projects"
                  ? "bg-[#39FF14]/15 text-[#39FF14] border border-[#39FF14]/40 shadow-[0_0_12px_rgba(57,255,20,0.15)]"
                  : "text-[#A89F91] hover:bg-[#181512] hover:text-[#FAF7F2]"
              }`}
            >
              <div className="flex items-center space-x-3">
                <Heart size={16} />
                <span>Wedding Projects</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-[#26211C] text-[10px] font-bold text-[#D8CDBF]">
                {projects.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setCurrentTab("qr");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                currentTab === "qr"
                  ? "bg-[#39FF14]/15 text-[#39FF14] border border-[#39FF14]/40 shadow-[0_0_12px_rgba(57,255,20,0.15)]"
                  : "text-[#A89F91] hover:bg-[#181512] hover:text-[#FAF7F2]"
              }`}
            >
              <QrCode size={16} />
              <span>QR Code & Referral Link</span>
            </button>

            <button
              type="button"
              onClick={() => setIsPasswordModalOpen(true)}
              className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-[#A89F91] hover:bg-[#181512] hover:text-[#39FF14] transition-all"
            >
              <KeyRound size={16} />
              <span>Change Password</span>
            </button>
          </nav>
        </div>

        {/* Logout Button */}
        <div className="pt-4 border-t border-[#26211C]">
          <button
            type="button"
            onClick={logout}
            className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-950/30 hover:text-rose-300 transition-colors border border-transparent hover:border-rose-900/40"
          >
            <LogOut size={16} />
            <span>Logout Session</span>
          </button>
        </div>
      </aside>

      {/* -------------------------------------------------------------------- */}
      {/* MOBILE TOP BAR */}
      {/* -------------------------------------------------------------------- */}
      <header className="md:hidden bg-[#12100E] border-b border-[#26211C] p-4 flex items-center justify-between sticky top-0 z-30 shadow-md">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#39FF14] to-[#10B981] p-[1px] flex items-center justify-center">
            <div className="w-full h-full rounded-lg bg-[#0A0908] flex items-center justify-center">
              <Store size={15} className="text-[#39FF14]" />
            </div>
          </div>
          <div>
            <h1 className="font-serif text-sm font-bold text-[#FAF7F2] leading-tight">
              {shopName}
            </h1>
            <p className="text-[10px] text-[#39FF14] font-mono leading-none">
              ID: {partnerCode}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setIsPasswordModalOpen(true)}
            className="p-2 rounded-lg bg-[#181512] text-[#A89F91] hover:text-[#39FF14] border border-[#26211C]"
            title="Change Password"
          >
            <KeyRound size={16} />
          </button>

          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-lg bg-[#181512] text-[#FAF7F2] border border-[#26211C]"
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </header>

      {/* MOBILE DRAWER */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#12100E] border-b border-[#26211C] p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#26211C]">
              <div>
                <p className="text-xs text-[#A89F91]">Partner Shop:</p>
                <p className="font-bold text-sm text-[#FAF7F2]">{shopName}</p>
                <p className="text-xs text-[#39FF14] font-mono">ID: {partnerCode}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-[#A89F91] hover:text-[#FAF7F2]"
              >
                <X size={18} />
              </button>
            </div>

            <nav className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  setCurrentTab("overview");
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold ${
                  currentTab === "overview"
                    ? "bg-[#39FF14]/15 text-[#39FF14] border border-[#39FF14]/30"
                    : "text-[#A89F91]"
                }`}
              >
                <Layers size={16} />
                <span>Dashboard Overview</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCurrentTab("projects");
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold ${
                  currentTab === "projects"
                    ? "bg-[#39FF14]/15 text-[#39FF14] border border-[#39FF14]/30"
                    : "text-[#A89F91]"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Heart size={16} />
                  <span>My Wedding Projects</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-[#26211C] text-[10px] font-bold">
                  {projects.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCurrentTab("qr");
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold ${
                  currentTab === "qr"
                    ? "bg-[#39FF14]/15 text-[#39FF14] border border-[#39FF14]/30"
                    : "text-[#A89F91]"
                }`}
              >
                <QrCode size={16} />
                <span>QR Code & Referral Link</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsPasswordModalOpen(true);
                }}
                className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-[#A89F91]"
              >
                <KeyRound size={16} />
                <span>Change Password</span>
              </button>

              <button
                type="button"
                onClick={logout}
                className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-950/30"
              >
                <LogOut size={16} />
                <span>Logout Session</span>
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* MAIN DASHBOARD CONTENT */}
      {/* -------------------------------------------------------------------- */}
      <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#26211C]">
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#FAF7F2]">
                Welcome, {shopName}
              </h1>
              <span className="hidden sm:inline-flex items-center space-x-1.5 text-[11px] font-bold text-[#39FF14] bg-[#39FF14]/10 border border-[#39FF14]/30 px-2.5 py-0.5 rounded-full shadow-[0_0_10px_rgba(57,255,20,0.15)]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#39FF14] animate-pulse"></span>
                <span>Active Partner</span>
              </span>
            </div>
            <p className="text-xs text-[#A89F91] mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span>
                Partner ID:{" "}
                <strong className="text-[#39FF14] font-mono">{partnerCode}</strong>
              </span>
              <span>•</span>
              <span>
                Username:{" "}
                <strong className="text-[#FAF7F2]">
                  {partnerProfile?.username || "—"}
                </strong>
              </span>
              <span>•</span>
              <span className="text-[#39FF14] font-semibold">
                Live Real-Time Sync Active
              </span>
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setIsPasswordModalOpen(true)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#181512] border border-[#26211C] hover:border-[#39FF14]/50 text-xs font-semibold text-[#FAF7F2] hover:text-[#39FF14] transition-all"
            >
              <KeyRound size={14} />
              <span>Settings</span>
            </button>

            <a
              href={`https://cards.webryza.in/?ref=${partnerCode}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#39FF14]/15 border border-[#39FF14]/40 text-xs font-bold text-[#39FF14] hover:bg-[#39FF14] hover:text-[#0A0908] transition-all shadow-[0_0_12px_rgba(57,255,20,0.15)]"
            >
              <ExternalLink size={14} />
              <span>Open Form Link</span>
            </a>
          </div>
        </div>

        {/* Global Error Banner if any */}
        {error && (
          <div className="p-3.5 bg-rose-950/70 border border-rose-700 rounded-xl text-rose-200 text-xs flex items-center space-x-2.5">
            <AlertCircle size={16} className="text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* SECTION: REGISTRATION QR CODE & LINK PREVIEW WIDGET (Part 8) */}
        {/* ------------------------------------------------------------------ */}
        <PartnerQrCard partnerCode={partnerCode} shopName={shopName} />

        {/* ------------------------------------------------------------------ */}
        {/* SECTION 2: EXACT 4 FINANCIAL OVERVIEW CARDS (Part 2) */}
        {/* ------------------------------------------------------------------ */}
        <section aria-label="Financial Summary Cards" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#A89F91] flex items-center space-x-1.5">
              <TrendingUp size={14} className="text-[#39FF14]" />
              <span>Partner Financial Overview & Earnings</span>
            </h2>
            <span className="text-[11px] text-[#7A7165]">
              Real-time sync from WebRyza Admin
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Partner Earnings */}
            <div className="bg-[#12100E] border-2 border-[#39FF14]/40 rounded-2xl p-4.5 shadow-[0_0_20px_rgba(57,255,20,0.12)] group hover:border-[#39FF14] transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#39FF14] uppercase tracking-wider">
                  Partner Earnings
                </span>
                <div className="w-9 h-9 rounded-xl bg-[#39FF14]/15 text-[#39FF14] flex items-center justify-center shadow-[0_0_10px_rgba(57,255,20,0.2)]">
                  <Sparkles size={18} />
                </div>
              </div>
              <div className="mt-3">
                <span className="font-serif text-3xl font-bold text-[#39FF14]">
                  {loading ? "…" : formatINR(metrics.partnerEarnings)}
                </span>
                <p className="text-[11px] text-[#A89F91] mt-1 flex items-center space-x-1">
                  <span>{metrics.verifiedCount} verified projects × ₹500</span>
                </p>
              </div>
            </div>

            {/* Card 2: Total Projects */}
            <div className="bg-[#12100E] border border-[#26211C] rounded-2xl p-4.5 hover:border-[#39FF14]/40 transition-all shadow-sm group">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#A89F91] uppercase tracking-wider">
                  Total Projects
                </span>
                <div className="w-9 h-9 rounded-xl bg-[#181512] text-[#FAF7F2] flex items-center justify-center border border-[#26211C]">
                  <Heart size={18} className="text-rose-400" />
                </div>
              </div>
              <div className="mt-3">
                <span className="font-serif text-3xl font-bold text-[#FAF7F2]">
                  {loading ? "…" : metrics.totalProjects}
                </span>
                <p className="text-[11px] text-[#7A7165] mt-1">Total registered invitations</p>
              </div>
            </div>

            {/* Card 3: Total Paid */}
            <div className="bg-[#12100E] border border-[#26211C] rounded-2xl p-4.5 hover:border-[#39FF14]/40 transition-all shadow-sm group">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#A89F91] uppercase tracking-wider">
                  Total Paid
                </span>
                <div className="w-9 h-9 rounded-xl bg-[#181512] text-emerald-400 flex items-center justify-center border border-[#26211C]">
                  <CreditCard size={18} />
                </div>
              </div>
              <div className="mt-3">
                <span className="font-serif text-3xl font-bold text-emerald-400">
                  {loading ? "…" : formatINR(metrics.totalCustomerPaid)}
                </span>
                <p className="text-[11px] text-[#7A7165] mt-1">Verified customer payments</p>
              </div>
            </div>

            {/* Card 4: Pending Payment */}
            <div className="bg-[#12100E] border border-[#26211C] rounded-2xl p-4.5 hover:border-amber-500/40 transition-all shadow-sm group">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#A89F91] uppercase tracking-wider">
                  Pending Payment
                </span>
                <div className="w-9 h-9 rounded-xl bg-[#181512] text-amber-400 flex items-center justify-center border border-[#26211C]">
                  <Clock size={18} />
                </div>
              </div>
              <div className="mt-3">
                <span className={`font-serif text-3xl font-bold ${metrics.pendingPaymentAmount > 0 ? "text-amber-400" : "text-[#7A7165]"}`}>
                  {loading ? "…" : formatINR(metrics.pendingPaymentAmount)}
                </span>
                <p className="text-[11px] text-amber-500/80 mt-1">
                  {metrics.pendingProjectsCount} project{metrics.pendingProjectsCount === 1 ? "" : "s"} awaiting verification
                </p>
              </div>
            </div>
          </div>

          {/* ------------------------------------------------------------------ */}
          {/* SECTION 3: PARTNER EARNINGS DETAILS BREAKDOWN (Part 3) */}
          {/* ------------------------------------------------------------------ */}
          <div className="bg-[#12100E] border border-[#26211C] rounded-2xl p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#26211C]">
              <div>
                <h3 className="font-serif text-sm font-bold text-[#FAF7F2] flex items-center space-x-2">
                  <IndianRupee size={15} className="text-[#39FF14]" />
                  <span>Partner Earnings & Payout Breakdown</span>
                </h3>
                <p className="text-[11px] text-[#A89F91] mt-0.5">
                  Clear calculation of earned commissions and pending settlement payouts
                </p>
              </div>
              <span className="text-[11px] font-semibold text-[#39FF14] bg-[#39FF14]/10 border border-[#39FF14]/30 px-2.5 py-1 rounded-full self-start sm:self-auto">
                Fixed ₹500 / Card
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <div className="p-3 rounded-xl bg-[#181512] border border-[#26211C]">
                <span className="text-[10px] uppercase font-bold text-[#7A7165] block">
                  Verified Projects
                </span>
                <span className="font-serif text-lg font-bold text-[#FAF7F2] block mt-1">
                  {metrics.verifiedCount}
                </span>
                <span className="text-[10px] text-[#A89F91]">Admin verified</span>
              </div>

              <div className="p-3 rounded-xl bg-[#181512] border border-[#26211C]">
                <span className="text-[10px] uppercase font-bold text-[#7A7165] block">
                  Commission / Card
                </span>
                <span className="font-serif text-lg font-bold text-[#39FF14] block mt-1">
                  ₹500
                </span>
                <span className="text-[10px] text-[#A89F91]">Fixed rate</span>
              </div>

              <div className="p-3 rounded-xl bg-[#181512] border border-[#39FF14]/30">
                <span className="text-[10px] uppercase font-bold text-[#39FF14] block">
                  Total Earned
                </span>
                <span className="font-serif text-lg font-bold text-[#39FF14] block mt-1">
                  {formatINR(metrics.totalEarned)}
                </span>
                <span className="text-[10px] text-[#A89F91]">
                  {metrics.verifiedCount} × ₹500
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#181512] border border-[#26211C]">
                <span className="text-[10px] uppercase font-bold text-[#7A7165] block">
                  Already Paid
                </span>
                <span className="font-serif text-lg font-bold text-sky-400 block mt-1">
                  {formatINR(metrics.alreadyPaid)}
                </span>
                <span className="text-[10px] text-[#A89F91]">Settled by Admin</span>
              </div>

              <div className="p-3 rounded-xl bg-[#181512] border border-amber-500/30 col-span-2 sm:col-span-1">
                <span className="text-[10px] uppercase font-bold text-amber-400 block">
                  Remaining Payable
                </span>
                <span className="font-serif text-lg font-bold text-amber-400 block mt-1">
                  {formatINR(metrics.remainingPayable)}
                </span>
                <span className="text-[10px] text-[#A89F91]">Pending disbursement</span>
              </div>
            </div>

            <p className="mt-3 text-[10px] text-[#7A7165] leading-relaxed">
              * Commission is credited immediately upon payment verification by the WebRyza Main Administration. Payout settlements are recorded and transferred directly by WebRyza.
            </p>
          </div>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* WEDDING PROJECTS TABLE SECTION (Part 4 & Part 5) */}
        {/* ------------------------------------------------------------------ */}
        <section className="bg-[#12100E] border border-[#26211C] rounded-3xl p-5 sm:p-6 space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#FAF7F2]">
                My Wedding Projects
              </h2>
              <p className="text-xs text-[#A89F91]">
                Real-time records for {shopName} (Click any row to view full details)
              </p>
            </div>

            {/* Quick Status Pill Counters (Part 5) */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => {
                  setPaymentStatusFilter("all");
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  paymentStatusFilter === "all"
                    ? "bg-[#39FF14] text-[#0A0908] font-bold"
                    : "bg-[#181512] text-[#A89F91] hover:text-[#FAF7F2]"
                }`}
              >
                All Projects ({projects.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setPaymentStatusFilter("Verified");
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  paymentStatusFilter === "Verified"
                    ? "bg-emerald-500 text-white font-bold"
                    : "bg-[#181512] text-emerald-400 hover:bg-emerald-500/20"
                }`}
              >
                Verified ({metrics.verifiedCount})
              </button>
              <button
                type="button"
                onClick={() => {
                  setPaymentStatusFilter("Verification Pending");
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  paymentStatusFilter === "Verification Pending"
                    ? "bg-amber-500 text-[#0A0908] font-bold"
                    : "bg-[#181512] text-amber-400 hover:bg-amber-500/20"
                }`}
              >
                Verification Pending ({metrics.pendingCount})
              </button>
              <button
                type="button"
                onClick={() => {
                  setPaymentStatusFilter("Rejected");
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  paymentStatusFilter === "Rejected"
                    ? "bg-rose-500 text-white font-bold"
                    : "bg-[#181512] text-rose-400 hover:bg-rose-500/20"
                }`}
              >
                Rejected ({metrics.rejectedCount})
              </button>
            </div>
          </div>

          {/* Search & Filter Toolbar (Part 5) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
            {/* Search Input */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#7A7165]">
                <Search size={14} />
              </div>
              <input
                type="text"
                placeholder="Search by bride, groom, phone..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-3 py-2 bg-[#0A0908] border border-[#26211C] rounded-xl text-xs text-[#FAF7F2] placeholder-[#665C51] focus:outline-none focus:border-[#39FF14]"
              />
            </div>

            {/* Payment Status Filter (Part 5) */}
            <div className="relative">
              <select
                value={paymentStatusFilter}
                onChange={(e) => {
                  setPaymentStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 bg-[#0A0908] border border-[#26211C] rounded-xl text-xs text-[#FAF7F2] focus:outline-none focus:border-[#39FF14]"
              >
                <option value="all">All Payment Statuses</option>
                <option value="Verification Pending">Verification Pending</option>
                <option value="Verified">Verified</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            {/* Project Status Filter */}
            <div className="relative">
              <select
                value={projectStatusFilter}
                onChange={(e) => {
                  setProjectStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 bg-[#0A0908] border border-[#26211C] rounded-xl text-xs text-[#FAF7F2] focus:outline-none focus:border-[#39FF14]"
              >
                <option value="all">All Project Statuses</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Building">Building</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            {/* Sort Order */}
            <div className="relative">
              <select
                value={sortOption}
                onChange={(e) => {
                  setSortOption(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 bg-[#0A0908] border border-[#26211C] rounded-xl text-xs text-[#FAF7F2] focus:outline-none focus:border-[#39FF14]"
              >
                <option value="newest">Sort: Newest Registrations</option>
                <option value="oldest">Sort: Oldest Registrations</option>
                <option value="weddingDate">Sort: Wedding Date</option>
              </select>
            </div>
          </div>

          {/* Projects Table Responsive Container (Part 4: Exact 8 Columns) */}
          <div className="overflow-x-auto rounded-2xl border border-[#26211C]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#181512] text-[#A89F91] border-b border-[#26211C] uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4 font-semibold">1. Couple</th>
                  <th className="py-3.5 px-4 font-semibold">2. Wedding Date</th>
                  <th className="py-3.5 px-4 font-semibold text-right">3. Customer Payment</th>
                  <th className="py-3.5 px-4 font-semibold text-center">4. Payment Status</th>
                  <th className="py-3.5 px-4 font-semibold text-right">5. Partner Commission</th>
                  <th className="py-3.5 px-4 font-semibold text-center">6. Commission Status</th>
                  <th className="py-3.5 px-4 font-semibold text-center">7. Project Status</th>
                  <th className="py-3.5 px-4 font-semibold text-center">8. Website Link &amp; QR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#26211C]">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="py-12 text-center text-[#7A7165]">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <RefreshCw size={20} className="animate-spin text-[#39FF14]" />
                        <span>Loading real-time projects from Firestore...</span>
                      </div>
                    </td>
                  </tr>
                ) : paginatedProjects.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-12 text-center text-[#7A7165]">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <FolderOpen size={24} className="text-[#3D352E]" />
                        <span className="font-semibold text-sm text-[#FAF7F2]">
                          No wedding projects found
                        </span>
                        <p className="text-xs text-[#665C51] max-w-sm">
                          {searchQuery || paymentStatusFilter !== "all" || projectStatusFilter !== "all"
                            ? "Try adjusting your search or filters to see more results."
                            : `When customers scan your QR code (ref=${partnerCode}) and register, their wedding projects will appear here in real-time.`}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedProjects.map((p) => {
                    const isCopied = copiedId === p.id;
                    const hasWebsite = Boolean(p.websiteUrl && p.websiteUrl.trim());

                    return (
                      <tr
                        key={p.id}
                        className="hover:bg-[#181512]/60 transition-colors group cursor-pointer"
                        onClick={() => setSelectedProjectDetails(p)}
                        title="Click to view full project details"
                      >
                        {/* 1. Couple Name */}
                        <td className="py-3.5 px-4 font-medium">
                          <div className="flex items-center space-x-1.5 text-sm text-[#FAF7F2] group-hover:text-[#39FF14] transition-colors">
                            <span className="font-semibold">{p.groomName}</span>
                            <span className="text-rose-400">❤️</span>
                            <span className="font-semibold">{p.brideName}</span>
                          </div>
                          {p.phone && (
                            <span className="text-[10px] text-[#7A7165] block mt-0.5">
                              📞 {p.phone}
                            </span>
                          )}
                        </td>

                        {/* 2. Wedding Date */}
                        <td className="py-3.5 px-4 text-[#D8CDBF] whitespace-nowrap">
                          <div className="flex items-center space-x-1.5">
                            <Calendar size={12} className="text-[#39FF14]" />
                            <span>{p.formattedWeddingDate}</span>
                          </div>
                        </td>

                        {/* 3. Customer Payment Amount */}
                        <td className="py-3.5 px-4 text-right font-semibold text-[#FAF7F2] whitespace-nowrap">
                          {formatINR(p.customerPaymentAmount)}
                        </td>

                        {/* 4. Payment Status Badge */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          {p.paymentStatus === "Verified" && (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#39FF14]/15 border border-[#39FF14]/40 text-[#39FF14] shadow-[0_0_8px_rgba(57,255,20,0.15)]">
                              <CheckCircle2 size={11} />
                              <span>Verified</span>
                            </span>
                          )}
                          {p.paymentStatus === "Verification Pending" && (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/15 border border-amber-500/30 text-amber-400">
                              <Clock size={11} />
                              <span>Verification Pending</span>
                            </span>
                          )}
                          {p.paymentStatus === "Rejected" && (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/15 border border-rose-500/30 text-rose-400">
                              <AlertCircle size={11} />
                              <span>Rejected</span>
                            </span>
                          )}
                        </td>

                        {/* 5. Partner Commission */}
                        <td className="py-3.5 px-4 text-right font-semibold whitespace-nowrap">
                          {p.paymentStatus === "Verified" && (
                            <span className="text-[#39FF14] font-bold">₹500</span>
                          )}
                          {p.paymentStatus === "Verification Pending" && (
                            <span className="text-amber-400 font-medium">₹500 Pending</span>
                          )}
                          {p.paymentStatus === "Rejected" && (
                            <span className="text-[#7A7165]">₹0 / Not Earned</span>
                          )}
                        </td>

                        {/* 6. Commission Status */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          {p.commissionStatus === "Paid" && (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/15 border border-sky-500/30 text-sky-400">
                              <span>Paid</span>
                            </span>
                          )}
                          {p.commissionStatus === "Earned" && (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#39FF14]/15 border border-[#39FF14]/30 text-[#39FF14]">
                              <span>Earned</span>
                            </span>
                          )}
                          {p.commissionStatus === "Pending" && (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 border border-amber-500/30 text-amber-400">
                              <span>Pending</span>
                            </span>
                          )}
                          {p.commissionStatus === "Not Earned" && (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#181512] text-[#7A7165] border border-[#26211C]">
                              <span>Not Earned</span>
                            </span>
                          )}
                        </td>

                        {/* 7. Project Status Badge */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          {p.projectStatus.toLowerCase() === "completed" && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-950/80 border border-emerald-500 text-emerald-300">
                              Completed
                            </span>
                          )}
                          {p.projectStatus.toLowerCase() === "building" && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-cyan-950/80 border border-cyan-500 text-cyan-300">
                              Building
                            </span>
                          )}
                          {p.projectStatus.toLowerCase() === "cancelled" && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-950/80 border border-rose-500 text-rose-300">
                              Cancelled
                            </span>
                          )}
                          {p.projectStatus.toLowerCase() !== "completed" &&
                            p.projectStatus.toLowerCase() !== "building" &&
                            p.projectStatus.toLowerCase() !== "cancelled" && (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-950/80 border border-purple-500 text-purple-300">
                                Confirmed
                              </span>
                            )}
                        </td>

                        {/* 8. Website Link & QR Code */}
                        <td
                          className="py-3 px-4 text-center whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-center space-x-2">
                            {hasWebsite ? (
                              <>
                                {/* Dynamic QR Code Thumbnail */}
                                <div
                                  onClick={() => setSelectedQrProject(p)}
                                  className="p-1 bg-white rounded-lg shadow-sm border border-[#26211C] hover:border-[#39FF14] transition-all cursor-pointer shrink-0"
                                  title="Click to view large printable QR code"
                                >
                                  <QRCodeCanvas
                                    id={`qr-canvas-${p.id}`}
                                    value={p.websiteUrl}
                                    size={36}
                                    level="H"
                                    marginSize={1}
                                  />
                                </div>

                                {/* Action Buttons: Copy Link, Download QR, View Details */}
                                <div className="flex items-center space-x-1">
                                  <button
                                    type="button"
                                    onClick={() => handleCopyLink(p.id, p.websiteUrl)}
                                    className={`p-1.5 rounded-lg border text-xs transition-all ${
                                      isCopied
                                        ? "bg-emerald-950/90 border-[#39FF14] text-[#39FF14]"
                                        : "bg-[#181512] border-[#26211C] text-[#D8CDBF] hover:border-[#39FF14] hover:text-[#39FF14]"
                                    }`}
                                    title={isCopied ? "Copied" : "Copy Website Link"}
                                  >
                                    {isCopied ? <Check size={13} /> : <Copy size={13} />}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleDownloadProjectQr(p)}
                                    className="p-1.5 rounded-lg bg-[#181512] border border-[#26211C] text-[#D8CDBF] hover:text-[#39FF14] hover:border-[#39FF14]/50 transition-colors"
                                    title="Download QR Code (PNG)"
                                  >
                                    <Download size={13} />
                                  </button>

                                  <a
                                    href={p.websiteUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-1.5 rounded-lg bg-[#181512] border border-[#26211C] text-[#A89F91] hover:text-[#39FF14] hover:border-[#39FF14]/50 transition-colors"
                                    title="Open Live Website"
                                  >
                                    <ExternalLink size={13} />
                                  </a>

                                  <button
                                    type="button"
                                    onClick={() => setSelectedProjectDetails(p)}
                                    className="p-1.5 rounded-lg bg-[#181512] border border-[#26211C] text-[#39FF14] hover:bg-[#39FF14]/15 transition-colors"
                                    title="View Full Details"
                                  >
                                    <Eye size={13} />
                                  </button>
                                </div>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setSelectedProjectDetails(p)}
                                className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-[#181512] border border-[#26211C] text-xs text-[#39FF14] hover:bg-[#39FF14]/15"
                              >
                                <Eye size={12} />
                                <span>Details</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 text-xs text-[#A89F91]">
              <div>
                Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                {Math.min(currentPage * itemsPerPage, filteredProjects.length)} of{" "}
                {filteredProjects.length} projects
              </div>

              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-lg border border-[#26211C] bg-[#0A0908] text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#181512] transition-colors"
                >
                  Previous
                </button>

                {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => handlePageChange(pageNum)}
                    className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all ${
                      currentPage === pageNum
                        ? "bg-[#39FF14] text-[#0A0908] font-bold shadow-[0_0_8px_rgba(57,255,20,0.4)]"
                        : "bg-[#0A0908] border border-[#26211C] text-[#A89F91] hover:text-[#FAF7F2]"
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-lg border border-[#26211C] bg-[#0A0908] text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#181512] transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Read-Only Notice Footer */}
        <div className="p-4 rounded-2xl bg-[#12100E] border border-[#26211C] flex items-center justify-between text-xs text-[#7A7165]">
          <div className="flex items-center space-x-2">
            <ShieldCheck size={16} className="text-[#39FF14]" />
            <span>
              Secure Read-Only Partner Admin Panel. Commission is fixed at ₹500 per verified card. Managed by WebRyza Admin.
            </span>
          </div>
          <span className="hidden sm:inline text-[11px] text-[#39FF14] font-mono">
            {shopName} ({partnerCode})
          </span>
        </div>
      </main>

      {/* -------------------------------------------------------------------- */}
      {/* CHANGE PASSWORD MODAL */}
      {/* -------------------------------------------------------------------- */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />

      {/* -------------------------------------------------------------------- */}
      {/* QR CODE MODAL */}
      {/* -------------------------------------------------------------------- */}
      {selectedQrProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-sm bg-[#12100E] border border-[#39FF14]/40 rounded-3xl p-6 text-center shadow-2xl space-y-4">
            <button
              type="button"
              onClick={() => setSelectedQrProject(null)}
              className="absolute top-4 right-4 p-2 text-[#A89F91] hover:text-[#FAF7F2] rounded-full hover:bg-white/10 transition-colors"
            >
              <X size={18} />
            </button>

            <div className="space-y-1 pt-2">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#39FF14] block">
                Digital Wedding Invitation QR
              </span>
              <h3 className="font-serif text-xl font-bold text-[#FAF7F2]">
                {selectedQrProject.groomName} &amp; {selectedQrProject.brideName}
              </h3>
              <p className="text-xs text-[#A89F91]">
                Wedding ID: #{selectedQrProject.weddingId || selectedQrProject.id}
              </p>
            </div>

            <div className="p-4 bg-white rounded-2xl shadow-lg border-2 border-[#39FF14]/30 inline-block">
              <QRCodeCanvas
                value={selectedQrProject.websiteUrl}
                size={200}
                level="H"
                marginSize={2}
              />
            </div>

            <p className="text-xs text-[#A89F91] leading-relaxed">
              Scan with any mobile camera to immediately view this wedding invitation website.
            </p>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => handleDownloadProjectQr(selectedQrProject)}
                className="w-full inline-flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#39FF14] to-[#2ecc71] hover:brightness-110 text-xs font-bold text-[#0A0908] transition-all shadow-md"
              >
                <Download size={14} />
                <span>Download Printable QR (PNG)</span>
              </button>

              <button
                type="button"
                onClick={() => handleCopyLink(selectedQrProject.id, selectedQrProject.websiteUrl)}
                className="w-full inline-flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-[#1A1714] border border-[#26211C] hover:border-[#39FF14]/50 text-xs font-semibold text-[#FAF7F2] transition-all"
              >
                {copiedId === selectedQrProject.id ? (
                  <Check size={14} className="text-[#39FF14]" />
                ) : (
                  <Copy size={14} />
                )}
                <span>
                  {copiedId === selectedQrProject.id ? "Link Copied!" : "Copy Invitation Link"}
                </span>
              </button>

              <a
                href={selectedQrProject.websiteUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full inline-flex items-center justify-center space-x-1.5 py-2 px-4 text-xs text-[#A89F91] hover:text-[#39FF14] transition-colors"
              >
                <span>Open Live Invitation Website</span>
                <ExternalLink size={13} />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* READ-ONLY PROJECT DETAILS VIEW MODAL (Part 6 & Part 7) */}
      {/* -------------------------------------------------------------------- */}
      {selectedProjectDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#12100E] border border-[#26211C] hover:border-[#39FF14]/40 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6 text-left">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-[#26211C]">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#39FF14] block">
                  Wedding Project Details • Read-Only
                </span>
                <h3 className="font-serif text-2xl font-bold text-[#FAF7F2] mt-0.5">
                  {selectedProjectDetails.groomName} &amp; {selectedProjectDetails.brideName}
                </h3>
                <p className="text-xs text-[#A89F91] mt-0.5">
                  Wedding ID: <span className="font-mono text-[#FAF7F2]">#{selectedProjectDetails.weddingId}</span>
                  {" • "}Registered: {selectedProjectDetails.formattedCreatedDate}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedProjectDetails(null)}
                className="p-2 text-[#A89F91] hover:text-[#FAF7F2] rounded-full hover:bg-white/10 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Rejection Alert Banner (Part 6) */}
            {selectedProjectDetails.paymentStatus === "Rejected" && (
              <div className="p-4 bg-rose-950/60 border border-rose-600/60 rounded-2xl text-rose-200 space-y-1.5">
                <div className="flex items-center space-x-2 text-rose-400 font-bold text-xs uppercase tracking-wider">
                  <AlertCircle size={16} />
                  <span>Payment Verification Rejected</span>
                </div>
                <p className="text-xs text-rose-100">
                  <strong>Reason:</strong>{" "}
                  {selectedProjectDetails.rejectionReason || "Transaction details could not be verified by WebRyza Admin."}
                </p>
                {selectedProjectDetails.formattedRejectedAt && (
                  <p className="text-[11px] text-rose-300">
                    Rejected Date: {selectedProjectDetails.formattedRejectedAt}
                  </p>
                )}
              </div>
            )}

            {/* 1. CUSTOMER DETAILS */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#A89F91] flex items-center space-x-1.5">
                <Heart size={14} className="text-rose-400" />
                <span>Customer & Wedding Details</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-[#181512] p-4 rounded-2xl border border-[#26211C]">
                <div>
                  <span className="text-[#7A7165] text-[11px] block">Bride Name:</span>
                  <span className="font-semibold text-[#FAF7F2] text-sm">{selectedProjectDetails.brideName || "—"}</span>
                </div>
                <div>
                  <span className="text-[#7A7165] text-[11px] block">Groom Name:</span>
                  <span className="font-semibold text-[#FAF7F2] text-sm">{selectedProjectDetails.groomName || "—"}</span>
                </div>
                <div>
                  <span className="text-[#7A7165] text-[11px] block">Wedding Date:</span>
                  <span className="font-semibold text-[#D8CDBF]">{selectedProjectDetails.formattedWeddingDate}</span>
                </div>
                <div>
                  <span className="text-[#7A7165] text-[11px] block">Phone Contact:</span>
                  <span className="font-semibold text-[#FAF7F2] flex items-center space-x-1">
                    <Phone size={12} className="text-[#39FF14]" />
                    <span>{selectedProjectDetails.phone || "—"}</span>
                  </span>
                </div>
                {selectedProjectDetails.email && (
                  <div className="sm:col-span-2">
                    <span className="text-[#7A7165] text-[11px] block">Email Address:</span>
                    <span className="font-semibold text-[#FAF7F2] flex items-center space-x-1">
                      <Mail size={12} className="text-[#A89F91]" />
                      <span>{selectedProjectDetails.email}</span>
                    </span>
                  </div>
                )}
                {selectedProjectDetails.venueName && (
                  <div className="sm:col-span-2">
                    <span className="text-[#7A7165] text-[11px] block">Venue & Address:</span>
                    <span className="text-[#FAF7F2] flex items-start space-x-1">
                      <MapPin size={12} className="text-[#39FF14] mt-0.5 shrink-0" />
                      <span>{selectedProjectDetails.venueName}{selectedProjectDetails.venueAddress ? ` — ${selectedProjectDetails.venueAddress}` : ""}</span>
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* 2. PAYMENT DETAILS (Part 7) */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#A89F91] flex items-center space-x-1.5">
                <CreditCard size={14} className="text-[#39FF14]" />
                <span>Customer Payment Details</span>
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#181512] p-4 rounded-2xl border border-[#26211C] text-xs">
                <div>
                  <span className="text-[#7A7165] text-[10px] uppercase font-bold block">Customer Payment</span>
                  <span className="font-serif text-base font-bold text-[#FAF7F2] mt-0.5 block">
                    {formatINR(selectedProjectDetails.customerPaymentAmount)}
                  </span>
                </div>
                <div>
                  <span className="text-[#7A7165] text-[10px] uppercase font-bold block">Payment Status</span>
                  <span className="mt-1 block">
                    {selectedProjectDetails.paymentStatus === "Verified" && (
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#39FF14]/15 border border-[#39FF14]/40 text-[#39FF14]">
                        <CheckCircle2 size={10} />
                        <span>Verified</span>
                      </span>
                    )}
                    {selectedProjectDetails.paymentStatus === "Verification Pending" && (
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 border border-amber-500/30 text-amber-400">
                        <Clock size={10} />
                        <span>Verification Pending</span>
                      </span>
                    )}
                    {selectedProjectDetails.paymentStatus === "Rejected" && (
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 border border-rose-500/30 text-rose-400">
                        <AlertCircle size={10} />
                        <span>Rejected</span>
                      </span>
                    )}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-[#7A7165] text-[10px] uppercase font-bold block">UPI Transaction Ref (UTR)</span>
                  <span className="font-mono text-xs font-bold text-[#FAF7F2] mt-1 block truncate">
                    {selectedProjectDetails.transactionReference || "—"}
                  </span>
                </div>
              </div>
            </div>

            {/* 3. COMMISSION DETAILS (Part 7) */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#A89F91] flex items-center space-x-1.5">
                <Sparkles size={14} className="text-[#39FF14]" />
                <span>Partner Commission Details</span>
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-[#181512] p-4 rounded-2xl border border-[#39FF14]/30 text-xs">
                <div>
                  <span className="text-[#7A7165] text-[10px] uppercase font-bold block">Partner Commission</span>
                  <span className="font-serif text-lg font-bold text-[#39FF14] mt-0.5 block">
                    {selectedProjectDetails.paymentStatus === "Verified"
                      ? "₹500"
                      : selectedProjectDetails.paymentStatus === "Rejected"
                      ? "₹0"
                      : "₹500 (Pending)"}
                  </span>
                </div>
                <div>
                  <span className="text-[#7A7165] text-[10px] uppercase font-bold block">Commission Status</span>
                  <span className="mt-1 block">
                    {selectedProjectDetails.commissionStatus === "Paid" && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/15 border border-sky-500/30 text-sky-400">
                        Paid / Settled
                      </span>
                    )}
                    {selectedProjectDetails.commissionStatus === "Earned" && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#39FF14]/15 border border-[#39FF14]/30 text-[#39FF14]">
                        Earned (Payable)
                      </span>
                    )}
                    {selectedProjectDetails.commissionStatus === "Pending" && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 border border-amber-500/30 text-amber-400">
                        Pending Verification
                      </span>
                    )}
                    {selectedProjectDetails.commissionStatus === "Not Earned" && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#0A0908] text-[#7A7165] border border-[#26211C]">
                        Not Earned
                      </span>
                    )}
                  </span>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <span className="text-[#7A7165] text-[10px] uppercase font-bold block">Commission Rule</span>
                  <span className="text-xs text-[#FAF7F2] mt-0.5 block">Fixed ₹500 / Card</span>
                </div>
              </div>
            </div>

            {/* 4. VIDEO & PROJECT DETAILS (Part 7) */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#A89F91] flex items-center space-x-1.5">
                <Film size={14} className="text-[#39FF14]" />
                <span>Invitation Video & Template</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#181512] p-4 rounded-2xl border border-[#26211C] text-xs">
                <div>
                  <span className="text-[#7A7165] text-[10px] uppercase font-bold block">Website Template</span>
                  <span className="font-semibold text-[#FAF7F2] mt-0.5 block capitalize">
                    {selectedProjectDetails.templateId.replace(/-/g, " ")}
                  </span>
                </div>
                <div>
                  <span className="text-[#7A7165] text-[10px] uppercase font-bold block">Wedding Video Selected</span>
                  <span className="font-semibold mt-0.5 block">
                    {selectedProjectDetails.videoRequired ? (
                      <span className="text-[#39FF14]">Yes • {selectedProjectDetails.videoStyle || "Standard Video"}</span>
                    ) : (
                      <span className="text-[#A89F91]">No Video Selected</span>
                    )}
                  </span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-[#7A7165] text-[10px] uppercase font-bold block">Generated Website Link</span>
                  {selectedProjectDetails.websiteUrl ? (
                    <div className="mt-1 flex items-center space-x-2">
                      <input
                        type="text"
                        readOnly
                        value={selectedProjectDetails.websiteUrl}
                        className="w-full bg-[#0A0908] border border-[#26211C] rounded-xl px-3 py-1.5 text-xs text-[#39FF14] font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => handleCopyLink(selectedProjectDetails.id, selectedProjectDetails.websiteUrl)}
                        className="px-3 py-1.5 rounded-xl bg-[#26211C] text-xs font-bold text-[#FAF7F2] hover:bg-[#39FF14] hover:text-[#0A0908] transition-all shrink-0"
                      >
                        {copiedId === selectedProjectDetails.id ? "Copied" : "Copy"}
                      </button>
                      <a
                        href={selectedProjectDetails.websiteUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-xl bg-[#26211C] text-[#39FF14] hover:bg-[#39FF14] hover:text-[#0A0908] transition-all shrink-0"
                      >
                        <ExternalLink size={14} />
                      </a>
                    </div>
                  ) : (
                    <span className="text-[#7A7165]">Website link will appear once generated.</span>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex items-center justify-end space-x-3 border-t border-[#26211C]">
              <button
                type="button"
                onClick={() => setSelectedProjectDetails(null)}
                className="px-5 py-2.5 rounded-xl bg-[#181512] border border-[#26211C] hover:border-[#39FF14]/40 text-xs font-bold text-[#FAF7F2] transition-colors"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
