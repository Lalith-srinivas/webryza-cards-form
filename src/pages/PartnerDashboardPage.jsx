import React, { useState, useEffect, useMemo } from "react";
import { usePartnerAuth } from "../context/PartnerAuthContext";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../config/firebase";
import { formatINR, formatDatePretty } from "../utils/formatters";
import { QRCodeCanvas } from "qrcode.react";
import PartnerQrCard from "../components/PartnerQrCard";
import ChangePasswordModal from "../components/ChangePasswordModal";
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
  ArrowUpDown,
  RefreshCw,
  FolderOpen,
  KeyRound,
  QrCode,
  DollarSign,
  TrendingUp,
  CreditCard,
  Building2,
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
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all"); // "all" | "pending" | "partial" | "paid"
  const [projectStatusFilter, setProjectStatusFilter] = useState("all"); // "all" | "confirmed" | "building" | "completed" | "cancelled"
  const [sortOption, setSortOption] = useState("newest"); // "newest" | "oldest" | "weddingDate"
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Copy toast state: maps projectId -> boolean
  const [copiedId, setCopiedId] = useState(null);

  // Selected project for QR modal
  const [selectedQrProject, setSelectedQrProject] = useState(null);

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
        const docs = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();

          // Financial field values
          const totalCharged = Number(data.amountCharged || 0);
          const webryzaAmount = Number(data.webryzaShare || data.amountDueToWebryza || 1500);
          const amountPaid = Number(data.amountReceivedByWebryza || 0);
          const remainingAmount = Math.max(0, webryzaAmount - amountPaid);
          const partnerEarnings = Math.max(0, totalCharged - webryzaAmount);

          // Payment Status
          let computedPaymentStatus = "Pending";
          if (amountPaid >= webryzaAmount && webryzaAmount > 0) {
            computedPaymentStatus = "Paid";
          } else if (amountPaid > 0) {
            computedPaymentStatus = "Partial";
          } else if (data.paymentStatus) {
            const norm = data.paymentStatus.toLowerCase();
            if (norm === "paid") computedPaymentStatus = "Paid";
            else if (norm === "partial") computedPaymentStatus = "Partial";
            else computedPaymentStatus = "Pending";
          }

          // Project Status (Confirmed / Building / Completed / Cancelled)
          let computedProjectStatus = "Confirmed";
          if (data.projectStatus) {
            computedProjectStatus = data.projectStatus;
          } else if (data.websiteUrl && data.websiteUrl.trim() !== "") {
            computedProjectStatus = "Completed";
          } else if (data.status) {
            const s = data.status.toLowerCase();
            if (s === "building" || s === "in_progress") computedProjectStatus = "Building";
            else if (s === "completed" || s === "done") computedProjectStatus = "Completed";
            else if (s === "cancelled") computedProjectStatus = "Cancelled";
            else computedProjectStatus = "Confirmed";
          }

          // Normalize wedding date
          let formattedWeddingDate = "—";
          let rawDateObj = null;
          if (data.weddingDate?.toDate) {
            rawDateObj = data.weddingDate.toDate();
            formattedWeddingDate = formatDatePretty(rawDateObj.toISOString().split("T")[0]);
          } else if (typeof data.weddingDate === "string") {
            formattedWeddingDate = formatDatePretty(data.weddingDate);
            rawDateObj = new Date(data.weddingDate);
          }

          // Normalize created timestamp
          let createdMillis = 0;
          if (data.createdAt?.toMillis) {
            createdMillis = data.createdAt.toMillis();
          } else if (data.createdAt?.seconds) {
            createdMillis = data.createdAt.seconds * 1000;
          }

          return {
            id: docSnap.id,
            ...data,
            totalCharged,
            webryzaAmount,
            amountPaid,
            remainingAmount,
            partnerEarnings,
            computedPaymentStatus,
            computedProjectStatus,
            formattedWeddingDate,
            rawDateObj,
            createdMillis,
          };
        });

        setProjects(docs);
        setLoading(false);
      },
      (err) => {
        console.error("Firestore error for partner cards:", err);
        if (err.code === "permission-denied" || err.message?.includes("permissions")) {
          setError("Firestore Permission Denied: Unable to access wedding projects for this partner. Please ensure the Firestore Rules in Firebase Console allow partner read access.");
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
  // Financial Summary Metrics Cards (Exact 6 required metrics!)
  // --------------------------------------------------------------------------
  const metrics = useMemo(() => {
    let totalProjects = projects.length;
    let totalAmountCharged = 0;
    let totalWebRyzaShare = 0;
    let totalAmountPaid = 0;
    let remainingBalanceDue = 0;
    let partnerEarnings = 0;

    projects.forEach((p) => {
      totalAmountCharged += p.totalCharged;
      totalWebRyzaShare += p.webryzaAmount;
      totalAmountPaid += p.amountPaid;
      remainingBalanceDue += p.remainingAmount;
      partnerEarnings += p.partnerEarnings;
    });

    return {
      totalProjects,
      totalAmountCharged,
      totalWebRyzaShare,
      totalAmountPaid,
      remainingBalanceDue,
      partnerEarnings,
    };
  }, [projects]);

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

        // Filter by Payment Status
        if (paymentStatusFilter !== "all") {
          if (p.computedPaymentStatus.toLowerCase() !== paymentStatusFilter.toLowerCase()) {
            return false;
          }
        }

        // Filter by Project Status
        if (projectStatusFilter !== "all") {
          if (p.computedProjectStatus.toLowerCase() !== projectStatusFilter.toLowerCase()) {
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
        {/* SECTION 5: REGISTRATION QR CODE & LINK PREVIEW WIDGET */}
        {/* ------------------------------------------------------------------ */}
        <PartnerQrCard partnerCode={partnerCode} shopName={shopName} />

        {/* ------------------------------------------------------------------ */}
        {/* SECTION 3: SIX FINANCIAL SUMMARY METRICS CARDS */}
        {/* ------------------------------------------------------------------ */}
        <section aria-label="Financial Summary Cards" className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#A89F91] flex items-center space-x-1.5">
              <TrendingUp size={14} className="text-[#39FF14]" />
              <span>Financial Overview & Earnings</span>
            </h2>
            <span className="text-[11px] text-[#7A7165]">
              Real-time sync from WebRyza Admin
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
            {/* Card 1: Total Projects */}
            <div className="bg-[#12100E] border border-[#26211C] rounded-2xl p-4 hover:border-[#39FF14]/40 transition-all shadow-sm group">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#A89F91] uppercase tracking-wider">
                  Total Projects
                </span>
                <div className="w-8 h-8 rounded-lg bg-[#181512] text-[#39FF14] flex items-center justify-center">
                  <Heart size={16} />
                </div>
              </div>
              <div className="mt-2.5">
                <span className="font-serif text-2xl font-bold text-[#FAF7F2]">
                  {loading ? "…" : metrics.totalProjects}
                </span>
                <p className="text-[10px] text-[#7A7165] mt-0.5">Wedding registrations</p>
              </div>
            </div>

            {/* Card 2: Total Amount Charged */}
            <div className="bg-[#12100E] border border-[#26211C] rounded-2xl p-4 hover:border-[#39FF14]/40 transition-all shadow-sm group">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#A89F91] uppercase tracking-wider">
                  Total Charged
                </span>
                <div className="w-8 h-8 rounded-lg bg-[#181512] text-[#39FF14] flex items-center justify-center">
                  <IndianRupee size={16} />
                </div>
              </div>
              <div className="mt-2.5">
                <span className="font-serif text-2xl font-bold text-[#FAF7F2]">
                  {loading ? "…" : formatINR(metrics.totalAmountCharged)}
                </span>
                <p className="text-[10px] text-[#7A7165] mt-0.5">Total customer price</p>
              </div>
            </div>

            {/* Card 3: WebRyza Share */}
            <div className="bg-[#12100E] border border-[#26211C] rounded-2xl p-4 hover:border-amber-500/40 transition-all shadow-sm group">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#A89F91] uppercase tracking-wider">
                  WebRyza Share
                </span>
                <div className="w-8 h-8 rounded-lg bg-[#181512] text-amber-400 flex items-center justify-center">
                  <Building2 size={16} />
                </div>
              </div>
              <div className="mt-2.5">
                <span className="font-serif text-2xl font-bold text-amber-400">
                  {loading ? "…" : formatINR(metrics.totalWebRyzaShare)}
                </span>
                <p className="text-[10px] text-[#7A7165] mt-0.5">WebRyza fee across cards</p>
              </div>
            </div>

            {/* Card 4: Amount Paid to WebRyza */}
            <div className="bg-[#12100E] border border-[#26211C] rounded-2xl p-4 hover:border-[#39FF14]/40 transition-all shadow-sm group">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#A89F91] uppercase tracking-wider">
                  Amount Paid
                </span>
                <div className="w-8 h-8 rounded-lg bg-[#181512] text-[#39FF14] flex items-center justify-center">
                  <CreditCard size={16} />
                </div>
              </div>
              <div className="mt-2.5">
                <span className="font-serif text-2xl font-bold text-[#39FF14]">
                  {loading ? "…" : formatINR(metrics.totalAmountPaid)}
                </span>
                <p className="text-[10px] text-[#7A7165] mt-0.5">Recorded payments</p>
              </div>
            </div>

            {/* Card 5: Remaining Balance Due */}
            <div className="bg-[#12100E] border border-[#26211C] rounded-2xl p-4 hover:border-rose-500/40 transition-all shadow-sm group">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#A89F91] uppercase tracking-wider">
                  Remaining Due
                </span>
                <div className="w-8 h-8 rounded-lg bg-[#181512] text-rose-400 flex items-center justify-center">
                  <Clock size={16} />
                </div>
              </div>
              <div className="mt-2.5">
                <span className={`font-serif text-2xl font-bold ${metrics.remainingBalanceDue > 0 ? "text-rose-400" : "text-[#7A7165]"}`}>
                  {loading ? "…" : formatINR(metrics.remainingBalanceDue)}
                </span>
                <p className="text-[10px] text-[#7A7165] mt-0.5">Balance due to WebRyza</p>
              </div>
            </div>

            {/* Card 6: Partner Earnings */}
            <div className="bg-[#12100E] border border-[#39FF14]/30 rounded-2xl p-4 shadow-[0_0_15px_rgba(57,255,20,0.1)] group">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#39FF14] uppercase tracking-wider">
                  Partner Earnings
                </span>
                <div className="w-8 h-8 rounded-lg bg-[#39FF14]/15 text-[#39FF14] flex items-center justify-center">
                  <Sparkles size={16} />
                </div>
              </div>
              <div className="mt-2.5">
                <span className="font-serif text-2xl font-bold text-[#39FF14]">
                  {loading ? "…" : formatINR(metrics.partnerEarnings)}
                </span>
                <p className="text-[10px] text-[#7A7165] mt-0.5">Your total commission</p>
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* WEDDING PROJECTS TABLE SECTION */}
        {/* ------------------------------------------------------------------ */}
        <section className="bg-[#12100E] border border-[#26211C] rounded-3xl p-5 sm:p-6 space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#FAF7F2]">
                My Wedding Projects
              </h2>
              <p className="text-xs text-[#A89F91]">
                Real-time records for {shopName} (Read-Only)
              </p>
            </div>

            {/* Quick Status Pill Counters */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => setPaymentStatusFilter("all")}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  paymentStatusFilter === "all"
                    ? "bg-[#39FF14] text-[#0A0908] font-bold"
                    : "bg-[#181512] text-[#A89F91] hover:text-[#FAF7F2]"
                }`}
              >
                All ({projects.length})
              </button>
              <button
                type="button"
                onClick={() => setPaymentStatusFilter("paid")}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  paymentStatusFilter === "paid"
                    ? "bg-[#39FF14] text-[#0A0908] font-bold"
                    : "bg-[#181512] text-[#39FF14] hover:bg-[#39FF14]/20"
                }`}
              >
                Paid ({projects.filter((p) => p.computedPaymentStatus === "Paid").length})
              </button>
              <button
                type="button"
                onClick={() => setPaymentStatusFilter("partial")}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  paymentStatusFilter === "partial"
                    ? "bg-sky-500 text-white font-bold"
                    : "bg-[#181512] text-sky-400 hover:bg-sky-500/20"
                }`}
              >
                Partial ({projects.filter((p) => p.computedPaymentStatus === "Partial").length})
              </button>
              <button
                type="button"
                onClick={() => setPaymentStatusFilter("pending")}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  paymentStatusFilter === "pending"
                    ? "bg-amber-500 text-white font-bold"
                    : "bg-[#181512] text-amber-400 hover:bg-amber-500/20"
                }`}
              >
                Pending ({projects.filter((p) => p.computedPaymentStatus === "Pending").length})
              </button>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
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

            {/* Payment Status Filter */}
            <div className="relative">
              <select
                value={paymentStatusFilter}
                onChange={(e) => {
                  setPaymentStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 bg-[#0A0908] border border-[#26211C] rounded-xl text-xs text-[#FAF7F2] focus:outline-none focus:border-[#39FF14]"
              >
                <option value="all">Payment: All Statuses</option>
                <option value="pending">Pending</option>
                <option value="partial">Partial</option>
                <option value="paid">Paid</option>
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
                <option value="all">Project: All Statuses</option>
                <option value="confirmed">Confirmed</option>
                <option value="building">Building</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
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

          {/* Projects Table Responsive Container (Exact 9 Columns!) */}
          <div className="overflow-x-auto rounded-2xl border border-[#26211C]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#181512] text-[#A89F91] border-b border-[#26211C] uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4 font-semibold">1. Couple</th>
                  <th className="py-3.5 px-4 font-semibold">2. Wedding Date</th>
                  <th className="py-3.5 px-4 font-semibold text-right">3. Total Charged</th>
                  <th className="py-3.5 px-4 font-semibold text-right">4. WebRyza Share</th>
                  <th className="py-3.5 px-4 font-semibold text-right">5. Amount Paid</th>
                  <th className="py-3.5 px-4 font-semibold text-right">6. Remaining</th>
                  <th className="py-3.5 px-4 font-semibold text-center">7. Payment Status</th>
                  <th className="py-3.5 px-4 font-semibold text-center">8. Project Status</th>
                  <th className="py-3.5 px-4 font-semibold text-center">9. Website Link &amp; QR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#26211C]">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="py-12 text-center text-[#7A7165]">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <RefreshCw size={20} className="animate-spin text-[#39FF14]" />
                        <span>Loading real-time projects from Firestore...</span>
                      </div>
                    </td>
                  </tr>
                ) : paginatedProjects.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="py-12 text-center text-[#7A7165]">
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
                        className="hover:bg-[#181512]/60 transition-colors group"
                      >
                        {/* 1. Couple Name */}
                        <td className="py-3.5 px-4 font-medium">
                          <div className="flex items-center space-x-1.5 text-sm text-[#FAF7F2]">
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

                        {/* 3. Total Charged */}
                        <td className="py-3.5 px-4 text-right font-semibold text-[#FAF7F2] whitespace-nowrap">
                          {formatINR(p.totalCharged)}
                        </td>

                        {/* 4. WebRyza Share */}
                        <td className="py-3.5 px-4 text-right font-medium text-amber-400 whitespace-nowrap">
                          {formatINR(p.webryzaAmount)}
                        </td>

                        {/* 5. Amount Paid */}
                        <td className="py-3.5 px-4 text-right font-medium text-[#39FF14] whitespace-nowrap">
                          {formatINR(p.amountPaid)}
                        </td>

                        {/* 6. Remaining */}
                        <td className="py-3.5 px-4 text-right font-semibold whitespace-nowrap">
                          <span
                            className={
                              p.remainingAmount > 0 ? "text-rose-400" : "text-[#7A7165]"
                            }
                          >
                            {formatINR(p.remainingAmount)}
                          </span>
                        </td>

                        {/* 7. Payment Status Badge */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          {p.computedPaymentStatus === "Paid" && (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#39FF14]/15 border border-[#39FF14]/40 text-[#39FF14] shadow-[0_0_8px_rgba(57,255,20,0.15)]">
                              <CheckCircle2 size={11} />
                              <span>Paid</span>
                            </span>
                          )}
                          {p.computedPaymentStatus === "Partial" && (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-sky-500/15 border border-sky-500/30 text-sky-400">
                              <Clock size={11} />
                              <span>Partial</span>
                            </span>
                          )}
                          {p.computedPaymentStatus === "Pending" && (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/15 border border-amber-500/30 text-amber-400">
                              <AlertCircle size={11} />
                              <span>Pending</span>
                            </span>
                          )}
                        </td>

                        {/* 8. Project Status Badge */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          {p.computedProjectStatus.toLowerCase() === "completed" && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-950/80 border border-emerald-500 text-emerald-300">
                              Completed
                            </span>
                          )}
                          {p.computedProjectStatus.toLowerCase() === "building" && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-cyan-950/80 border border-cyan-500 text-cyan-300">
                              Building
                            </span>
                          )}
                          {p.computedProjectStatus.toLowerCase() === "cancelled" && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-950/80 border border-rose-500 text-rose-300">
                              Cancelled
                            </span>
                          )}
                          {p.computedProjectStatus.toLowerCase() !== "completed" &&
                            p.computedProjectStatus.toLowerCase() !== "building" &&
                            p.computedProjectStatus.toLowerCase() !== "cancelled" && (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-950/80 border border-purple-500 text-purple-300">
                                Confirmed
                              </span>
                            )}
                        </td>

                        {/* 9. Website Link & QR Code */}
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          {hasWebsite ? (
                            <div className="flex items-center justify-center space-x-2.5">
                              {/* Dynamic QR Code Thumbnail */}
                              <div
                                onClick={() => setSelectedQrProject(p)}
                                className="p-1 bg-white rounded-lg shadow-sm border border-[#26211C] hover:border-[#39FF14] transition-all cursor-pointer shrink-0"
                                title="Click to view large printable QR code"
                              >
                                <QRCodeCanvas
                                  id={`qr-canvas-${p.id}`}
                                  value={p.websiteUrl}
                                  size={44}
                                  level="H"
                                  marginSize={1}
                                />
                              </div>

                              {/* Action Buttons: Copy Link, Download QR Code, Open Website */}
                              <div className="flex flex-col space-y-1 text-left">
                                <div className="flex items-center space-x-1">
                                  {/* Copy Link */}
                                  <button
                                    type="button"
                                    onClick={() => handleCopyLink(p.id, p.websiteUrl)}
                                    className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                                      isCopied
                                        ? "bg-emerald-950/90 border-[#39FF14] text-[#39FF14]"
                                        : "bg-[#181512] border-[#26211C] text-[#D8CDBF] hover:border-[#39FF14] hover:text-[#39FF14]"
                                    }`}
                                    title="Copy Website Link"
                                  >
                                    {isCopied ? <Check size={12} /> : <Copy size={12} />}
                                    <span>{isCopied ? "Copied" : "Copy Link"}</span>
                                  </button>

                                  {/* Download QR Code */}
                                  <button
                                    type="button"
                                    onClick={() => handleDownloadProjectQr(p)}
                                    className="p-1 rounded-lg bg-[#181512] border border-[#26211C] text-[#D8CDBF] hover:text-[#39FF14] hover:border-[#39FF14]/50 transition-colors"
                                    title="Download QR Code (PNG)"
                                  >
                                    <Download size={13} />
                                  </button>

                                  {/* Open Website */}
                                  <a
                                    href={p.websiteUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-1 rounded-lg bg-[#181512] border border-[#26211C] text-[#A89F91] hover:text-[#39FF14] hover:border-[#39FF14]/50 transition-colors"
                                    title="Open Live Website in new tab"
                                  >
                                    <ExternalLink size={13} />
                                  </a>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#181512] text-[#7A7165] border border-[#26211C]">
                              Under Development
                            </span>
                          )}
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
              Secure Read-Only Partner Admin Panel. Financial figures, payment status, and wedding websites are managed by WebRyza Admin.
            </span>
          </div>
          <span className="hidden sm:inline text-[11px] text-[#39FF14] font-mono">
            {shopName} ({partnerCode})
          </span>
        </div>
      </main>

      {/* Change Password Self-Service Modal */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />

      {/* Wedding Invitation QR Code Modal */}
      {selectedQrProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-sm bg-[#12100E] border border-[#39FF14]/40 rounded-3xl p-6 text-center shadow-2xl space-y-4">
            {/* Close Button */}
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

            {/* High-Res QR Code Card */}
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

            {/* Action Buttons */}
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
                {copiedId === selectedQrProject.id ? <Check size={14} className="text-[#39FF14]" /> : <Copy size={14} />}
                <span>{copiedId === selectedQrProject.id ? "Link Copied!" : "Copy Invitation Link"}</span>
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
    </div>
  );
}
