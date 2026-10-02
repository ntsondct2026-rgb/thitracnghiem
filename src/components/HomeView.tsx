import React, { useState, useMemo } from "react";
import { 
  GraduationCap, 
  ArrowRight, 
  Clock, 
  Users, 
  BookOpen, 
  Award, 
  Shield, 
  Zap, 
  Search, 
  ExternalLink,
  ChevronRight,
  HelpCircle,
  FileCheck,
  CheckCircle,
  Info,
  Calendar,
  Sparkles,
  ArrowRightCircle,
  BookMarked,
  UserCheck,
  Check,
  Lock,
  X,
  Folder as FolderIcon,
  FolderOpen
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ExamRoom, Question, Folder } from "../types";

// Simple utility for merging tailwind classes
function cn(...classes: (string | undefined | null | boolean)[]) {
  return classes.filter(Boolean).join(" ");
}

export function getCategoryStyle(catName: string) {
  const lower = catName.toLowerCase();
  if (lower.includes("toán") || lower.includes("math")) {
    return {
      tab: "bg-amber-50 border-amber-250 text-amber-900 hover:bg-amber-100/50",
      body: "border-amber-200 bg-amber-50/5",
      text: "text-amber-600",
      bg: "bg-amber-500",
      iconBg: "bg-amber-100"
    };
  }
  if (lower.includes("lý") || lower.includes("lí") || lower.includes("physics")) {
    return {
      tab: "bg-sky-50 border-sky-250 text-sky-900 hover:bg-sky-100/50",
      body: "border-sky-200 bg-sky-50/5",
      text: "text-sky-600",
      bg: "bg-sky-500",
      iconBg: "bg-sky-100"
    };
  }
  if (lower.includes("anh") || lower.includes("english")) {
    return {
      tab: "bg-rose-50 border-rose-250 text-rose-900 hover:bg-rose-100/50",
      body: "border-rose-200 bg-rose-50/5",
      text: "text-rose-600",
      bg: "bg-rose-500",
      iconBg: "bg-rose-100"
    };
  }
  if (lower.includes("hóa") || lower.includes("chemistry")) {
    return {
      tab: "bg-emerald-50 border-emerald-250 text-emerald-900 hover:bg-emerald-100/50",
      body: "border-emerald-200 bg-emerald-50/5",
      text: "text-emerald-600",
      bg: "bg-emerald-500",
      iconBg: "bg-emerald-100"
    };
  }
  if (lower.includes("sinh") || lower.includes("biology")) {
    return {
      tab: "bg-teal-50 border-teal-250 text-teal-900 hover:bg-teal-100/50",
      body: "border-teal-200 bg-teal-50/5",
      text: "text-teal-600",
      bg: "bg-teal-500",
      iconBg: "bg-teal-100"
    };
  }
  if (lower.includes("tin") || lower.includes("computer")) {
    return {
      tab: "bg-indigo-50 border-indigo-250 text-indigo-900 hover:bg-indigo-100/50",
      body: "border-indigo-200 bg-indigo-50/5",
      text: "text-indigo-600",
      bg: "bg-indigo-500",
      iconBg: "bg-indigo-100"
    };
  }
  if (lower.includes("địa") || lower.includes("geography")) {
    return {
      tab: "bg-orange-50 border-orange-250 text-orange-900 hover:bg-orange-100/50",
      body: "border-orange-200 bg-orange-50/5",
      text: "text-orange-600",
      bg: "bg-orange-500",
      iconBg: "bg-orange-100"
    };
  }
  if (catName === "Tất cả") {
    return {
      tab: "bg-indigo-50 border-indigo-200 text-indigo-850 hover:bg-indigo-100/50",
      body: "border-indigo-150 bg-indigo-50/5",
      text: "text-indigo-605",
      bg: "bg-indigo-600",
      iconBg: "bg-indigo-100"
    };
  }

  // Hash code for custom colors
  let hash = 0;
  for (let i = 0; i < catName.length; i++) {
    hash = catName.charCodeAt(i) + ((hash << 5) - hash);
  }
  hash = Math.abs(hash);

  const colorOptions = [
    { name: "fuchsia", tab: "bg-fuchsia-50 border-fuchsia-250 text-fuchsia-900 hover:bg-fuchsia-100/50", body: "border-fuchsia-200 bg-fuchsia-50/5", text: "text-fuchsia-600", bg: "bg-fuchsia-500", iconBg: "bg-fuchsia-100" },
    { name: "purple", tab: "bg-purple-50 border-purple-250 text-purple-950 text-purple-900 hover:bg-purple-100/50", body: "border-purple-200 bg-purple-50/5", text: "text-purple-600", bg: "bg-purple-500", iconBg: "bg-purple-100" },
    { name: "cyan", tab: "bg-cyan-50 border-cyan-250 text-cyan-900 hover:bg-cyan-100/50", body: "border-cyan-200 bg-cyan-50/5", text: "text-cyan-600", bg: "bg-cyan-500", iconBg: "bg-cyan-100" },
    { name: "lime", tab: "bg-lime-50 border-lime-250 text-lime-900 hover:bg-lime-100/50", body: "border-lime-200 bg-lime-50/5", text: "text-lime-600", bg: "bg-lime-500", iconBg: "bg-lime-100" },
    { name: "violet", tab: "bg-violet-50 border-violet-250 text-violet-900 hover:bg-violet-100/50", body: "border-violet-200 bg-violet-50/5", text: "text-violet-600", bg: "bg-violet-500", iconBg: "bg-violet-100" },
    { name: "pink", tab: "bg-pink-50 border-pink-250 text-pink-900 hover:bg-pink-100/50", body: "border-pink-200 bg-pink-50/5", text: "text-pink-600", bg: "bg-pink-500", iconBg: "bg-pink-100" }
  ];
  return colorOptions[hash % colorOptions.length];
}

