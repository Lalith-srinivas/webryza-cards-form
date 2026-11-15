import React, { useState, useEffect, useMemo } from "react";
import { usePartnerAuth } from "../context/PartnerAuthContext";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "../config/firebase";
import { formatINR, formatDatePretty } from "../utils/formatters";
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
  LogOut,
  Menu,
  X,
  ChevronDown,
  Calendar,
  Heart,
  ShieldCheck,
  Sparkles,
  ArrowUpDown,
  RefreshCw,
  FolderOpen,
} from "lucide-react";

export default function PartnerDashboardPage() {
  const { partnerProfile, logout } = usePartnerAuth();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // UI Navigation & Mobile Menu State
  const [currentTab, setCurrentTab] = useState("overview"); // "overview" | "projects"
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Search, Filter, Sort & Pagination State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // "all" | "pending" | "partial" | "paid"
  const [dateFilter, setDateFilter] = useState("all"); // "all" | "upcoming" | "past"
  const [sortOption, setSortOption] = useState("newest"); // "newest" | "oldest" | "weddingDate"
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Copy toast state: maps projectId -> boolean
  const [copiedId, setCopiedId] = useState(null);

  // Real-time Firestore Listener for this partner's projects
  useEffect(() => {
    if (!partnerProfile?.partnerCode && !partnerProfile?.partnerId && !partnerProfile?.id) {
      setLoading(false);
      return;
    }

    const partnerCode = (partnerProfile.partnerCode || partnerProfile.partnerId || partnerProfile.id || "").toString().trim();

    setLoading(true);
    setError(null);

    // Query wedding_cards collection filtered strictly by this partner's ID
    const q = query(
      collection(db, "wedding_cards"),
      where("partnerId", "==", partnerCode)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();

          // Calculate payment status dynamically from financial fields
          const webryzaAmount = Number(data.webryzaShare || data.amountDueToWebryza || 1500);
          const amountPaid = Number(data.amountReceivedByWebryza || 0);
          const remainingAmount = Math.max(0, webryzaAmount - amountPaid);

          let computedStatus = "Pending";
          if (amountPaid >= webryzaAmount && webryzaAmount > 0) {
            computedStatus = "Paid";
          } else if (amountPaid > 0) {
            computedStatus = "Partial";
          } else if (data.paymentStatus) {
            const norm = data.paymentStatus.toLowerCase();
            if (norm === "paid") computedStatus = "Paid";
            else if (norm === "partial") computedStatus = "Partial";
            else computedStatus = "Pending";
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
            computedStatus,
            webryzaAmount,
            amountPaid,
            remainingAmount,
            formattedWeddingDate,
            rawDateObj,
            createdMillis,
          };
        });

        setProjects(docs);
        setLoading(false);
      },
      (err) => {
        console.error("Firestore listener error for partner projects:", err);
        setError("Unable to load real-time wedding projects. Please check your internet connection.");
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

  // --------------------------------------------------------------------------
  // Summary Metrics Calculations (Real-time)
  // --------------------------------------------------------------------------
  const metrics = useMemo(() => {
    let totalProjects = projects.length;
    let totalDue = 0;
    let totalPaid = 0;
    let pendingCount = 0;

    projects.forEach((p) => {
      totalDue += p.remainingAmount;
      totalPaid += p.amountPaid;

      if (p.computedStatus === "Pending" || p.computedStatus === "Partial") {
        pendingCount += 1;
      }
    });

    return {
      totalProjects,
      totalDue,
      totalPaid,
      pendingCount,
    };
  }, [projects]);

  // --------------------------------------------------------------------------
  // Filter, Search, and Sort Logic
  // --------------------------------------------------------------------------
  const filteredProjects = useMemo(() => {
    return projects
      .filter((p) => {
        // Search by bride or groom name
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const brideMatch = (p.brideName || "").toLowerCase().includes(q);
          const groomMatch = (p.groomName || "").toLowerCase().includes(q);
          const phoneMatch = (p.phone || "").includes(q);
          if (!brideMatch && !groomMatch && !phoneMatch) return false;
        }

        // Status Filter
        if (statusFilter !== "all") {
          if (p.computedStatus.toLowerCase() !== statusFilter.toLowerCase()) {
            return false;
          }
        }

        // Date Filter
        if (dateFilter !== "all" && p.rawDateObj) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (dateFilter === "upcoming" && p.rawDateObj < today) return false;
          if (dateFilter === "past" && p.rawDateObj >= today) return false;
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
  }, [projects, searchQuery, statusFilter, dateFilter, sortOption]);

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

  return (
    <div className="min-h-screen bg-[#0F0D0B] text-[#FAF7F2] flex flex-col md:flex-row antialiased">
      {/* -------------------------------------------------------------------- */}
      {/* SIDEBAR: Modern SaaS Dark Sidebar */}
      {/* -------------------------------------------------------------------- */}
      <aside className="hidden md:flex flex-col justify-between w-64 bg-[#141210] border-r border-[#26211C] p-5 shrink-0 min-h-screen sticky top-0">
        <div>
          {/* Logo Branding */}
          <div className="flex items-center space-x-3 pb-6 border-b border-[#26211C]">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#D4AF37] via-[#F3E5AB] to-[#B8860B] p-[1.5px] shadow-sm flex items-center justify-center">
              <div className="w-full h-full rounded-xl bg-[#141210] flex items-center justify-center">
                <Store size={18} className="text-[#D4AF37]" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-serif text-lg font-bold tracking-tight text-[#FAF7F2]">
                  WebRyza
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]"></span>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#93611D]">
                Partner Portal
              </span>
            </div>
          </div>

          {/* Partner Info Summary in Sidebar */}
          <div className="my-5 p-3 rounded-2xl bg-[#1A1714] border border-[#26211C]">
            <div className="flex items-center justify-between text-[11px] text-[#A89F91] mb-1">
              <span>Partner Shop:</span>
              <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]"></span>
                <span>Active</span>
              </span>
            </div>
            <p className="font-semibold text-sm text-[#FAF7F2] truncate">
              {partnerProfile?.shopName || "Partner Shop"}
            </p>
            <p className="text-xs text-[#D4AF37] font-mono mt-0.5 font-bold">
              ID: {partnerProfile?.partnerId || partnerProfile?.id || "SHOP001"}
            </p>
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
                  ? "bg-[#D4AF37]/15 text-[#E6CA65] border border-[#D4AF37]/30 shadow-xs"
                  : "text-[#A89F91] hover:bg-[#1C1814] hover:text-[#FAF7F2]"
              }`}
            >
              <Layers size={16} />
              <span>Overview</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setCurrentTab("projects");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                currentTab === "projects"
                  ? "bg-[#D4AF37]/15 text-[#E6CA65] border border-[#D4AF37]/30 shadow-xs"
                  : "text-[#A89F91] hover:bg-[#1C1814] hover:text-[#FAF7F2]"
              }`}
            >
              <div className="flex items-center space-x-3">
                <Heart size={16} />
                <span>My Wedding Projects</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-[#26211C] text-[10px] font-bold text-[#D8CDBF]">
                {projects.length}
              </span>
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
      <header className="md:hidden bg-[#141210] border-b border-[#26211C] p-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#D4AF37] to-[#B8860B] p-[1px] flex items-center justify-center">
            <div className="w-full h-full rounded-lg bg-[#141210] flex items-center justify-center">
              <Store size={15} className="text-[#D4AF37]" />
            </div>
          </div>
          <div>
            <h1 className="font-serif text-sm font-bold text-[#FAF7F2] leading-tight">
              {partnerProfile?.shopName || "WebRyza Partner"}
            </h1>
            <p className="text-[10px] text-[#D4AF37] font-mono leading-none">
              {partnerProfile?.partnerId || partnerProfile?.id || "SHOP001"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-lg bg-[#1C1814] text-[#FAF7F2] border border-[#26211C]"
          aria-label="Toggle mobile menu"
        >
          {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </header>

      {/* MOBILE DRAWER */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#141210] border-b border-[#26211C] p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#26211C]">
              <div>
                <p className="text-xs text-[#A89F91]">Logged in as:</p>
                <p className="font-bold text-sm text-[#FAF7F2]">{partnerProfile?.shopName}</p>
                <p className="text-xs text-[#D4AF37] font-mono">ID: {partnerProfile?.partnerId}</p>
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
                    ? "bg-[#D4AF37]/15 text-[#E6CA65] border border-[#D4AF37]/30"
                    : "text-[#A89F91]"
                }`}
              >
                <Layers size={16} />
                <span>Overview</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCurrentTab("projects");
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold ${
                  currentTab === "projects"
                    ? "bg-[#D4AF37]/15 text-[#E6CA65] border border-[#D4AF37]/30"
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
                onClick={logout}
                className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-950/30"
              >
                <LogOut size={16} />
                <span>Logout</span>
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
            <div className="flex items-center space-x-2">
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#FAF7F2]">
                Welcome, {partnerProfile?.shopName || "Partner"}
              </h1>
              <span className="hidden sm:inline-flex items-center space-x-1 text-[11px] font-bold text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/20 px-2.5 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse"></span>
                <span>Active Account</span>
              </span>
            </div>
            <p className="text-xs text-[#A89F91] mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span>
                Partner ID:{" "}
                <strong className="text-[#D4AF37] font-mono">
                  {partnerProfile?.partnerId || partnerProfile?.id || "SHOP001"}
                </strong>
              </span>
              <span>•</span>
              <span>
                Username:{" "}
                <strong className="text-[#FAF7F2]">
                  {partnerProfile?.username || partnerProfile?.email || "—"}
                </strong>
              </span>
              <span>•</span>
              <span className="text-[#10B981] font-semibold">Live Real-time Sync Active</span>
            </p>
          </div>

          <div className="flex items-center space-x-2 self-start sm:self-auto">
            <span className="text-xs text-[#7A7165]">
              Viewing {projects.length} wedding {projects.length === 1 ? "project" : "projects"}
            </span>
          </div>
        </div>

        {/* Global Error Banner if any */}
        {error && (
          <div className="p-3.5 bg-rose-950/60 border border-rose-800 rounded-xl text-rose-200 text-xs flex items-center space-x-2.5">
            <AlertCircle size={16} className="text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* SECTION 4: FOUR SUMMARY CARDS */}
        {/* ------------------------------------------------------------------ */}
        <section aria-label="Dashboard Metrics Summary" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Wedding Projects */}
          <div className="bg-[#161310] border border-[#26211C] rounded-2xl p-5 hover:border-[#D4AF37]/50 transition-all shadow-sm group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#A89F91] uppercase tracking-wider">
                Total Wedding Projects
              </span>
              <div className="w-9 h-9 rounded-xl bg-[#211C18] text-[#D4AF37] flex items-center justify-center group-hover:scale-105 transition-transform">
                <Heart size={18} />
              </div>
            </div>
            <div className="mt-3">
              <span className="font-serif text-3xl font-bold text-[#FAF7F2]">
                {loading ? "…" : metrics.totalProjects}
              </span>
              <p className="text-[11px] text-[#7A7165] mt-1">
                Registrations through this partner
              </p>
            </div>
          </div>

          {/* Card 2: Total Amount Due to WebRyza */}
          <div className="bg-[#161310] border border-[#26211C] rounded-2xl p-5 hover:border-[#F59E0B]/50 transition-all shadow-sm group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#A89F91] uppercase tracking-wider">
                Total Amount Due
              </span>
              <div className="w-9 h-9 rounded-xl bg-[#211C18] text-[#F59E0B] flex items-center justify-center group-hover:scale-105 transition-transform">
                <Clock size={18} />
              </div>
            </div>
            <div className="mt-3">
              <span className="font-serif text-3xl font-bold text-[#F59E0B]">
                {loading ? "…" : formatINR(metrics.totalDue)}
              </span>
              <p className="text-[11px] text-[#7A7165] mt-1">
                Outstanding balance across projects
              </p>
            </div>
          </div>

          {/* Card 3: Total Amount Paid */}
          <div className="bg-[#161310] border border-[#26211C] rounded-2xl p-5 hover:border-[#10B981]/50 transition-all shadow-sm group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#A89F91] uppercase tracking-wider">
                Total Amount Paid
              </span>
              <div className="w-9 h-9 rounded-xl bg-[#211C18] text-[#10B981] flex items-center justify-center group-hover:scale-105 transition-transform">
                <IndianRupee size={18} />
              </div>
            </div>
            <div className="mt-3">
              <span className="font-serif text-3xl font-bold text-[#10B981]">
                {loading ? "…" : formatINR(metrics.totalPaid)}
              </span>
              <p className="text-[11px] text-[#7A7165] mt-1">
                Payments recorded by WebRyza
              </p>
            </div>
          </div>

          {/* Card 4: Pending Payments */}
          <div className="bg-[#161310] border border-[#26211C] rounded-2xl p-5 hover:border-amber-500/50 transition-all shadow-sm group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#A89F91] uppercase tracking-wider">
                Pending Payments
              </span>
              <div className="w-9 h-9 rounded-xl bg-[#211C18] text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <AlertCircle size={18} />
              </div>
            </div>
            <div className="mt-3">
              <span className="font-serif text-3xl font-bold text-amber-400">
                {loading ? "…" : metrics.pendingCount}
              </span>
              <p className="text-[11px] text-[#7A7165] mt-1">
                Projects pending full settlement
              </p>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* SECTION 5: WEDDING PROJECTS TABLE */}
        {/* ------------------------------------------------------------------ */}
        <section className="bg-[#161310] border border-[#26211C] rounded-3xl p-5 sm:p-6 space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#FAF7F2]">
                My Wedding Projects
              </h2>
              <p className="text-xs text-[#A89F91]">
                Real-time records maintained by WebRyza Admin (Read-Only)
              </p>
            </div>

            {/* Quick Status Pill Counters */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  statusFilter === "all"
                    ? "bg-[#D4AF37] text-[#141210]"
                    : "bg-[#211C18] text-[#A89F91] hover:text-[#FAF7F2]"
                }`}
              >
                All ({projects.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("paid")}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  statusFilter === "paid"
                    ? "bg-[#10B981] text-white"
                    : "bg-[#211C18] text-[#10B981] hover:bg-[#10B981]/20"
                }`}
              >
                Paid (
                {projects.filter((p) => p.computedStatus === "Paid").length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("partial")}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  statusFilter === "partial"
                    ? "bg-sky-500 text-white"
                    : "bg-[#211C18] text-sky-400 hover:bg-sky-500/20"
                }`}
              >
                Partial (
                {projects.filter((p) => p.computedStatus === "Partial").length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("pending")}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  statusFilter === "pending"
                    ? "bg-amber-500 text-white"
                    : "bg-[#211C18] text-amber-400 hover:bg-amber-500/20"
                }`}
              >
                Pending (
                {projects.filter((p) => p.computedStatus === "Pending").length})
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
                placeholder="Search by bride, groom name..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-3 py-2 bg-[#0F0D0B] border border-[#26211C] rounded-xl text-xs text-[#FAF7F2] placeholder-[#665C51] focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 bg-[#0F0D0B] border border-[#26211C] rounded-xl text-xs text-[#FAF7F2] focus:outline-none focus:border-[#D4AF37]"
              >
                <option value="all">Payment Status: All</option>
                <option value="pending">Pending</option>
                <option value="partial">Partial</option>
                <option value="paid">Paid</option>
              </select>
            </div>

            {/* Wedding Date Filter */}
            <div className="relative">
              <select
                value={dateFilter}
                onChange={(e) => {
                  setDateFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 bg-[#0F0D0B] border border-[#26211C] rounded-xl text-xs text-[#FAF7F2] focus:outline-none focus:border-[#D4AF37]"
              >
                <option value="all">Date: All Dates</option>
                <option value="upcoming">Upcoming Weddings</option>
                <option value="past">Past Weddings</option>
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
                className="w-full px-3 py-2 bg-[#0F0D0B] border border-[#26211C] rounded-xl text-xs text-[#FAF7F2] focus:outline-none focus:border-[#D4AF37]"
              >
                <option value="newest">Sort: Newest Registrations</option>
                <option value="oldest">Sort: Oldest Registrations</option>
                <option value="weddingDate">Sort: Wedding Date</option>
              </select>
            </div>
          </div>

          {/* Projects Table Responsive Container */}
          <div className="overflow-x-auto rounded-2xl border border-[#26211C]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#1A1714] text-[#A89F91] border-b border-[#26211C] uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4 font-semibold">Couple</th>
                  <th className="py-3.5 px-4 font-semibold">Wedding Date</th>
                  <th className="py-3.5 px-4 font-semibold">Website</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Total Charged</th>
                  <th className="py-3.5 px-4 font-semibold text-right">WebRyza Amount</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Paid</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Remaining</th>
                  <th className="py-3.5 px-4 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#26211C]">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="py-12 text-center text-[#7A7165]">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <RefreshCw size={20} className="animate-spin text-[#D4AF37]" />
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
                          {searchQuery || statusFilter !== "all" || dateFilter !== "all"
                            ? "Try adjusting your search or filters to see more results."
                            : `When customers scan your QR code (ref=${partnerProfile?.partnerId}) and register, their projects will appear here automatically.`}
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
                        className="hover:bg-[#1A1714]/60 transition-colors group"
                      >
                        {/* 1. Couple */}
                        <td className="py-3 px-4 font-medium">
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
                        <td className="py-3 px-4 text-[#D8CDBF] whitespace-nowrap">
                          <div className="flex items-center space-x-1.5">
                            <Calendar size={12} className="text-[#93611D]" />
                            <span>{p.formattedWeddingDate}</span>
                          </div>
                        </td>

                        {/* 3. Website Link */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          {hasWebsite ? (
                            <div className="flex items-center space-x-1.5">
                              <button
                                type="button"
                                onClick={() => handleCopyLink(p.id, p.websiteUrl)}
                                className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                                  isCopied
                                    ? "bg-emerald-950/80 border-emerald-500 text-emerald-300"
                                    : "bg-[#211C18] border-[#3D352E] text-[#D8CDBF] hover:border-[#D4AF37] hover:text-[#FAF7F2]"
                                }`}
                                title="Copy Website Link"
                              >
                                {isCopied ? <Check size={12} /> : <Copy size={12} />}
                                <span>{isCopied ? "Copied!" : "Copy Link"}</span>
                              </button>

                              <a
                                href={p.websiteUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1 rounded-lg bg-[#211C18] text-[#A89F91] hover:text-[#D4AF37] hover:bg-[#2B241F] transition-colors"
                                title="Open Website in new tab"
                              >
                                <ExternalLink size={13} />
                              </a>
                            </div>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#211C18] text-[#7A7165] border border-[#2D261E]">
                              Website Under Development
                            </span>
                          )}
                        </td>

                        {/* 4. Total Charged */}
                        <td className="py-3 px-4 text-right font-semibold text-[#FAF7F2] whitespace-nowrap">
                          {formatINR(p.amountCharged)}
                        </td>

                        {/* 5. WebRyza Amount */}
                        <td className="py-3 px-4 text-right font-medium text-[#D8CDBF] whitespace-nowrap">
                          {formatINR(p.webryzaAmount)}
                        </td>

                        {/* 6. Amount Paid */}
                        <td className="py-3 px-4 text-right font-medium text-[#10B981] whitespace-nowrap">
                          {formatINR(p.amountPaid)}
                        </td>

                        {/* 7. Remaining */}
                        <td className="py-3 px-4 text-right font-semibold whitespace-nowrap">
                          <span
                            className={
                              p.remainingAmount > 0 ? "text-[#F59E0B]" : "text-[#7A7165]"
                            }
                          >
                            {formatINR(p.remainingAmount)}
                          </span>
                        </td>

                        {/* 8. Status Badge */}
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          {p.computedStatus === "Paid" && (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#10B981]/15 border border-[#10B981]/30 text-[#10B981]">
                              <CheckCircle2 size={11} />
                              <span>Paid</span>
                            </span>
                          )}
                          {p.computedStatus === "Partial" && (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-sky-500/15 border border-sky-500/30 text-sky-400">
                              <Clock size={11} />
                              <span>Partial</span>
                            </span>
                          )}
                          {p.computedStatus === "Pending" && (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/15 border border-amber-500/30 text-amber-400">
                              <AlertCircle size={11} />
                              <span>Pending</span>
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
                  className="px-3 py-1.5 rounded-lg border border-[#26211C] bg-[#0F0D0B] text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#1C1814] transition-colors"
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
                        ? "bg-[#D4AF37] text-[#141210] font-bold"
                        : "bg-[#0F0D0B] border border-[#26211C] text-[#A89F91] hover:text-[#FAF7F2]"
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-lg border border-[#26211C] bg-[#0F0D0B] text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#1C1814] transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Read-Only Notice Footer */}
        <div className="p-4 rounded-2xl bg-[#141210] border border-[#26211C] flex items-center justify-between text-xs text-[#7A7165]">
          <div className="flex items-center space-x-2">
            <ShieldCheck size={16} className="text-[#10B981]" />
            <span>
              Secure Read-Only Partner Portal. All financial and website data is verified and synchronized by WebRyza Admin.
            </span>
          </div>
          <span className="hidden sm:inline text-[11px] text-[#D4AF37] font-mono">
            {partnerProfile?.shopName} ({partnerProfile?.partnerId})
          </span>
        </div>
      </main>
    </div>
  );
}