interface HomeViewProps {
  examRooms: ExamRoom[];
  questions: Question[];
  folders: Folder[];
  onStartExam: (examCode: string) => Promise<void> | void;
  onStudentLogin: (name: string, sbd: string, isFree?: boolean) => void;
  onNavigateToLogin: () => void;
  onNavigateToAdmin: () => void;
  onStartFreeExamDirectly: (name: string, sbd: string, examCode: string) => void;
  setExamRooms: React.Dispatch<React.SetStateAction<ExamRoom[]>>;
}

export default function HomeView({
  examRooms,
  questions,
  folders,
  onStartExam,
  onStudentLogin,
  onNavigateToLogin,
  onNavigateToAdmin,
  onStartFreeExamDirectly,
  setExamRooms
}: HomeViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedExam, setSelectedExam] = useState<ExamRoom | null>(null);

  // Registration modal for free candidates
  const [regName, setRegName] = useState("");
  const [regClass, setRegClass] = useState("");
  const [regSchool, setRegSchool] = useState("");
  const [regError, setRegError] = useState("");

  // Filter exam rooms that are active
  const activeRooms = useMemo(() => {
    return examRooms.filter(room => room.isActive);
  }, [examRooms]);

  // Filter active exam rooms that are created by the admin/teacher and specifically marked for free practice
  const activeFreeRooms = useMemo(() => {
    return examRooms.filter(room => room.isActive && room.isFree);
  }, [examRooms]);

  // Only display active custom free exam rooms created by teachers or admins.
  // Since we pre-seed the demo exams in the database, admins can delete them as they wish.
  const displayedExams = useMemo(() => {
    return activeFreeRooms;
  }, [activeFreeRooms]);

  // Search filter
  const filteredExams = useMemo(() => {
    return displayedExams.filter(exam => 
      exam.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      exam.code.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [displayedExams, searchTerm]);

  // Filter custom question folders
  const questionFolders = useMemo(() => {
    return (folders || []).filter(f => !f.type || f.type === 'question');
  }, [folders]);

  // Recursively find the top parent folder of any given folder ID
  const getRootFolder = (folderId: string): Folder | undefined => {
    let current = questionFolders.find(f => f.id === folderId);
    if (!current) return undefined;
    
    let depth = 0;
    while (current.parentId && depth < 20) {
      const parent = questionFolders.find(f => f.id === current.parentId);
      if (!parent) break;
      current = parent;
      depth++;
    }
    return current;
  };

  // Helper to find the matching category name for an ExamRoom
  const getExamCategory = (exam: ExamRoom): string => {
    // 1. Try questions in this exam
    const examQuestions = questions.filter(q => exam.questionIds.includes(q.id));
    const counts: Record<string, number> = {};
    examQuestions.forEach(q => {
      if (q.folderId) {
        const rootFold = getRootFolder(q.folderId);
        if (rootFold) {
          counts[rootFold.name] = (counts[rootFold.name] || 0) + 1;
        }
      }
    });

    let bestCategory: string | null = null;
    let maxCount = 0;
    for (const [catName, count] of Object.entries(counts)) {
      if (count > maxCount) {
        maxCount = count;
        bestCategory = catName;
      }
    }

    if (bestCategory) {
      return bestCategory;
    }

    // 2. Try match folder name in exam name / code
    const nameLower = exam.name.toLowerCase();
    const codeLower = exam.code.toLowerCase();
    
    // Sort custom folders by length descending to match most specific folder first
    const sortedFolders = [...questionFolders].sort((a, b) => b.name.length - a.name.length);
    for (const folder of sortedFolders) {
      const folderNameLower = folder.name.toLowerCase();
      if (nameLower.includes(folderNameLower) || codeLower.includes(folderNameLower)) {
        const rootFold = getRootFolder(folder.id);
        return rootFold ? rootFold.name : folder.name;
      }
    }

    // 3. Fallback to basic keyword matching from previous version if it matches any keyword
    if (nameLower.includes("toán") || codeLower.includes("toan") || nameLower.includes("math")) {
      return "Toán Học";
    }
    if (nameLower.includes("vật lý") || nameLower.includes("vật lí") || codeLower.includes("ly") || codeLower.includes("li") || nameLower.includes("physics")) {
      return "Vật Lý";
    }
    if (nameLower.includes("tiếng anh") || nameLower.includes("anh văn") || codeLower.includes("eng") || nameLower.includes("english")) {
      return "Tiếng Anh";
    }
    if (nameLower.includes("hóa") || codeLower.includes("hoa") || nameLower.includes("chemistry")) {
      return "Hóa Học";
    }
    if (nameLower.includes("sinh") || nameLower.includes("biology")) {
      return "Sinh Học";
    }
    if (nameLower.includes("tin") || codeLower.includes("tin")) {
      return "Tin Học";
    }
    if (nameLower.includes("địa") || codeLower.includes("dia")) {
      return "Địa Lý";
    }

    return "Chủ đề khác";
  };

  // Folder navigation state
  const [activeFolder, setActiveFolder] = useState<string>("Tất cả");

  // Dynamic set of categories with exams or that exist in folders
  const activeCategories = useMemo(() => {
    const list = new Set<string>();
    
    // Only add root-level folders (folders without parentId or parentId not present in questionFolders)
    const rootFolders = questionFolders.filter(
      f => !f.parentId || !questionFolders.some(p => p.id === f.parentId)
    );
    rootFolders.forEach(f => {
      list.add(f.name);
    });

    // Also collect from displayed exams (ensuring fallback categories or static ones have their folder tabs)
    displayedExams.forEach(exam => {
      list.add(getExamCategory(exam));
    });

    return ["Tất cả", ...Array.from(list)];
  }, [questionFolders, displayedExams]);

  // Calculate folder counts based on all available free exams
  const folderCounts = useMemo(() => {
    const counts: Record<string, number> = {
      "Tất cả": displayedExams.length
    };

    activeCategories.forEach(cat => {
      if (cat !== "Tất cả") {
        counts[cat] = 0;
      }
    });

    displayedExams.forEach(exam => {
      const cat = getExamCategory(exam);
      if (counts[cat] !== undefined) {
        counts[cat]++;
      } else {
        counts[cat] = 1;
      }
    });

    return counts;
  }, [displayedExams, activeCategories]);

  // Group only the exams matching the search terms
  const groupedExams = useMemo(() => {
    const groups: Record<string, ExamRoom[]> = {};

    activeCategories.forEach(cat => {
      if (cat !== "Tất cả") {
        groups[cat] = [];
      }
    });

    filteredExams.forEach(exam => {
      const cat = getExamCategory(exam);
      if (!groups[cat]) {
        groups[cat] = [];
      }
      groups[cat].push(exam);
    });

    // If activeFolder is not "Tất cả", we only display that chosen group
    if (activeFolder !== "Tất cả") {
      const singleGroup: Record<string, ExamRoom[]> = {};
      if (groups[activeFolder]) {
        singleGroup[activeFolder] = groups[activeFolder];
      }
      return singleGroup;
    }

    // Otherwise, return all groups that have at least one exam under the current search
    const nonEmptyGroups: Record<string, ExamRoom[]> = {};
    for (const key of Object.keys(groups)) {
      if (groups[key].length > 0) {
        nonEmptyGroups[key] = groups[key];
      }
    }
    return nonEmptyGroups;
  }, [filteredExams, activeFolder, activeCategories]);

  // Register and participate directly
  const handleRegisterAndStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExam) return;
    
    if (!regName.trim() || !regClass.trim() || !regSchool.trim()) {
      setRegError("Vui lòng điền đầy đủ và chính xác tất cả thông tin!");
      return;
    }

    // Ensure the exam exists in the parent state list so startExam works
    const exists = examRooms.some(r => r.code.toUpperCase() === selectedExam.code.toUpperCase());
    if (!exists) {
      // Programmatically add this demo exam room so that backend / App engine recognizes it
      setExamRooms(prev => [...prev.filter(r => r.id !== selectedExam.id), selectedExam]);
      
      // Also register this exam room with the mock backend
      fetch("/api/exam-rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selectedExam)
      }).catch(err => console.error("Error writing demo free exam room:", err));
    }

    const formattedSbd = `TS-Tự do [Lớp ${regClass.trim()} - Trường ${regSchool.trim()}]`;
    onStartFreeExamDirectly(regName.trim(), formattedSbd, selectedExam.code);
    
    // Reset modal state
    setSelectedExam(null);
    setRegName("");
    setRegClass("");
    setRegSchool("");
    setRegError("");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col antialiased">
      {/* GLOWING AMBIENT ACCENTS */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-blue-200/20 rounded-full blur-3xl pointer-events-none" />

      {/* HEADER NAVBAR */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-sm px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-650 text-white rounded-xl shadow-lg shadow-indigo-650/20">
              <GraduationCap size={24} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <svg className="w-5.5 h-5.5 text-indigo-600 flex-shrink-0 animate-pulse" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" fill="url(#brand-shield-grad)" />
                  <path d="M8.5 12.2L10.8 14.5L15.8 9.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  <defs>
                    <linearGradient id="brand-shield-grad" x1="4" y1="2" x2="20" y2="22" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#4F46E5" />
                      <stop offset="1" stopColor="#2563EB" />
                    </linearGradient>
                  </defs>
                </svg>
                <span className="font-extrabold text-lg sm:text-xl tracking-tight bg-gradient-to-r from-indigo-750 to-blue-650 bg-clip-text text-indigo-700">
                  TINHOC DCT
                </span>
              </div>
              <p className="text-[10px] font-bold text-slate-400 tracking-wider mt-0.5">HỆ THỐNG THI TRỰC TUYẾN</p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <a href="#bài-thi" className="text-sm font-semibold text-slate-500 hover:text-indigo-650 transition-colors">Bài Thi Tự Do</a>
            <a href="#tính-năng" className="text-sm font-semibold text-slate-500 hover:text-indigo-650 transition-colors">Tính Năng</a>
            <button 
              onClick={onNavigateToAdmin} 
              className="text-sm font-semibold text-slate-500 hover:text-indigo-650 transition-colors cursor-pointer bg-transparent border-none p-0 focus:outline-none"
            >
              Dành Cho Giáo Viên
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            <button 
              onClick={onNavigateToLogin}
              className="px-4.5 py-2 hover:bg-slate-100 text-indigo-650 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5"
            >
              Vào thi (SBD)
            </button>
            <button 
              onClick={onNavigateToAdmin}
              className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-orange-500/20 hover:shadow-orange-500/30 active:scale-[0.98] cursor-pointer"
            >
              Cổng Giáo Viên 🔐
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative px-6 py-16 md:py-24 max-w-4xl mx-auto w-full flex flex-col items-center text-center gap-8 z-10">
        <div className="space-y-6 flex flex-col items-center">
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-750 border border-indigo-100 rounded-full px-3.5 py-1.5">
            <Sparkles size={14} className="text-indigo-600 animate-spin" />
            <span className="text-[11px] font-extrabold tracking-wide uppercase">Cập nhật cấu trúc thi mới 2026</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 tracking-tight leading-tight">
            Nền Tảng Thi <br></br><span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">Trắc Nghiệm Trực Tuyến</span> 
          </h1>

          <p className="text-slate-600 max-w-2xl text-sm sm:text-base leading-relaxed font-semibold">
            Thiết kế trực quan, chấm điểm chính xác 3 phần chuẩn năng lực mới. Học sinh tự do có thể tham gia thi thử không giới hạn, xem kết quả giải chi tiết ngay lập tức.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <button
              onClick={() => {
                const element = document.getElementById("bài-thi");
                if (element) element.scrollIntoView({ behavior: "smooth" });
              }}
              className="px-8 py-4.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-400 hover:via-purple-400 hover:to-pink-400 text-white rounded-2xl font-black text-sm shadow-xl shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-105 transition-all flex items-center gap-2 group active:scale-95 cursor-pointer"
            >
              Bắt đầu làm bài thi ngay 🚀
              <ArrowRight size={16} className="group-hover:translate-x-1.5 transition-transform" />
            </button>
            <button
              onClick={onNavigateToLogin}
              className="px-8 py-4.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-2xl font-black text-sm transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              Vào phòng thi chính thức
            </button>
          </div>

          {/* REAL STATS COUNTER */}
          <div className="grid grid-cols-3 gap-8 pt-8 border-t border-slate-200/80 w-full max-w-xl mx-auto">
            <div>
              <span className="block text-2xl sm:text-3xl font-mono font-black text-indigo-600">20+</span>
              <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Đề thi sẵn sàng</span>
            </div>
            <div>
              <span className="block text-2xl sm:text-3xl font-mono font-black text-purple-600">{questions.length}+</span>
              <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Ngân hàng câu hỏi</span>
            </div>
            <div>
              <span className="block text-2xl sm:text-3xl font-mono font-black text-green-500">100%</span>
              <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Bảo mật & Miễn phí</span>
            </div>
          </div>
        </div>
      </section>

      {/* FREE PRACTICE EXAM GRID */}
      <section id="bài-thi" className="bg-slate-100/60 border-y border-slate-200/30 py-16 px-6 scroll-mt-20">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              Danh Sách Phòng Thi Cho Thí Sinh Tự Do
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto text-xs sm:text-sm font-medium">
              Tìm kiếm và chọn một đề thi thích hợp để bắt đầu quá trình ôn luyện đánh giá năng học lực của bạn ngay hôm nay. Xem giải chi tiết sau khi nộp bài.
            </p>
          </div>

          {/* SEARCH CONTROL BAR */}
          <div className="max-w-md mx-auto flex items-center bg-white border border-slate-200 rounded-2xl px-3.5 py-1.5 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500/80 transition-all shadow-sm">
            <Search className="text-slate-400 shrink-0" size={18} />
            <input 
              type="text"
              placeholder="Nhập tên đề thi hoặc mã bài thi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent px-3 text-sm focus:outline-none placeholder-slate-400 font-medium"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm("")} 
                className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer text-xs font-bold"
              >
                Xóa
              </button>
            )}
          </div>

          {/* FOLDER TOP NAVIGATION SHELF */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest block font-mono">
                Thư mục chủ đề ({Object.values(folderCounts).filter(v => v > 0).length - 1} chủ đề có đề thi)
              </span>
              {activeFolder !== "Tất cả" && (
                <button
                  onClick={() => setActiveFolder("Tất cả")}
                  className="text-xs font-black text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer flex items-center gap-1 bg-transparent border-none p-0 focus:outline-none"
                >
                  <ArrowRight size={12} className="rotate-180 text-indigo-550" /> Quay lại xem tất cả thư mục
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {Object.keys(folderCounts).map((catName) => {
                const count = folderCounts[catName];
                const isActive = activeFolder === catName;
                const styles = getCategoryStyle(catName);

                // Skip showing any folder tab with 0 exams to keep the top landing page clean
                if (count === 0 && catName !== "Tất cả") {
                  return null;
                }

                return (
                  <button
                    key={catName}
                    onClick={() => setActiveFolder(catName)}
                    className={cn(
                      "flex flex-col p-4 rounded-2xl border text-left transition-all relative overflow-hidden group cursor-pointer bg-white",
                      isActive
                        ? `${styles.tab} ring-2 ring-indigo-500/15 shadow-md scale-102`
                        : "border-slate-200 text-slate-700 hover:border-slate-350 hover:shadow-xs hover:scale-101"
                    )}
                  >
                    {/* Folder icon and badge */}
                    <div className="flex items-center justify-between mb-3 w-full">
                      <div className={cn(
                        "p-2 rounded-xl transition-all",
                        isActive ? `${styles.bg} text-white` : "bg-slate-55/40 text-slate-400 group-hover:bg-slate-100"
                      )}>
                        {isActive ? <FolderOpen size={18} className="fill-current" /> : <FolderIcon size={18} className="fill-current" />}
                      </div>
                      <span className={cn(
                        "text-[10px] font-black font-mono px-2 py-0.5 rounded-full shrink-0 border",
                        isActive 
                          ? "bg-white/90 text-slate-800 border-transparent shadow-xs" 
                          : "bg-slate-50 text-slate-500 border-slate-150"
                      )}>
                        {count} Đề
                      </span>
                    </div>

                    <span className="text-xs font-black tracking-tight block">
                      {catName}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold block mt-0.5 uppercase tracking-wide">
                      Thư mục
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* EXAM LIST PER GROUP (PHYSICAL FOLDER CONTAINERS) */}
          {Object.keys(groupedExams).length > 0 ? (
            <div className="space-y-12">
              {Object.entries(groupedExams).map(([category, exams]) => {
                const styles = getCategoryStyle(category);
                
                if (exams.length === 0) return null;

                return (
                  <div key={category} className="space-y-1">
                    {/* Folder Tab Section Header */}
                    <div className="flex items-end justify-between -mb-px">
                      <div className={cn(
                        "inline-flex items-center gap-2 px-5 py-3 rounded-t-2xl font-black text-xs sm:text-sm border-t border-x relative z-10 transition-all",
                        styles.tab
                      )}>
                        {activeFolder === "Tất cả" ? (
                          <FolderIcon size={16} className="text-amber-500 fill-amber-500/20" />
                        ) : (
                          <FolderOpen size={16} className="text-amber-500 fill-amber-500/20 animate-pulse" />
                        )}
                        <span>MÔN {category.toUpperCase()} ({exams.length} ĐỀ THI)</span>
                      </div>
                      
                      {/* Interactive back indicator if inside single group */}
                      {activeFolder !== "Tất cả" && (
                        <button
                          onClick={() => setActiveFolder("Tất cả")}
                          className="mr-3 mb-1.5 text-xs font-bold text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer bg-transparent border-none p-0 focus:outline-none"
                        >
                          Xem tất cả thư mục
                        </button>
                      )}
                    </div>

                    {/* Folder Body wrapping the Grid */}
                    <div className={cn(
                      "p-5 sm:p-6.5 rounded-b-2xl rounded-tr-2xl border relative z-0 shadow-xs",
                      styles.body
                    )}>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {exams.map((exam) => (
                          <div 
                            key={exam.id}
                            className="bg-white rounded-2xl border border-slate-200/80 hover:border-indigo-300 shadow-sm hover:shadow-xl hover:shadow-indigo-900/5 transition-all p-5 flex flex-col justify-between group relative overflow-hidden"
                          >
                            {/* Floating subtle background badge for aesthetic craft */}
                            <div className="absolute -top-3 -right-3 w-16 h-16 bg-slate-50 group-hover:bg-indigo-50/50 rounded-full transition-colors -z-0 pointer-events-none" />

                            <div className="space-y-4 z-10">
                              <div className="flex items-center justify-between">
                                <span className="px-2.5 py-1 bg-indigo-50 border border-indigo-100 text-indigo-750 rounded-lg text-[10px] font-black font-mono">
                                  MÃ ĐỀ: {exam.code}
                                </span>
                                <span className="flex items-center gap-1 text-[11px] text-green-600 bg-green-50 border border-green-100 font-extrabold px-2 py-0.5 rounded-full">
                                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" />
                                  SẴN SÀNG
                                </span>
                              </div>

                              <div>
                                <h3 className="text-slate-900 font-extrabold text-sm sm:text-base leading-snug group-hover:text-indigo-750 transition-colors">
                                  {exam.name}
                                </h3>
                                {exam.teacherId && (
                                  <p className="text-[11px] text-slate-405 font-bold text-slate-500 mt-1 uppercase tracking-wider">
                                    Giáo viên phụ trách: {exam.teacherId === "ADMIN" ? "Quản trị viên" : exam.teacherId}
                                  </p>
                                )}
                              </div>

                              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-slate-600 text-xs font-bold">
                                <div className="flex items-center gap-2">
                                  <Clock size={14} className="text-slate-400" />
                                  <span>{exam.duration} Phút</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <BookOpen size={14} className="text-slate-400" />
                                  <span>{exam.questionIds.length} Câu hỏi</span>
                                </div>
                              </div>
                            </div>

                            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-3 z-10">
                              <span className="text-[11px] text-slate-400 font-black uppercase">Thi Thử Miễn Phí</span>
                              <button 
                                onClick={() => setSelectedExam(exam)}
                                className="px-4 py-2 bg-slate-100 group-hover:bg-indigo-650 group-hover:text-white text-indigo-750 rounded-xl text-xs font-black transition-all flex items-center gap-1 shadow-sm active:scale-95 cursor-pointer"
                              >
                                Bắt đầu thi
                                <ArrowRightCircle size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center max-w-md mx-auto space-y-4 shadow-sm">
              <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                <Info size={24} />
              </div>
              <div>
                <h3 className="text-slate-800 font-extrabold text-base">Không tìm thấy bài thi</h3>
                <p className="text-slate-405 text-slate-500 text-xs mt-1">Các từ khóa tìm kiếm hoặc thư mục hiện tại có thể không khớp. Hãy thử đổi thư mục hoặc nhập mã/tên bài thi khác!</p>
              </div>
              <button 
                onClick={() => {
                  setSearchTerm("");
                  setActiveFolder("Tất cả");
                }}
                className="text-xs bg-indigo-50 text-indigo-650 px-3.5 py-1.5 rounded-xl font-bold hover:bg-indigo-100 transition-colors cursor-pointer"
              >
                Đặt lại filters & Xem tất cả bài thi
              </button>
            </div>
          )}
        </div>
      </section>

      {/* PLATFORM ADVANTAGES / FEATURES */}
      <section id="tính-năng" className="py-20 px-6 max-w-7xl mx-auto w-full space-y-12">
        <div className="text-center space-y-2">
          <span className="text-xs font-extrabold text-indigo-650 uppercase tracking-widest block font-mono">TÍNH NĂNG VƯỢT TRỘI</span>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Giải Pháp Đánh Giá Chuẩn Mực Và Bảo Mật</h2>
          <p className="text-slate-505 max-w-xl mx-auto text-xs sm:text-sm font-medium text-slate-500">
            Nền tảng trang bị các công cụ kiểm tra tự động tiên tiến, phù hợp với mọi khối thi độc lập và kiểm tra tập trung.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: <Shield className="text-emerald-500" size={24} />,
              title: "Tổ Chức Khoa Học & Bảo Mật",
              desc: "Hệ thống bảo vệ đề thi, quản lý bài làm thí sinh chặt chẽ. Cơ sở dữ liệu SQLite tích hợp lưu trữ bài làm chống rủi ro rớt mạng."
            },
            {
              icon: <Zap className="text-amber-500" size={24} />,
              title: "Tự Động Trộn Câu Hỏi Ngẫu Nhiên",
              desc: "Giáo viên biên soạn bộ đề từ folder ngân hàng. Đề thi tự động phân bố chuẩn 3 phần cấu trúc của Bộ GD&ĐT một cách đều đặn."
            },
            {
              icon: <Award className="text-indigo-600" size={24} />,
              title: "Xem Bảng Điểm & Lời Giải Thần Tốc",
              desc: "Hệ thống cung cấp kết quả chấm điểm tức thì. Thống kê chi tiết điểm cộng, điểm trừ và giải thích chi tiết cho từng phương án lựa chọn."
            }
          ].map((feature, i) => (
            <div key={i} className="bg-white p-6.5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <div className="p-3 bg-slate-50 inline-flex rounded-xl">
                {feature.icon}
              </div>
              <h3 className="text-slate-900 font-extrabold text-base">{feature.title}</h3>
              <p className="text-slate-500 text-xs leading-relaxed font-semibold">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mt-auto bg-[#c6f7e1] border-t border-emerald-200/60 text-emerald-900 py-12 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-700 text-white rounded-lg">
              <GraduationCap size={20} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <svg className="w-4.5 h-4.5 text-emerald-700 flex-shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" fill="url(#footer-shield-grad)" />
                  <path d="M8.5 12.2L10.8 14.5L15.8 9.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  <defs>
                    <linearGradient id="footer-shield-grad" x1="4" y1="2" x2="20" y2="22" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#047857" />
                      <stop offset="1" stopColor="#10B981" />
                    </linearGradient>
                  </defs>
                </svg>
                <span className="font-extrabold text-base tracking-tight text-emerald-950">TINHOC DCT MULTI-PORTAL</span>
              </div>
              <span className="text-[10px] text-emerald-800/80 font-bold tracking-wider mt-0.5 block uppercase">Hệ thống thi trắc nghiệm chuyên nghiệp</span>
              <span className="text-[10px] text-emerald-800/80 font-bold tracking-wider mt-0.5 block uppercase">Tác giả: Nguyễn thanh Sơn</span>
            </div>
          </div>

          <p className="text-center md:text-left text-xs font-semibold leading-relaxed max-w-sm text-emerald-900/85">
            Hệ thống cung cấp các bài thi thử, ngân hàng câu hỏi định hướng phát triển năng lực chất lượng cao cho thí sinh tự do và các trung tâm giáo dục chất lượng.
          </p>

          <div className="flex justify-center md:justify-end gap-4.5 text-xs font-bold text-emerald-950">
            <a href="#bài-thi" className="hover:text-emerald-700 transition-colors">Toán Học</a>
            <span className="text-emerald-300">•</span>
            <a href="#bài-thi" className="hover:text-emerald-700 transition-colors">Vật Lý</a>
            <span className="text-emerald-300">•</span>
            <a href="#bài-thi" className="hover:text-emerald-700 transition-colors">Tin Học</a>
          </div>
        </div>


      </footer>

      {/* REGISTRATION MODAL FOR FREE CANDIDATES */}
      <AnimatePresence>
        {selectedExam && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            {/* Modal Overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedExam(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl p-6.5 sm:p-8 shadow-2xl border border-slate-100 max-w-md w-full relative z-10 space-y-6"
            >
              <button 
                onClick={() => setSelectedExam(null)}
                className="absolute top-4 right-4 p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
              >
                <X size={18} />
              </button>

              <div className="text-center space-y-1.5">
                <div className="inline-flex p-3 bg-indigo-50 text-indigo-650 rounded-2xl mb-1">
                  <UserCheck size={28} />
                </div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Khai Báo Thí Sinh Tự Do</h3>
                <p className="text-xs text-slate-505 text-slate-500 font-medium">
                  Để làm đề: <strong className="text-indigo-650">{selectedExam.name}</strong>, vui lòng nhập thông tin cơ bản dưới đây để lưu trữ điểm số.
                </p>
              </div>

              <form onSubmit={handleRegisterAndStart} className="space-y-4">
                {regError && (
                  <p className="text-xs font-bold text-rose-500 bg-rose-50 border border-rose-100 p-2.5 rounded-xl">{regError}</p>
                )}

                <div>
                  <label className="block text-[10px] font-black text-slate-405 text-slate-500 uppercase tracking-widest mb-1.5">Họ và tên thí sinh *</label>
                  <input 
                    type="text"
                    required
                    placeholder="Ví dụ: Nguyễn Văn A"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/80 rounded-xl text-sm font-semibold text-slate-800 transition-all focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-405 text-slate-500 uppercase tracking-widest mb-1.5">Lớp hiện tại *</label>
                    <input 
                      type="text"
                      required
                      placeholder="Ví dụ: Lớp 12A1"
                      value={regClass}
                      onChange={(e) => setRegClass(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/80 rounded-xl text-sm font-semibold text-slate-800 transition-all focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-405 text-slate-500 uppercase tracking-widest mb-1.5">Trường THPT *</label>
                    <input 
                      type="text"
                      required
                      placeholder="Ví dụ: Đỗ Công Tường"
                      value={regSchool}
                      onChange={(e) => setRegSchool(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/80 rounded-xl text-sm font-semibold text-slate-800 transition-all focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setSelectedExam(null)}
                    className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-2xl text-xs font-black tracking-wide uppercase transition-colors cursor-pointer text-center"
                  >
                    Hủy Bỏ
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 bg-indigo-650 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black tracking-wide uppercase transition-all shadow-md shadow-indigo-650/15 cursor-pointer text-center"
                  >
                    Bắt đầu thi 🚀
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
