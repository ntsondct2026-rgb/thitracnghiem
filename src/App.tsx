import React, { useState, useEffect, useMemo } from "react";
import { 
  Search, Plus, Folder as FolderIcon, FileText, Settings, Users, 
  LogOut, ChevronRight, Clock, CheckCircle2, AlertCircle, 
  LayoutDashboard, BookOpen, History, User, Play, Printer,
  Trash2, Edit3, Save, X, Menu, Bell, Download, Upload,
  Check, Info, HelpCircle, ArrowLeft, ArrowRight, Eye, EyeOff,
  Lock, Mail, Phone, Calendar, MapPin, Briefcase, GraduationCap,
  Award, Star, Heart, Share2, MessageSquare, MoreVertical,
  Filter, SortAsc, SortDesc, RefreshCw, Maximize2, Minimize2,
  Copy, ExternalLink, Link, Hash, Globe, Shield, Zap,
  Database, Server, Cpu, HardDrive, Monitor, Smartphone,
  Tablet, Watch, Camera, Mic, Volume2, Image as ImageIcon,
  Video, Music, Layers, Grid, List, Table, PieChart, BarChart2,
  Activity, TrendingUp, DollarSign, ShoppingCart, Package,
  ChevronLeft, ChevronDown, ChevronUp, Trash, Edit, LogIn, File
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { 
  PartType, Folder, Question, StudentResult, Student, ExamRoom, Teacher
} from "./types";
import { SAMPLE_QUESTIONS } from "./constants";
// @ts-ignore
import mammoth from "mammoth/mammoth.browser";
import * as XLSX from "xlsx";
import katex from "katex";
import { SafeHtmlRenderer } from "./components/SafeHtmlRenderer";
import HomeView from "./components/HomeView";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { 
  Document as DocxDocument, 
  Packer as DocxPacker, 
  Paragraph as DocxParagraph, 
  TextRun as DocxTextRun, 
  Table as DocxTable, 
  TableRow as DocxTableRow, 
  TableCell as DocxTableCell, 
  WidthType as DocxWidthType 
} from "docx";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type View = "home" | "login" | "admin-login" | "admin-dashboard" | "student-home" | "exam" | "result";

// ----------------- SUB-COMPONENTS -----------------

// --- 1. LOGIN COMPONENT ---
interface LoginProps {
  students: Student[];
  onStudentLogin: (name: string, sbd: string, isFree?: boolean) => void;
  onGoToAdmin: () => void;
  onBackToHome?: () => void;
}

function Login({ students, onStudentLogin, onGoToAdmin, onBackToHome }: LoginProps) {
  const [activeTab, setActiveTab ] = useState<"class" | "free">("class");
  
  // State cho Thí sinh chính thức (lớp học)
  const [name, setName] = useState("");
  const [sbd, setSbd] = useState("");

  // State cho Thí sinh tự do
  const [freeName, setFreeName] = useState("");
  const [freeClass, setFreeClass] = useState("");
  const [freeSchool, setFreeSchool] = useState("");

  const handleSubmitClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && sbd.trim()) {
      onStudentLogin(name.trim(), sbd.trim(), false);
    }
  };

  const handleSubmitFree = (e: React.FormEvent) => {
    e.preventDefault();
    if (freeName.trim() && freeClass.trim() && freeSchool.trim()) {
      // Gộp lớp và trường thành thông tin SBD để dễ hiển thị và lưu quản lý
      const formattedSbd = `${freeClass.trim()} - ${freeSchool.trim()}`;
      onStudentLogin(freeName.trim(), formattedSbd, true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100"
      >
        <div className="text-center mb-6">
          <div className="inline-flex p-3 bg-indigo-50 text-indigo-600 rounded-2xl mb-3">
            <GraduationCap size={36} />
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Hệ Thống Thi Trắc Nghiệm</h1>
          <p className="text-gray-500 mt-1 text-xs">Vui lòng chọn đối tượng và nhập thông tin để vào làm bài</p>
        </div>

        {/* TAB CONTROL */}
        <div className="flex p-1 bg-gray-100 rounded-xl mb-6">
          <button
            type="button"
            onClick={() => setActiveTab("class")}
            className={cn(
              "flex-1 py-2 text-xs font-bold rounded-lg transition-all",
              activeTab === "class" 
                ? "bg-white text-indigo-600 shadow-sm" 
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50/50"
            )}
          >
            Thí sinh lớp học
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("free")}
            className={cn(
              "flex-1 py-2 text-xs font-bold rounded-lg transition-all",
              activeTab === "free" 
                ? "bg-white text-indigo-600 shadow-sm" 
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50/50"
            )}
          >
            Thí sinh tự do
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "class" ? (
            <motion.form 
              key="tab-class"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.15 }}
              onSubmit={handleSubmitClass} 
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Họ và tên thí sinh</label>
                <input 
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm font-medium"
                  placeholder="Nguyễn Văn A"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Số báo danh (SBD)</label>
                <input 
                  type="text"
                  required
                  value={sbd}
                  onChange={(e) => setSbd(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm font-mono font-bold"
                  placeholder="SBD001"
                />
              </div>

              <button 
                type="submit"
                disabled={!name.trim() || !sbd.trim()}
                className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 text-sm shadow-md shadow-indigo-100 flex items-center justify-center gap-1.5"
              >
                <LogIn size={16} />
                Đăng Nhập Thi
              </button>
            </motion.form>
          ) : (
            <motion.form 
              key="tab-free"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
              onSubmit={handleSubmitFree} 
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Họ và tên thí sinh</label>
                <input 
                  type="text"
                  required
                  value={freeName}
                  onChange={(e) => setFreeName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm font-medium"
                  placeholder="Ví dụ: Trần Thị B"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Lớp</label>
                  <input 
                    type="text"
                    required
                    value={freeClass}
                    onChange={(e) => setFreeClass(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm font-bold"
                    placeholder="VD: 12A1"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Trường</label>
                  <input 
                    type="text"
                    required
                    value={freeSchool}
                    onChange={(e) => setFreeSchool(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm font-medium"
                    placeholder="VD: THPT Chu Văn An"
                  />
                </div>
              </div>

              <div className="bg-fuchsia-50/50 p-2.5 rounded-xl border border-fuchsia-100 flex items-start gap-1.5 text-xs text-fuchsia-800">
                <Info size={14} className="text-fuchsia-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">Đối với thí sinh tự do, bạn <strong>không cần đăng ký SBD trước</strong>. Điểm số sẽ được ghi nhận trực tiếp theo thông tin cá nhân của bạn.</p>
              </div>

              <button 
                type="submit"
                disabled={!freeName.trim() || !freeClass.trim() || !freeSchool.trim()}
                className="w-full bg-fuchsia-600 text-white py-3 rounded-xl font-bold hover:bg-fuchsia-700 transition-colors disabled:opacity-50 text-sm shadow-md shadow-fuchsia-100 flex items-center justify-center gap-1.5"
              >
                <LogIn size={16} />
                Vào Thi Tự Do
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="text-center mt-6 pt-4 border-t border-gray-100 flex flex-col gap-2.5">
          <button 
            onClick={onGoToAdmin}
            className="text-xs text-indigo-650 hover:underline font-extrabold flex items-center justify-center gap-1 mx-auto cursor-pointer"
          >
            <Shield size={14} />
            Đăng nhập dành cho Giáo viên
          </button>
          {onBackToHome && (
            <button 
              onClick={onBackToHome}
              className="text-xs text-gray-400 hover:text-slate-700 font-bold hover:underline flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
            >
              Quay lại Trang Chủ
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// --- 2. ADMIN LOGIN COMPONENT ---
interface AdminLoginProps {
  teachers: Teacher[];
  onAdminLogin: (password: string) => void;
  onTeacherLogin: (teacherId: string, password: string) => void;
  onTeacherRegister: (teacher: Teacher) => void;
  onBack: () => void;
}

function AdminLogin({ teachers, onAdminLogin, onTeacherLogin, onTeacherRegister, onBack }: AdminLoginProps) {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [loginRole, setLoginRole] = useState<"admin" | "teacher">("teacher");

  // Admin and Teacher login state
  const [adminPassword, setAdminPassword] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [teacherPassword, setTeacherPassword] = useState("");

  // Teacher register state
  const [regId, setRegId] = useState("");
  const [regName, setRegName] = useState("");
  const [regClassName, setRegClassName] = useState("");
  const [regPassword, setRegPassword] = useState("");

  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (loginRole === "admin") {
      if (adminPassword === "admin123") {
        onAdminLogin(adminPassword);
      } else {
        setMessage({ text: "Mật khẩu Quản trị không chính xác!", type: "error" });
      }
    } else {
      const teacher = teachers.find(t => t.id.trim().toLowerCase() === teacherId.trim().toLowerCase());
      if (teacher && teacher.password === teacherPassword) {
        onTeacherLogin(teacher.id, teacherPassword);
      } else {
        setMessage({ text: "Tài khoản giáo viên hoặc mật khẩu không chính xác!", type: "error" });
      }
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    const cleanId = regId.trim();
    const cleanName = regName.trim();
    const cleanClass = regClassName.trim();
    const cleanPass = regPassword.trim();

    if (!cleanId || !cleanName || !cleanClass || !cleanPass) {
      setMessage({ text: "Vui lòng nhập đầy đủ các trường thông tin!", type: "error" });
      return;
    }

    if (cleanId.toLowerCase() === "admin") {
      setMessage({ text: "Tài khoản 'admin' là của quản trị trường hợp đặc biệt!", type: "error" });
      return;
    }

    const exists = teachers.some(t => t.id.toLowerCase() === cleanId.toLowerCase());
    if (exists) {
      setMessage({ text: "Tài khoản / Mã giáo viên này đã được đăng ký trước đó!", type: "error" });
      return;
    }

    const nwTeacher: Teacher = {
      id: cleanId,
      name: cleanName,
      className: cleanClass,
      password: cleanPass,
      createdAt: new Date().toISOString()
    };

    onTeacherRegister(nwTeacher);
    setMessage({ text: "Đăng ký tài khoản giáo viên thành công! Mời bạn đăng nhập.", type: "success" });
    setTeacherId(cleanId);
    setTeacherPassword(cleanPass);
    setLoginRole("teacher");
    setActiveTab("login");

    // Reset inputs
    setRegId("");
    setRegName("");
    setRegClassName("");
    setRegPassword("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100"
      >
        <div className="text-center mb-6">
          <div className="inline-flex p-3 bg-indigo-50 text-indigo-600 rounded-2xl mb-3">
            <Shield size={36} />
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Cổng Kiểm Tra Giáo Viên</h1>
          <p className="text-gray-500 mt-1 text-xs">Đăng nhập Quản trị viên hệ thống hoặc Đăng ký tài khoản giáo viên riêng</p>
        </div>

        {/* TABS CONTROL */}
        <div className="flex p-1 bg-gray-100 rounded-xl mb-5">
          <button
            type="button"
            onClick={() => {
              setActiveTab("login");
              setMessage(null);
            }}
            className={cn(
              "flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer",
              activeTab === "login" 
                ? "bg-white text-indigo-600 shadow-sm" 
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            Đăng Nhập
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("register");
              setMessage(null);
            }}
            className={cn(
              "flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer",
              activeTab === "register" 
                ? "bg-white text-indigo-600 shadow-sm" 
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            Đăng Ký Giáo Viên
          </button>
        </div>

        {message && (
          <div className={cn(
            "p-3 rounded-xl text-xs font-semibold mb-4 leading-relaxed",
            message.type === "error" ? "bg-red-50 text-red-700 border border-red-200" : "bg-green-50 text-green-700 border border-green-200"
          )}>
            {message.text}
          </div>
        )}

        <AnimatePresence mode="wait">
          {activeTab === "login" ? (
            <motion.form 
              key="auth-login"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.15 }}
              onSubmit={handleLoginSubmit} 
              className="space-y-4"
            >
              {/* ROLE SELECTION */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-gray-50 rounded-xl border border-gray-200 text-xs">
                <button
                  type="button"
                  onClick={() => setLoginRole("teacher")}
                  className={cn(
                    "py-1.5 rounded-lg font-bold transition-all cursor-pointer",
                    loginRole === "teacher" 
                      ? "bg-indigo-600 text-white" 
                      : "text-gray-500 hover:text-gray-700"
                  )}
                >
                  Giáo viên bộ môn
                </button>
                <button
                  type="button"
                  onClick={() => setLoginRole("admin")}
                  className={cn(
                    "py-1.5 rounded-lg font-bold transition-all cursor-pointer",
                    loginRole === "admin" 
                      ? "bg-indigo-600 text-white" 
                      : "text-gray-500 hover:text-gray-700"
                  )}
                >
                  Admin hệ thống
                </button>
              </div>

              {loginRole === "admin" ? (
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Mật khẩu Quản trị viên</label>
                  <input 
                    type="password"
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm font-bold"
                    placeholder="••••••••"
                    autoFocus
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Tài khoản / Mã giáo viên</label>
                    <input 
                      type="text"
                      required
                      value={teacherId}
                      onChange={(e) => setTeacherId(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm font-mono font-bold"
                      placeholder="teacher_an"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Mật khẩu giáo viên</label>
                    <input 
                      type="password"
                      required
                      value={teacherPassword}
                      onChange={(e) => setTeacherPassword(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm font-bold"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              )}

              <button 
                type="submit"
                className="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-colors text-sm shadow-md cursor-pointer flex items-center justify-center gap-1.5"
              >
                <LogIn size={16} />
                Đăng Nhập Quản Lý
              </button>
            </motion.form>
          ) : (
            <motion.form 
              key="auth-register"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
              onSubmit={handleRegisterSubmit} 
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Mã giáo viên / Tài khoản đăng nhập</label>
                <input 
                  type="text"
                  required
                  value={regId}
                  onChange={(e) => setRegId(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm font-mono font-bold"
                  placeholder="giao_vien_mai"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Họ và tên giáo viên</label>
                <input 
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm font-semibold text-gray-800"
                  placeholder="Cô Nguyễn Thị Mai"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Tên lớp phụ trách quản lý thi</label>
                <input 
                  type="text"
                  required
                  value={regClassName}
                  onChange={(e) => setRegClassName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm font-bold uppercase text-indigo-700"
                  placeholder="Ví dụ: Lớp 12A3"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Mật khẩu đăng nhập</label>
                <input 
                  type="password"
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm font-bold"
                  placeholder="Mật khẩu của bạn"
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-emerald-600 text-white py-2.5 rounded-xl font-bold hover:bg-emerald-700 transition-colors text-sm shadow-md cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Plus size={16} />
                Đăng Ký Tài Khoản
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="text-center mt-5 pt-3 border-t border-gray-100 flex justify-between items-center text-xs">
          <button 
            type="button"
            onClick={onBack}
            className="text-gray-500 hover:text-indigo-600 font-bold transition-all cursor-pointer inline-flex items-center gap-1"
          >
            <ArrowLeft size={14} /> Quay lại trang chủ
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// --- 3. STUDENT HOME COMPONENT ---
interface StudentHomeProps {
  user: { name: string; sbd: string; role: "student" | "admin" | "teacher"; className?: string; teacherId?: string; isFree?: boolean } | null;
  results: StudentResult[];
  onStartExam: (examCode: string) => void;
  onLogout: () => void;
  examRooms: ExamRoom[];
  onViewResultDetail: (result: StudentResult) => void;
}

function StudentHome({ user, results, onStartExam, onLogout, examRooms, onViewResultDetail }: StudentHomeProps) {
  const [examCode, setExamCode] = useState("");
  const studentResults = useMemo(() => results.filter(r => r.studentId === user?.sbd), [results, user]);

  const visibleExams = useMemo(() => {
    if (user?.isFree) {
      // Free candidates see/take BOTH demo practice exams AND custom exams marked isFree!
      return examRooms.filter(r => r.id.startsWith("demo-") || ["TOAN2026", "LY2026", "ENG2026"].includes(r.code.toUpperCase()) || r.isFree);
    }
    if (user?.role === "student" && user?.teacherId) {
      return examRooms.filter(r => (r.teacherId === user.teacherId) && !r.id.startsWith("demo-") && !r.isFree);
    }
    // Regular student without teacher ID or generic candidate view shows all non-demo, non-free exams
    return examRooms.filter(r => r.teacherId && !r.id.startsWith("demo-") && !r.isFree);
  }, [examRooms, user]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="bg-white shadow-sm border-b border-gray-150 px-6 py-4 flex justify-between items-center sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-600 text-white rounded-lg">
            <GraduationCap size={24} />
          </div>
          <span className="text-lg font-bold text-gray-900 tracking-tight">Cổng Thí Sinh</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="font-bold text-gray-900 text-sm">{user?.name}</p>
            <p className="text-xs text-indigo-600 font-mono font-bold">Lớp/SBD: {user?.sbd}</p>
          </div>
          <button onClick={onLogout} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
            <LogOut size={20} />
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-6 w-full flex-1">
        <div className="md:col-span-2 space-y-6">
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-150">
            <h2 className="text-base font-bold text-gray-950 mb-3 flex items-center gap-2">
              <Play className="text-indigo-600" size={18} />
              Vào Phòng Thi Trực Tuyến
            </h2>
            <p className="text-xs text-gray-500 mb-4">Vui lòng nhập mã phòng thi do thầy/cô cung cấp bên dưới để tải đề thi và làm bài.</p>
            <div className="flex gap-3">
              <input 
                type="text"
                value={examCode}
                onChange={(e) => setExamCode(e.target.value)}
                placeholder="Ví dụ: TOAN12, LY15..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono font-bold text-indigo-700"
              />
              <button 
                onClick={() => onStartExam(examCode.trim())}
                className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-700 transition-colors text-sm shadow-md"
              >
                Vào Thi
              </button>
            </div>

            {visibleExams.filter(r => r.isActive).length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                <p className="text-xs font-bold text-gray-400 uppercase mb-1">Phòng thi đang mở hiện tại:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {visibleExams.filter(r => r.isActive).map(r => {
                    const now = new Date();
                    const isBefore = r.startTime ? (now < new Date(r.startTime)) : false;
                    const isAfter = r.endTime ? (now > new Date(r.endTime)) : false;
                    const statusText = isBefore ? "Chưa mở" : isAfter ? "Đã kết thúc" : "Đang diễn ra";
                    const statusColor = isBefore ? "text-amber-600 bg-amber-50 border-amber-200" : isAfter ? "text-rose-600 bg-rose-50 border-rose-200" : "text-green-700 bg-green-50 border-green-200";

                    return (
                      <div 
                        key={r.id}
                        className="p-3 bg-gray-50 border border-gray-200 rounded-xl hover:shadow-sm transition-all flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex justify-between items-start gap-1 pb-1.5 border-b border-gray-150 mb-2">
                            <span className="font-bold text-xs text-gray-850 line-clamp-1">{r.name}</span>
                            <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full font-bold border shrink-0", statusColor)}>
                              {statusText}
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-500 mb-1">Mã tham gia: <span className="font-mono font-black text-indigo-600 text-xs bg-indigo-50 border border-indigo-100 px-1 py-0.5 rounded-sm">{r.code}</span></p>
                          {r.startTime && (
                            <p className="text-[10px] text-gray-500">Bắt đầu: <span className="font-mono text-gray-700 font-semibold">{new Date(r.startTime).toLocaleString('vi-VN')}</span></p>
                          )}
                          {r.endTime && (
                            <p className="text-[10px] text-gray-505 text-gray-500">Kết thúc: <span className="font-mono text-gray-700 font-semibold">{new Date(r.endTime).toLocaleString('vi-VN')}</span></p>
                          )}
                        </div>
                        <button
                          onClick={() => setExamCode(r.code)}
                          disabled={isBefore || isAfter}
                          className={cn(
                            "w-full mt-3 py-1.5 px-2.5 rounded-lg text-xs font-bold font-sans transition-all cursor-pointer text-center",
                            (isBefore || isAfter) 
                              ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200" 
                              : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                          )}
                        >
                          {(isBefore || isAfter) ? "Sắp ra mắt / Đã đóng" : "Dùng Mã & Vào Thi"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>

          <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-150">
            <h2 className="text-base font-bold text-gray-950 mb-4 flex items-center gap-2">
              <History className="text-indigo-600" size={18} />
              Lịch Sử Làm Bài Của Bạn
            </h2>
            {studentResults.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <FileText className="mx-auto mb-2 opacity-20" size={48} />
                <p className="text-sm">Bạn chưa tham gia đợt kiểm tra nào.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {studentResults.map(result => (
                  <div key={result.id} className="flex flex-col sm:flex-row justify-between sm:items-center p-4 bg-gray-50 rounded-xl border border-gray-150 gap-3">
                    <div>
                      <p className="font-bold text-sm text-gray-800">
                        {result.examName || "Kết quả đánh giá bài thi"}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">Nộp lúc: {new Date(result.timestamp).toLocaleString('vi-VN')}</p>
                    </div>
                    <div className="flex items-center gap-4 self-end sm:self-auto justify-between w-full sm:w-auto">
                      <div className="text-right">
                        <p className="text-xl font-mono font-black text-indigo-600">{result.score.toFixed(2)}</p>
                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Điểm số</p>
                      </div>
                      <button 
                        onClick={() => onViewResultDetail(result)}
                        className="px-3.5 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-all cursor-pointer font-sans"
                      >
                        Xem chi tiết
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-150">
            <h2 className="text-base font-bold text-gray-950 mb-4 flex items-center gap-2">
              <User className="text-indigo-600" size={18} />
              Bảng Thông Tin
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between pb-2 border-b border-gray-100">
                <span className="text-gray-500">Họ và tên:</span>
                <span className="font-bold text-gray-800">{user?.name}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-gray-100">
                <span className="text-gray-500">Số báo danh:</span>
                <span className="font-mono font-bold text-indigo-600">{user?.sbd}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Trạng thái:</span>
                <span className="text-green-600 font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  Sẵn sàng thi
                </span>
              </div>
            </div>
          </section>

          <section className="bg-gradient-to-br from-indigo-600 to-violet-700 p-6 rounded-2xl shadow-lg text-white">
            <h3 className="font-bold mb-2 flex items-center gap-1.5 text-sm">
              <AlertCircle size={16} /> Quy chế phòng thi:
            </h3>
            <ul className="text-xs space-y-2.5 opacity-90">
              <li>• Hệ thống tự động ghi nhận thời gian làm bài của bạn.</li>
              <li>• Tuyệt đối không được thoát trình duyệt hoặc tải lại trang khi đang làm bài.</li>
              <li>• Khi hết thời gian, hệ thống tự nộp bài làm hiện tại.</li>
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
}

// --- 4. EXAM VIEW COMPONENT ---
interface ExamProps {
  currentExam: ExamRoom;
  questions: Question[];
  user: { name: string; sbd: string; role: "student" | "admin" | "teacher"; className?: string } | null;
  timeLeft: number;
  answers: Record<string, any>;
  setAnswers: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  onSubmitExam: () => void;
  showConfirm: (title: string, message: string, onConfirm: () => void) => void;
}

// Stable seeded random and shuffle helpers to guarantee consistent scrambled layouts for a single candidate session
const seedRandom = (seedStr: string) => {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seedStr.length; i++) {
    h = Math.imul(h ^ seedStr.charCodeAt(i), 16777619);
  }
  return () => {
    h += 0xe120fc15;
    let tmp = Math.imul(h ^ (h >>> 15), 1 | h);
    tmp = (tmp + Math.imul(tmp ^ (tmp >>> 7), 61 | tmp)) ^ tmp;
    return ((tmp ^ (tmp >>> 14)) >>> 0) / 4294967296;
  };
};

const seededShuffle = <T,>(array: T[], seed: string): T[] => {
  const rand = seedRandom(seed);
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

function ExamView({ currentExam, questions, user, timeLeft, answers, setAnswers, onSubmitExam, showConfirm }: ExamProps) {
  // Retrieve or generate a session-stable random seed for shuffling questions/answers.
  // This allows different attempts from the same candidate (or different candidates with identical details)
  // to get completely independent shuffled views, while resisting browser refreshes during a single active attempt.
  const uniqueAttemptSeed = useMemo(() => {
    const sessionKey = `exam-attempt-seed-${currentExam.id}-${user?.sbd || "GUEST"}`;
    let seed = sessionStorage.getItem(sessionKey);
    if (!seed) {
      seed = Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
      sessionStorage.setItem(sessionKey, seed);
    }
    return seed;
  }, [currentExam.id, user]);

  const examQuestions = useMemo(() => {
    const filtered = questions.filter(q => currentExam.questionIds.includes(q.id));
    if (currentExam.shuffleQuestions) {
      const studentSeed = (user?.sbd || "GUEST") + "-" + currentExam.id + "-" + uniqueAttemptSeed;
      
      const p1 = filtered.filter(q => q.part === PartType.PART1);
      const p2 = filtered.filter(q => q.part === PartType.PART2);
      const p3 = filtered.filter(q => q.part === PartType.PART3);

      const p1Shuffled = seededShuffle(p1, studentSeed + "-part1");
      const p2Shuffled = seededShuffle(p2, studentSeed + "-part2");
      const p3Shuffled = seededShuffle(p3, studentSeed + "-part3");

      return [...p1Shuffled, ...p2Shuffled, ...p3Shuffled];
    }
    return filtered;
  }, [questions, currentExam, user, uniqueAttemptSeed]);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const currentQuestion = examQuestions[currentQuestionIndex];

  // Dynamically shuffle answer options for PART1 if enabled in the exam configuration
  const optionKeys = useMemo(() => {
    const defaultKeys = ['A', 'B', 'C', 'D'];
    if (currentExam.shuffleAnswers && currentQuestion && currentQuestion.part === PartType.PART1) {
      const questionSeed = (user?.sbd || "GUEST") + "-" + currentExam.id + "-" + currentQuestion.id + "-" + uniqueAttemptSeed + "-opt";
      return seededShuffle(defaultKeys, questionSeed);
    }
    return defaultKeys;
  }, [currentExam, currentQuestion, user, uniqueAttemptSeed]);

  // Dynamically shuffle statement options for PART2 if enabled in the exam configuration
  const part2StatementKeys = useMemo(() => {
    const defaultKeys = ['a', 'b', 'c', 'd'];
    if (currentExam.shuffleAnswers && currentQuestion && currentQuestion.part === PartType.PART2) {
      const questionSeed = (user?.sbd || "GUEST") + "-" + currentExam.id + "-" + currentQuestion.id + "-" + uniqueAttemptSeed + "-stmt";
      return seededShuffle(defaultKeys, questionSeed);
    }
    return defaultKeys;
  }, [currentExam, currentQuestion, user, uniqueAttemptSeed]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center sticky top-0 z-10 border-b border-gray-150">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-100 p-2 rounded-lg text-indigo-650">
            <Clock className="text-indigo-600" size={24} />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Thời gian còn lại</p>
            <p className={cn(
              "text-2xl font-mono font-black",
              timeLeft < 300 ? "text-red-650 text-red-650 animate-pulse" : "text-gray-900"
            )}>
              {formatTime(timeLeft)}
            </p>
          </div>
        </div>
        <div className="text-center hidden md:block">
          <h1 className="font-black text-gray-900 tracking-tight text-base">{currentExam.name}</h1>
          <p className="text-xs text-gray-500 font-bold">Thí sinh: {user?.name} | SBD: {user?.sbd}</p>
        </div>
        <button 
          onClick={() => {
            showConfirm(
              "Nộp bài thi",
              "Bạn có chắc chắn muốn nộp bài thi ngay bây giờ? Sau khi nộp, hệ thống sẽ chấm điểm và bạn không thể thay đổi đáp án được nữa.",
              onSubmitExam
            );
          }}
          className="bg-green-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-green-700 transition-colors shadow-lg shadow-green-100 text-sm cursor-pointer"
        >
          Nộp Bài Thi
        </button>
      </header>

      <div className="flex-1 max-w-7xl mx-auto w-full p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <AnimatePresence mode="wait">
            {currentQuestion ? (
              <motion.div 
                key={currentQuestion.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
                className="bg-white p-8 rounded-2xl shadow-sm border border-gray-150 min-h-[420px] flex flex-col"
              >
                <div className="flex justify-between items-start mb-6">
                  <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                    Phần {currentQuestion.part}
                  </span>
                  <span className="text-gray-400 text-xs font-bold font-mono">
                    Câu {currentQuestionIndex + 1} / {examQuestions.length}
                  </span>
                </div>

                <div className="text-lg font-bold text-gray-900 mb-8 leading-relaxed">
                  <SafeHtmlRenderer html={currentQuestion.question} />
                </div>

                <div className="space-y-4 flex-1">
                  {currentQuestion.part === PartType.PART1 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {['A', 'B', 'C', 'D'].map((visualLabel, index) => {
                        const optKey = optionKeys[index];
                        return (
                          <button
                            key={visualLabel}
                            onClick={() => setAnswers(prev => ({ ...prev, [currentQuestion.id]: optKey }))}
                            className={cn(
                              "flex items-center p-4 rounded-xl border-2 transition-all text-left group",
                              answers[currentQuestion.id] === optKey 
                                ? "border-indigo-650 border-indigo-650 bg-indigo-50/50 text-indigo-950" 
                                : "border-gray-100 hover:border-indigo-200 hover:bg-gray-50/55"
                            )}
                          >
                            <span className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center font-bold mr-4 transition-colors text-xs shrink-0",
                              answers[currentQuestion.id] === optKey 
                                ? "bg-indigo-600 text-white" 
                                : "bg-gray-100 text-gray-500 group-hover:bg-indigo-100 group-hover:text-indigo-600"
                            )}>
                              {visualLabel}
                            </span>
                            <span className="font-semibold text-sm flex-1">
                              <SafeHtmlRenderer html={(currentQuestion as any)[optKey]} />
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {currentQuestion.part === PartType.PART2 && currentQuestion.statements && (
                    <div className="space-y-4">
                      {part2StatementKeys.map((stmtKey, index) => {
                        const visualLabel = ['a', 'b', 'c', 'd'][index];
                        const text = (currentQuestion.statements as any)[stmtKey];
                        return (
                          <div key={stmtKey} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 gap-4 font-sans">
                            <span className="font-semibold text-gray-755 text-gray-800 text-sm flex-1 flex items-start gap-1.5">
                              <span className="font-black text-indigo-600 font-mono text-xs shrink-0 mt-0.5">{visualLabel}.</span>
                              <span className="flex-1">
                                <SafeHtmlRenderer html={text} />
                              </span>
                            </span>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setAnswers(prev => ({
                                  ...prev,
                                  [currentQuestion.id]: { ...(prev[currentQuestion.id] || {}), [stmtKey]: true }
                                }))}
                                className={cn(
                                  "px-5 py-1.5 rounded-lg text-xs font-bold transition-all",
                                  answers[currentQuestion.id]?.[stmtKey] === true
                                    ? "bg-green-600 text-white shadow-md shadow-green-100"
                                    : "bg-white text-gray-500 border border-gray-200 hover:bg-green-50"
                                )}
                              >
                                Đúng
                              </button>
                              <button
                                onClick={() => setAnswers(prev => ({
                                  ...prev,
                                  [currentQuestion.id]: { ...(prev[currentQuestion.id] || {}), [stmtKey]: false }
                                }))}
                                className={cn(
                                  "px-5 py-1.5 rounded-lg text-xs font-bold transition-all",
                                  answers[currentQuestion.id]?.[stmtKey] === false
                                    ? "bg-red-650 bg-red-650 bg-red-600 text-white shadow-md shadow-red-100"
                                    : "bg-white text-gray-500 border border-gray-200 hover:bg-red-50"
                                )}
                              >
                                Sai
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {currentQuestion.part === PartType.PART3 && (
                    <div className="max-w-md">
                      <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Nhập phương án cuối cùng của bạn</label>
                      <input 
                        type="text"
                        value={answers[currentQuestion.id] || ""}
                        onChange={(e) => setAnswers(prev => ({ ...prev, [currentQuestion.id]: e.target.value }))}
                        className="w-full px-5 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 text-base font-bold text-indigo-900"
                        placeholder="Nhập số hoặc chữ cái..."
                      />
                    </div>
                  )}
                </div>

                <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
                  <button
                    disabled={currentQuestionIndex === 0}
                    onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                    className="flex items-center gap-1 px-4 py-2 text-gray-500 hover:text-indigo-600 disabled:opacity-30 font-bold transition-colors text-sm"
                  >
                    <ChevronLeft size={20} />
                    Quay lại
                  </button>
                  <button
                    disabled={currentQuestionIndex === examQuestions.length - 1}
                    onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                    className="flex items-center gap-1 px-4 py-2 text-gray-500 hover:text-indigo-600 disabled:opacity-30 font-bold transition-colors text-sm"
                  >
                    Tiếp theo
                    <ChevronRight size={20} />
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="bg-white p-8 rounded-2xl border text-center text-gray-500">
                Không có dữ liệu câu hỏi trong phòng thi này.
              </div>
            )}
          </AnimatePresence>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-150">
            <h3 className="font-bold text-gray-950 text-sm mb-4 flex items-center gap-2">
              <Grid size={18} className="text-indigo-600" />
              Tiến Trình Làm Bài
            </h3>

            {/* Part Questions Summary Banner */}
            <div className="mb-4 bg-gray-50/80 p-3 rounded-xl border border-gray-150 grid grid-cols-3 gap-2 text-center text-[10px] leading-tight select-none">
              <div className="bg-white p-2 rounded-lg border border-gray-150 flex flex-col justify-center">
                <p className="font-bold text-gray-500 uppercase tracking-tight">Phần I</p>
                <p className="font-sans font-black text-indigo-750 text-xs mt-0.5">
                  {examQuestions.filter(q => q.part === PartType.PART1).length} Câu
                </p>
              </div>
              <div className="bg-white p-2 rounded-lg border border-gray-150 flex flex-col justify-center">
                <p className="font-bold text-gray-500 uppercase tracking-tight">Phần II</p>
                <p className="font-sans font-black text-indigo-750 text-xs mt-0.5">
                  {examQuestions.filter(q => q.part === PartType.PART2).length} Câu
                </p>
              </div>
              <div className="bg-white p-2 rounded-lg border border-gray-150 flex flex-col justify-center">
                <p className="font-bold text-gray-500 uppercase tracking-tight">Phần III</p>
                <p className="font-sans font-black text-indigo-750 text-xs mt-0.5">
                  {examQuestions.filter(q => q.part === PartType.PART3).length} Câu
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Part 1 */}
              {examQuestions.some(q => q.part === PartType.PART1) && (
                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-indigo-700 bg-indigo-50/70 px-2.5 py-1.5 rounded-lg border border-indigo-100 flex justify-between items-center">
                    <span>PHẦN I: Trắc nghiệm khách quan</span>
                    <span className="text-[10px] text-gray-550 font-mono bg-white px-1.5 py-0.5 rounded border border-gray-150">
                      {examQuestions.filter(q => q.part === PartType.PART1 && answers[q.id] !== undefined).length}/
                      {examQuestions.filter(q => q.part === PartType.PART1).length}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {examQuestions.map((q, idx) => {
                      if (q.part !== PartType.PART1) return null;
                      const localIdx = examQuestions.filter((item, i) => item.part === PartType.PART1 && i <= idx).length;
                      return (
                        <button
                          key={q.id}
                          onClick={() => setCurrentQuestionIndex(idx)}
                          className={cn(
                            "aspect-square rounded-xl flex items-center justify-center text-xs font-bold transition-all border-2 cursor-pointer",
                            currentQuestionIndex === idx 
                              ? "border-indigo-600 bg-indigo-50 text-indigo-700 font-black ring-2 ring-indigo-100" 
                              : answers[q.id] !== undefined
                                ? "border-green-500 bg-green-50 text-green-700"
                                : "border-gray-100 bg-gray-50 text-gray-400 hover:border-indigo-200"
                          )}
                          title={`Câu ${idx + 1} - Phần I Câu ${localIdx}`}
                        >
                          {localIdx}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Part 2 */}
              {examQuestions.some(q => q.part === PartType.PART2) && (
                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-indigo-700 bg-indigo-50/70 px-2.5 py-1.5 rounded-lg border border-indigo-100 flex justify-between items-center">
                    <span>PHẦN II: Trắc nghiệm Đúng/Sai</span>
                    <span className="text-[10px] text-gray-550 font-mono bg-white px-1.5 py-0.5 rounded border border-gray-150">
                      {examQuestions.filter(q => q.part === PartType.PART2 && answers[q.id] && Object.keys(answers[q.id]).length === 4).length}/
                      {examQuestions.filter(q => q.part === PartType.PART2).length}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {examQuestions.map((q, idx) => {
                      if (q.part !== PartType.PART2) return null;
                      const hasAns = answers[q.id] && Object.keys(answers[q.id]).length > 0;
                      const isComplete = answers[q.id] && Object.keys(answers[q.id]).length === 4;
                      const localIdx = examQuestions.filter((item, i) => item.part === PartType.PART2 && i <= idx).length;
                      return (
                        <button
                          key={q.id}
                          onClick={() => setCurrentQuestionIndex(idx)}
                          className={cn(
                            "aspect-square rounded-xl flex items-center justify-center text-xs font-bold transition-all border-2 cursor-pointer",
                            currentQuestionIndex === idx 
                              ? "border-indigo-600 bg-indigo-50 text-indigo-700 font-black ring-2 ring-indigo-100" 
                              : isComplete
                                ? "border-green-500 bg-green-50 text-green-700"
                                : hasAns
                                  ? "border-amber-500 bg-amber-50 text-amber-700"
                                  : "border-gray-100 bg-gray-50 text-gray-400 hover:border-indigo-200"
                          )}
                          title={`Câu ${idx + 1} - Phần II Câu ${localIdx}`}
                        >
                          {localIdx}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Part 3 */}
              {examQuestions.some(q => q.part === PartType.PART3) && (
                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-indigo-700 bg-indigo-50/70 px-2.5 py-1.5 rounded-lg border border-indigo-100 flex justify-between items-center">
                    <span>PHẦN III: Trả lời ngắn</span>
                    <span className="text-[10px] text-gray-550 font-mono bg-white px-1.5 py-0.5 rounded border border-gray-150">
                      {examQuestions.filter(q => q.part === PartType.PART3 && answers[q.id]?.toString().trim() !== "").length}/
                      {examQuestions.filter(q => q.part === PartType.PART3).length}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {examQuestions.map((q, idx) => {
                      if (q.part !== PartType.PART3) return null;
                      const answered = answers[q.id] !== undefined && answers[q.id]?.toString().trim() !== "";
                      const localIdx = examQuestions.filter((item, i) => item.part === PartType.PART3 && i <= idx).length;
                      return (
                        <button
                          key={q.id}
                          onClick={() => setCurrentQuestionIndex(idx)}
                          className={cn(
                            "aspect-square rounded-xl flex items-center justify-center text-xs font-bold transition-all border-2 cursor-pointer",
                            currentQuestionIndex === idx 
                              ? "border-indigo-600 bg-indigo-50 text-indigo-700 font-black ring-2 ring-indigo-100" 
                              : answered
                                ? "border-green-500 bg-green-50 text-green-700"
                                : "border-gray-100 bg-gray-50 text-gray-400 hover:border-indigo-200"
                          )}
                          title={`Câu ${idx + 1} - Phần III Câu ${localIdx}`}
                        >
                          {localIdx}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            <div className="mt-6 space-y-2 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2 text-[10px] text-gray-500 font-semibold uppercase">
                <div className="w-3 h-3 rounded bg-green-500" />
                <span>Đã trả lời xong</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-gray-500 font-semibold uppercase">
                <div className="w-3 h-3 rounded bg-amber-500" />
                <span>Trả lời dở dang (Phần II)</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-gray-500 font-semibold uppercase">
                <div className="w-3 h-3 rounded bg-gray-200" />
                <span>Chưa phản hồi</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-gray-500 font-semibold uppercase">
                <div className="w-3 h-3 rounded border-2 border-indigo-600 bg-indigo-50" />
                <span>Đang chọn hiển thị</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- 5. RESULT VIEW COMPONENT ---
const stripHtml = (html: string): string => {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
};

// --- 5. RESULT VIEW COMPONENT ---
interface ResultViewProps {
  results: StudentResult[];
  onGoToHome: () => void;
  questions: Question[];
  currentExam: ExamRoom | null;
  viewingResultId: string | null;
}

function ResultView({ results, onGoToHome, questions, currentExam, viewingResultId }: ResultViewProps) {
  const latestResult = useMemo(() => {
    if (viewingResultId) {
      return results.find(r => r.id === viewingResultId) || results[results.length - 1];
    }
    return results[results.length - 1];
  }, [results, viewingResultId]);

  const [showDetails, setShowDetails] = React.useState(false);

  if (!latestResult) return null;

  // Resolve exam context from the historical result or current selection
  const examResolved = currentExam || {
    id: latestResult.examId || "unknown",
    name: latestResult.examName || "Bài thi tự do",
    code: "",
    duration: 45,
    questionIds: Object.keys(latestResult.answers).filter(k => !k.startsWith("_")),
    allowReview: true
  };

  const isReviewAllowed = examResolved.allowReview ?? true;

  // Retrieve matching questions for this exam representation
  const examQuestions = questions.filter(q => examResolved.questionIds.includes(q.id));

  const convertHtmlWithLatexToWordMathML = (htmlStr: string): string => {
    if (!htmlStr) return "";
    
    // 1. Clean math text helper: strips HTML tags inside math formulas and decodes HTML entities
    const cleanMathText = (txt: string) => {
      let cleaned = txt
        .replace(/<[^>]+>/g, '') // Strip inline styles or span wrappers in mathematical formulas
        .replace(/(?:«\s*(?:Toggle\s*TeX|MathType|Equation|OLE)(?:\s*\([^)]+\))?\s*»|»\s*(?:Toggle\s*TeX|MathType|Equation|OLE)(?:\s*\([^)]+\))?\s*«|\[\s*(?:Toggle\s*TeX|MathType|Equation|OLE)(?:\s*\([^)]+\))?\s*\])/gi, "")
        .replace(/(?:«\s*Toggle\s*TeX\s*»|»\s*Toggle\s*TeX\s*«|\[\s*Toggle\s*TeX\s*\]|Toggle\s*TeX)/gi, "")
        .replace(/(?:«\s*MathType\s*»|»\s*MathType\s*«|\[\s*MathType\s*\]|MathType)/gi, "")
        .trim();
      cleaned = cleaned
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ');
      return cleaned.trim();
    };

    // 2. Convert LaTeX to MathML using KaTeX
    const convertToPureMathML = (latex: string, isBlock = false): string => {
      try {
        const rawRender = katex.renderToString(latex, {
          displayMode: isBlock,
          output: "mathml",
          throwOnError: false
        });
        const match = rawRender.match(/<math\b[^>]*>[\s\S]*?<\/math>/i);
        if (match) {
          let mathml = match[0];
          
          // Remove the <annotation> block entirely so Word never falls back to printing raw LaTeX text
          mathml = mathml.replace(/<annotation encoding="application\/x-tex">[\s\S]*?<\/annotation>/gi, "");
          
          // Remove the <semantics> wrapper to simplify structure for Word's parser and avoid confusion
          mathml = mathml.replace(/<semantics>/gi, "").replace(/<\/semantics>/gi, "");
          
          // Ensure it has exactly the valid xmlns="http://www.w3.org/1998/Math/MathML" namespace attribute and no duplicate or wrong xmlns
          mathml = mathml.replace(/<math\b[^>]*>/i, isBlock ? '<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">' : '<math xmlns="http://www.w3.org/1998/Math/MathML">');
          
          return mathml;
        }
        return latex;
      } catch (err) {
        return latex;
      }
    };

    let processed = htmlStr;

    // 3. Clean up Toggle TeX, MathType, Equation, OLE labels first globally (matching SafeHtmlRenderer behavior)
    processed = processed
      .replace(/«\s*Toggle TeX\s*»/gi, "")
      .replace(/»\s*Toggle TeX\s*«/gi, "")
      .replace(/\[\s*Toggle TeX\s*\]/gi, "")
      .replace(/Toggle TeX/gi, "")
      .replace(/«\s*MathType\s*»/gi, "")
      .replace(/»\s*MathType\s*«/gi, "")
      .replace(/\[\s*MathType\s*\]/gi, "")
      .replace(/MathType/gi, "")
      .replace(/«\s*Equation\s*»/gi, "")
      .replace(/»\s*Equation\s*«/gi, "")
      .replace(/\[\s*Equation\s*\]/gi, "")
      .replace(/Equation/gi, "")
      .replace(/«\s*OLE\s*»/gi, "")
      .replace(/»\s*OLE\s*«/gi, "")
      .replace(/\[\s*OLE\s*\]/gi, "")
      .replace(/OLE/gi, "");

    // 4. Process <img> tags containing math/formulas in alt/title (like in SafeHtmlRenderer.tsx)
    processed = processed.replace(/<img\b([^>]*?)>/gi, (imgTag, attrs) => {
      const altMatch = attrs.match(/alt=["']([\s\S]*?)["']/i);
      const titleMatch = attrs.match(/title=["']([\s\S]*?)["']/i);
      const val = (altMatch ? altMatch[1] : titleMatch ? titleMatch[1] : "").trim();
      
      if (!val) return imgTag;
      
      let decoded = val
        .replace(/(?:«\s*(?:Toggle\s*TeX|MathType|Equation|OLE)\s*»|»\s*(?:Toggle\s*TeX|MathType|Equation|OLE)\s*«|\[\s*(?:Toggle\s*TeX|MathType|Equation|OLE)\s*\]|Toggle\s*TeX)/gi, "");
      let prev = "";
      for (let i = 0; i < 3; i++) {
        prev = decoded;
        decoded = decoded
          .replace(/&amp;/g, "&")
          .replace(/&quot;/g, '"')
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&#39;/g, "'")
          .replace(/&#x27;/g, "'")
          .replace(/&nbsp;/g, " ");
        if (decoded === prev) break;
      }

      decoded = decoded.trim();

      while (
        (decoded.startsWith('"') && decoded.endsWith('"')) ||
        (decoded.startsWith("'") && decoded.endsWith("'")) ||
        (decoded.startsWith("`") && decoded.endsWith("`"))
      ) {
        decoded = decoded.substring(1, decoded.length - 1).trim();
      }

      while (
        (decoded.startsWith('$$') && decoded.endsWith('$$')) ||
        (decoded.startsWith('$') && decoded.endsWith('$')) ||
        (decoded.startsWith('\\[') && decoded.endsWith('\\]')) ||
        (decoded.startsWith('\\(') && decoded.endsWith('\\)'))
      ) {
        if (decoded.startsWith('$$') && decoded.endsWith('$$')) {
          decoded = decoded.substring(2, decoded.length - 2).trim();
        } else if (decoded.startsWith('$') && decoded.endsWith('$')) {
          decoded = decoded.substring(1, decoded.length - 1).trim();
        } else if (decoded.startsWith('\\[') && decoded.endsWith('\\]')) {
          decoded = decoded.substring(2, decoded.length - 2).trim();
        } else if (decoded.startsWith('\\(') && decoded.endsWith('\\)')) {
          decoded = decoded.substring(2, decoded.length - 2).trim();
        }
      }

      decoded = decoded.replace(/^(?:Equation|MathType|OLE|Microsoft Equation|MathType Equation)\s*\d*(?:\s*|:)\s*/i, "").trim();

      const lower = decoded.toLowerCase();
      const isBlacklisted = (
        !lower ||
        decoded.includes("[!") ||
        decoded.includes("[img") ||
        decoded.includes("mathtype_") ||
        decoded.includes("formula_") ||
        decoded.includes("_toc") ||
        decoded.includes("_Toc") ||
        lower === "equation" ||
        lower === "mathtype" ||
        lower === "embedded object" ||
        lower.startsWith("ole object") ||
        lower.startsWith("microsoft equation") ||
        lower.includes("hình") ||
        lower.includes("đồ thị") ||
        lower.includes("biểu đồ") ||
        lower.includes("sơ đồ") ||
        lower.includes("picture") ||
        lower.includes("image") ||
        lower.includes("diagram") ||
        lower.includes("figure") ||
        lower.includes("chart") ||
        lower.includes("graph") ||
        lower.includes("logo") ||
        lower.includes("photo") ||
        lower.includes("vector") ||
        lower.includes("draw") ||
        /^(?:equation|mathtype|object|shape|embed|picture|image|ole|winword)\s*[-_.]?\s*\d*$/i.test(lower)
      );

      if (isBlacklisted) return imgTag;

      const hasMathSymbols = /\\|[\+\-\*\/\^_{}\[\]\(\)=<>≤≥≠≈±×÷]/.test(decoded);
      const isVariableName = /^[a-zA-Zα-ωΑ-ΩθπΔ/]$/.test(decoded);
      const isMathExpression = /^[a-zA-Z0-9\sα-ωΑ-ΩθπΔ+\-*/^_{}[\]()=<>≤≥≠≈±×÷]+$/.test(decoded) && 
                               (decoded.includes("=") || decoded.includes("+") || decoded.includes("-") || decoded.includes("*") || decoded.includes("/") || decoded.includes(" ") || decoded.length < 5);
      const hasMathWords = /\b(sin|cos|tan|cot|log|ln|lim|arcsin|arccos|arctan|lg|deg|rad)\b/i.test(decoded);

      if (hasMathSymbols || isVariableName || isMathExpression || hasMathWords) {
        return `$${decoded}$`;
      }
      return imgTag;
    });

    // 5. Unify offline styles classes
    processed = processed.replace(/\[!b:\$(.*?)\$\]/g, '<strong>$1</strong>');
    processed = processed.replace(/\[!i:\$(.*?)\$\]/g, '<em>$1</em>');
    processed = processed.replace(/\[!u:\$(.*?)\$\]/g, '<u>$1</u>');
    processed = processed.replace(/\[!sup:\$(.*?)\$\]/g, '<sup>$1</sup>');
    processed = processed.replace(/\[!sub:\$(.*?)\$\]/g, '<sub>$1</sub>');
    processed = processed.replace(/\[!m:\$(.*?)\$\]/gi, "");
    processed = processed.replace(/\[img:\$(.*?)\$\]/gi, "");

    // 6. Process display / block math $$...$$
    processed = processed.replace(/\$\$(.+?)\$\$/gs, (match, p1) => {
      try {
        const cleaned = cleanMathText(p1);
        return cleaned ? `<div align="center" style="text-align:center;margin:12pt 0;">${convertToPureMathML(cleaned, true)}</div>` : "";
      } catch (e) {
        return match;
      }
    });

    // 7. Process inline math $...$
    processed = processed.replace(/\$(.+?)\$/g, (match, p1) => {
      try {
        const cleaned = cleanMathText(p1);
        return cleaned ? convertToPureMathML(cleaned, false) : "";
      } catch (e) {
        return match;
      }
    });

    // 8. LaTeX inline forms \\( ... \\) and \( ... \)
    processed = processed.replace(/\\\\\((.+?)\\\\\)/g, (match, p1) => {
      try {
        const cleaned = cleanMathText(p1);
        return cleaned ? convertToPureMathML(cleaned, false) : "";
      } catch (e) {
        return match;
      }
    });
    processed = processed.replace(/\\\((.+?)\\\)/g, (match, p1) => {
      try {
        const cleaned = cleanMathText(p1);
        return cleaned ? convertToPureMathML(cleaned, false) : "";
      } catch (e) {
        return match;
      }
    });

    // 9. LaTeX display forms \\[ ... \\] and \[ ... \]
    processed = processed.replace(/\\\\\[(.+?)\\\\\]/gs, (match, p1) => {
      try {
        const cleaned = cleanMathText(p1);
        return cleaned ? `<div align="center" style="text-align:center;margin:12pt 0;">${convertToPureMathML(cleaned, true)}</div>` : "";
      } catch (e) {
        return match;
      }
    });
    processed = processed.replace(/\\\[(.+?)\\\]/gs, (match, p1) => {
      try {
        const cleaned = cleanMathText(p1);
        return cleaned ? `<div align="center" style="text-align:center;margin:12pt 0;">${convertToPureMathML(cleaned, true)}</div>` : "";
      } catch (e) {
        return match;
      }
    });

    // 10. Process leftover `« ... »` that could contain inline formulas but weren't prefixed with $
    processed = processed.replace(/«\s*([^«»]+?)\s*»/g, (match, p1) => {
      const cleaned = cleanMathText(p1);
      if (!cleaned) return "";
      
      const lower = cleaned.toLowerCase();
      // If it looks like math or variable, convert to MathML
      const hasMathSymbols = /\\|[\+\-\*\/\^_{}\[\]\(\)=<>≤≥≠≈±×÷]/.test(cleaned);
      const isVariableName = /^[a-zA-Zα-ωΑ-ΩθπΔ]$/.test(cleaned);
      const isMathExpression = /^[a-zA-Z0-9\sα-ωΑ-ΩθπΔ+\-*/^_{}[\]()=<>≤≥≠≈±×÷]+$/.test(cleaned) && 
                               (cleaned.includes("=") || cleaned.includes("+") || cleaned.includes("-") || cleaned.includes("*") || cleaned.includes("/") || cleaned.includes(" ") || cleaned.length < 5);
      const hasMathWords = /\b(sin|cos|tan|cot|log|ln|lim|arcsin|arccos|arctan|lg|deg|rad)\b/i.test(cleaned);
      
      if (hasMathSymbols || isVariableName || isMathExpression || hasMathWords) {
        return convertToPureMathML(cleaned, false);
      }
      return cleaned;
    });

    // Final cleanup of left over brackets and tags
    processed = processed
      .replace(/«\s*»/g, "")
      .replace(/\[\s*\]/g, "")
      .replace(/«\s*(?:Toggle\s*TeX|MathType|Equation|OLE)\s*»/gi, "")
      .replace(/»\s*(?:Toggle\s*TeX|MathType|Equation|OLE)\s*«/gi, "")
      .replace(/\[\s*(?:Toggle\s*TeX|MathType|Equation|OLE)\s*\]/gi, "")
      .replace(/(?:Toggle\s*TeX|MathType|Equation\s*Equation|OLE)/gi, "");

    // 11. Auto-format tables for Microsoft Word compatibility (grid lines, cell spacing, responsive margins)
    processed = processed.replace(/<table\b([^>]*?)>/gi, (match, attrs) => {
      if (attrs.includes('style=')) {
        return `<table border="1" cellspacing="0" cellpadding="6" ${attrs.replace(/style=["']([^"']*)["']/i, 'style="border-collapse:collapse; border:1px solid #cbd5e0; width:100%; margin:12pt 0; $1"')}>`;
      }
      return `<table border="1" cellspacing="0" cellpadding="6" style="border-collapse:collapse; border:1px solid #cbd5e0; width:100%; margin:12pt 0;" ${attrs}>`;
    });

    processed = processed.replace(/<td\b([^>]*?)>/gi, (match, attrs) => {
      if (attrs.includes('style=')) {
        return `<td ${attrs.replace(/style=["']([^"']*)["']/i, 'style="border:1px solid #cbd5e0; padding:6pt; vertical-align:top; $1"')}>`;
      }
      return `<td style="border:1px solid #cbd5e0; padding:6pt; vertical-align:top;" ${attrs}>`;
    });

    processed = processed.replace(/<th\b([^>]*?)>/gi, (match, attrs) => {
      if (attrs.includes('style=')) {
        return `<th ${attrs.replace(/style=["']([^"']*)["']/i, 'style="border:1px solid #cbd5e0; padding:6pt; background-color:#f7fafc; font-weight:bold; vertical-align:top; $1"')}>`;
      }
      return `<th style="border:1px solid #cbd5e0; padding:6pt; background-color:#f7fafc; font-weight:bold; vertical-align:top;" ${attrs}>`;
    });

    return processed;
  };

  const handleDownloadWork = () => {
    // Generate beautiful MS Word file as HTML with Word namespace XML meta tags
    let docHtml = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <title>BÀI LÀM CHI TIẾT & ĐÁP ÁN THI</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    body {
      font-family: "Times New Roman", Times, serif;
      font-size: 12pt;
      line-height: normal;
      mso-line-height-rule: at-least;
      color: #1a202c;
      margin: 1in;
    }
    .header {
      text-align: center;
      margin-bottom: 20pt;
    }
    .title {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 18pt;
      font-weight: bold;
      color: #2b6cb0;
      margin: 0;
      padding: 0;
      text-transform: uppercase;
    }
    .subtitle {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 11pt;
      color: #718096;
      margin-top: 5pt;
    }
    .info-section {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20pt;
      border: 1px solid #cbd5e0;
    }
    .info-section td {
      padding: 8pt;
      border: 1px solid #cbd5e0;
      vertical-align: middle;
    }
    .info-label {
      font-weight: bold;
      color: #4a5568;
      background-color: #edf2f7;
      width: 30%;
    }
    .info-value {
      color: #2d3748;
    }
    .score-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 25pt;
      border: 1px solid #cbd5e0;
    }
    .score-table th {
      background-color: #2b6cb0;
      color: white;
      font-weight: bold;
      padding: 8pt;
      border: 1px solid #cbd5e0;
      text-align: left;
    }
    .score-table td {
      padding: 8pt;
      border: 1px solid #cbd5e0;
    }
    .section-title {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 14pt;
      font-weight: bold;
      color: #2c5282;
      border-bottom: 2px solid #3182ce;
      padding-bottom: 4pt;
      margin-top: 25pt;
      margin-bottom: 15pt;
    }
    .question-card {
      margin-bottom: 25pt;
      padding-top: 12pt;
      border-top: 1px solid #cbd5e0;
      page-break-inside: avoid;
    }
    .question-meta {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 10.5pt;
      font-weight: bold;
      color: #2b6cb0;
      margin-bottom: 8pt;
    }
    .question-text {
      font-size: 12pt;
      font-weight: bold;
      color: #2d3748;
      margin-bottom: 12pt;
      line-height: normal;
      mso-line-height-rule: at-least;
    }
    .options-table {
      width: 95%;
      border-collapse: collapse;
      margin-left: 12pt;
      margin-bottom: 10pt;
    }
    .options-table td {
      padding: 6pt;
      vertical-align: top;
    }
    .option-letter {
      font-family: Arial, Helvetica, sans-serif;
      font-weight: bold;
      color: #4a5568;
      width: 25pt;
    }
    .option-text {
      color: #2d3748;
    }
    .status-correct {
      color: #38a169;
      font-weight: bold;
      font-size: 10pt;
    }
    .status-incorrect {
      color: #e53e3e;
      font-weight: bold;
      font-size: 10pt;
    }
    .user-choice-label {
      font-family: Arial, Helvetica, sans-serif;
      font-weight: bold;
      font-size: 9pt;
      color: #e53e3e;
    }
    .correct-answer-label {
      font-family: Arial, Helvetica, sans-serif;
      font-weight: bold;
      font-size: 9pt;
      color: #38a169;
    }
    .text-mono {
      font-family: "Courier New", Courier, monospace;
    }
    img {
      border: 0;
      display: inline-block;
      vertical-align: middle;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 12pt 0;
      border: 1px solid #cbd5e0;
      table-layout: auto;
      mso-table-layout-alt: auto;
    }
    th, td {
      border: 1px solid #cbd5e0;
      padding: 6.5pt;
      vertical-align: top;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">Báo Cáo Làm Bài &amp; Đáp Án Chi Tiết</div>
    <div class="subtitle">Hệ Thống Đánh Giá Năng Lực Trực Tuyến</div>
  </div>

  <table class="info-section" border="1" cellspacing="0" cellpadding="8" style="width:100%; border-collapse:collapse; border:1px solid #cbd5e0; margin-bottom:20pt;">
    <tr>
      <td class="info-label" style="font-weight: bold; color: #4a5568; background-color: #edf2f7; width: 30%; border: 1px solid #cbd5e0; padding: 8pt;">Họ và tên thí sinh:</td>
      <td class="info-value" style="color: #2d3748; border: 1px solid #cbd5e0; padding: 8pt;"><strong>${latestResult.studentName}</strong></td>
      <td class="info-label" style="font-weight: bold; color: #4a5568; background-color: #edf2f7; width: 25%; border: 1px solid #cbd5e0; padding: 8pt;">Tổng điểm đạt được:</td>
      <td class="info-value" style="color: #2d3748; border: 1px solid #cbd5e0; padding: 8pt;"><span style="font-size: 14pt; color: #2b6cb0;"><strong>${latestResult.score.toFixed(2)} / 10.00 điểm</strong></span></td>
    </tr>
    <tr>
      <td class="info-label" style="font-weight: bold; color: #4a5568; background-color: #edf2f7; border: 1px solid #cbd5e0; padding: 8pt;">Số báo danh / Lớp:</td>
      <td class="info-value" style="color: #2d3748; border: 1px solid #cbd5e0; padding: 8pt;">${latestResult.studentId}</td>
      <td class="info-label" style="font-weight: bold; color: #4a5568; background-color: #edf2f7; border: 1px solid #cbd5e0; padding: 8pt;">Phòng kiểm tra:</td>
      <td class="info-value" style="color: #2d3748; border: 1px solid #cbd5e0; padding: 8pt;">${examResolved.name}</td>
    </tr>
    <tr>
      <td class="info-label" style="font-weight: bold; color: #4a5568; background-color: #edf2f7; border: 1px solid #cbd5e0; padding: 8pt;">Thời gian nộp bài:</td>
      <td class="info-value" style="color: #2d3748; border: 1px solid #cbd5e0; padding: 8pt;">${new Date(latestResult.timestamp).toLocaleString('vi-VN')}</td>
      <td class="info-label" style="font-weight: bold; color: #4a5568; background-color: #edf2f7; border: 1px solid #cbd5e0; padding: 8pt;">Trạng thái:</td>
      <td class="info-value" style="color: #38a169; font-weight: bold; border: 1px solid #cbd5e0; padding: 8pt;">ĐÃ CHẤM ĐIỂM</td>
    </tr>
  </table>

  <div class="section-title">Kết quả từng phần kiểm tra</div>
  <table class="score-table" border="1" cellspacing="0" cellpadding="8" style="width:100%; border-collapse:collapse; border:1px solid #cbd5e0; margin-bottom:25pt;">
    <thead>
      <tr>
        <th style="padding: 8pt; background-color: #2b6cb0; color: white; border: 1px solid #cbd5e0; font-weight: bold; text-align: left;">Phần Kiểm Tra</th>
        <th style="padding: 8pt; background-color: #2b6cb0; color: white; border: 1px solid #cbd5e0; font-weight: bold; text-align: left;">Loại câu hỏi</th>
        <th style="padding: 8pt; background-color: #2b6cb0; color: white; border: 1px solid #cbd5e0; font-weight: bold; text-align: left;">Điểm Số Đạt Được</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="padding: 8pt; border: 1px solid #cbd5e0;"><strong>Phần I</strong></td>
        <td style="padding: 8pt; border: 1px solid #cbd5e0;">Trắc nghiệm nhiều lựa chọn (Một đáp án đúng)</td>
        <td style="padding: 8pt; border: 1px solid #cbd5e0;"><strong>${latestResult.part1Score.toFixed(2)} / 10.00đ</strong></td>
      </tr>
      <tr>
        <td style="padding: 8pt; border: 1px solid #cbd5e0;"><strong>Phần II</strong></td>
        <td style="padding: 8pt; border: 1px solid #cbd5e0;">Trắc nghiệm Đúng/Sai (Bốn khẳng định độc lập)</td>
        <td style="padding: 8pt; border: 1px solid #cbd5e0;"><strong>${latestResult.part2Score.toFixed(2)} / 10.00đ</strong></td>
      </tr>
      <tr>
        <td style="padding: 8pt; border: 1px solid #cbd5e0;"><strong>Phần III</strong></td>
        <td style="padding: 8pt; border: 1px solid #cbd5e0;">Trả lời điền kết quả ngắn</td>
        <td style="padding: 8pt; border: 1px solid #cbd5e0;"><strong>${latestResult.part3Score.toFixed(2)} / 10.00đ</strong></td>
      </tr>
    </tbody>
  </table>

  <div class="section-title">Chi tiết câu hỏi &amp; Lời giải thí sinh</div>
`;

    examQuestions.forEach((q, idx) => {
      const studentAns = latestResult.answers[q.id];
      const partName = q.part === PartType.PART1 ? "Phần I - Trắc nghiệm nhiều lựa chọn" : q.part === PartType.PART2 ? "Phần II - Trắc nghiệm Đúng/Sai" : "Phần III - Trả lời kết quả ngắn";
      
      let cleanedQuestion = convertHtmlWithLatexToWordMathML(q.question);
      
      docHtml += `
  <div class="question-card" style="margin-bottom: 25pt; padding-top: 12pt; border-top: 1px solid #cbd5e0; page-break-inside: avoid;">
    <div class="question-meta" style="font-family: Arial, Helvetica, sans-serif; font-size: 10.5pt; font-weight: bold; color: #2b6cb0; margin-bottom: 8pt;">CÂU ${idx + 1} (${partName})</div>
    <div class="question-text" style="font-size: 12pt; font-weight: bold; color: #2d3748; margin-bottom: 12pt; line-height: 1.35; mso-line-height-rule: at-least;">${cleanedQuestion}</div>
`;

      if (q.part === PartType.PART1) {
        docHtml += `    <table class="options-table" border="0" cellspacing="0" cellpadding="4" style="width: 95%; border: none; border-collapse: collapse; margin-left: 12pt; margin-bottom: 10pt;">`;
        ['A', 'B', 'C', 'D'].forEach(opt => {
          const optText = convertHtmlWithLatexToWordMathML((q as any)[opt] || "");
          const isChosen = studentAns === opt;
          const isCorrect = q.answer === opt;
          
          let statusText = "";
          if (isChosen && isCorrect) {
            statusText = ` <span class="status-correct" style="color: #38a169; font-weight: bold; font-size: 10pt;">[Lựa chọn của bạn - CHÍNH XÁC]</span>`;
          } else if (isChosen && !isCorrect) {
            statusText = ` <span class="status-incorrect" style="color: #e53e3e; font-weight: bold; font-size: 10pt;">[Lựa chọn của bạn - CHƯA CHÍNH XÁC]</span>`;
          } else if (!isChosen && isCorrect) {
            statusText = ` <span class="status-correct" style="color: #38a169; font-weight: bold; font-size: 10pt;">[Đáp án chuẩn]</span>`;
          }

          docHtml += `
      <tr>
        <td class="option-letter" style="width: 25pt; border: none; padding: 4pt; font-family: Arial, Helvetica, sans-serif; font-weight: bold; color: #4a5568;">${opt}.</td>
        <td class="option-text" style="border: none; padding: 4pt; color: #2d3748;">${optText}${statusText}</td>
      </tr>`;
        });
        docHtml += `    </table>`;
      } else if (q.part === PartType.PART2) {
        docHtml += `    <table class="options-table" border="1" cellspacing="0" cellpadding="6" style="background-color: #ffffff; border: 1px solid #cbd5e0; border-collapse: collapse; width: 95%; margin-left: 12pt; margin-bottom: 10pt;">`;
        docHtml += `
      <thead>
        <tr style="background-color: #f7fafc;">
          <th style="padding: 6pt; border: 1px solid #cbd5e0; text-align: left; font-size: 10.5pt; color: #4a5568; font-weight: bold;">Phát biểu / Khẳng định độc lập</th>
          <th style="padding: 6pt; border: 1px solid #cbd5e0; text-align: center; font-size: 10.5pt; color: #4a5568; font-weight: bold; width: 80pt;">Bạn chọn</th>
          <th style="padding: 6pt; border: 1px solid #cbd5e0; text-align: center; font-size: 10.5pt; color: #4a5568; font-weight: bold; width: 80pt;">Đáp án</th>
          <th style="padding: 6pt; border: 1px solid #cbd5e0; text-align: center; font-size: 10.5pt; color: #4a5568; font-weight: bold; width: 80pt;">Nhận xét</th>
        </tr>
      </thead>
      <tbody>`;

        const statements = q.statements || { a: "", b: "", c: "", d: "" };
        const correctAnswers = (q.answer as any) || { a: true, b: true, c: true, d: true };
        const userAnswers = (studentAns as any) || {};

        ['a', 'b', 'c', 'd'].forEach(key => {
          const stmtText = convertHtmlWithLatexToWordMathML((statements as any)[key] || "");
          const correctVal = correctAnswers[key] ? "Đúng" : "Sai";
          const userVal = typeof userAnswers[key] === 'boolean' ? (userAnswers[key] ? "Đúng" : "Sai") : "Chưa chọn (?)";
          const isCorrect = userAnswers[key] === correctAnswers[key];

          docHtml += `
        <tr>
          <td style="padding: 6pt; border: 1px solid #cbd5e0;"><strong>${key.toUpperCase()})</strong> ${stmtText}</td>
          <td style="padding: 6pt; border: 1px solid #cbd5e0; text-align: center; font-weight: bold; color: ${userVal === 'Đúng' ? '#3182ce' : userVal === 'Sai' ? '#dd6b20' : '#a0aec0'}">${userVal}</td>
          <td style="padding: 6pt; border: 1px solid #cbd5e0; text-align: center; font-weight: bold; color: #38a169;">${correctVal}</td>
          <td style="padding: 6pt; border: 1px solid #cbd5e0; text-align: center; font-weight: bold; color: ${isCorrect ? '#38a169' : '#e53e3e'}">${isCorrect ? "ĐÚNG" : "SAI"}</td>
        </tr>`;
        });
        docHtml += `      </tbody>\n    </table>`;
      } else if (q.part === PartType.PART3) {
        const isCorrect = studentAns?.toString().trim().toLowerCase() === q.answer?.toString().trim().toLowerCase();
        const displayStudentAns = convertHtmlWithLatexToWordMathML(studentAns || "");
        const displayAnswer = convertHtmlWithLatexToWordMathML(q.answer?.toString() || "");
        docHtml += `
    <div style="margin-top: 8pt; border-top: 1px solid #cbd5e0; padding-top: 8pt; font-size: 11pt;">
      <p style="margin: 2pt 0;">- Câu trả lời điền vào của bạn: <strong style="color: ${isCorrect ? "#38a169" : "#e53e3e"}">${displayStudentAns || "Trống (Không điền)"}</strong></p>
      <p style="margin: 2pt 0;">- Đáp án chính xác được duyệt: <strong style="color: #38a169; font-family: Consolas, monospace;">${displayAnswer}</strong></p>
      <p style="margin: 2pt 0;">=> Đánh giá: <strong style="color: ${isCorrect ? "#38a169" : "#e53e3e"}">${isCorrect ? "CHÍNH XÁC" : "CHƯA CHÍNH XÁC"}</strong></p>
    </div>`;
      }

      docHtml += `  </div>`;
    });

    docHtml += `
  <div style="text-align: center; margin-top: 30pt; font-size: 10.5pt; color: #718096; border-top: 1px dashed #cbd5e0; padding-top: 15pt;">
    Cảm ơn bạn đã thực hiện bài thi! Báo cáo được tạo tự động bởi cổng kiểm tra trực tuyến.
  </div>
</body>
</html>`;

    // Process images embedded as base64 and pack into an MHTML archive
    let imageCounter = 0;
    const images: { name: string; cid: string; mimeType: string; data: string }[] = [];

    let processedHtml = docHtml.replace(/<img\b([^>]*?)>/gi, (imgTag) => {
      // RegEx targeting Base64 source safely without buggy word-boundary checks
      const srcMatch = imgTag.match(/src=["']data:([^"';\s]+);base64,([^"']+)["']/i);
      if (srcMatch) {
        const mimeType = srcMatch[1];
        let rawBase64 = srcMatch[2].trim();
        
        // Decode percent-encoded characters first if any exist
        if (rawBase64.includes("%")) {
          try {
            rawBase64 = decodeURIComponent(rawBase64);
          } catch (e) {
            // ignore fallback
          }
        }
        
        // First convert actual space characters ' ' (originally '+') back to '+'
        let base64Data = rawBase64.replace(/ /g, "+");
        
        // Then strip any other whitespace formatting (newlines, carriage returns, tabs, or remaining spacing)
        base64Data = base64Data.replace(/[\r\n\t]/g, "").replace(/\s/g, "");
        
        // Ensure standard Base64 characters (convert URL-safe variants - and _ to + and /)
        base64Data = base64Data.replace(/-/g, "+").replace(/_/g, "/");

        // MS Word base64 decoder is strictly RFC compliant and requires proper 4-character padding to avoid trunkation / black cutout boxes
        while (base64Data.length % 4 !== 0) {
          base64Data += "=";
        }

        const ext = mimeType.split("/")[1] || "png";
        const imageName = `img_${imageCounter}.${ext}`;
        const cid = `img_${imageCounter++}`;
        
        images.push({
          name: imageName,
          cid,
          mimeType,
          data: base64Data
        });

        // Resolve precise layout dimensions from attributes or inline style properties to avoid Word clipping them
        let widthVal = "";
        let heightVal = "";

        const widthMatch = imgTag.match(/\bwidth=["']?(\d+)(?:px)?["']?/i);
        if (widthMatch) widthVal = widthMatch[1];

        const heightMatch = imgTag.match(/\bheight=["']?(\d+)(?:px)?["']?/i);
        if (heightMatch) heightVal = heightMatch[1];

        const styleMatch = imgTag.match(/\bstyle=["']([^"']*)["']/i);
        let inlineStyleString = styleMatch ? styleMatch[1] : "";

        if (!widthVal && inlineStyleString) {
          const wStyleMatch = inlineStyleString.match(/\bwidth:\s*(\d+)px/i);
          if (wStyleMatch) widthVal = wStyleMatch[1];
        }
        if (!heightVal && inlineStyleString) {
          const hStyleMatch = inlineStyleString.match(/\bheight:\s*(\d+)px/i);
          if (hStyleMatch) heightVal = hStyleMatch[1];
        }

        // Clean inlineStyle: Strip max-width and auto height as Microsoft Word fails to properly compute auto scales, clipping them instead
        let cleanedInlineStyle = inlineStyleString
          .replace(/max-width\s*:\s*[^;]+;?/gi, "")
          .replace(/height\s*:\s*auto;?/gi, "")
          .replace(/line-height:[^;]+;?/gi, "");

        const widthAttr = widthVal ? `width="${widthVal}"` : "";
        const heightAttr = heightVal ? `height="${heightVal}"` : "";

        // Return a beautiful MSO-compatible paragraph centering the image without line-height constraints or table layouts clipping it
        return `<p align="center" class="MsoNormal" style="text-align:center; line-height:normal; margin:12pt 0; page-break-inside:avoid;"><img src="${imageName}" ${widthAttr} ${heightAttr} style="display:inline-block; margin:0 auto; ${cleanedInlineStyle}" /></p>`;
      }
      return imgTag;
    });

    const boundary = "----=nextPart_314159265358";
    
    // Help helper function to convert UTF-8 HTML safely to base64 for MHTML encoding
    const base64Html = btoa(unescape(encodeURIComponent(processedHtml)));
    let chunkedHtmlLines: string[] = [];
    for (let i = 0; i < base64Html.length; i += 76) {
      chunkedHtmlLines.push(base64Html.substring(i, i + 76));
    }
    const chunkedHtml = chunkedHtmlLines.join("\r\n");

    // Construct valid multipart MHTML file structure using CRLF line endings
    let mhtml = `MIME-Version: 1.0\r\n`;
    mhtml += `Content-Type: multipart/related; boundary="${boundary}"\r\n\r\n`;
    
    // Part 1: Main HTML Content encoded in Base64 to bypass any UTF-8 multi-byte boundary shift bugs in MS Word
    mhtml += `--${boundary}\r\n`;
    mhtml += `Content-Type: text/html; charset="utf-8"\r\n`;
    mhtml += `Content-Transfer-Encoding: base64\r\n\r\n`;
    mhtml += chunkedHtml + `\r\n\r\n`;
    
    // Part 2: Inline Base64 Images with full MIME headers (Content-ID and Content-Location)
    // base64 data must be split into lines of maximum 76 characters per standard RFC 2045 MIME compliance to prevent MS Word from truncating long strings
    images.forEach(img => {
      let chunkedLines: string[] = [];
      for (let i = 0; i < img.data.length; i += 76) {
        chunkedLines.push(img.data.substring(i, i + 76));
      }
      const chunkedData = chunkedLines.join("\r\n");

      mhtml += `--${boundary}\r\n`;
      mhtml += `Content-ID: <${img.cid}>\r\n`;
      mhtml += `Content-Location: ${img.name}\r\n`;
      mhtml += `Content-Transfer-Encoding: base64\r\n`;
      mhtml += `Content-Type: ${img.mimeType}\r\n\r\n`;
      mhtml += chunkedData + `\r\n\r\n`;
    });
    
    mhtml += `--${boundary}--\r\n`;

    // Package the HTML/MHTML into a Blob for downloading with application/msword mime-type
    // We normalize all line breaks in the entire document to standard RFC CRLF formats
    const normalizedData = mhtml.replace(/\r\n/g, "\n").replace(/\n/g, "\r\n");
    const blob = new Blob([normalizedData], { type: "application/msword;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `BAI_LAM_CHI_TIET_${latestResult.studentName.replace(/\s+/g, "_")}_${examResolved.id}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white p-6 sm:p-8 rounded-3xl shadow-xl w-full max-w-4xl border border-gray-100 my-4"
      >
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-100">
            <CheckCircle2 size={36} />
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Cổng Kiểm Tra Đánh Giá</h1>
          <p className="text-gray-500 mt-1 text-sm">Hệ thống ghi nhận và chấm điểm thành công cho bài kiểm tra của bạn</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl text-center">
            <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider mb-1">Điểm số đạt được</p>
            <p className="text-4xl font-mono font-black text-indigo-700">{latestResult.score.toFixed(2)}</p>
          </div>
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl flex flex-col justify-center text-center">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Thời gian nộp bài</p>
            <p className="text-sm font-bold text-gray-700">{new Date(latestResult.timestamp).toLocaleString('vi-VN')}</p>
          </div>
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl flex flex-col justify-center text-center">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Học sinh tham gia</p>
            <p className="text-sm font-bold text-gray-700 truncate px-2">{latestResult.studentName}</p>
          </div>
        </div>

        <div className="mb-6 p-5 bg-gray-50 rounded-2xl border border-gray-200 space-y-3.5 text-xs text-gray-700">
          <div className="flex justify-between items-center pb-2.5 border-b border-gray-200">
            <span className="text-gray-500 font-medium">Phần I (Trắc nghiệm nhiều lựa chọn):</span>
            <span className="font-bold text-gray-900 font-mono tracking-tight bg-white px-2 py-1 rounded border">{latestResult.part1Score.toFixed(2)} / 10đ</span>
          </div>
          <div className="flex justify-between items-center pb-2.5 border-b border-gray-200">
            <span className="text-gray-500 font-medium">Phần II (Trắc nghiệm Đúng/Sai):</span>
            <span className="font-bold text-gray-900 font-mono tracking-tight bg-white px-2 py-1 rounded border">{latestResult.part2Score.toFixed(2)} / 10đ</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500 font-medium">Phần III (Tự luận trả lời kết quả ngắn):</span>
            <span className="font-bold text-gray-900 font-mono tracking-tight bg-white px-2 py-1 rounded border">{latestResult.part3Score.toFixed(2)} / 10đ</span>
          </div>
        </div>

        {/* REVIEW SECTIONS & SOLUTIONS OR LOCK WARNING */}
        {isReviewAllowed ? (
          <div className="border border-gray-200 rounded-2xl mb-6 overflow-hidden">
            <button 
              onClick={() => setShowDetails(!showDetails)}
              className="w-full flex justify-between items-center px-5 py-4 bg-indigo-50/50 hover:bg-indigo-50 transition-colors"
            >
              <span className="font-extrabold text-sm text-indigo-900 flex items-center gap-1.5">
                <BookOpen size={16} /> 
                {showDetails ? "Ẩn danh sách đáp án chi tiết" : "Xem lời giải & đáp án chi tiết câu hỏi"}
              </span>
              {showDetails ? <ChevronUp size={18} className="text-indigo-650" /> : <ChevronDown size={18} className="text-indigo-650" />}
            </button>

            {showDetails && (
              <div className="p-4 sm:p-6 bg-white border-t border-gray-200 space-y-6 divide-y divide-gray-150 max-h-[500px] overflow-y-auto">
                {examQuestions.map((q, idx) => {
                  const studentAns = latestResult.answers[q.id];
                  return (
                    <div key={q.id} className={cn("pt-6 first:pt-0 space-y-3.5")}>
                      <div className="flex flex-wrap items-start justify-between gap-2.5">
                        <span className="text-xs font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-150 px-2.5 py-1 rounded-lg">
                          Câu {idx + 1} - Phần {q.part === PartType.PART1 ? 'I' : q.part === PartType.PART2 ? 'II' : 'III'}
                        </span>
                        {q.part === PartType.PART1 && (
                          <span className={cn(
                            "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border",
                            studentAns === q.answer ? "bg-green-100 text-green-700 border-green-200" : "bg-red-100 text-red-700 border-red-200"
                          )}>
                            {studentAns === q.answer ? "Đúng" : "Sai"}
                          </span>
                        )}
                        {q.part === PartType.PART3 && (
                          <span className={cn(
                            "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border",
                            studentAns?.toString().trim().toLowerCase() === q.answer?.toString().trim().toLowerCase() ? "bg-green-100 text-green-700 border-green-200" : "bg-red-100 text-red-700 border-red-200"
                          )}>
                            {studentAns?.toString().trim().toLowerCase() === q.answer?.toString().trim().toLowerCase() ? "Đúng" : "Sai"}
                          </span>
                        )}
                      </div>

                      <div className="text-sm font-medium text-gray-800 leading-relaxed bg-gray-50/50 p-3.5 border border-gray-100 rounded-xl">
                        <SafeHtmlRenderer html={q.question} />
                      </div>

                      {/* PART 1 */}
                      {q.part === PartType.PART1 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pl-2 text-xs">
                          {['A', 'B', 'C', 'D'].map(opt => {
                            const optText = (q as any)[opt];
                            const isChosen = studentAns === opt;
                            const isCorrect = q.answer === opt;
                            return (
                              <div 
                                key={opt}
                                className={cn(
                                  "p-3 rounded-xl border transition-all flex items-start gap-2.5",
                                  isCorrect ? "bg-green-50/70 border-green-300 text-green-900 font-semibold" : 
                                  isChosen ? "bg-red-50/70 border-red-300 text-red-900" : "bg-white border-gray-200 text-gray-700"
                                )}
                              >
                                <span className={cn(
                                  "w-6 h-6 flex items-center justify-center rounded-lg font-black shrink-0",
                                  isCorrect ? "bg-green-500 text-white" : 
                                  isChosen ? "bg-red-500 text-white" : "bg-gray-100 text-gray-600 font-bold"
                                )}>
                                  {opt}
                                </span>
                                <div className="flex-1 mt-0.5 leading-relaxed">
                                  <SafeHtmlRenderer html={optText} className="text-xs" />
                                  {isChosen && <span className="inline-block text-[10px] font-extrabold ml-1.5 uppercase text-red-600 font-mono">(Lực chọn của bạn)</span>}
                                  {isCorrect && <span className="inline-block text-[10px] font-extrabold ml-1.5 uppercase text-green-600 font-mono">(Đáp án chuẩn)</span>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* PART 2 */}
                      {q.part === PartType.PART2 && (
                        <div className="space-y-3 pl-2">
                          {['a', 'b', 'c', 'd'].map(key => {
                            const stmtText = q.statements ? (q.statements as any)[key] : "";
                            const correctVal = q.answer ? (q.answer as any)[key] : true;
                            const studentVal = studentAns ? studentAns[key] : undefined;
                            const isCorrect = studentVal === correctVal;

                            return (
                              <div 
                                key={key}
                                className={cn(
                                  "p-3 rounded-xl border flex flex-col sm:flex-row justify-between sm:items-center gap-3.5 text-xs transition-all",
                                  isCorrect ? "bg-green-50/40 border-green-200" : "bg-red-50/40 border-red-200"
                                )}
                              >
                                <div className="flex-1 flex gap-2">
                                  <span className="font-extrabold text-indigo-700 uppercase shrink-0">{key})</span>
                                  <div className="text-gray-700 leading-relaxed">
                                    <SafeHtmlRenderer html={stmtText} className="text-xs" />
                                  </div>
                                </div>
                                <div className="flex gap-2.5 shrink-0 self-end sm:self-auto">
                                  <div className="text-right">
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">Bạn chọn</p>
                                    <p className={cn(
                                      "font-extrabold",
                                      studentVal === undefined ? "text-gray-400" : studentVal ? "text-indigo-650" : "text-amber-600"
                                    )}>
                                      {studentVal === undefined ? "Chưa chọn (?)" : studentVal ? "Đúng" : "Sai"}
                                    </p>
                                  </div>
                                  <div className="border-r border-gray-200 mx-1" />
                                  <div>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">Đáp án</p>
                                    <p className="font-extrabold text-green-700">
                                      {correctVal ? "Đúng" : "Sai"}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* PART 3 */}
                      {q.part === PartType.PART3 && (
                        <div className="p-4 rounded-xl border border-gray-250 bg-gray-50/60 pl-4 space-y-2 text-xs">
                          <div className="flex justify-between items-center border-b border-gray-200/50 pb-2">
                            <span className="text-gray-500 font-bold">Câu trả lời điền vào của bạn:</span>
                            <span className={cn(
                              "font-extrabold font-mono text-sm px-2.5 py-1 rounded bg-white border",
                              studentAns?.toString().trim().toLowerCase() === q.answer?.toString().trim().toLowerCase()
                                ? "text-green-700 border-green-200" : "text-red-700 border-red-200"
                            )}>
                              {studentAns || "Trống (Không điền)"}
                            </span>
                          </div>
                          <div className="flex justify-between items-center pt-1">
                            <span className="text-gray-550 font-bold text-gray-600">Đáp án chính xác được duyệt:</span>
                            <span className="font-extrabold font-mono text-sm px-2.5 py-1 rounded bg-green-50 border border-green-200 text-green-750">
                              <SafeHtmlRenderer html={q.answer as string} className="text-xs font-mono font-bold text-green-750 inline-block" />
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="mb-6 p-4 bg-amber-50/50 p-4 border border-amber-200 rounded-2xl flex items-center gap-3 text-xs text-amber-850">
            <Info size={18} className="text-amber-600 shrink-0" />
            <div>
              <p className="font-bold">Tính năng xem đáp án và giải đề đã bị khóa</p>
              <p className="text-[11px] text-amber-700 mt-0.5">Giáo viên quản nhiệm phòng thi đã vô hiệu hóa quyền xem lời giải chi tiết và đáp án trực tiếp cho đợt thi này.</p>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4">
          <button 
            onClick={isReviewAllowed ? handleDownloadWork : () => alert("Thao tác tải về bị giáo viên khóa cho bài thi này.")}
            disabled={!isReviewAllowed}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all text-sm cursor-pointer border shadow-sm",
              isReviewAllowed 
                ? "bg-slate-50 border-slate-350 hover:bg-slate-100 text-gray-700" 
                : "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
            )}
          >
            <Download size={18} />
            Tải Bài Làm (Word .doc)
          </button>
          <button 
            onClick={onGoToHome}
            className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-md text-sm text-center"
          >
            Trở lại Trang chính
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// --- 6. ADMIN DASHBOARD COMPONENT ---
interface AdminDashboardProps {
  user: { name: string; sbd: string; role: "student" | "admin" | "teacher"; className?: string } | null;
  teachers: Teacher[];
  setTeachers: React.Dispatch<React.SetStateAction<Teacher[]>>;
  folders: Folder[];
  setFolders: React.Dispatch<React.SetStateAction<Folder[]>>;
  questions: Question[];
  setQuestions: React.Dispatch<React.SetStateAction<Question[]>>;
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  examRooms: ExamRoom[];
  setExamRooms: React.Dispatch<React.SetStateAction<ExamRoom[]>>;
  results: StudentResult[];
  setResults?: React.Dispatch<React.SetStateAction<StudentResult[]>>;
  onViewResultDetail?: (result: StudentResult) => void;
  onLogout: () => void;
}

const quillModules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{'list': 'ordered'}, {'list': 'bullet'}],
    ['image', 'video'],
    ['clean']
  ],
};



const parseWordHtml = (htmlString: string, folderId?: string): Question[] => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, "text/html");
  const nodes = Array.from(doc.body.childNodes);
  const parsedQuestions: Question[] = [];
  
  let currentPart: PartType = PartType.PART1;
  let currentQuestion: Partial<Question> | null = null;
  let currentField: string = "question";

  const cleanOptionHtml = (html?: string): string => {
    if (!html) return "";
    return html
      .replace(/<\/?[tT][dDrRhH][^>]*>/g, " ")
      .replace(/<\/?[tT][bB][oO][dD][yY][^>]*>/g, "")
      .replace(/<\/?[tT][aA][bB][lL][eE][^>]*>/g, "")
      .replace(/<\/?[pP][^>]*>/g, "")
      .replace(/\s+/g, " ")
      .trim();
  };

  const finalizeQuestionLocal = (q: Partial<Question>, list: Question[]) => {
    if (!q.question?.trim()) return;
    if (q.part === PartType.PART1) {
      q.A = cleanOptionHtml(q.A) || "Phương án A";
      q.B = cleanOptionHtml(q.B) || "Phương án B";
      q.C = cleanOptionHtml(q.C) || "Phương án C";
      q.D = cleanOptionHtml(q.D) || "Phương án D";
      q.answer = q.answer || "A";
    } else if (q.part === PartType.PART2) {
      if (q.statements) {
        q.statements.a = cleanOptionHtml(q.statements.a) || "Phát biểu a";
        q.statements.b = cleanOptionHtml(q.statements.b) || "Phát biểu b";
        q.statements.c = cleanOptionHtml(q.statements.c) || "Phát biểu c";
        q.statements.d = cleanOptionHtml(q.statements.d) || "Phát biểu d";
      } else {
        q.statements = { a: "Phát biểu a", b: "Phát biểu b", c: "Phát biểu c", d: "Phát biểu d" };
      }
      q.answer = q.answer || { a: true, b: true, c: true, d: false };
    } else if (q.part === PartType.PART3) {
      q.answer = q.answer || "Đáp án chuẩn";
    }
    list.push({ ...q, folderId: folderId || undefined } as Question);
  };

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (node.nodeType === Node.TEXT_NODE && !node.textContent?.trim()) {
      continue;
    }

    const textContent = (node.textContent || "").trim();
    const upperText = textContent.toUpperCase();

    if (upperText.includes("[PHẦN 1]") || upperText.includes("[PHẦN I]") || upperText.includes("PART 1") || upperText.includes("PART I")) {
      currentPart = PartType.PART1;
      continue;
    }
    if (upperText.includes("[PHẦF 2]") || upperText.includes("[PHẦN II]") || upperText.includes("PART 2") || upperText.includes("PART II") || upperText.includes("[PHẦN 2]")) {
      currentPart = PartType.PART2;
      continue;
    }
    if (upperText.includes("[PHẦN 3]") || upperText.includes("[PHẦN III]") || upperText.includes("PART 3") || upperText.includes("PART III")) {
      currentPart = PartType.PART3;
      continue;
    }

    const qMatch = textContent.match(/^(?:Câu\s*\d+|Question\s*\d+|Q\d+)[:.\s-]\s*(.*)$/i);
    if (node.nodeType === Node.ELEMENT_NODE && (node as Element).tagName === "P" && qMatch) {
      if (currentQuestion) {
        finalizeQuestionLocal(currentQuestion, parsedQuestions);
      }
      
      let innerHTML = (node as Element).innerHTML;
      innerHTML = innerHTML.replace(/^(?:<strong>)?(?:Câu\s*\d+|Question\s*\d+|Q\d+)[:.\s-]*(?:<\/strong>)?\s*/i, "");

      currentQuestion = {
        id: "imported-" + Math.random().toString(36).substr(2, 9),
        part: currentPart,
        question: innerHTML,
      };
      currentField = "question";
      continue;
    }

    if (!currentQuestion) {
      continue;
    }

    if (currentQuestion.part === PartType.PART1) {
      // 1. Split a single line with 4 options (A., B., C., D.)
      const multiMatch = textContent.match(/^A[\s.)\u2013-]([\s\S]*?)B[\s.)\u2013-]([\s\S]*?)C[\s.)\u2013-]([\s\S]*?)D[\s.)\u2013-]([\s\S]*)$/i);
      if (multiMatch) {
        let inner = (node as Element).innerHTML || textContent;
        const aIdx = inner.search(/(?:^|[\s>])A[\s.)\u2013-]/i);
        const bIdx = inner.search(/(?:^|[\s>])B[\s.)\u2013-]/i);
        const cIdx = inner.search(/(?:^|[\s>])C[\s.)\u2013-]/i);
        const dIdx = inner.search(/(?:^|[\s>])D[\s.)\u2013-]/i);

        if (aIdx !== -1 && bIdx !== -1 && cIdx !== -1 && dIdx !== -1 && aIdx < bIdx && bIdx < cIdx && cIdx < dIdx) {
          const rawASymbol = inner.substring(aIdx, bIdx);
          const rawBSymbol = inner.substring(bIdx, cIdx);
          const rawCSymbol = inner.substring(cIdx, dIdx);
          const rawDSymbol = inner.substring(dIdx);

          currentQuestion.A = rawASymbol.replace(/^(?:<[^>]+>)*\s*A[\s.)\u2013-]*/i, "").trim();
          currentQuestion.B = rawBSymbol.replace(/^(?:<[^>]+>)*\s*B[\s.)\u2013-]*/i, "").trim();
          currentQuestion.C = rawCSymbol.replace(/^(?:<[^>]+>)*\s*C[\s.)\u2013-]*/i, "").trim();
          currentQuestion.D = rawDSymbol.replace(/^(?:<[^>]+>)*\s*D[\s.)\u2013-]*/i, "").trim();
          currentField = "D";
          continue;
        }
      }

      // 2. Split a single line with Row 1 of 2 options (A., B.)
      const row1Match = textContent.match(/^A[\s.)\u2013-]([\s\S]*?)B[\s.)\u2013-]([\s\S]*)$/i);
      if (row1Match && !textContent.includes("C.") && !textContent.includes("D.")) {
        let inner = (node as Element).innerHTML || textContent;
        const bIdx = inner.search(/(?:^|[\s>])B[\s.)\u2013-]/i);
        if (bIdx !== -1) {
          currentQuestion.A = inner.substring(0, bIdx).replace(/^(?:<[^>]+>)*\s*A[\s.)\u2013-]*/i, "").trim();
          currentQuestion.B = inner.substring(bIdx).replace(/^(?:<[^>]+>)*\s*B[\s.)\u2013-]*/i, "").trim();
          currentField = "B";
          continue;
        }
      }

      // 3. Split a single line with Row 2 of 2 options (C., D.)
      const row2Match = textContent.match(/^C[\s.)\u2013-]([\s\S]*?)D[\s.)\u2013-]([\s\S]*)$/i);
      if (row2Match && !textContent.includes("A.") && !textContent.includes("B.")) {
        let inner = (node as Element).innerHTML || textContent;
        const dIdx = inner.search(/(?:^|[\s>])D[\s.)\u2013-]/i);
        if (dIdx !== -1) {
          currentQuestion.C = inner.substring(0, dIdx).replace(/^(?:<[^>]+>)*\s*C[\s.)\u2013-]*/i, "").trim();
          currentQuestion.D = inner.substring(dIdx).replace(/^(?:<[^>]+>)*\s*D[\s.)\u2013-]*/i, "").trim();
          currentField = "D";
          continue;
        }
      }

      // 4. Default single option line matching
      const choiceMatch = textContent.match(/^([A-D])[\s.)\u2013-]\s*(.*)$/i);
      if (choiceMatch) {
        const letter = choiceMatch[1].toUpperCase() as "A" | "B" | "C" | "D";
        currentField = letter;
        
        let valHTML = (node as Element).innerHTML || textContent;
        valHTML = valHTML.replace(/^(?:<strong>)?([A-D])[\s.)\u2013-]*(?:<\/strong>)?\s*/i, "");
        currentQuestion[letter] = valHTML;
        continue;
      }

      const ansMatch = textContent.match(/^(?:Đáp\s+án|Answer|DA)[:.\s-]\s*([A-D])/i);
      if (ansMatch) {
        currentQuestion.answer = ansMatch[1].toUpperCase();
        currentField = "answer";
        continue;
      }
    } else if (currentQuestion.part === PartType.PART2) {
      const statementMatch = textContent.match(/^([a-d])[\s.)\u2013-]\s*(.*)$/i);
      if (statementMatch) {
        const stmtLet = statementMatch[1].toLowerCase() as "a" | "b" | "c" | "d";
        currentField = "statements." + stmtLet;
        
        let stmtHTML = (node as Element).innerHTML || textContent;
        stmtHTML = stmtHTML.replace(/^(?:<strong>)?([a-d])[\s.)\u2013-]*(?:<\/strong>)?\s*/i, "");
        
        const lowerText = textContent.toLowerCase().trim();
        let isTrue = true;
        if (/(?:[\s\-\(\[]|^)sai[\s\)\(\[\]\.]*$/i.test(lowerText)) {
          isTrue = false;
        } else if (/(?:[\s\-\(\[]|^)đúng[\s\)\(\[\]\.]*$/i.test(lowerText) || /(?:[\s\-\(\[]|^)dung[\s\)\(\[\]\.]*$/i.test(lowerText)) {
          isTrue = true;
        }
        
        stmtHTML = stmtHTML.replace(/[-\s\(\[\]\.]*(?:[Đđ]úng|[Ss]ai)[-\s\)\(\[\]\.]*$/i, "").trim();

        if (!currentQuestion.statements) {
          currentQuestion.statements = { a: "", b: "", c: "", d: "" };
        }
        currentQuestion.statements[stmtLet] = stmtHTML;

        if (!currentQuestion.answer || typeof currentQuestion.answer !== "object") {
          currentQuestion.answer = { a: true, b: true, c: true, d: true };
        }
        (currentQuestion.answer as any)[stmtLet] = isTrue;
        continue;
      }
    } else if (currentQuestion.part === PartType.PART3) {
      const ansMatch = textContent.match(/^(?:Đáp\s+án|Answer|DA)[:.\s-]\s*(.*)$/i);
      if (ansMatch) {
        currentQuestion.answer = ansMatch[1].trim();
        currentField = "answer";
        continue;
      }
    }

    let contentToAdd = "";
    if (node.nodeType === Node.ELEMENT_NODE) {
      contentToAdd = (node as Element).outerHTML;
    } else {
      contentToAdd = node.textContent || "";
    }

    if (contentToAdd) {
      if (currentField === "question") {
        currentQuestion.question = (currentQuestion.question || "") + " " + contentToAdd;
      } else if (currentField === "A" || currentField === "B" || currentField === "C" || currentField === "D") {
        const fieldName = currentField as "A" | "B" | "C" | "D";
        currentQuestion[fieldName] = (currentQuestion[fieldName] || "") + " " + contentToAdd;
      } else if (currentField.startsWith("statements.")) {
        const stmtLet = currentField.split(".")[1] as "a" | "b" | "c" | "d";
        if (!currentQuestion.statements) {
          currentQuestion.statements = { a: "", b: "", c: "", d: "" };
        }
        currentQuestion.statements[stmtLet] = (currentQuestion.statements[stmtLet] || "") + " " + contentToAdd;
      }
    }
  }

  if (currentQuestion) {
    finalizeQuestionLocal(currentQuestion, parsedQuestions);
  }

  return parsedQuestions;
};

function AdminDashboard({
  user, teachers, setTeachers,
  folders, setFolders,
  questions, setQuestions,
  students, setStudents,
  examRooms, setExamRooms,
  results, setResults, onViewResultDetail, onLogout
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<"dashboard" | "folders" | "questions" | "students" | "exams" | "results" | "teachers">("dashboard");
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [isExcelImportModalOpen, setIsExcelImportModalOpen] = useState(false);
  const [excelPreviewStudents, setExcelPreviewStudents] = useState<Student[]>([]);
  const [excelImportErrors, setExcelImportErrors] = useState(0);
  const [excelSelectedFolderId, setExcelSelectedFolderId] = useState<string>("");
  
  const [isManualQuestionModalOpen, setIsManualQuestionModalOpen] = useState(false);
  const [isWordImportModalOpen, setIsWordImportModalOpen] = useState(false);
  const [isParsingAi, setIsParsingAi] = useState(false);
  const [useAiParser, setUseAiParser] = useState(true);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {}
  });

  const [toastNotification, setToastNotification] = useState<{
    isOpen: boolean;
    message: string;
    type: "success" | "info" | "error";
  }>({
    isOpen: false,
    message: "",
    type: "success"
  });

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm
    });
  };

  const showToast = (message: string, type: "success" | "info" | "error" = "success") => {
    setToastNotification({
      isOpen: true,
      message,
      type
    });
    setTimeout(() => {
      setToastNotification(prev => ({ ...prev, isOpen: false }));
    }, 3000);
  };
  
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [editingExamRoomId, setEditingExamRoomId] = useState<string | null>(null);
  
  const [newFolder, setNewFolder] = useState<{ name: string; parentId?: string; type?: 'question' | 'student' }>({ name: "", parentId: undefined, type: "question" });
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [studentFolderFilter, setStudentFolderFilter] = useState<string>("ALL");
  const [resultsClassFilter, setResultsClassFilter] = useState<string>("ALL");
  const [resultsExamFilter, setResultsExamFilter] = useState<string>("ALL");
  const [isStatsExpanded, setIsStatsExpanded] = useState<boolean>(true);
  const [expandedFolderIds, setExpandedFolderIds] = useState<Record<string, boolean>>({});
  const [newStudent, setNewStudent] = useState({ name: "", sbd: "", className: "" });
  const [newExam, setNewExam] = useState({ 
    name: "", 
    duration: 45, 
    code: "", 
    startTime: "", 
    endTime: "", 
    questionIds: [] as string[],
    part1Point: 0.25,
    part2Point1: 0.1,
    part2Point2: 0.25,
    part2Point3: 0.5,
    part2Point4: 1.0,
    part3Point: 0.5,
    allowReview: true,
    isFree: false,
    shuffleQuestions: false,
    shuffleAnswers: false
  });

  // Random Select Question state fields
  const [randomSelectFolderId, setRandomSelectFolderId] = useState<string>("ALL");
  const [randomSelectPart1Count, setRandomSelectPart1Count] = useState<number>(0);
  const [randomSelectPart2Count, setRandomSelectPart2Count] = useState<number>(0);
  const [randomSelectPart3Count, setRandomSelectPart3Count] = useState<number>(0);

  // Manual Question state
  const [manualFolderId, setManualFolderId] = useState("");
  const [manualPart, setManualPart] = useState<PartType>(PartType.PART1);
  const [manualQuestionText, setManualQuestionText] = useState("");
  const [manualA, setManualA] = useState("");
  const [manualB, setManualB] = useState("");
  const [manualC, setManualC] = useState("");
  const [manualD, setManualD] = useState("");
  const [manualAnsPart1, setManualAnsPart1] = useState("A");
  
  const [manualStmtA, setManualStmtA] = useState("");
  const [manualStmtB, setManualStmtB] = useState("");
  const [manualStmtC, setManualStmtC] = useState("");
  const [manualStmtD, setManualStmtD] = useState("");
  const [manualAnsPart2, setManualAnsPart2] = useState({ a: true, b: true, c: true, d: false });
  const [manualAnsPart3, setManualAnsPart3] = useState("");

  // Import Word file state
  const [importText, setImportText] = useState("");
  const [previewQuestions, setPreviewQuestions] = useState<Question[]>([]);

  // Add search and filter states for bank questions helper
  const [searchQuery, setSearchQuery] = useState("");
  const [partFilter, setPartFilter] = useState<PartType | "ALL">("ALL");
  const [folderFilter, setFolderFilter] = useState<string>("ALL");

  const parseWordContent = (text: string): Question[] => {
    const lines = text.split(/\r?\n/);
    const parsedQuestions: Question[] = [];
    
    let currentPart: PartType = PartType.PART1;
    let currentQuestion: Partial<Question> | null = null;
    
    const finalizeQuestionLocal = (q: Partial<Question>, list: Question[]) => {
      if (!q.question?.trim()) return;
      if (q.part === PartType.PART1) {
        q.A = q.A || "Phương án A";
        q.B = q.B || "Phương án B";
        q.C = q.C || "Phương án C";
        q.D = q.D || "Phương án D";
        q.answer = q.answer || "A";
      } else if (q.part === PartType.PART2) {
        q.statements = q.statements || { a: "Phát biểu a", b: "Phát biểu b", c: "Phát biểu c", d: "Phát biểu d" };
        q.answer = q.answer || { a: true, b: true, c: true, d: false };
      } else if (q.part === PartType.PART3) {
        q.answer = q.answer || "Đáp án chuẩn";
      }
      list.push({ ...q, folderId: manualFolderId || undefined } as Question);
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const upperLine = line.toUpperCase();
      if (upperLine.includes("[PHẦN 1]") || upperLine.includes("[PHẦN I]") || upperLine.includes("PART 1") || upperLine.includes("PART I")) {
        currentPart = PartType.PART1;
        continue;
      }
      if (upperLine.includes("[PHẦN 2]") || upperLine.includes("[PHẦN II]") || upperLine.includes("PART 2") || upperLine.includes("PART II")) {
        currentPart = PartType.PART2;
        continue;
      }
      if (upperLine.includes("[PHẦN 3]") || upperLine.includes("[PHẦN III]") || upperLine.includes("PART 3") || upperLine.includes("PART III")) {
        currentPart = PartType.PART3;
        continue;
      }
      
      const qMatch = line.match(/^(?:Câu\s+\d+|Question\s+\d+|Q\d+)[:.\s-]\s*(.*)$/i);
      if (qMatch) {
        if (currentQuestion) {
          finalizeQuestionLocal(currentQuestion, parsedQuestions);
        }
        currentQuestion = {
          id: "imported-" + Math.random().toString(36).substr(2, 9),
          part: currentPart,
          question: qMatch[1].trim(),
        };
        if (!qMatch[1].trim() && lines[i+1]) {
          currentQuestion.question = lines[i+1].trim();
          i++;
        }
        continue;
      }
      
      if (currentQuestion) {
        if (currentQuestion.part === PartType.PART1) {
          const choiceMatch = line.match(/^([A-D])[\s.)\u2013-]\s*(.*)$/i);
          if (choiceMatch) {
            const letter = choiceMatch[1].toUpperCase() as "A" | "B" | "C" | "D";
            currentQuestion[letter] = choiceMatch[2].trim();
            continue;
          }
          const ansMatch = line.match(/^(?:Đáp\s+án|Answer|DA)[:.\s-]\s*([A-D])/i);
          if (ansMatch) {
            currentQuestion.answer = ansMatch[1].toUpperCase();
            continue;
          }
        } else if (currentQuestion.part === PartType.PART2) {
          const statementMatch = line.match(/^([a-d])[\s.)\u2013-]\s*(.*)$/i);
          if (statementMatch) {
            const stmtLet = statementMatch[1].toLowerCase() as "a" | "b" | "c" | "d";
            let textContent = statementMatch[2].trim();
            
            const lowerText = textContent.toLowerCase().trim();
            let isTrue = true;
            if (/(?:[\s\-\(\[]|^)sai[\s\)\(\[\]\.]*$/i.test(lowerText)) {
              isTrue = false;
            } else if (/(?:[\s\-\(\[]|^)đúng[\s\)\(\[\]\.]*$/i.test(lowerText) || /(?:[\s\-\(\[]|^)dung[\s\)\(\[\]\.]*$/i.test(lowerText)) {
              isTrue = true;
            }
            
            textContent = textContent.replace(/[-\s\(\[\]\.]*(?:[Đđ]úng|[Ss]ai)[-\s\)\(\[\]\.]*$/i, "").trim();
            
            if (!currentQuestion.statements) {
              currentQuestion.statements = { a: "", b: "", c: "", d: "" };
            }
            currentQuestion.statements[stmtLet] = textContent;
            
            if (!currentQuestion.answer || typeof currentQuestion.answer !== "object") {
              currentQuestion.answer = { a: true, b: true, c: true, d: true };
            }
            (currentQuestion.answer as any)[stmtLet] = isTrue;
            continue;
          }
        } else if (currentQuestion.part === PartType.PART3) {
          const ansMatch = line.match(/^(?:Đáp\s+án|Answer|DA)[:.\s-]\s*(.*)$/i);
          if (ansMatch) {
            currentQuestion.answer = ansMatch[1].trim();
            continue;
          }
        }
        
        if (line && !line.startsWith("Phần") && !line.startsWith("[Phần")) {
          currentQuestion.question += "\n" + line;
        }
      }
    }
    
    if (currentQuestion) {
      finalizeQuestionLocal(currentQuestion, parsedQuestions);
    }
    
    return parsedQuestions;
  };

  const handleImportTextChange = (text: string) => {
    setImportText(text);
    const parsed = parseWordContent(text);
    setPreviewQuestions(parsed);
  };

  const handleWordFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.name.endsWith(".docx")) {
      if (useAiParser) {
        setIsParsingAi(true);
        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            const arrayBuffer = event.target?.result as ArrayBuffer;
            
            // Convert ArrayBuffer to Base64 safely
            const uint8Array = new Uint8Array(arrayBuffer);
            let binary = "";
            const len = uint8Array.byteLength;
            for (let i = 0; i < len; i++) {
              binary += String.fromCharCode(uint8Array[i]);
            }
            const base64 = window.btoa(binary);

            const res = await fetch("/api/parse-docx-ai", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ fileBase64: base64, folderId: manualFolderId })
            });

            if (!res.ok) {
              const errData = await res.json();
              throw new Error(errData.error || "Lỗi phản hồi từ máy chủ AI.");
            }

            const parsed = await res.json();
            setPreviewQuestions(parsed);
            showToast(`Trí tuệ nhân tạo (AI) đã trích xuất thành công ${parsed.length} câu hỏi kèm công thức toán LaTeX chuẩn!`, "success");
          } catch (err: any) {
            console.error("AI Parse Error:", err);
            showToast("AI không thể phân tích file: " + (err.message || "Vui lòng chọn cách tải thông thường hoặc kiểm tra khóa API."), "error");
          } finally {
            setIsParsingAi(false);
          }
        };
        reader.readAsArrayBuffer(file);
      } else {
        setIsParsingAi(true);
        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            const arrayBuffer = event.target?.result as ArrayBuffer;
            
            // Convert ArrayBuffer to Base64 safely
            const uint8Array = new Uint8Array(arrayBuffer);
            let binary = "";
            const len = uint8Array.byteLength;
            for (let i = 0; i < len; i++) {
              binary += String.fromCharCode(uint8Array[i]);
            }
            const base64 = window.btoa(binary);

            const res = await fetch("/api/parse-docx-native", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ fileBase64: base64 })
            });

            if (!res.ok) {
              const errData = await res.json();
              throw new Error(errData.error || "Lỗi máy chủ giải mã offline.");
            }

            const data = await res.json();
            const html = data.html;
            setImportText(html);
            const parsed = parseWordHtml(html, manualFolderId);
            setPreviewQuestions(parsed);
            showToast(`Đọc thành công ngoại tuyến! Tách được ${parsed.length} câu hỏi có hình ảnh, bảng và công thức chuyển đổi chuẩn KaTeX.`, "success");
          } catch (err: any) {
            console.error("Lỗi khi giải mã file Word (.docx) offline:", err);
            showToast("Không thể giải mã file Word .docx: " + (err.message || "Đảm bảo tệp không lỗi hoặc dán trực tiếp."), "error");
          } finally {
            setIsParsingAi(false);
          }
        };
        reader.readAsArrayBuffer(file);
      }
    } else if (file.name.endsWith(".doc")) {
      showToast("Định dạng file .doc (cũ) không được hỗ trợ giải mã trực tiếp. Vui lòng lưu tệp dưới định dạng .docx.", "error");
    } else {
      // txt or text files
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        handleImportTextChange(text);
        showToast("Đọc file văn bản thành công!", "success");
      };
      reader.readAsText(file);
    }
  };

  const saveImportedQuestions = () => {
    if (previewQuestions.length === 0) {
      showToast("Không tìm thấy câu hỏi hợp lệ nào để lưu!", "error");
      return;
    }
    const questionsWithTeacher = previewQuestions.map(q => ({
      ...q,
      teacherId: user?.role === "teacher" ? user.sbd : undefined
    }));
    setQuestions(prev => [...questionsWithTeacher, ...prev]);
    fetch("/api/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(questionsWithTeacher)
    }).catch(err => console.error("Error saving imported questions:", err));
    setIsWordImportModalOpen(false);
    setImportText("");
    setPreviewQuestions([]);
    showToast(`Đã thêm thành công ${previewQuestions.length} câu hỏi vào ngân hàng!`, "success");
  };

  const handleStartEditQuestion = (q: Question) => {
    setEditingQuestionId(q.id);
    setManualFolderId(q.folderId || "");
    setManualPart(q.part);
    setManualQuestionText(q.question);
    
    if (q.part === PartType.PART1) {
      setManualA(q.A || "");
      setManualB(q.B || "");
      setManualC(q.C || "");
      setManualD(q.D || "");
      setManualAnsPart1(q.answer as string);
    } else if (q.part === PartType.PART2) {
      setManualStmtA(q.statements?.a || "");
      setManualStmtB(q.statements?.b || "");
      setManualStmtC(q.statements?.c || "");
      setManualStmtD(q.statements?.d || "");
      setManualAnsPart2(q.answer as any);
    } else if (q.part === PartType.PART3) {
      setManualAnsPart3(q.answer as string);
    }
    
    setIsManualQuestionModalOpen(true);
  };

  const handleBulkDelete = () => {
    if (selectedQuestionIds.length === 0) return;
    showConfirm(
      "Xóa nhiều câu hỏi cùng lúc",
      `Bạn có chắc chắn muốn xóa đồng thời ${selectedQuestionIds.length} câu hỏi đã chọn? Thao tác này sẽ cập nhật trực tiếp cơ sở dữ liệu và không thể khôi phục!`,
      () => {
        setQuestions(prev => prev.filter(q => !selectedQuestionIds.includes(q.id)));
        selectedQuestionIds.forEach(id => {
          fetch(`/api/questions/${id}`, { method: "DELETE" }).catch(err => console.error(err));
        });
        setSelectedQuestionIds([]);
        showToast("Đã xóa đồng thời thành công các câu hỏi được chọn!", "success");
      }
    );
  };

  const addManualQuestion = () => {
    if (!manualQuestionText.trim()) {
      showToast("Vui lòng nhập nội dung câu hỏi!", "error");
      return;
    }
    
    let answer: any;
    let qDetails: Partial<Question> = {};
    
    if (manualPart === PartType.PART1) {
      if (!manualA.trim() || !manualB.trim() || !manualC.trim() || !manualD.trim()) {
        showToast("Vui lòng nhập đầy đủ các phương án A, B, C, D!", "error");
        return;
      }
      answer = manualAnsPart1;
      qDetails = {
        A: manualA.trim(),
        B: manualB.trim(),
        C: manualC.trim(),
        D: manualD.trim(),
      };
    } else if (manualPart === PartType.PART2) {
      if (!manualStmtA.trim() || !manualStmtB.trim() || !manualStmtC.trim() || !manualStmtD.trim()) {
        showToast("Vui lòng nhập đầy đủ phát biểu cho cả 4 ý mệnh đề!", "error");
        return;
      }
      answer = manualAnsPart2;
      qDetails = {
        statements: {
          a: manualStmtA.trim(),
          b: manualStmtB.trim(),
          c: manualStmtC.trim(),
          d: manualStmtD.trim(),
        }
      };
    } else {
      if (!manualAnsPart3.trim()) {
        showToast("Vui lòng nhập đáp án viết ngắn!", "error");
        return;
      }
      answer = manualAnsPart3.trim();
    }
    
    if (editingQuestionId) {
      const existingQ = questions.find(q => q.id === editingQuestionId);
      const updatedQ = {
        id: editingQuestionId,
        part: manualPart,
        question: manualQuestionText.trim(),
        answer,
        folderId: manualFolderId || undefined,
        teacherId: existingQ?.teacherId || (user?.role === "teacher" ? user.sbd : undefined),
        ...qDetails
      } as Question;
      setQuestions(prev => prev.map(q => q.id === editingQuestionId ? updatedQ : q));
      fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedQ)
      }).catch(err => console.error("Error updating question:", err));
      showToast("Đã cập nhật câu hỏi thành công!", "success");
      setEditingQuestionId(null);
    } else {
      const newQ: Question = {
        id: "manual-" + Date.now().toString(),
        part: manualPart,
        question: manualQuestionText.trim(),
        answer,
        folderId: manualFolderId || undefined,
        teacherId: user?.role === "teacher" ? user.sbd : undefined,
        ...qDetails
      } as Question;
      
      setQuestions(prev => [newQ, ...prev]);
      fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newQ)
      }).catch(err => console.error("Error creating question:", err));
      showToast("Đã thêm câu hỏi thủ công thành công!", "success");
    }
    
    // Reset form states
    setManualQuestionText("");
    setManualA("");
    setManualB("");
    setManualC("");
    setManualD("");
    setManualStmtA("");
    setManualStmtB("");
    setManualStmtC("");
    setManualStmtD("");
    setManualAnsPart1("A");
    setManualAnsPart2({ a: true, b: true, c: true, d: false });
    setManualAnsPart3("");
    setIsManualQuestionModalOpen(false);
  };

  const handleDownloadSampleDoc = () => {
    const doc = new DocxDocument({
      sections: [
        {
          properties: {},
          children: [
            new DocxParagraph({
              children: [
                new DocxTextRun({
                  text: "MẪU FILE CÂU HỎI NGÂN HÀNG TNTHPT 2025",
                  bold: true,
                  size: 28, // 14pt
                }),
              ],
              spacing: { after: 200 },
            }),
            new DocxParagraph({
              children: [
                new DocxTextRun({
                  text: "Lưu ý: Bạn có thể lưu file dưới dạng tài liệu Word (.docx). Hệ thống sẽ tự động bóc tách các câu hỏi thành 3 Phần chuẩn và hỗ trợ giữ nguyên bảng biểu, ảnh đính kèm (MathType dạng ảnh) hoặc các công thức dạng LaTeX ($ ... $ / $$ ... $$) để biên dịch sang định dạng chuẩn KaTeX cực đẹp.",
                  italics: true,
                  size: 22, // 11pt
                }),
              ],
              spacing: { after: 300 },
            }),

            // [Phần 1]
            new DocxParagraph({
              children: [
                new DocxTextRun({
                  text: "[Phần 1]",
                  bold: true,
                  size: 24, // 12pt
                }),
              ],
              spacing: { before: 200, after: 120 },
            }),
            new DocxParagraph({
              children: [
                new DocxTextRun({
                  text: "Câu 1: Cho hàm số bậc ba $y = ax^3 + bx^2 + cx + d \\ (a \\neq 0)$ có bảng biến thiên sau. Hỏi đồ thị hàm số có bao nhiêu cực trị?",
                  size: 24,
                }),
              ],
              spacing: { after: 120 },
            }),
            new DocxParagraph({
              children: [new DocxTextRun({ text: "A. 2 cực trị", size: 24 })],
              spacing: { after: 80 },
            }),
            new DocxParagraph({
              children: [new DocxTextRun({ text: "B. 1 cực trị", size: 24 })],
              spacing: { after: 80 },
            }),
            new DocxParagraph({
              children: [new DocxTextRun({ text: "C. 3 cực trị", size: 24 })],
              spacing: { after: 80 },
            }),
            new DocxParagraph({
              children: [new DocxTextRun({ text: "D. Có cực đại, không cực tiểu", size: 24 })],
              spacing: { after: 120 },
            }),
            new DocxParagraph({
              children: [
                new DocxTextRun({
                  text: "Đáp án: A",
                  bold: true,
                  size: 24,
                }),
              ],
              spacing: { after: 300 },
            }),

            new DocxParagraph({
              children: [
                new DocxTextRun({
                  text: "Câu 2: Công thức giải nhanh nghiệm phương trình bậc hai $ax^2 + bx + c = 0 \\ (a \\neq 0)$ có biệt thức $\\Delta = b^2 - 4ac > 0$ là:",
                  size: 24,
                }),
              ],
              spacing: { after: 120 },
            }),
            new DocxParagraph({
              children: [new DocxTextRun({ text: "A. $x = \\frac{-b \\pm \\sqrt{\\Delta}}{2a}$", size: 24 })],
              spacing: { after: 80 },
            }),
            new DocxParagraph({
              children: [new DocxTextRun({ text: "B. $x = \\frac{-b \\pm \\Delta}{2a}$", size: 24 })],
              spacing: { after: 80 },
            }),
            new DocxParagraph({
              children: [new DocxTextRun({ text: "C. $x = \\frac{b \\pm \\sqrt{\\Delta}}{2a}$", size: 24 })],
              spacing: { after: 80 },
            }),
            new DocxParagraph({
              children: [new DocxTextRun({ text: "D. x không xác định", size: 24 })],
              spacing: { after: 120 },
            }),
            new DocxParagraph({
              children: [
                new DocxTextRun({
                  text: "Đáp án: A",
                  bold: true,
                  size: 24,
                }),
              ],
              spacing: { after: 300 },
            }),

            // [Phần 2]
            new DocxParagraph({
              children: [
                new DocxTextRun({
                  text: "[Phần 2]",
                  bold: true,
                  size: 24,
                }),
              ],
              spacing: { before: 200, after: 120 },
            }),
            new DocxParagraph({
              children: [
                new DocxTextRun({
                  text: "Câu 3: Cho bảng số liệu sau về nhiệt độ trung bình một số tháng tại Thủ đô Hà Nội:",
                  size: 24,
                }),
              ],
              spacing: { after: 120 },
            }),

            // Table
            new DocxTable({
              width: {
                size: 100,
                type: DocxWidthType.PERCENTAGE,
              },
              rows: [
                // Header
                new DocxTableRow({
                  children: [
                    new DocxTableCell({
                      children: [
                        new DocxParagraph({
                          children: [new DocxTextRun({ text: "Tháng 1", bold: true, size: 24 })],
                          alignment: "center",
                        }),
                      ],
                      shading: { fill: "F1F5F9" },
                    }),
                    new DocxTableCell({
                      children: [
                        new DocxParagraph({
                          children: [new DocxTextRun({ text: "Tháng 6", bold: true, size: 24 })],
                          alignment: "center",
                        }),
                      ],
                      shading: { fill: "F1F5F9" },
                    }),
                    new DocxTableCell({
                      children: [
                        new DocxParagraph({
                          children: [new DocxTextRun({ text: "Tháng 12", bold: true, size: 24 })],
                          alignment: "center",
                        }),
                      ],
                      shading: { fill: "F1F5F9" },
                    }),
                  ],
                }),
                // Body
                new DocxTableRow({
                  children: [
                    new DocxTableCell({
                      children: [
                        new DocxParagraph({
                          children: [new DocxTextRun({ text: "$16.4^oC$", size: 24 })],
                          alignment: "center",
                        }),
                      ],
                    }),
                    new DocxTableCell({
                      children: [
                        new DocxParagraph({
                          children: [new DocxTextRun({ text: "$29.8^oC$", size: 24 })],
                          alignment: "center",
                        }),
                      ],
                    }),
                    new DocxTableCell({
                      children: [
                        new DocxParagraph({
                          children: [new DocxTextRun({ text: "$18.2^oC$", size: 24 })],
                          alignment: "center",
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),

            new DocxParagraph({
              children: [new DocxTextRun({ text: "" })],
              spacing: { before: 120, after: 120 },
            }),

            new DocxParagraph({
              children: [
                new DocxTextRun({
                  text: "Xét tính Đúng/Sai của các mệnh đề:",
                  size: 24,
                }),
              ],
              spacing: { after: 120 },
            }),
            new DocxParagraph({
              children: [
                new DocxTextRun({
                  text: "a. Tháng 6 có nhiệt độ trung bình cao nhất trong ba tháng kể trên. - Đúng",
                  size: 24,
                }),
              ],
              spacing: { after: 80 },
            }),
            new DocxParagraph({
              children: [
                new DocxTextRun({
                  text: "b. Biên độ nhiệt lệch giữa tháng 6 và tháng 1 lớn hơn $15.0^oC$. - Sai",
                  size: 24,
                }),
              ],
              spacing: { after: 80 },
            }),
            new DocxParagraph({
              children: [
                new DocxTextRun({
                  text: "c. Nhiệt độ trung bình của tháng 12 mát hơn nhiệt độ mùa hè. - Đúng",
                  size: 24,
                }),
              ],
              spacing: { after: 80 },
            }),
            new DocxParagraph({
              children: [
                new DocxTextRun({
                  text: "d. Nhiệt độ tháng 1 là thấp nhất trong 3 tháng. - Đúng",
                  size: 24,
                }),
              ],
              spacing: { after: 120 },
            }),

            // [Phần 3]
            new DocxParagraph({
              children: [
                new DocxTextRun({
                  text: "[Phần 3]",
                  bold: true,
                  size: 24,
                }),
              ],
              spacing: { before: 200, after: 120 },
            }),
            new DocxParagraph({
              children: [
                new DocxTextRun({
                  text: "Câu 4: Tìm số nghiệm thực của phương trình $x^2 - 4x + 3 = 0$.",
                  size: 24,
                }),
              ],
              spacing: { after: 120 },
            }),
            new DocxParagraph({
              children: [
                new DocxTextRun({
                  text: "Đáp án: 2",
                  bold: true,
                  size: 24,
                }),
              ],
              spacing: { after: 200 },
            }),
            new DocxParagraph({
              children: [
                new DocxTextRun({
                  text: "Câu 5: Cho hàm số $y = x^3 - 3x^2 + 1$. Điểm cực đại của đồ thị hàm số có tọa độ cực đại là $(x_0; y_0)$. Tính tổng $x_0 + y_0$.",
                  size: 24,
                }),
              ],
              spacing: { after: 120 },
            }),
            new DocxParagraph({
              children: [
                new DocxTextRun({
                  text: "Đáp án: 1",
                  bold: true,
                  size: 24,
                }),
              ],
              spacing: { after: 120 },
            }),
          ],
        },
      ],
    });

    DocxPacker.toBlob(doc).then((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Mau_Ngan_Hang_Cau_Hoi.docx";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  };

  // Helper to get formatted folders list for dropdown with indentation
  const getFolderDropdownList = (foldersList: Folder[]) => {
    const result: { id: string; name: string; level: number }[] = [];
    const visit = (pid: string | undefined, level: number) => {
      const children = foldersList.filter(f => f.parentId === pid);
      children.forEach(c => {
        result.push({ id: c.id, name: c.name, level });
        visit(c.id, level + 1);
      });
    };
    // Add folders without parents first (root folders)
    const rootFolders = foldersList.filter(f => !f.parentId || !foldersList.some(p => p.id === f.parentId));
    rootFolders.forEach(rf => {
      result.push({ id: rf.id, name: rf.name, level: 0 });
      visit(rf.id, 1);
    });
    return result;
  };

  const getSubfolderIds = (folderId: string, foldersList: Folder[]): string[] => {
    const children = foldersList.filter(f => f.parentId === folderId);
    return [
      folderId,
      ...children.flatMap(c => getSubfolderIds(c.id, foldersList))
    ];
  };

  const getFolderQuestionCount = (folderId: string) => {
    const allIds = getSubfolderIds(folderId, visibleFolders);
    return visibleQuestions.filter(q => q.folderId && allIds.includes(q.folderId)).length;
  };

  const toggleFolderExpanded = (id: string) => {
    setExpandedFolderIds(prev => ({ ...prev, [id]: !(prev[id] ?? true) }));
  };

  const moveFolder = (folderId: string, direction: "up" | "down") => {
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return;

    // Filter siblings: same parent and same type
    const siblings = folders
      .filter(f => f.parentId === folder.parentId && f.type === folder.type)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)); // sorted descending visually

    const currentIndex = siblings.findIndex(s => s.id === folderId);
    if (currentIndex === -1) return;

    let targetIndex = -1;
    if (direction === "up" && currentIndex > 0) {
      targetIndex = currentIndex - 1;
    } else if (direction === "down" && currentIndex < siblings.length - 1) {
      targetIndex = currentIndex + 1;
    }

    if (targetIndex !== -1) {
      const targetFolder = siblings[targetIndex];
      
      // Swap createdAt timestamps to swap visual display order
      const tempTime = folder.createdAt;
      const updatedFolder = { ...folder, createdAt: targetFolder.createdAt };
      const updatedTarget = { ...targetFolder, createdAt: tempTime };

      // Update local state
      setFolders(prev => prev.map(f => {
        if (f.id === folder.id) return updatedFolder;
        if (f.id === targetFolder.id) return updatedTarget;
        return f;
      }));

      // Update on database
      Promise.all([
        fetch("/api/folders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedFolder)
        }),
        fetch("/api/folders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedTarget)
        })
      ]).then(() => {
        showToast("Đã thay đổi vị trí thư mục thành công!", "success");
      }).catch(err => console.error("Error swapping folder positions:", err));
    }
  };

  const createFolder = () => {
    if (!newFolder.name.trim()) return;
    const folderType = newFolder.type || "question";
    
    if (editingFolderId) {
      // Editing an existing folder
      setFolders(prev => prev.map(f => {
        if (f.id === editingFolderId) {
          return {
            ...f,
            name: newFolder.name.trim(),
            parentId: newFolder.parentId,
            type: folderType
          };
        }
        return f;
      }));
      
      const folderToUpdate = folders.find(f => f.id === editingFolderId);
      if (folderToUpdate) {
        const updated = {
          ...folderToUpdate,
          name: newFolder.name.trim(),
          parentId: newFolder.parentId,
          type: folderType
        };
        fetch("/api/folders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updated)
        })
        .then(() => {
          showToast("Đã cập nhật thông tin thư mục thành công!", "success");
        })
        .catch(err => console.error("Error updating folder:", err));
      }
      
      setNewFolder({ name: "", parentId: undefined, type: "question" });
      setEditingFolderId(null);
      setIsFolderModalOpen(false);
      return;
    }

    const folder: Folder = {
      id: Date.now().toString(),
      name: newFolder.name.trim(),
      createdAt: new Date().toISOString(),
      teacherId: user?.role === "teacher" ? user.sbd : undefined,
      parentId: newFolder.parentId,
      type: folderType
    };
    setFolders(prev => [...prev, folder]);
    fetch("/api/folders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(folder)
    }).catch(err => console.error("Error creating folder:", err));
    setNewFolder({ name: "", parentId: undefined, type: "question" });
    setIsFolderModalOpen(false);
  };

  const createStudent = () => {
    if (!newStudent.name.trim() || !newStudent.sbd.trim()) return;
    const targetSbd = newStudent.sbd.trim();
    const student: Student = {
      id: targetSbd,
      name: newStudent.name.trim(),
      createdAt: new Date().toISOString(),
      teacherId: user?.role === "teacher" ? user.sbd : undefined,
      className: user?.role === "teacher" ? user.className : (newStudent.className?.trim() || undefined)
    };

    if (editingStudentId) {
      if (editingStudentId !== targetSbd) {
        // SBD changed: Delete the old student ID first
        setStudents(prev => prev.filter(s => s.id !== editingStudentId));
        fetch(`/api/students/${editingStudentId}`, { method: "DELETE" })
          .catch(err => console.error("Error deleting old student ID:", err));
      }

      setStudents(prev => {
        const filtered = prev.filter(s => s.id !== editingStudentId);
        return [...filtered, student];
      });
      showToast("Cập nhật thông tin thí sinh thành công!", "success");
    } else {
      setStudents(prev => {
        const filtered = prev.filter(s => s.id !== targetSbd);
        return [...filtered, student];
      });
      showToast("Đã thêm thí sinh mới thành công!", "success");
    }

    // Upsert student details to the server
    fetch("/api/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(student)
    }).catch(err => console.error("Error saving student:", err));

    setNewStudent({ name: "", sbd: "", className: "" });
    setEditingStudentId(null);
    setIsStudentModalOpen(false);
  };

  const handleBulkDeleteStudents = () => {
    if (selectedStudentIds.length === 0) return;
    showConfirm(
      "Xác nhận xóa nhiều thí sinh",
      `Bạn có chắc chắn muốn xóa đồng thời ${selectedStudentIds.length} thí sinh đã chọn khỏi danh sách lớp không? Thao tác này sẽ xóa vĩnh viễn khỏi hệ thống!`,
      () => {
        setStudents(prev => prev.filter(s => !selectedStudentIds.includes(s.id)));
        setSelectedStudentIds([]);
        fetch("/api/students/bulk-delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: selectedStudentIds })
        })
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              showToast(`Đã xóa thành công ${data.count} thí sinh khỏi hệ thống!`, "success");
            } else {
              showToast("Thao tác xóa gặp lỗi trên máy chủ!", "error");
            }
          })
          .catch(err => {
            console.error(err);
            showToast("Không kết nối được server để thực hiện xóa!", "error");
          });
      }
    );
  };

  const downloadExcelTemplate = () => {
    const sampleData = [
      { "Số báo danh": "SBD001", "Họ và tên": "Nguyễn Văn Anh", "Lớp": "12A1" },
      { "Số báo danh": "SBD002", "Họ và tên": "Trần Thị Bình", "Lớp": "12A1" },
      { "Số báo danh": "SBD003", "Họ và tên": "Lê Hoàng Chinh", "Lớp": "12A2" },
      { "Số báo danh": "SBD004", "Họ và tên": "Phạm Minh Đức", "Lớp": "12A3" }
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Danh sách thí sinh");
    XLSX.writeFile(workbook, "Mau_danh_sach_thi_sinh.xlsx");
    showToast("Đã tải xuống file Excel mẫu!", "success");
  };

  const exportResultsToExcel = () => {
    try {
      if (filteredResults.length === 0) {
        showToast("Không có dữ liệu kết quả nào khớp bộ lọc để xuất file!", "info");
        return;
      }

      const workbook = XLSX.utils.book_new();

      // 1. Sheet 1: Thống kê tổng hợp các Lớp
      const summaryHeader: any[][] = [
        ["BÁO CÁO THỐNG KÊ KẾT QUẢ ĐIỂM SỐ THEO LỚP"],
        [`Ngày xuất báo cáo: ${new Date().toLocaleString("vi-VN")}`],
        [`Bộ lọc lớp: ${resultsClassFilter === "ALL" ? "Tất cả các lớp" : "Lớp " + resultsClassFilter}`],
        [`Đợt thi / Phòng thi: ${resultsExamFilter === "ALL" ? "Tất cả các đợt" : resultsExamFilter}`],
        [], // Dòng trống phân cách
        [
          "STT", 
          "Lớp học", 
          "Số bài đã nộp", 
          "Điểm trung bình", 
          "Điểm cao nhất", 
          "Điểm thấp nhất", 
          "Đạt Giỏi (≥ 8.0)", 
          "Đạt Khá (6.5 - 7.9)", 
          "Đạt Trung Bình (5.0 - 6.4)", 
          "Đạt Yếu (< 5.0)"
        ]
      ];

      classStats.forEach((group, index) => {
        summaryHeader.push([
          index + 1,
          group.className,
          group.submissions.length,
          Math.round(group.average * 100) / 100,
          group.max,
          group.min,
          group.gioi,
          group.kha,
          group.tb,
          group.yeu
        ]);
      });

      const summaryWorksheet = XLSX.utils.aoa_to_sheet(summaryHeader);
      
      // Định dạng độ rộng cột cho Sheet 1
      summaryWorksheet["!cols"] = [
        { wch: 8 },   // STT
        { wch: 16 },  // Lớp học
        { wch: 16 },  // Số bài nộp
        { wch: 18 },  // TB lớp
        { wch: 16 },  // Điểm Max
        { wch: 16 },  // Điểm Min
        { wch: 20 },  // Giỏi
        { wch: 20 },  // Khá
        { wch: 22 },  // Trung bình
        { wch: 18 }   // Yếu
      ];

      XLSX.utils.book_append_sheet(workbook, summaryWorksheet, "Thống kê tổng hợp Lớp");

      // 2. Sheet 2: Danh sách chi tiết học lực của thí sinh
      const detailsHeader: any[][] = [
        ["DANH SÁCH BẢNG ĐIỂM CHI TIẾT TỪNG THÍ SINH"],
        [`Ngày xuất báo cáo: ${new Date().toLocaleString("vi-VN")}`],
        [`Lớp học: ${resultsClassFilter === "ALL" ? "Tất cả" : "Lớp " + resultsClassFilter}`],
        [`Đề thi / Phòng thi: ${resultsExamFilter === "ALL" ? "Tất cả phòng" : resultsExamFilter}`],
        [], // Dòng trống phân cách
        [
          "STT", 
          "Số báo danh (SBD)", 
          "Họ và tên thí sinh", 
          "Lớp quản lý", 
          "Đề thi / Phòng thi", 
          "Điểm Phần I", 
          "Điểm Phần II", 
          "Điểm Phần III", 
          "Tổng điểm cuối cùng", 
          "Thời gian nộp bài"
        ]
      ];

      filteredResults.forEach((res, index) => {
        const studentObj = students.find(s => s.id === res.studentId);
        detailsHeader.push([
          index + 1,
          res.studentId,
          res.studentName,
          studentObj?.className || "Tự do / Chung",
          res.examName || "Đợt thi tự do",
          res.part1Score !== undefined ? res.part1Score : "-",
          res.part2Score !== undefined ? res.part2Score : "-",
          res.part3Score !== undefined ? res.part3Score : "-",
          res.score,
          new Date(res.timestamp).toLocaleString("vi-VN")
        ]);
      });

      const detailsWorksheet = XLSX.utils.aoa_to_sheet(detailsHeader);
      
      // Định dạng độ rộng cột cho Sheet 2
      detailsWorksheet["!cols"] = [
        { wch: 8 },   // STT
        { wch: 18 },  // SBD
        { wch: 26 },  // Họ tên
        { wch: 16 },  // Lớp
        { wch: 32 },  // Phòng thi
        { wch: 16 },  // Phần I
        { wch: 16 },  // Phần II
        { wch: 16 },  // Phần III
        { wch: 20 },  // Tổng điểm
        { wch: 22 }   // Thời gian nộp
      ];

      XLSX.utils.book_append_sheet(workbook, detailsWorksheet, "Chi tiết điểm thí sinh");

      // Set filename based on current filters
      let filename = "Bao_cao_thong_ke_diem_so";
      if (resultsClassFilter !== "ALL") {
        filename += `_Lop_${resultsClassFilter}`;
      }
      if (resultsExamFilter !== "ALL") {
        filename += `_PhongThi_${resultsExamFilter}`;
      }
      filename += `_${new Date().toISOString().split("T")[0]}.xlsx`;

      XLSX.writeFile(workbook, filename);
      showToast(`Đã xuất báo cáo Excel thành công: ${filename}`, "success");
    } catch (error) {
      console.error("Lỗi khi xuất file Excel:", error);
      showToast("Gặp lỗi trong quá trình khởi tạo và tải file Excel!", "error");
    }
  };

  const handleExcelImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json: any[] = XLSX.utils.sheet_to_json(worksheet);

        if (!json || json.length === 0) {
          showToast("Tệp Excel trống hoặc không đúng định dạng!", "error");
          return;
        }

        const parsedStudents: Student[] = [];
        let errorCount = 0;

        for (const row of json) {
          const normalizedRow: any = {};
          Object.keys(row).forEach(key => {
            normalizedRow[String(key).trim().toLowerCase()] = row[key];
          });

          const rawSbd = normalizedRow["số báo danh"] || normalizedRow["sbd"] || normalizedRow["id"] || normalizedRow["mã số"] || normalizedRow["sỡ báo danh"];
          const rawName = normalizedRow["họ và tên"] || normalizedRow["họ tên"] || normalizedRow["tên"] || normalizedRow["name"] || normalizedRow["họ tên thí sinh"];
          const rawClass = normalizedRow["lớp"] || normalizedRow["class"] || normalizedRow["classname"] || normalizedRow["lớp quản lý"];

          if (rawSbd && rawName) {
            parsedStudents.push({
              id: String(rawSbd).trim(),
              name: String(rawName).trim(),
              createdAt: new Date().toISOString(),
              teacherId: user?.role === "teacher" ? user.sbd : undefined,
              className: rawClass ? String(rawClass).trim() : (user?.role === "teacher" ? user.className : undefined)
            });
          } else {
            errorCount++;
          }
        }

        if (parsedStudents.length === 0) {
          showToast("Không tìm thấy dữ liệu thí sinh hợp lệ (Phải có thông số 'Họ và tên' và 'Số báo danh').", "error");
          return;
        }

        setExcelPreviewStudents(parsedStudents);
        setExcelImportErrors(errorCount);
        showToast(`Đã đọc thành công ${parsedStudents.length} thí sinh từ file!`, "success");
      } catch (err) {
        console.error("Error reading Excel file:", err);
        showToast("Có lỗi xảy ra khi đọc file Excel!", "error");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const confirmExcelImport = () => {
    if (excelPreviewStudents.length === 0) return;

    const folderIdToSet = excelSelectedFolderId || undefined;
    const mappedStudents = excelPreviewStudents.map(s => ({
      ...s,
      folderId: folderIdToSet
    }));

    setStudents(prev => {
      const studentMap = new Map(prev.map(s => [s.id, s]));
      mappedStudents.forEach(s => {
        studentMap.set(s.id, s);
      });
      return Array.from(studentMap.values());
    });

    fetch("/api/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mappedStudents)
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          showToast(`Đã nhập thành công ${mappedStudents.length} thí sinh vào hệ thống!`, "success");
        } else {
          showToast("Có lỗi xảy ra khi lưu danh sách vào database!", "error");
        }
      })
      .catch(err => {
        console.error("Error committing Excel students:", err);
        showToast("Không thể kết nối tới máy chủ!", "error");
      });

    setIsExcelImportModalOpen(false);
    setExcelPreviewStudents([]);
    setExcelImportErrors(0);
    setExcelSelectedFolderId("");
  };

  const handleStartEditExamRoom = (room: ExamRoom) => {
    setEditingExamRoomId(room.id);
    setNewExam({
      name: room.name,
      duration: room.duration,
      code: room.code,
      startTime: room.startTime || "",
      endTime: room.endTime || "",
      questionIds: room.questionIds || [],
      part1Point: room.part1Point ?? 0.25,
      part2Point1: room.part2Point1 ?? 0.1,
      part2Point2: room.part2Point2 ?? 0.25,
      part2Point3: room.part2Point3 ?? 0.5,
      part2Point4: room.part2Point4 ?? 1.0,
      part3Point: room.part3Point ?? 0.5,
      allowReview: room.allowReview ?? true,
      isFree: room.isFree ?? false,
      shuffleQuestions: room.shuffleQuestions ?? false,
      shuffleAnswers: room.shuffleAnswers ?? false
    });
    setIsExamModalOpen(true);
  };

  const closeExamModal = () => {
    setIsExamModalOpen(false);
    setEditingExamRoomId(null);
    setNewExam({
      name: "", 
      duration: 45, 
      code: "", 
      startTime: "", 
      endTime: "", 
      questionIds: [],
      part1Point: 0.25,
      part2Point1: 0.1,
      part2Point2: 0.25,
      part2Point3: 0.5,
      part2Point4: 1.0,
      part3Point: 0.5,
      allowReview: true,
      isFree: false,
      shuffleQuestions: false,
      shuffleAnswers: false
    });
    setRandomSelectFolderId("ALL");
    setRandomSelectPart1Count(0);
    setRandomSelectPart2Count(0);
    setRandomSelectPart3Count(0);
  };

  const createExam = () => {
    if (!newExam.name.trim() || !newExam.code.trim()) return;
    const exam: ExamRoom = {
      id: editingExamRoomId || Date.now().toString(),
      name: newExam.name.trim(),
      code: newExam.code.trim().toUpperCase(),
      duration: newExam.duration || 45,
      startTime: newExam.startTime ? newExam.startTime : undefined,
      endTime: newExam.endTime ? newExam.endTime : undefined,
      isActive: editingExamRoomId 
        ? (examRooms.find(r => r.id === editingExamRoomId)?.isActive ?? true) 
        : true,
      questionIds: newExam.questionIds,
      part1Point: Number(newExam.part1Point) || 0.25,
      part2Point1: Number(newExam.part2Point1) || 0.1,
      part2Point2: Number(newExam.part2Point2) || 0.25,
      part2Point3: Number(newExam.part2Point3) || 0.5,
      part2Point4: Number(newExam.part2Point4) || 1.0,
      part3Point: Number(newExam.part3Point) || 0.5,
      allowReview: newExam.allowReview,
      teacherId: user?.role === "teacher" ? user.sbd : undefined,
      isFree: newExam.isFree,
      shuffleQuestions: newExam.shuffleQuestions,
      shuffleAnswers: newExam.shuffleAnswers
    };
    if (editingExamRoomId) {
      setExamRooms(prev => prev.map(r => r.id === editingExamRoomId ? exam : r));
    } else {
      setExamRooms(prev => [...prev, exam]);
    }
    fetch("/api/exam-rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(exam)
    }).then(() => {
      showToast(editingExamRoomId ? "Cập nhật phòng thi thành công!" : "Khởi tạo phòng thi thành công!", "success");
    }).catch(err => {
      console.error("Error creating exam room:", err);
      showToast("Có lỗi xảy ra khi lưu phòng thi!", "error");
    });
    setNewExam({
      name: "", 
      duration: 45, 
      code: "", 
      startTime: "", 
      endTime: "", 
      questionIds: [],
      part1Point: 0.25,
      part2Point1: 0.1,
      part2Point2: 0.25,
      part2Point3: 0.5,
      part2Point4: 1.0,
      part3Point: 0.5,
      allowReview: true,
      isFree: false,
      shuffleQuestions: false,
      shuffleAnswers: false
    });
    setEditingExamRoomId(null);
    // Reset random selection parameters on creation
    setRandomSelectFolderId("ALL");
    setRandomSelectPart1Count(0);
    setRandomSelectPart2Count(0);
    setRandomSelectPart3Count(0);
    setIsExamModalOpen(false);
  };

  const handleApplyRandomSelection = () => {
    // 1. Filter questions by folder (if randomSelectFolderId is not "ALL")
    let pool = visibleQuestions;
    if (randomSelectFolderId !== "ALL") {
      pool = pool.filter(q => q.folderId === randomSelectFolderId);
    }

    // 2. Separate pool by Parts
    const part1Questions = pool.filter(q => q.part === PartType.PART1);
    const part2Questions = pool.filter(q => q.part === PartType.PART2);
    const part3Questions = pool.filter(q => q.part === PartType.PART3);

    // Helpers to shuffle and pick N elements
    const shuffleAndPick = (arr: Question[], n: number): string[] => {
      const shuffled = [...arr].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, n).map(q => q.id);
    };

    const pickedPart1Ids = shuffleAndPick(part1Questions, randomSelectPart1Count);
    const pickedPart2Ids = shuffleAndPick(part2Questions, randomSelectPart2Count);
    const pickedPart3Ids = shuffleAndPick(part3Questions, randomSelectPart3Count);

    const allPickedIds = [...pickedPart1Ids, ...pickedPart2Ids, ...pickedPart3Ids];

    if (allPickedIds.length === 0) {
      showToast("Không tìm thấy câu hỏi phù hợp để chọn trong thư mục đề tài đã chỉ định!", "error");
      return;
    }

    setNewExam(prev => ({
      ...prev,
      questionIds: allPickedIds
    }));

    let successMsg = `Đã tự động chọn ngẫu nhiên ${allPickedIds.length} câu hỏi thành công! `;
    successMsg += `(Phần 1: ${pickedPart1Ids.length}/${randomSelectPart1Count}, `;
    successMsg += `Phần 2: ${pickedPart2Ids.length}/${randomSelectPart2Count}, `;
    successMsg += `Phần 3: ${pickedPart3Ids.length}/${randomSelectPart3Count})`;
    showToast(successMsg, "success");
  };

  const visibleFolders = useMemo(() => {
    let list = folders;
    if (user?.role === "teacher") {
      list = folders.filter(f => f.teacherId === user.sbd);
    }
    return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [folders, user]);

  const questionFolders = useMemo(() => {
    return visibleFolders.filter(f => !f.type || f.type === 'question');
  }, [visibleFolders]);

  const studentFolders = useMemo(() => {
    return visibleFolders.filter(f => f.type === 'student');
  }, [visibleFolders]);

  const visibleQuestions = useMemo(() => {
    if (user?.role === "teacher") {
      return questions.filter(q => q.teacherId === user.sbd);
    }
    return questions;
  }, [questions, user]);

  const filteredQuestions = useMemo(() => {
    return visibleQuestions.filter(q => {
      const matchSearch = q.question.toLowerCase().includes(searchQuery.toLowerCase());
      const matchPart = partFilter === "ALL" ? true : q.part === partFilter;
      const matchFolder = folderFilter === "ALL"
        ? true
        : folderFilter === "NONE"
          ? !q.folderId
          : q.folderId === folderFilter;
      return matchSearch && matchPart && matchFolder;
    });
  }, [visibleQuestions, searchQuery, partFilter, folderFilter]);

  const visibleStudents = useMemo(() => {
    if (user?.role === "teacher") {
      return students.filter(s => s.teacherId === user.sbd || (s.className && s.className.toLowerCase() === user.className?.toLowerCase()));
    }
    return students;
  }, [students, user]);

  const filteredStudents = useMemo(() => {
    return visibleStudents.filter(s => {
      if (studentFolderFilter === "ALL") return true;
      if (studentFolderFilter === "NONE") return !s.folderId;
      return s.folderId === studentFolderFilter;
    });
  }, [visibleStudents, studentFolderFilter]);

  const visibleResults = useMemo(() => {
    if (user?.role === "teacher") {
      const classStudentIds = new Set(visibleStudents.map(s => s.id));
      return results.filter(r => classStudentIds.has(r.studentId));
    }
    return results;
  }, [results, visibleStudents, user]);

  const classStats = useMemo(() => {
    const classGroups: Record<string, {
      className: string;
      submissions: typeof visibleResults;
      totalScore: number;
      average: number;
      max: number;
      min: number;
      gioi: number;
      kha: number;
      tb: number;
      yeu: number;
    }> = {};

    visibleResults.forEach(r => {
      const student = students.find(s => s.id === r.studentId);
      const clsName = student?.className?.trim() || "Tự do";
      
      if (!classGroups[clsName]) {
        classGroups[clsName] = {
          className: clsName,
          submissions: [],
          totalScore: 0,
          average: 0,
          max: -1,
          min: 11,
          gioi: 0,
          kha: 0,
          tb: 0,
          yeu: 0,
        };
      }

      const group = classGroups[clsName];
      group.submissions.push(r);
      group.totalScore += r.score;
      if (r.score > group.max) group.max = r.score;
      if (r.score < group.min) group.min = r.score;

      if (r.score >= 8.0) {
        group.gioi++;
      } else if (r.score >= 6.5) {
        group.kha++;
      } else if (r.score >= 5.0) {
        group.tb++;
      } else {
        group.yeu++;
      }
    });

    return Object.values(classGroups).map(group => {
      return {
        ...group,
        average: group.submissions.length > 0 ? (group.totalScore / group.submissions.length) : 0,
        min: group.min === 11 ? 0 : group.min,
        max: group.max === -1 ? 0 : group.max,
      };
    }).sort((a, b) => a.className.localeCompare(b.className));
  }, [visibleResults, students]);

  const filteredResults = useMemo(() => {
    return visibleResults.filter(r => {
      if (resultsClassFilter !== "ALL") {
        const student = students.find(s => s.id === r.studentId);
        const clsName = student?.className?.trim() || "Tự do";
        if (clsName !== resultsClassFilter) return false;
      }
      if (resultsExamFilter !== "ALL") {
        if (r.examId !== resultsExamFilter) return false;
      }
      return true;
    });
  }, [visibleResults, students, resultsClassFilter, resultsExamFilter]);

  const visibleExams = useMemo(() => {
    if (user?.role === "teacher") {
      return examRooms.filter(r => r.teacherId === user.sbd);
    }
    return examRooms;
  }, [examRooms, user]);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar navigation */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col sticky top-0 h-screen">
        <div className="p-6 border-b border-gray-150 flex items-center gap-2.5">
          <div className="p-1.5 bg-indigo-600 text-white rounded-lg">
            <Shield size={22} />
          </div>
          <span className="text-lg font-black tracking-tight text-gray-900">Giáo Viên Portal</span>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {[
            { id: "dashboard", label: "Bảng tổng quan", icon: LayoutDashboard },
            { id: "folders", label: "Thư mục chủ đề", icon: FolderIcon },
            { id: "questions", label: "Dữ liệu câu hỏi", icon: FileText },
            { id: "students", label: "Quản lý thí sinh", icon: Users },
            { id: "exams", label: "Kế hoạch phòng thi", icon: Play },
            { id: "results", label: "Kết quả chấm bài", icon: Award },
            ...(user?.role === "admin" ? [{ id: "teachers", label: "Quản lý Giáo viên", icon: Briefcase }] : [])
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all",
                activeTab === item.id 
                  ? "bg-indigo-50 text-indigo-700" 
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-150">
          <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors">
            <LogOut size={18} />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main admin view */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">
              {activeTab === "dashboard" && "Tổng Quan Hệ Thống"}
              {activeTab === "folders" && "Quản Lý Thư Mục Chủ Đề"}
              {activeTab === "questions" && "Ngân Hàng Câu Hỏi"}
              {activeTab === "students" && "Danh Sách Thí Sinh Bộc Lộ"}
              {activeTab === "exams" && "Quản Lý Đợt Kiểm Tra"}
              {activeTab === "results" && "Lượt Hoàn Thành & Kết Quả"}
            </h2>
            <p className="text-gray-500 text-xs mt-0.5">Quản lý và thiết lập hệ thống chấm thi tự động của lớp học.</p>
          </div>
          
          <div className="flex gap-3">
            {activeTab === "questions" && (
              <>
                <button 
                  onClick={() => setIsManualQuestionModalOpen(true)} 
                  className="bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center gap-1.5 hover:bg-indigo-700 font-bold text-sm transition-colors shadow-sm"
                >
                  <Plus size={16} /> Thêm thủ công
                </button>
                <button 
                  onClick={() => setIsWordImportModalOpen(true)} 
                  className="bg-emerald-600 text-white px-4 py-2 rounded-xl flex items-center gap-1.5 hover:bg-emerald-700 font-bold text-sm transition-colors shadow-sm"
                >
                  <Upload size={16} /> Nhập từ file Word
                </button>
              </>
            )}
            {activeTab === "folders" && (
              <button onClick={() => setIsFolderModalOpen(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center gap-1.5 hover:bg-indigo-700 font-bold text-sm transition-colors shadow-sm">
                <Plus size={16} /> Thêm thư mục
              </button>
            )}
            {activeTab === "students" && (
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    setNewFolder({ name: "", parentId: undefined, type: "student" });
                    setIsFolderModalOpen(true);
                  }}
                  className="bg-amber-600 text-white px-4 py-2 rounded-xl flex items-center gap-1.5 hover:bg-amber-700 font-bold text-sm transition-colors shadow-sm cursor-pointer"
                >
                  <FolderIcon size={16} /> Thêm thư mục lớp
                </button>
                <button 
                  onClick={() => {
                    setEditingStudentId(null);
                    setNewStudent({ name: "", sbd: "", className: "" });
                    setIsStudentModalOpen(true);
                  }} 
                  className="bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center gap-1.5 hover:bg-indigo-700 font-bold text-sm transition-colors shadow-sm cursor-pointer"
                >
                  <Plus size={16} /> Thêm thủ công
                </button>
                <button 
                  onClick={() => {
                    setExcelPreviewStudents([]);
                    setExcelImportErrors(0);
                    setIsExcelImportModalOpen(true);
                  }} 
                  className="bg-emerald-600 text-white px-4 py-2 rounded-xl flex items-center gap-1.5 hover:bg-emerald-700 font-bold text-sm transition-colors shadow-sm cursor-pointer"
                >
                  <Upload size={16} /> Nhập từ Excel
                </button>
              </div>
            )}
            {activeTab === "exams" && (
              <button 
                onClick={() => {
                  setEditingExamRoomId(null);
                  setNewExam({
                    name: "", 
                    duration: 45, 
                    code: "", 
                    startTime: "", 
                    endTime: "", 
                    questionIds: [],
                    part1Point: 0.25,
                    part2Point1: 0.1,
                    part2Point2: 0.25,
                    part2Point3: 0.5,
                    part2Point4: 1.0,
                    part3Point: 0.5,
                    allowReview: true,
                    isFree: false,
                    shuffleQuestions: false,
                    shuffleAnswers: false
                  });
                  setIsExamModalOpen(true);
                }} 
                className="bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center gap-1.5 hover:bg-indigo-700 font-bold text-sm transition-colors shadow-sm"
              >
                <Plus size={16} /> Tạo phòng thi
              </button>
            )}
          </div>
        </div>

        {activeTab === "dashboard" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-150">
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Tổng số câu hỏi</p>
                <p className="text-3xl font-mono font-black text-gray-900 mt-2">{visibleQuestions.length}</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-150">
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Thí sinh đã khai báo</p>
                <p className="text-3xl font-mono font-black text-indigo-650 mt-2">{visibleStudents.length}</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-150">
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Phòng thi đang hoạt động</p>
                <p className="text-3xl font-mono font-black text-green-600 mt-2">{visibleExams.filter(r => r.isActive).length}</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-150">
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Lượt thi hoàn thành</p>
                <p className="text-3xl font-mono font-black text-violet-650 mt-2">{visibleResults.length}</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-150">
              <h3 className="font-bold text-gray-900 mb-2 text-sm">Hướng dẫn triển khai kiểm tra trực tuyến:</h3>
              <div className="text-xs text-gray-650 space-y-2 leading-relaxed">
                <p>1. <strong>Bước 1</strong>: Cấu hình danh sách thí sinh được phép tham gia kiểm tra trong tab <strong>Quản lý thí sinh</strong>.</p>
                <p>2. <strong>Bước 2</strong>: Chẩn đoán hoặc tạo lập <strong>Ngân hàng câu hỏi</strong> theo đúng Part 1, 2, 3 chuẩn thi quốc gia mới nhất.</p>
                <p>3. <strong>Bước 3</strong>: Vào phần <strong>Quản lý đợt kiểm tra</strong>, nhấn "Tạo phòng thi", thiết lập mã code (ví dụ: TOAN12) và lựa chọn câu hỏi phù hợp.</p>
                <p>4. <strong>Bước 4</strong>: Cung cấp mã code này cho học sinh để các em tự nhập từ màn hình của thí sinh.</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "folders" && (() => {
          const topLevelFolders = questionFolders.filter(f => !f.parentId || !questionFolders.some(p => p.id === f.parentId));
          const renderFolderNode = (folder: Folder, depth = 0) => {
            const children = questionFolders.filter(f => f.parentId === folder.id);
            const hasChildren = children.length > 0;
            const isExpanded = expandedFolderIds[folder.id] ?? true; // Default to expanded
            
            const directQuestionCount = visibleQuestions.filter(q => q.folderId === folder.id).length;
            const totalQuestionCount = getFolderQuestionCount(folder.id);
            const siblings = questionFolders
              .filter(f => f.parentId === folder.parentId)
              .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
            const siblingIndex = siblings.findIndex(s => s.id === folder.id);
            const canGoUp = siblingIndex > 0;
            const canGoDown = siblingIndex < siblings.length - 1 && siblingIndex !== -1;

            return (
              <div key={folder.id} className="space-y-2">
                {/* Folder Row */}
                <div 
                  className={cn(
                    "group bg-white p-3.5 rounded-xl border border-gray-150 flex items-center justify-between gap-3 transition-all hover:bg-gray-50/50 hover:shadow-2xs",
                    depth > 0 && "relative"
                  )}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {hasChildren ? (
                      <button 
                        onClick={() => toggleFolderExpanded(folder.id)}
                        className="p-1 hover:bg-gray-150 rounded text-gray-500 cursor-pointer focus:outline-hidden transition-transform duration-200"
                        style={{ transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)" }}
                      >
                        <ChevronRight size={14} />
                      </button>
                    ) : (
                      <div className="w-6 shrink-0" />
                    )}
                    
                    <FolderIcon className="text-amber-500 fill-amber-500/10 shrink-0" size={18} />
                    
                    <div className="flex-1 min-w-0">
                      <span className="font-bold text-gray-900 text-xs sm:text-sm truncate block">{folder.name}</span>
                      <span className="text-[10px] text-gray-500 flex flex-wrap items-center gap-1.5 mt-0.5 font-semibold">
                        <span>{directQuestionCount} câu hỏi trực tiếp</span>
                        {totalQuestionCount > directQuestionCount && (
                          <>
                            <span className="text-gray-300">•</span>
                            <span className="text-indigo-650 bg-indigo-50/70 px-1 rounded-md">{totalQuestionCount} tổng cộng (gồm mục con)</span>
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 bg-gray-50 px-1.5 py-0.5 rounded-lg border border-gray-100 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity whitespace-nowrap">
                    {/* Move Up */}
                    <button
                      onClick={() => moveFolder(folder.id, "up")}
                      disabled={!canGoUp}
                      title={canGoUp ? "Di chuyển lên phía trên" : "Đã ở vị trí đầu tiên"}
                      className={cn(
                        "p-1 rounded cursor-pointer transition-colors",
                        canGoUp ? "text-amber-600 hover:bg-amber-100 hover:text-amber-700" : "text-gray-300 cursor-not-allowed"
                      )}
                    >
                      <ChevronUp size={14} />
                    </button>

                    {/* Move Down */}
                    <button
                      onClick={() => moveFolder(folder.id, "down")}
                      disabled={!canGoDown}
                      title={canGoDown ? "Di chuyển xuống phía dưới" : "Đã ở vị trí cuối cùng"}
                      className={cn(
                        "p-1 rounded cursor-pointer transition-colors",
                        canGoDown ? "text-amber-600 hover:bg-amber-100 hover:text-amber-700" : "text-gray-300 cursor-not-allowed"
                      )}
                    >
                      <ChevronDown size={14} />
                    </button>

                    {/* Edit Name & Parent */}
                    <button
                      onClick={() => {
                        setNewFolder({ name: folder.name, parentId: folder.parentId, type: "question" });
                        setEditingFolderId(folder.id);
                        setIsFolderModalOpen(true);
                      }}
                      title="Chỉnh sửa tên & đổi thư mục cha"
                      className="p-1 text-blue-600 hover:bg-blue-100 rounded cursor-pointer transition-colors"
                    >
                      <Edit size={14} />
                    </button>

                    {/* Add Subfolder */}
                    <button
                      onClick={() => {
                        setNewFolder({ name: "", parentId: folder.id, type: "question" });
                        setIsFolderModalOpen(true);
                      }}
                      title="Thêm thư mục con"
                      className="p-1 text-indigo-650 hover:bg-indigo-100 rounded cursor-pointer transition-colors"
                    >
                      <Plus size={14} />
                    </button>
                    <button 
                      onClick={() => {
                        showConfirm(
                          "Xóa thư mục / chủ đề",
                          `Bạn có chắc chắn muốn xóa thư mục "${folder.name}" không? Thao tác này chỉ xóa danh mục, các câu hỏi bên trong vẫn được giữ lại và chuyển về trạng thái không phân loại.`,
                          () => {
                            setFolders(prev => prev.filter(f => f.id !== folder.id).map(f => {
                              if (f.parentId === folder.id) {
                                return { ...f, parentId: undefined };
                              }
                              return f;
                            }));
                            fetch(`/api/folders/${folder.id}`, { method: "DELETE" }).catch(err => console.error(err));
                            showToast("Đã xóa thư mục thành công!", "success");
                          }
                        );
                      }} 
                      title="Xóa thư mục này"
                      className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded cursor-pointer transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                {/* Subfolders Block */}
                {hasChildren && isExpanded && (
                  <div className="pl-4 sm:pl-6 border-l border-dashed border-gray-200 space-y-2 mt-2">
                    {children.map(child => renderFolderNode(child, depth + 1))}
                  </div>
                )}
              </div>
            );
          };
          return (
            <div className="space-y-6">
              {questionFolders.length === 0 ? (
                <div className="text-center bg-white p-12 border border-gray-200 rounded-2xl">
                  <FolderIcon className="mx-auto text-gray-300 mb-3" size={48} />
                  <p className="text-sm font-semibold text-gray-600">Chưa khai báo chủ đề/thư mục nào</p>
                  <p className="text-xs text-gray-400 mt-1">Sử dụng nút "Thêm thư mục" ở góc phải để phân loại ngân hàng câu hỏi của bạn.</p>
                </div>
              ) : (
                <div className="bg-gray-50/30 border border-gray-150 p-4 sm:p-6 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-black uppercase text-gray-400 tracking-wider">Cấu trúc thư mục chủ đề</p>
                    <span className="text-[10px] text-gray-500 font-bold bg-white border border-gray-150 px-2 py-0.5 rounded-full">
                      {questionFolders.length} danh mục
                    </span>
                  </div>
                  <div className="space-y-3">
                    {topLevelFolders.map(folder => renderFolderNode(folder))}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {activeTab === "questions" && (() => {
          const areAllFilteredSelected = filteredQuestions.length > 0 && filteredQuestions.every(q => selectedQuestionIds.includes(q.id));
          const areSomeFilteredSelected = filteredQuestions.some(q => selectedQuestionIds.includes(q.id)) && !areAllFilteredSelected;
          
          return (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-xl border border-gray-150 flex flex-col md:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                  <input 
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm kiếm nội dung câu hỏi trong ngân hàng..."
                    className="w-full pl-9 pr-4 py-1.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <select 
                    value={partFilter}
                    onChange={(e) => setPartFilter(e.target.value as any)}
                    className="px-3 py-1.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 bg-white font-semibold"
                  >
                    <option value="ALL">Toàn bộ phần</option>
                    <option value={PartType.PART1}>Phần I</option>
                    <option value={PartType.PART2}>Phần II</option>
                    <option value={PartType.PART3}>Phần III</option>
                  </select>

                  <select 
                    value={folderFilter}
                    onChange={(e) => setFolderFilter(e.target.value)}
                    className="px-3 py-1.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 bg-white font-semibold min-w-[200px] max-w-xs"
                  >
                    <option value="ALL">Toàn bộ thư mục chủ đề</option>
                    <option value="NONE">[ Không thuộc thư mục ]</option>
                    {getFolderDropdownList(questionFolders).map(f => (
                      <option key={f.id} value={f.id}>
                        {"\u00A0\u00A0".repeat(f.level * 2)}{f.level > 0 ? "↳ " : ""}📁 {f.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedQuestionIds.length > 0 && (
                <div className="bg-rose-50 border border-rose-150 p-3.5 rounded-xl flex items-center justify-between animate-fadeIn text-sm">
                  <div className="flex items-center gap-2 text-rose-800 font-semibold">
                    <AlertCircle size={16} className="text-rose-600" />
                    <span>Đã chọn <strong className="text-rose-700 bg-rose-200/50 px-2 py-0.5 rounded-md">{selectedQuestionIds.length}</strong> câu hỏi</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedQuestionIds([])}
                      className="px-3 py-1.5 bg-white border border-gray-200 text-gray-650 rounded-lg hover:bg-gray-50 flex items-center gap-1 font-semibold text-xs transition-colors cursor-pointer"
                    >
                      Hủy chọn
                    </button>
                    <button
                      onClick={handleBulkDelete}
                      className="px-3 py-1.5 bg-rose-650 hover:bg-rose-700 text-white rounded-lg flex items-center gap-1 font-bold text-xs transition-colors shadow-sm cursor-pointer"
                    >
                      <Trash2 size={14} /> Xóa đồng thời ({selectedQuestionIds.length}) câu hỏi
                    </button>
                  </div>
                </div>
              )}

              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3.5 text-center w-12">
                        <input 
                          type="checkbox"
                          checked={areAllFilteredSelected}
                          ref={(el) => {
                            if (el) {
                              el.indeterminate = areSomeFilteredSelected;
                            }
                          }}
                          onChange={(e) => {
                            if (e.target.checked) {
                              const toAdd = filteredQuestions.map(q => q.id);
                              setSelectedQuestionIds(prev => Array.from(new Set([...prev, ...toAdd])));
                            } else {
                              const toRemove = new Set(filteredQuestions.map(q => q.id));
                              setSelectedQuestionIds(prev => prev.filter(id => !toRemove.has(id)));
                            }
                          }}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                        />
                      </th>
                      <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase w-28">Phần</th>
                      <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase">Nội dung câu hỏi đề thi</th>
                      <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase">Thư mục</th>
                      <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase">Đáp án chuẩn</th>
                      <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase text-right w-40">Lệnh</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-150 divide-solid text-sm">
                    {filteredQuestions.map(q => (
                      <tr key={q.id} className={cn("hover:bg-gray-50/50 transition-colors", selectedQuestionIds.includes(q.id) && "bg-indigo-50/20")}>
                        <td className="px-6 py-4 text-center w-12">
                          <input 
                            type="checkbox" 
                            checked={selectedQuestionIds.includes(q.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedQuestionIds(prev => [...prev, q.id]);
                              } else {
                                setSelectedQuestionIds(prev => prev.filter(id => id !== q.id));
                              }
                            }}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-bold rounded-md whitespace-nowrap">
                            Phần {q.part}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-800 break-words max-w-lg select-text">
                          <SafeHtmlRenderer html={q.question} className="text-sm leading-relaxed" />
                        </td>
                        <td className="px-6 py-4">
                          {q.folderId ? (
                            <span className="px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold rounded-lg inline-block whitespace-nowrap max-w-[150px] truncate" title={folders.find(f => f.id === q.folderId)?.name || "Thư mục"}>
                              📁 {folders.find(f => f.id === q.folderId)?.name || "Thư mục"}
                            </span>
                          ) : (
                            <span className="text-gray-450 text-xs italic">Không có</span>
                          )}
                        </td>
                        <td className="px-6 py-4 font-semibold text-xs text-gray-650 max-w-xs break-words">
                          {typeof q.answer === 'object' && q.answer !== null ? (
                            <span className="space-y-0.5 block">
                              {Object.entries(q.answer).map(([k, v]) => (
                                <span key={k} className="inline-block mr-2 font-mono">
                                  {k.toLowerCase()}: <span className={v ? "text-emerald-600 font-bold" : "text-rose-600 font-bold"}>{v ? "Đúng" : "Sai"}</span>
                                </span>
                              ))}
                            </span>
                          ) : (
                            <span className="font-mono text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded font-bold">{q.answer?.toString()}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-1.5">
                            <button 
                              onClick={() => handleStartEditQuestion(q)}
                              className="text-indigo-605 bg-indigo-50 border border-indigo-150 text-indigo-700 px-2.5 py-1 rounded-xl transition-all text-xs font-bold hover:bg-indigo-100 flex items-center gap-1 cursor-pointer"
                            >
                              <Edit size={13} /> Sửa
                            </button>
                            <button 
                              onClick={() => {
                                showConfirm(
                                  "Xác nhận xóa câu hỏi",
                                  "Bạn có chắc chắn muốn xóa câu hỏi này khỏi ngân hàng không? Thao tác này sẽ cập nhật trực tiếp cơ sở dữ liệu và không thể khôi phục!",
                                  () => {
                                    setQuestions(prev => prev.filter(item => item.id !== q.id));
                                    setSelectedQuestionIds(prev => prev.filter(id => id !== q.id));
                                    fetch(`/api/questions/${q.id}`, { method: "DELETE" }).catch(err => console.error(err));
                                    showToast("Đã xóa câu hỏi khỏi ngân hàng!", "success");
                                  }
                                );
                              }}
                              className="text-red-650 bg-red-50 border border-red-150 text-red-700 px-2.5 py-1 rounded-xl transition-all text-xs font-bold hover:bg-red-100 flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 size={13} /> Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredQuestions.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-gray-400 text-xs">
                          Không tìm thấy câu hỏi nào thỏa mãn tham số tìm kiếm.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}

        {activeTab === "students" && (() => {
          const areAllFilteredSelected = filteredStudents.length > 0 && filteredStudents.every(s => selectedStudentIds.includes(s.id));
          const areSomeFilteredSelected = filteredStudents.some(s => selectedStudentIds.includes(s.id)) && !areAllFilteredSelected;

          return (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-150">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-400 uppercase">Thư mục quản lý:</span>
                  <select 
                    value={studentFolderFilter}
                    onChange={(e) => {
                      setStudentFolderFilter(e.target.value);
                      setSelectedStudentIds([]);
                    }}
                    className="px-3 py-1.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 bg-white font-semibold min-w-[200px]"
                  >
                    <option value="ALL">Tất cả thư mục lớp học</option>
                    <option value="NONE">[ Chưa phân thư mục ]</option>
                    {getFolderDropdownList(studentFolders).map(f => (
                      <option key={f.id} value={f.id}>
                        {"\u00A0\u00A0".repeat(f.level * 2)}{f.level > 0 ? "↳ " : ""}📁 {f.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedStudentIds.length > 0 && (
                <div className="bg-rose-50 border border-rose-150 p-3.5 rounded-xl flex items-center justify-between animate-fadeIn text-sm">
                  <div className="flex items-center gap-2 text-rose-800 font-semibold text-left">
                    <AlertCircle size={16} className="text-rose-600" />
                    <span>Đã chọn <strong className="text-rose-700 bg-rose-200/50 px-2 py-0.5 rounded-md">{selectedStudentIds.length}</strong> thí sinh</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedStudentIds([])}
                      className="px-3 py-1.5 bg-white border border-gray-200 text-gray-650 rounded-lg hover:bg-gray-50 flex items-center gap-1 font-semibold text-xs transition-colors cursor-pointer"
                    >
                      Hủy chọn
                    </button>
                    <button
                      onClick={handleBulkDeleteStudents}
                      className="px-3 py-1.5 bg-rose-650 hover:bg-rose-700 text-white rounded-lg flex items-center gap-1 font-bold text-xs transition-colors shadow-sm cursor-pointer"
                    >
                      <Trash2 size={14} /> Xóa đồng thời ({selectedStudentIds.length}) thí sinh
                    </button>
                  </div>
                </div>
              )}

              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3.5 text-center w-12">
                        <input 
                          type="checkbox"
                          checked={areAllFilteredSelected}
                          ref={(el) => {
                            if (el) {
                              el.indeterminate = areSomeFilteredSelected;
                            }
                          }}
                          onChange={(e) => {
                            if (e.target.checked) {
                              const toAdd = filteredStudents.map(s => s.id);
                              setSelectedStudentIds(prev => Array.from(new Set([...prev, ...toAdd])));
                            } else {
                              const toRemove = new Set(filteredStudents.map(s => s.id));
                              setSelectedStudentIds(prev => prev.filter(id => !toRemove.has(id)));
                            }
                          }}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                        />
                      </th>
                      <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase">Số báo danh</th>
                      <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase">Họ và tên thí sinh</th>
                      <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase">Lớp và Thư mục</th>
                      <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase">Ngày thêm vào danh sách</th>
                      <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 text-sm">
                    {filteredStudents.map(student => (
                      <tr 
                        key={student.id} 
                        className={cn(
                          "hover:bg-gray-50 transition-colors", 
                          selectedStudentIds.includes(student.id) && "bg-indigo-50/20"
                        )}
                      >
                        <td className="px-6 py-4 text-center w-12">
                          <input 
                            type="checkbox" 
                            checked={selectedStudentIds.includes(student.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedStudentIds(prev => [...prev, student.id]);
                              } else {
                                setSelectedStudentIds(prev => prev.filter(id => id !== student.id));
                              }
                            }}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                          />
                        </td>
                        <td className="px-6 py-4 font-mono font-bold text-indigo-600">{student.id}</td>
                        <td className="px-6 py-4 font-semibold text-gray-800">{student.name}</td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-indigo-50 text-indigo-700 uppercase">
                            {student.className || "Tự do / Chung"}
                          </span>
                          {(() => {
                            const sFolder = folders.find(f => f.id === student.folderId);
                            return sFolder ? (
                              <span className="ml-2 px-2 py-0.5 text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 rounded-md inline-flex items-center gap-0.5">
                                📁 {sFolder.name}
                              </span>
                            ) : null;
                          })()}
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-500">{new Date(student.createdAt).toLocaleDateString('vi-VN')}</td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <div className="flex justify-end items-center gap-3">
                            <button 
                              onClick={() => {
                                setEditingStudentId(student.id);
                                setNewStudent({
                                  name: student.name,
                                  sbd: student.id,
                                  className: student.className || ""
                                });
                                setIsStudentModalOpen(true);
                              }} 
                              className="text-indigo-600 hover:text-indigo-800 hover:underline text-xs font-bold cursor-pointer inline-flex items-center gap-1 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100 transition-colors"
                            >
                              <Edit3 size={11} /> Sửa
                            </button>
                            <button 
                              onClick={() => {
                                showConfirm(
                                  "Xóa thí sinh",
                                  `Bạn có chắc chắn muốn xóa thí sinh "${student.name}" (SBD: ${student.id}) khỏi danh sách lớp không?`,
                                  () => {
                                    setStudents(prev => prev.filter(s => s.id !== student.id));
                                    setSelectedStudentIds(prev => prev.filter(id => id !== student.id));
                                    fetch(`/api/students/${student.id}`, { method: "DELETE" }).catch(err => console.error(err));
                                    showToast("Đã xóa thí sinh thành công!", "success");
                                  }
                                );
                              }} 
                              className="text-red-600 hover:text-red-800 hover:underline text-xs font-bold cursor-pointer inline-flex items-center gap-1 bg-red-50 px-2.5 py-1 rounded-lg border border-red-100 transition-colors"
                            >
                              <Trash2 size={11} /> Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredStudents.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-gray-400 text-xs">
                          Không có thí sinh nào trong thư mục lựa chọn. Vui lòng bấm "Thêm thí sinh" để bắt đầu thiết lập.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}

        {activeTab === "exams" && (
          <div className="space-y-6">
            {visibleExams.length === 0 ? (
              <div className="text-center bg-white p-12 border border-gray-200 rounded-2xl">
                <Play className="mx-auto text-gray-300 mb-3" size={48} />
                <p className="text-sm font-semibold text-gray-600">Chưa cấu hình phòng thi</p>
                <p className="text-xs text-gray-400 mt-1">Giáo viên cần "Tạo phòng thi mới" để thí sinh có thể dùng mã gia nhập.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {visibleExams.map(room => (
                  <div key={room.id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-base font-bold text-gray-900">{room.name}</h3>
                          <span className="text-xs text-indigo-650 font-mono font-bold bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">Mã khóa: {room.code}</span>
                        </div>
                        <span className={cn(
                          "px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                          room.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                        )}>
                          {room.isActive ? "Đang mở" : "Đã đóng"}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                          <p className="text-[10px] text-gray-400 uppercase font-black tracking-wide">Thời lượng</p>
                          <p className="font-bold text-xs">{room.duration} phút</p>
                        </div>
                        <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                          <p className="text-[10px] text-gray-400 uppercase font-black tracking-wide">Số câu hỏi</p>
                          <p className="font-bold text-xs">{room.questionIds.length} câu</p>
                        </div>
                      </div>

                      {/* Phân bổ điểm chi tiết */}
                      <div className="mb-4 p-3 bg-fuchsia-50/40 rounded-xl border border-fuchsia-100/50 text-[11px] space-y-1">
                        <p className="font-extrabold text-fuchsia-800 uppercase text-[9px] tracking-wide mb-1 flex items-center gap-1">
                          <Settings size={10} className="text-fuchsia-600 animate-spin-slow" /> Cấu hình thang điểm:
                        </p>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Phần I (Trắc nghiệm):</span>
                          <span className="font-bold text-gray-700 font-mono">+{room.part1Point ?? 0.25} đ/câu</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Phần II (Đúng 1/2/3/4 ý):</span>
                          <span className="font-bold text-gray-700 font-mono">
                            +{room.part2Point1 ?? 0.1} / +{room.part2Point2 ?? 0.25} / +{room.part2Point3 ?? 0.5} / +{room.part2Point4 ?? 1.0} đ
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Phần III (Trả lời ngắn):</span>
                          <span className="font-bold text-gray-700 font-mono">+{room.part3Point ?? 0.5} đ/câu</span>
                        </div>
                      </div>

                      <div className="mb-4 flex items-center justify-between text-xs p-2.5 rounded-xl border border-gray-150 bg-gray-50/50">
                        <span className="text-gray-500 font-medium text-[11px]">Xem lại đáp án & tải về:</span>
                        <span className={cn(
                          "px-2 py-0.5 rounded-lg text-[10px] font-black uppercase text-center",
                          (room.allowReview ?? true) ? "bg-indigo-50 text-indigo-700 border border-indigo-200" : "bg-amber-50 text-amber-700 border border-amber-200"
                        )}>
                          {(room.allowReview ?? true) ? "Cho phép" : "Không"}
                        </span>
                      </div>
                      {(room.startTime || room.endTime) && (
                        <div className="mb-4 p-3 bg-indigo-50/30 rounded-xl border border-indigo-100/50 text-xs space-y-1.5">
                          {room.startTime && (
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-gray-400 text-[10px] uppercase">Bắt đầu:</span>
                              <span className="font-mono text-gray-700 bg-white px-2 py-0.5 rounded-md border border-gray-150 font-semibold">{new Date(room.startTime).toLocaleString('vi-VN')}</span>
                            </div>
                          )}
                          {room.endTime && (
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-gray-400 text-[10px] uppercase">Kết thúc:</span>
                              <span className="font-mono text-rose-650 bg-white px-2 py-0.5 rounded-md border border-gray-150 font-semibold">{new Date(room.endTime).toLocaleString('vi-VN')}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 pt-4 border-t border-gray-100">
                      <button 
                        onClick={() => {
                          const updatedActive = !room.isActive;
                          setExamRooms(prev => prev.map(r => r.id === room.id ? { ...r, isActive: updatedActive } : r));
                          fetch("/api/exam-rooms", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ ...room, isActive: updatedActive })
                          }).catch(err => console.error(err));
                        }}
                        className={cn(
                          "flex-1 py-2 rounded-xl text-xs font-bold transition-all",
                          room.isActive ? "bg-gray-150 text-gray-700 hover:bg-gray-200" : "bg-green-600 text-white hover:bg-green-700 shadow-sm shadow-green-100"
                        )}
                      >
                        {room.isActive ? "Đóng phòng" : "Kích hoạt mở"}
                      </button>
                      <button 
                        onClick={() => handleStartEditExamRoom(room)}
                        className="px-3 py-2 text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 rounded-xl transition-all font-bold text-xs flex items-center gap-1 cursor-pointer"
                        title="Chỉnh sửa phòng thi"
                      >
                        <Edit size={16} />
                        <span>Sửa</span>
                      </button>
                      <button 
                        onClick={() => {
                          showConfirm(
                            "Xóa đề thi / phòng thi",
                            `Bạn có chắc chắn muốn xóa đề thi / phòng thi "${room.name}" (Mã phòng: ${room.id}) này không? Thao tác này sẽ xóa vĩnh viễn cấu hình phòng thi hiện tại.`,
                            () => {
                              setExamRooms(prev => prev.filter(r => r.id !== room.id));
                              fetch(`/api/exam-rooms/${room.id}`, { method: "DELETE" }).catch(err => console.error(err));
                              showToast("Đã xóa phòng thi thành công!", "success");
                            }
                          );
                        }} 
                        className="p-2 text-gray-400 hover:text-red-650 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "results" && (
          <div className="space-y-6">
            {/* Collapse button & Thống kê toàn cục */}
            <div className="bg-white border border-gray-150 rounded-xl p-5 shadow-sm text-left">
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <BarChart2 className="text-indigo-600" size={20} />
                  <span className="text-sm font-black text-gray-800 uppercase tracking-wider font-sans">📊 Thống kê Phân tích Điểm số theo Lớp</span>
                </div>
                <button 
                  onClick={() => setIsStatsExpanded(!isStatsExpanded)}
                  className="px-3 py-1 bg-gray-50 border border-gray-200 text-xs font-bold rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-1 cursor-pointer text-gray-650"
                >
                  {isStatsExpanded ? (
                    <>Thu gọn <ChevronUp size={14} /></>
                  ) : (
                    <>Mở rộng thống kê <ChevronDown size={14} /></>
                  )}
                </button>
              </div>

              {isStatsExpanded && (
                <div className="mt-4 space-y-6">
                  {/* General summary metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-indigo-50/40 border border-indigo-100 p-4 rounded-xl flex items-center gap-4">
                      <div className="p-3 bg-indigo-500 text-white rounded-lg">
                        <Users size={20} />
                      </div>
                      <div>
                        <span className="text-xs text-gray-400 block font-bold uppercase">Tổng số bài nộp</span>
                        <span className="text-2xl font-black text-indigo-700">{visibleResults.length} bài</span>
                      </div>
                    </div>
                    
                    <div className="bg-emerald-50/45 border border-emerald-100 p-4 rounded-xl flex items-center gap-4">
                      <div className="p-3 bg-emerald-500 text-white rounded-lg">
                        <TrendingUp size={20} />
                      </div>
                      <div>
                        <span className="text-xs text-gray-400 block font-bold uppercase">Điểm trung bình</span>
                        <span className="text-2xl font-black text-emerald-700">
                          {visibleResults.length > 0 
                            ? (visibleResults.reduce((acc, r) => acc + r.score, 0) / visibleResults.length).toFixed(2)
                            : "0.00"
                          }
                        </span>
                      </div>
                    </div>

                    <div className="bg-amber-50/45 border border-amber-100 p-4 rounded-xl flex items-center gap-4">
                      <div className="p-3 bg-amber-500 text-white rounded-lg">
                        <Award size={20} />
                      </div>
                      <div>
                        <span className="text-xs text-gray-400 block font-bold uppercase">Điểm cao nhất</span>
                        {(() => {
                          const top_student = visibleResults.length > 0 
                            ? visibleResults.reduce((max, r) => r.score > max.score ? r : max, visibleResults[0]) 
                            : null;
                          return top_student ? (
                            <div className="leading-tight">
                              <span className="text-xl font-black text-amber-700 block">{top_student.score.toFixed(2)} đ</span>
                              <span className="text-[10px] font-bold text-amber-600 block truncate max-w-[200px]" title={top_student.studentName}>
                                {top_student.studentName} ({top_student.studentId})
                              </span>
                            </div>
                          ) : (
                            <span className="text-xl font-black text-amber-700">0.00 đ</span>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Per Class cards breakdown */}
                  {classStats.length > 0 ? (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                      {classStats.map(group => {
                        const total = group.submissions.length || 1;
                        return (
                          <div key={group.className} className="border border-gray-150 rounded-xl p-4 hover:shadow-sm transition-all bg-white flex flex-col justify-between text-left">
                            <div>
                              <div className="flex justify-between items-center mb-3">
                                <span className="font-black text-gray-800 text-base flex items-center gap-1.5 uppercase font-sans">
                                  🏫 Lớp: <span className="text-indigo-650">{group.className}</span>
                                </span>
                                <span className="text-xs font-bold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg border border-indigo-100 inline-flex items-center gap-1">
                                  <File size={12} /> {group.submissions.length} bài nộp
                                </span>
                              </div>

                              {/* Key statistics row */}
                              <div className="grid grid-cols-3 gap-2 bg-gray-50 p-2.5 rounded-lg border border-gray-150 text-center mb-3">
                                <div>
                                  <span className="text-[10px] text-gray-400 font-bold block uppercase">TB Lớp</span>
                                  <span className="text-sm font-black text-indigo-600">{group.average.toFixed(2)}</span>
                                </div>
                                <div>
                                  <span className="text-[10px] text-gray-400 font-bold block uppercase">Cao Nhất</span>
                                  <span className="text-sm font-black text-emerald-600">{group.max.toFixed(2)}</span>
                                </div>
                                <div>
                                  <span className="text-[10px] text-gray-400 font-bold block uppercase">Thấp Nhất</span>
                                  <span className="text-sm font-black text-rose-600">{group.min.toFixed(2)}</span>
                                </div>
                              </div>

                              {/* Segmented Progress Bar */}
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block">Phổ Điểm / Phân Loại học lực:</span>
                              <div className="w-full flex h-3 rounded-full overflow-hidden bg-gray-100 mt-1 mb-2.5">
                                {group.gioi > 0 && (
                                  <div 
                                    style={{ width: `${(group.gioi / total * 100)}%` }} 
                                    className="bg-emerald-500 h-full transition-all hover:brightness-95"
                                    title={`Giỏi (8.0 - 10.0): ${group.gioi} HS`}
                                  />
                                )}
                                {group.kha > 0 && (
                                  <div 
                                    style={{ width: `${(group.kha / total * 100)}%` }} 
                                    className="bg-indigo-500 h-full transition-all hover:brightness-95"
                                    title={`Khá (6.5 - 7.9): ${group.kha} HS`}
                                  />
                                )}
                                {group.tb > 0 && (
                                  <div 
                                    style={{ width: `${(group.tb / total * 100)}%` }} 
                                    className="bg-amber-500 h-full transition-all hover:brightness-95"
                                    title={`Trung bình (5.0 - 6.4): ${group.tb} HS`}
                                  />
                                )}
                                {group.yeu > 0 && (
                                  <div 
                                    style={{ width: `${(group.yeu / total * 100)}%` }} 
                                    className="bg-rose-500 h-full transition-all hover:brightness-95"
                                    title={`Yếu/Kém (< 5.0): ${group.yeu} HS`}
                                  />
                                )}
                              </div>

                              {/* Legend with direct quantities */}
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[11px] font-semibold text-gray-650">
                                <div className="flex items-center gap-1">
                                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block"></span>
                                  <span>Giỏi: <strong className="text-emerald-700">{group.gioi}</strong> ({(group.gioi / total * 100).toFixed(0)}%)</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 block"></span>
                                  <span>Khá: <strong className="text-indigo-705">{group.kha}</strong> ({(group.kha / total * 100).toFixed(0)}%)</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 block"></span>
                                  <span>TB: <strong className="text-amber-700">{group.tb}</strong> ({(group.tb / total * 100).toFixed(0)}%)</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 block"></span>
                                  <span>Yếu: <strong className="text-rose-700">{group.yeu}</strong> ({(group.yeu / total * 100).toFixed(0)}%)</span>
                                </div>
                              </div>
                            </div>

                            {/* Class Actions */}
                            <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
                              <button 
                                onClick={() => {
                                  setResultsClassFilter(group.className);
                                  showToast(`Đã lọc danh sách kết quả theo Lớp ${group.className}!`, "info");
                                }}
                                className="text-indigo-650 hover:bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                              >
                                <Filter size={12} /> Xem danh sách lớp này
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-400 text-xs">Chưa có đủ dữ liệu học sinh để phân tích theo lớp.</div>
                  )}
                </div>
              )}
            </div>

            {/* Filter controls row */}
            <div className="flex flex-col md:flex-row items-center gap-4 bg-white p-4 rounded-xl border border-gray-150 shadow-sm text-left font-sans">
              <div className="flex-1 w-full flex flex-col sm:flex-row items-center gap-3">
                {/* Lọc theo Lớp */}
                <div className="w-full sm:w-1/2 flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-400 uppercase whitespace-nowrap">Lọc theo Lớp:</span>
                  <select 
                    value={resultsClassFilter}
                    onChange={(e) => setResultsClassFilter(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 bg-white font-semibold cursor-pointer"
                  >
                    <option value="ALL">Tất cả các Lớp</option>
                    {(() => {
                      const uniqueClasses = Array.from(new Set(
                        visibleResults.map(r => {
                          const s = students.find(std => std.id === r.studentId);
                          return s?.className?.trim() || "Tự do";
                        })
                      )).filter(Boolean).sort();
                      return uniqueClasses.map(cls => (
                        <option key={cls} value={cls}>🏫 Lớp {cls}</option>
                      ));
                    })()}
                  </select>
                </div>

                {/* Lọc theo đề thi / phòng thi */}
                <div className="w-full sm:w-1/2 flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-400 uppercase whitespace-nowrap">Phòng thi:</span>
                  <select
                    value={resultsExamFilter}
                    onChange={(e) => setResultsExamFilter(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 bg-white font-semibold cursor-pointer"
                  >
                    <option value="ALL">Tất cả bài thi</option>
                    {(() => {
                      const uniqueExams = Array.from(new Map(
                        visibleResults.map(r => [r.examId || "free", r.examName || "Đợt thi tự do"])
                      ).entries());
                      return uniqueExams.map(([examId, examName]) => (
                        <option key={examId} value={examId}>📝 {examName}</option>
                      ));
                    })()}
                  </select>
                </div>
              </div>

              <div className="flex w-full md:w-auto items-center gap-2">
                {/* Clear filters button */}
                {(resultsClassFilter !== "ALL" || resultsExamFilter !== "ALL") && (
                  <button
                    onClick={() => {
                      setResultsClassFilter("ALL");
                      setResultsExamFilter("ALL");
                      showToast("Đã thiết lập lại bộ lọc mặc định!", "info");
                    }}
                    className="w-full md:w-auto px-4 py-1.5 border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <X size={14} /> Xóa bộ lọc
                  </button>
                )}

                <button
                  onClick={exportResultsToExcel}
                  className="w-full md:w-auto px-4 py-1.5 bg-emerald-650 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm font-sans"
                  title="Xuất bảng điểm ra file Excel (xlsx)"
                >
                  <Download size={14} /> Xuất Excel báo cáo
                </button>
              </div>
            </div>

            {/* Main results list table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase">Thí sinh</th>
                    <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase">Lớp quản lý</th>
                    <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase">Đề thi / Phòng thi</th>
                    <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase font-mono">SBD</th>
                    <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase">Tổng Điểm</th>
                    <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase">Thời gian nộp</th>
                    <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase text-right">Chi tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-sm">
                  {filteredResults.map(result => {
                    const student = students.find(s => s.id === result.studentId);
                    return (
                      <tr key={result.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-semibold text-gray-850 text-left">
                          <span className="block font-black text-gray-900">{result.studentName}</span>
                        </td>
                        <td className="px-6 py-4 text-left">
                          <span className="px-2.5 py-1 text-xs font-black rounded-lg bg-indigo-50 border border-indigo-100/60 text-indigo-700 uppercase">
                            🏫 {student?.className || "Tự do / Chung"}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-semibold text-gray-700 max-w-[200px] truncate text-left" title={result.examName || "Đợt thi tự do"}>
                          📝 {result.examName || "Đợt thi tự do"}
                        </td>
                        <td className="px-6 py-4 font-mono text-gray-600 font-bold text-left">{result.studentId}</td>
                        <td className="px-6 py-4 font-mono font-black text-indigo-600 text-base text-left">{result.score.toFixed(2)}</td>
                        <td className="px-6 py-4 text-xs text-gray-500 font-mono text-left">{new Date(result.timestamp).toLocaleString('vi-VN')}</td>
                        <td className="px-6 py-4 text-right flex items-center justify-end gap-2.5">
                          <button 
                            onClick={() => {
                              if (onViewResultDetail) {
                                onViewResultDetail(result);
                              }
                            }}
                            className="bg-indigo-50 text-indigo-600 border border-indigo-100 hover:bg-indigo-100 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                          >
                            <Eye size={12} /> Xem bài làm
                          </button>
                          <button 
                            onClick={() => {
                              showConfirm(
                                "Xóa kết quả bài làm",
                                `Bạn có chắc chắn muốn xóa bài làm của thí sinh "${result.studentName}" (SBD: ${result.studentId}, Điểm: ${result.score.toFixed(2)}) không? Thao tác này không thể hoàn tác.`,
                                () => {
                                  if (setResults) {
                                    setResults(prev => prev.filter(r => r.id !== result.id));
                                  }
                                  fetch(`/api/results/${result.id}`, { method: "DELETE" })
                                    .then(res => res.json())
                                    .then(data => {
                                      if (data.success) {
                                        showToast("Đã xóa bài làm của thí sinh thành công!", "success");
                                      } else {
                                        showToast("Có lỗi xảy ra khi xóa bài làm!", "error");
                                      }
                                    })
                                    .catch(err => {
                                      console.error(err);
                                      showToast("Lỗi kết nối máy chủ!", "error");
                                    });
                                }
                              );
                            }}
                            className="p-1.5 text-gray-400 hover:text-red-650 hover:bg-red-50 rounded-lg transition-all cursor-pointer border border-transparent hover:border-red-100"
                            title="Xóa bài làm"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredResults.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-gray-400 text-xs font-medium">
                        Không tìm thấy lượt nộp bài nào khớp với bộ lọc được chọn.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "teachers" && user?.role === "admin" && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase">Tài khoản (ID)</th>
                  <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase">Họ và tên giáo viên</th>
                  <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase">Lớp phụ trách</th>
                  <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase">Ngày đăng ký</th>
                  <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-sm">
                {teachers.map(teacher => (
                  <tr key={teacher.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-mono font-bold text-slate-700">{teacher.id}</td>
                    <td className="px-6 py-4 font-semibold text-gray-800">{teacher.name}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-indigo-50 text-indigo-700 uppercase">
                        {teacher.className}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500">
                      {teacher.createdAt ? new Date(teacher.createdAt).toLocaleDateString('vi-VN') : "Mặc định"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => {
                          showConfirm(
                            "Xóa Giáo viên",
                            `Bạn có chắc chắn muốn xóa tài khoản giáo viên "${teacher.name}" khỏi hệ thống không? `,
                            () => {
                              setTeachers(prev => prev.filter(t => t.id !== teacher.id));
                              fetch(`/api/teachers/${teacher.id}`, { method: "DELETE" })
                                .then(() => showToast("Đã xóa giáo viên thành công!", "success"))
                                .catch(err => console.error(err));
                            }
                          );
                        }}
                        className="text-red-650 hover:underline text-xs font-bold cursor-pointer"
                      >
                        Xóa giáo viên
                      </button>
                    </td>
                  </tr>
                ))}
                {teachers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-400 text-xs font-medium">
                      Chưa có giáo viên nào tự đăng ký tài khoản trên hệ thống.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Modals inside Dashboard context */}
      <AnimatePresence>
        {isFolderModalOpen && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl p-6 w-full max-w-md border border-gray-150 shadow-xl">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                {editingFolderId ? (
                  newFolder.type === "student" ? "Chỉnh sửa thư mục lớp học" : "Chỉnh sửa thư mục chủ đề"
                ) : (
                  newFolder.type === "student" ? "Thêm thư mục lớp học mới" : "Thêm thư mục chủ đề mới"
                )}
              </h3>
              <div className="space-y-4 mb-5">
                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase mb-1">Tên thư mục</label>
                  <input 
                    type="text"
                    value={newFolder.name}
                    onChange={(e) => setNewFolder({ ...newFolder, name: e.target.value })}
                    placeholder={newFolder.type === "student" ? "Ví dụ: Lớp 10A1, Khối 12 THPT..." : "Tên chủ đề toán học, vật lý..."}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase mb-1">Thư mục cha (Vị trí trong cây)</label>
                  <select
                    value={newFolder.parentId || ""}
                    onChange={(e) => setNewFolder({ ...newFolder, parentId: e.target.value || undefined })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm bg-white"
                  >
                    <option value="">-- Thư mục gốc --</option>
                    {(() => {
                      const isDescendant = (parentFoldId: string, childFoldId: string): boolean => {
                        let curr = folders.find(f => f.id === childFoldId);
                        while (curr && curr.parentId) {
                          if (curr.parentId === parentFoldId) return true;
                          curr = folders.find(f => f.id === curr.parentId);
                        }
                        return false;
                      };
                      const rawFolders = newFolder.type === 'student' ? studentFolders : questionFolders;
                      const dropdownFolders = getFolderDropdownList(rawFolders);
                      const filteredFolders = editingFolderId
                        ? dropdownFolders.filter(f => f.id !== editingFolderId && !isDescendant(editingFolderId, f.id))
                        : dropdownFolders;
                        
                      return filteredFolders.map(f => (
                        <option key={f.id} value={f.id}>
                          {"\u00A0\u00A0".repeat(f.level * 2)}{f.level > 0 ? "↳ " : ""}📁 {f.name}
                        </option>
                      ));
                    })()}
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setIsFolderModalOpen(false); setNewFolder({ name: "", parentId: undefined, type: "question" }); setEditingFolderId(null); }} className="flex-1 py-2 text-gray-500 font-bold text-sm">Hủy</button>
                <button onClick={createFolder} className="flex-1 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors">Lưu lại</button>
              </div>
            </motion.div>
          </div>
        )}

        {isStudentModalOpen && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl p-6 w-full max-w-md border border-gray-150 shadow-xl">
              <h3 className="text-lg font-bold text-gray-900 mb-4">{editingStudentId ? "Chỉnh sửa thông tin thí sinh" : "Thêm thí sinh mới"}</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Họ và tên</label>
                  <input 
                    type="text"
                    value={newStudent.name}
                    onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                    placeholder="Ví dụ: Nguyễn Văn Hải"
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1 font-mono">Số báo danh (SBD)</label>
                  <input 
                    type="text"
                    value={newStudent.sbd}
                    onChange={(e) => setNewStudent({ ...newStudent, sbd: e.target.value })}
                    placeholder="Ví dụ: SBD024"
                    disabled={editingStudentId !== null}
                    className={cn(
                      "w-full px-4 py-2 border border-gray-300 rounded-xl text-sm font-mono font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-indigo-700",
                      editingStudentId && "bg-gray-50 opacity-90"
                    )}
                  />
                  {editingStudentId && (
                    <span className="text-[10px] text-amber-600 block mt-1 font-medium">⚠️ Thay đổi Số báo danh (SBD) sẽ cập nhật khóa định danh của thí sinh</span>
                  )}
                </div>
                {user?.role === "admin" ? (
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Lớp (Ví dụ: 12A1)</label>
                    <input 
                      type="text"
                      value={newStudent.className || ""}
                      onChange={(e) => setNewStudent({ ...newStudent, className: e.target.value })}
                      placeholder="Ví dụ: 12A1"
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm font-bold uppercase text-indigo-650 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                ) : (
                  <div className="bg-indigo-50 border border-indigo-150 rounded-xl p-3 text-xs text-indigo-700 leading-relaxed font-semibold">
                    💡 Thí sinh này sẽ được tự động quản lý trong Lớp của bạn: <span className="font-bold text-indigo-900">{user?.className || "Mặc định"}</span>
                  </div>
                )}
              </div>
              <div className="flex gap-2 mt-6">
                <button onClick={() => { setIsStudentModalOpen(false); setEditingStudentId(null); setNewStudent({ name: "", sbd: "", className: "" }); }} className="flex-1 py-2 text-gray-500 font-bold text-sm">Hủy</button>
                <button onClick={createStudent} className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-colors">{editingStudentId ? "Lưu thay đổi" : "Đăng ký"}</button>
              </div>
            </motion.div>
          </div>
        )}

        {isExcelImportModalOpen && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl p-6 w-full max-w-xl border border-gray-150 shadow-xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Nhập thí sinh từ file Excel</h3>
                  <p className="text-xs text-gray-500 mt-1">Hệ thống chấp nhận các file Excel dạng .xlsx hoặc .xls</p>
                </div>
                <button
                  onClick={() => {
                    setIsExcelImportModalOpen(false);
                    setExcelPreviewStudents([]);
                    setExcelImportErrors(0);
                    setExcelSelectedFolderId("");
                  }}
                  className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Sample file download section */}
              <div className="bg-amber-50/50 border border-amber-150 rounded-xl p-4 mb-5 flex items-center justify-between gap-4">
                <div className="flex-1">
                  <span className="font-bold text-xs text-amber-800 uppercase tracking-wider block">Yêu cầu tệp dữ liệu</span>
                  <p className="text-xs text-amber-900 leading-relaxed mt-1 font-semibold">
                    File excel nhập vào cần phải chứa các cột thông tin chuẩn: <span className="font-bold underline">Số báo danh (SBD)</span> và <span className="font-bold underline">Họ và tên</span> (Cột <span className="italic">Lớp</span> là tùy chọn).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={downloadExcelTemplate}
                  className="shrink-0 bg-white hover:bg-amber-100/70 border border-amber-250 text-amber-850 text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download size={14} /> Tải file mẫu
                </button>
              </div>

              {/* Select Folder to Import Into */}
              <div className="mb-5 bg-indigo-50/35 border border-indigo-100 p-4 rounded-xl text-left font-sans">
                <label className="block text-xs font-black text-indigo-700 uppercase mb-1.5 flex items-center gap-1">
                  📁 Đưa danh sách thí sinh vào thư mục lớp học nào?
                </label>
                <select
                  value={excelSelectedFolderId}
                  onChange={(e) => setExcelSelectedFolderId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm bg-white font-semibold text-gray-750 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
                >
                  <option value="">-- Thư mục gốc (Chưa phân thư mục) --</option>
                  {getFolderDropdownList(studentFolders).map(f => (
                    <option key={f.id} value={f.id}>
                      {"\u00A0\u00A0".repeat(f.level * 2)}{f.level > 0 ? "↳ " : ""}📁 {f.name}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-indigo-650 font-semibold mt-1.5 leading-relaxed">
                  💡 Danh sách các thí sinh sau khi nhập thành công sẽ được sắp xếp ngay vào thư mục/lớp học này.
                </p>
              </div>

              {/* Drag and Drop / File selector */}
              <div className="space-y-4 mb-5">
                <label className="block border-2 border-dashed border-gray-255 hover:border-indigo-500 rounded-2xl p-6 text-center cursor-pointer bg-gray-50/50 hover:bg-indigo-50/20 transition-all group">
                  <input
                    type="file"
                    accept=".xlsx, .xls"
                    onChange={handleExcelImportFile}
                    className="hidden"
                  />
                  <Upload className="mx-auto text-gray-400 group-hover:text-indigo-600 mb-2 transition-colors" size={32} />
                  <span className="text-xs font-bold text-gray-700 block group-hover:text-indigo-700">Kéo thả file Excel vào đây hoặc nhấp để chọn</span>
                  <span className="text-[10px] text-gray-400 block mt-1">Hỗ trợ các định dạng .xlsx, .xls tối đa 10MB</span>
                </label>
              </div>

              {/* Data Preview */}
              {excelPreviewStudents.length > 0 && (
                <div className="space-y-3 mb-5 text-left">
                  <div className="flex justify-between items-center bg-gray-50 p-2 border border-gray-150 rounded-lg">
                    <span className="text-xs font-bold text-gray-600">Bản xem trước dữ liệu nạp</span>
                    <div className="flex gap-2">
                      <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                        {excelPreviewStudents.length} thí sinh hợp lệ
                      </span>
                      {excelImportErrors > 0 && (
                        <span className="text-[10px] font-black text-red-700 bg-red-50 px-2 py-0.5 rounded-md">
                          {excelImportErrors} dòng bỏ qua
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="border border-gray-150 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-100 sticky top-0 border-b border-gray-150">
                        <tr>
                          <th className="px-4 py-2 font-bold text-gray-550 uppercase">Số báo danh</th>
                          <th className="px-4 py-2 font-bold text-gray-550 uppercase">Họ và tên</th>
                          <th className="px-4 py-2 font-bold text-gray-550 uppercase">Lớp quản lý</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-150">
                        {excelPreviewStudents.map((s, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-4 py-2 font-mono font-bold text-indigo-600">{s.id}</td>
                            <td className="px-4 py-2 font-semibold text-gray-800">{s.name}</td>
                            <td className="px-4 py-2 text-gray-500">
                              <span className="px-1.5 py-0.5 font-bold rounded-md bg-indigo-50 text-indigo-700 uppercase">
                                {s.className || "Mặc định lớp"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setIsExcelImportModalOpen(false);
                    setExcelPreviewStudents([]);
                    setExcelImportErrors(0);
                    setExcelSelectedFolderId("");
                  }}
                  className="flex-1 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 font-bold text-sm rounded-xl transition-all cursor-pointer"
                >
                  Đóng lại
                </button>
                <button
                  onClick={confirmExcelImport}
                  disabled={excelPreviewStudents.length === 0}
                  className={cn(
                    "flex-1 py-2 text-white rounded-xl font-bold text-sm transition-all",
                    excelPreviewStudents.length > 0 
                      ? "bg-indigo-650 hover:bg-indigo-700 cursor-pointer shadow-sm"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  )}
                >
                  Xác nhận nhập ({excelPreviewStudents.length})
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {isExamModalOpen && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto border border-gray-150 shadow-xl">
              <h3 className="text-lg font-bold text-gray-900 mb-4">{editingExamRoomId ? "Cập nhật phòng kiểm tra thi" : "Khởi tạo phòng kiểm tra thi"}</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Tên kỳ thi/Phòng thi</label>
                  <input 
                    type="text"
                    value={newExam.name}
                    onChange={(e) => setNewExam({ ...newExam, name: e.target.value })}
                    placeholder="Ví dụ: Kiểm tra giữa kỳ môn Toán Lớp 12"
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Mã tham gia phòng thi</label>
                    <input 
                      type="text"
                      value={newExam.code}
                      onChange={(e) => setNewExam({ ...newExam, code: e.target.value.toUpperCase() })}
                      placeholder="TOAN12"
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm font-bold uppercase focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-indigo-650"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Thời gian làm bài (Phút)</label>
                    <input 
                      type="number"
                      value={newExam.duration}
                      onChange={(e) => setNewExam({ ...newExam, duration: parseInt(e.target.value) || 45 })}
                      placeholder="Số phút"
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Ngày giờ bắt đầu</label>
                    <input 
                      type="datetime-local"
                      value={newExam.startTime || ""}
                      onChange={(e) => setNewExam({ ...newExam, startTime: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm text-gray-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Ngày giờ kết thúc</label>
                    <input 
                      type="datetime-local"
                      value={newExam.endTime || ""}
                      onChange={(e) => setNewExam({ ...newExam, endTime: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm text-gray-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* RANDOM SHUFFLING OPTIONS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-start gap-2.5 bg-amber-50/50 p-3 border border-amber-100/70 rounded-xl">
                    <input 
                      type="checkbox"
                      id="shuffleQuestions"
                      checked={newExam.shuffleQuestions}
                      onChange={(e) => setNewExam({ ...newExam, shuffleQuestions: e.target.checked })}
                      className="w-4 h-4 text-amber-600 border-amber-300 rounded focus:ring-amber-500 mt-0.5 cursor-pointer"
                    />
                    <div className="select-none">
                      <label htmlFor="shuffleQuestions" className="block text-xs font-bold text-amber-900 cursor-pointer flex items-center gap-1">
                        <span>Xáo trộn câu hỏi</span>
                        <span className="text-xs">🔀</span>
                      </label>
                      <p className="text-[10px] text-amber-650 leading-normal mt-0.5">Xáo trộn thứ tự câu hỏi trong mỗi phần (Phần I, II, III) cho từng thí sinh.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 bg-orange-50/50 p-3 border border-orange-100/70 rounded-xl">
                    <input 
                      type="checkbox"
                      id="shuffleAnswers"
                      checked={newExam.shuffleAnswers}
                      onChange={(e) => setNewExam({ ...newExam, shuffleAnswers: e.target.checked })}
                      className="w-4 h-4 text-orange-600 border-orange-300 rounded focus:ring-orange-500 mt-0.5 cursor-pointer"
                    />
                    <div className="select-none">
                      <label htmlFor="shuffleAnswers" className="block text-xs font-bold text-orange-900 cursor-pointer flex items-center gap-1">
                        <span>Xáo trộn đáp án</span>
                        <span>🔄</span>
                      </label>
                      <p className="text-[10px] text-orange-650 leading-normal mt-0.5">Xáo trộn vị trí phương án lựa chọn A-B-C-D và các mệnh đề Đúng/Sai.</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 bg-indigo-50/40 p-3 border border-indigo-100/60 rounded-xl">
                  <input 
                    type="checkbox"
                    id="allowReview"
                    checked={newExam.allowReview}
                    onChange={(e) => setNewExam({ ...newExam, allowReview: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 mt-0.5 cursor-pointer"
                  />
                  <div className="select-none">
                    <label htmlFor="allowReview" className="block text-xs font-bold text-gray-750 cursor-pointer">
                      Cho phép xem lại đáp án và tải bài làm về
                    </label>
                    <p className="text-[10px] text-gray-455 leading-relaxed mt-0.5">Sau khi hoàn thành bài, thí sinh được xem bài làm kèm lời giải, đồng thời có thể tải bài thi của mình.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 bg-emerald-50/50 p-3 border border-emerald-100 rounded-xl">
                  <input 
                    type="checkbox"
                    id="isFree"
                    checked={newExam.isFree}
                    onChange={(e) => setNewExam({ ...newExam, isFree: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 border-emerald-300 rounded focus:ring-emerald-500 mt-0.5 cursor-pointer"
                  />
                  <div className="select-none">
                    <label htmlFor="isFree" className="block text-xs font-bold text-emerald-950 cursor-pointer">
                      Đề thi luyện tập tự do (Hiển thị ở trang chủ cho Thí sinh tự do 🚀)
                    </label>
                    <p className="text-[10px] text-emerald-650 leading-relaxed mt-0.5">Nếu kích hoạt, bài thi này sẽ tự động xuất hiện công khai trên trang chủ để các thí sinh tự do vào ôn luyện.</p>
                  </div>
                </div>

                {/* CONFIGURING SCORING PER PART */}
                <div className="bg-fuchsia-50/50 p-4 border border-fuchsia-100 rounded-xl space-y-4">
                  <div className="flex items-center gap-1.5">
                    <span className="p-1.5 bg-fuchsia-100 rounded-lg text-fuchsia-600">
                      <Settings size={14} className="text-fuchsia-600 animate-spin-slow" />
                    </span>
                    <p className="text-xs font-black text-fuchsia-800 uppercase tracking-wide">Cấu hình điểm số từng loại câu hỏi</p>
                  </div>

                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">ĐIỂM PHẦN I (TRẮC NGHIỆM)</label>
                        <input 
                          type="number"
                          step="0.05"
                          min="0"
                          value={newExam.part1Point}
                          onChange={(e) => setNewExam({ ...newExam, part1Point: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-bold text-center bg-white"
                          placeholder="0.25"
                        />
                        <span className="text-[9px] text-gray-400 block mt-0.5 text-center">đ/câu đúng</span>
                      </div>

                      <div>
                        <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">ĐIỂM PHẦN III (TRẢ LỜI NGẮN)</label>
                        <input 
                          type="number"
                          step="0.05"
                          min="0"
                          value={newExam.part3Point}
                          onChange={(e) => setNewExam({ ...newExam, part3Point: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-bold text-center bg-white"
                          placeholder="0.5"
                        />
                        <span className="text-[9px] text-gray-400 block mt-0.5 text-center">đ/câu đúng</span>
                      </div>
                    </div>

                    <div className="border-t border-fuchsia-250/40 pt-2.5">
                      <p className="block text-[10px] font-black text-gray-500 uppercase mb-2">ĐIỂM PHẦN II TRẮC NGHIỆM ĐÚNG/SAI (DỰA TRÊN SỐ Ý ĐÚNG/4 Ý)</p>
                      <div className="grid grid-cols-4 gap-2">
                        <div>
                          <label className="block text-[9px] text-gray-400 font-bold mb-1 text-center">Đúng 1 ý</label>
                          <input 
                            type="number"
                            step="0.05"
                            min="0"
                            value={newExam.part2Point1}
                            onChange={(e) => setNewExam({ ...newExam, part2Point1: parseFloat(e.target.value) || 0 })}
                            className="w-full px-1.5 py-1.5 border border-gray-300 rounded-lg text-xs font-bold text-center bg-white"
                            placeholder="0.1"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] text-gray-400 font-bold mb-1 text-center">Đúng 2 ý</label>
                          <input 
                            type="number"
                            step="0.05"
                            min="0"
                            value={newExam.part2Point2}
                            onChange={(e) => setNewExam({ ...newExam, part2Point2: parseFloat(e.target.value) || 0 })}
                            className="w-full px-1.5 py-1.5 border border-gray-300 rounded-lg text-xs font-bold text-center bg-white"
                            placeholder="0.25"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] text-gray-400 font-bold mb-1 text-center">Đúng 3 ý</label>
                          <input 
                            type="number"
                            step="0.05"
                            min="0"
                            value={newExam.part2Point3}
                            onChange={(e) => setNewExam({ ...newExam, part2Point3: parseFloat(e.target.value) || 0 })}
                            className="w-full px-1.5 py-1.5 border border-gray-300 rounded-lg text-xs font-bold text-center bg-white"
                            placeholder="0.5"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] text-gray-400 font-bold mb-1 text-center">Đúng 4 ý</label>
                          <input 
                            type="number"
                            step="0.05"
                            min="0"
                            value={newExam.part2Point4}
                            onChange={(e) => setNewExam({ ...newExam, part2Point4: parseFloat(e.target.value) || 0 })}
                            className="w-full px-1.5 py-1.5 border border-gray-300 rounded-lg text-xs font-bold text-center bg-white"
                            placeholder="1.0"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* RANDOM SELECT SECTION FOR TOPIC SELECT */}
                <div className="bg-gradient-to-br from-indigo-50/60 to-purple-50/40 p-4 border border-indigo-100 rounded-xl space-y-3">
                  <div className="flex items-center gap-1.5">
                    <span className="p-1.5 bg-indigo-100 rounded-lg text-indigo-600">
                      <Settings size={14} className="animate-spin-slow text-indigo-600" />
                    </span>
                    <p className="text-xs font-black text-indigo-700 uppercase tracking-wide">Lấy câu hỏi ngẫu nhiên từ thư mục chủ đề</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Chọn chủ đề / Thư mục</label>
                      <select
                        value={randomSelectFolderId}
                        onChange={(e) => setRandomSelectFolderId(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs bg-white font-medium"
                      >
                        <option value="ALL">-- Tất cả câu hỏi trong hệ thống --</option>
                        {getFolderDropdownList(questionFolders).map(f => (
                          <option key={f.id} value={f.id}>
                            {"\u00A0\u00A0".repeat(f.level * 2)}{f.level > 0 ? "↳ " : ""}📁 {f.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 md:col-span-2">
                      <div>
                        <label className="block text-[9px] font-black text-gray-500 uppercase mb-0.5">Số câu P1</label>
                        <input 
                          type="number"
                          min={0}
                          value={randomSelectPart1Count}
                          onChange={(e) => setRandomSelectPart1Count(Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs font-bold text-center"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-black text-gray-500 uppercase mb-0.5">Số câu P2</label>
                        <input 
                          type="number"
                          min={0}
                          value={randomSelectPart2Count}
                          onChange={(e) => setRandomSelectPart2Count(Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs font-bold text-center"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-black text-gray-500 uppercase mb-0.5">Số câu P3</label>
                        <input 
                          type="number"
                          min={0}
                          value={randomSelectPart3Count}
                          onChange={(e) => setRandomSelectPart3Count(Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs font-bold text-center"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleApplyRandomSelection}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-sm text-center"
                  >
                    🎲 Tải và áp dụng danh sách ngẫu nhiên
                  </button>
                </div>

                <div>
                  <p className="text-xs font-bold text-gray-450 uppercase mb-2">Lựa chọn câu hỏi thủ công bên dưới ({newExam.questionIds.length} đã chọn)</p>
                  <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-xl p-2.5 space-y-1.5 bg-gray-50">
                    {visibleQuestions.map(q => (
                      <label key={q.id} className="flex items-start gap-2.5 p-2 hover:bg-white rounded-lg cursor-pointer transition-colors border border-transparent hover:border-gray-150">
                        <input 
                          type="checkbox"
                          checked={newExam.questionIds.includes(q.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewExam({ ...newExam, questionIds: [...newExam.questionIds, q.id] });
                            } else {
                              setNewExam({ ...newExam, questionIds: newExam.questionIds.filter(id => id !== q.id) });
                            }
                          }}
                          className="mt-0.5"
                        />
                        <div className="text-xs">
                          <span className="font-bold text-indigo-700 font-mono mr-1.5">[Phần {q.part}]</span>
                          <span className="text-gray-700 truncate inline-block max-w-[280px] align-bottom">{stripHtml(q.question)}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <button onClick={closeExamModal} className="flex-1 py-2 text-gray-500 font-bold text-sm col-span-1">Hủy bỏ</button>
                <button onClick={createExam} className="flex-1 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all">{editingExamRoomId ? "Lưu thay đổi" : "Khởi tạo ngay"}</button>
              </div>
            </motion.div>
          </div>
        )}

        {isManualQuestionModalOpen && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }} 
              className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto border border-gray-150 shadow-xl font-sans"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900">{editingQuestionId ? "Chỉnh sửa câu hỏi" : "Thêm câu hỏi thủ công"}</h3>
                <button 
                  onClick={() => {
                    setIsManualQuestionModalOpen(false);
                    setEditingQuestionId(null);
                    setManualQuestionText("");
                    setManualA("");
                    setManualB("");
                    setManualC("");
                    setManualD("");
                    setManualStmtA("");
                    setManualStmtB("");
                    setManualStmtC("");
                    setManualStmtD("");
                    setManualAnsPart1("A");
                    setManualAnsPart2({ a: true, b: true, c: true, d: false });
                    setManualAnsPart3("");
                  }}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Thư mục / Chủ đề</label>
                  <select
                    value={manualFolderId}
                    onChange={(e) => setManualFolderId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm"
                  >
                    <option value="">-- Không phân loại --</option>
                    {getFolderDropdownList(visibleFolders).map(f => (
                      <option key={f.id} value={f.id}>
                        {"\u00A0\u00A0".repeat(f.level * 2)}{f.level > 0 ? "↳ " : ""}📁 {f.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Phần đề thi</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: PartType.PART1, name: "Phần I" },
                      { id: PartType.PART2, name: "Phần II" },
                      { id: PartType.PART3, name: "Phần III" },
                    ].map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setManualPart(p.id)}
                        className={cn(
                          "py-2 rounded-xl text-xs font-bold border transition-all text-center",
                          manualPart === p.id 
                            ? "border-indigo-600 bg-indigo-50 text-indigo-700" 
                            : "border-gray-200 text-gray-600 hover:bg-gray-50"
                        )}
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-gray-450 mt-1 leading-normal">
                    {manualPart === PartType.PART1 && "Trắc nghiệm 4 lựa chọn (A, B, C, D) chọn 1 đáp án đúng nhất."}
                    {manualPart === PartType.PART2 && "Câu hỏi Đúng/Sai liên kết gồm 4 mệnh đề ý tương ứng Đúng hoặc Sai."}
                    {manualPart === PartType.PART3 && "Câu hỏi tự luận điền kết quả ngắn, chữ cái hoặc số tối giản."}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Nội dung câu hỏi (Hỗ trợ hình ảnh, bảng biểu và công thức Toán/Lý/Hóa)</label>
                  <div className="quill-editor-container bg-white border border-gray-300 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
                    <ReactQuill
                      theme="snow"
                      value={manualQuestionText}
                      onChange={setManualQuestionText}
                      placeholder="Nhập đề bài câu hỏi (bạn có thể dán ảnh trực tiếp từ Clipboard, tạo bảng biểu, hoặc gõ công thức Toán dạng $x^2 + y^2 = z^2$)"
                      modules={quillModules}
                    />
                  </div>
                </div>

                {manualPart === PartType.PART1 && (
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-indigo-700 uppercase">Phương án & Đáp án</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-0.5">Phương án A</label>
                        <input
                          type="text"
                          value={manualA}
                          onChange={(e) => setManualA(e.target.value)}
                          placeholder="Nhập phương án A"
                          className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-0.5">Phương án B</label>
                        <input
                          type="text"
                          value={manualB}
                          onChange={(e) => setManualB(e.target.value)}
                          placeholder="Nhập phương án B"
                          className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-0.5">Phương án C</label>
                        <input
                          type="text"
                          value={manualC}
                          onChange={(e) => setManualC(e.target.value)}
                          placeholder="Nhập phương án C"
                          className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-0.5">Phương án D</label>
                        <input
                          type="text"
                          value={manualD}
                          onChange={(e) => setManualD(e.target.value)}
                          placeholder="Nhập phương án D"
                          className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Lựa chọn Đáp án đúng</label>
                      <select
                        value={manualAnsPart1}
                        onChange={(e) => setManualAnsPart1(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm"
                      >
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                        <option value="D">D</option>
                      </select>
                    </div>
                  </div>
                )}

                {manualPart === PartType.PART2 && (
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-indigo-700 uppercase">Mệnh đề & Trạng thái Đúng/Sai</p>
                    {[
                      { id: 'a', stmt: manualStmtA, setStmt: setManualStmtA, label: 'Mệnh đề a)' },
                      { id: 'b', stmt: manualStmtB, setStmt: setManualStmtB, label: 'Mệnh đề b)' },
                      { id: 'c', stmt: manualStmtC, setStmt: setManualStmtC, label: 'Mệnh đề c)' },
                      { id: 'd', stmt: manualStmtD, setStmt: setManualStmtD, label: 'Mệnh đề d)' },
                    ].map(item => (
                      <div key={item.id} className="flex gap-2 items-center">
                        <div className="flex-1">
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-0.5">{item.label}</label>
                          <input
                            type="text"
                            value={item.stmt}
                            onChange={(e) => item.setStmt(e.target.value)}
                            placeholder={`Nội dung phát biểu ${item.id}`}
                            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                          />
                        </div>
                        <div className="flex gap-1 mt-4">
                          <button
                            type="button"
                            onClick={() => setManualAnsPart2(prev => ({ ...prev, [item.id]: true }))}
                            className={cn(
                              "px-3 py-1.5 rounded-lg text-xs font-bold border transition-all",
                              manualAnsPart2[item.id as 'a'|'b'|'c'|'d'] === true
                                ? "bg-green-600 text-white border-green-600 shadow-sm"
                                : "border-gray-200 text-gray-500 hover:bg-green-50"
                            )}
                          >
                            Đúng
                          </button>
                          <button
                            type="button"
                            onClick={() => setManualAnsPart2(prev => ({ ...prev, [item.id]: false }))}
                            className={cn(
                              "px-3 py-1.5 rounded-lg text-xs font-bold border transition-all",
                              manualAnsPart2[item.id as 'a'|'b'|'c'|'d'] === false
                                ? "bg-red-600 border-red-600 text-white shadow-sm"
                                : "border-gray-200 text-gray-500 hover:bg-red-50"
                            )}
                          >
                            Sai
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {manualPart === PartType.PART3 && (
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Đáp án viết ngắn chuẩn</label>
                    <input
                      type="text"
                      value={manualAnsPart3}
                      onChange={(e) => setManualAnsPart3(e.target.value)}
                      placeholder="Ví dụ: 45 hoặc K..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-6 pt-4 border-t border-gray-100">
                <button 
                  onClick={() => {
                    setIsManualQuestionModalOpen(false);
                    setEditingQuestionId(null);
                    setManualQuestionText("");
                    setManualA("");
                    setManualB("");
                    setManualC("");
                    setManualD("");
                    setManualStmtA("");
                    setManualStmtB("");
                    setManualStmtC("");
                    setManualStmtD("");
                    setManualAnsPart1("A");
                    setManualAnsPart2({ a: true, b: true, c: true, d: false });
                    setManualAnsPart3("");
                  }} 
                  className="flex-1 py-2 text-gray-500 font-bold text-sm"
                >
                  Hủy bỏ
                </button>
                <button 
                  onClick={addManualQuestion} 
                  className="flex-1 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors shadow-sm"
                >
                  {editingQuestionId ? "Lưu thay đổi" : "Thêm câu hỏi"}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {isWordImportModalOpen && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }} 
              className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-150 shadow-xl font-sans relative"
            >
              {isParsingAi && (
                <div className="absolute inset-0 bg-white/95 z-30 flex flex-col items-center justify-center p-6 text-center select-none rounded-2xl">
                  <div className="relative flex items-center justify-center mb-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-100 border-t-indigo-600"></div>
                    <div className="absolute text-indigo-600 animate-pulse">
                      <Zap size={20} />
                    </div>
                  </div>
                  <h4 className="text-sm font-bold text-gray-900 mb-1.5">
                    {useAiParser ? "Trí tuệ Nhân tạo (Gemini AI) đang phân tích tệp" : "Hệ thống đang giải mã & bóc tách tệp offline"}
                  </h4>
                  <p className="text-xs text-gray-500 leading-relaxed max-w-sm">
                    {useAiParser 
                      ? "Đang bóc tách đề chi tiết và tự động dịch toàn bộ công thức gốc MathType, OMML, LaTeX phức tạp sang hiển thị LaTeX hoàn mỹ. Việc biên dịch chuyên sâu này có thể mất khoảng 5 - 12 giây, xin vui lòng chờ..."
                      : "Sử dụng thuật toán bản xứ chuyển đổi 100% công thức MathType, OMML và cấu trúc bảng biểu, hình ảnh chuẩn LaTeX offline tức thì. Xin vui lòng chờ trong giây lát..."}
                  </p>
                </div>
              )}

              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Nhập câu hỏi từ file Word / Text</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Sao chép dán hoặc chọn file từ máy tính nhanh chóng.</p>
                </div>
                <button 
                  onClick={() => setIsWordImportModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                {/* AI Mode Toggle Card */}
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50/60 p-4 rounded-xl border border-indigo-100/40 shadow-sm flex items-center justify-between">
                  <div className="flex gap-3 items-center">
                    <div className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white p-2.5 rounded-xl shadow-md shadow-indigo-100">
                      <Zap size={18} />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-gray-900 block">Sử dụng Trí tuệ Nhân tạo (AI)</span>
                      <span className="text-[10px] text-gray-500 mt-0.5 block leading-normal max-w-[340px]">
                        Tự động bóc tách đề từ file Word và quy đổi 100% công thức <b>MathType</b> sang LaTeX chuẩn.
                      </span>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={useAiParser}
                      onChange={(e) => setUseAiParser(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                <div className="flex flex-wrap gap-2 items-center justify-between bg-indigo-50/55 p-4 rounded-xl border border-indigo-100">
                  <div className="text-xs text-indigo-950 max-w-md">
                    <p className="font-bold flex items-center gap-1">
                      <Info size={14} /> Tải tệp tài liệu Word mẫu
                    </p>
                    <p className="mt-0.5 text-gray-550 leading-relaxed">Mẫu cấu trúc chuẩn 3 phần đánh giá năng lực TNTHPT mới ban hành.</p>
                  </div>
                  <button
                    onClick={handleDownloadSampleDoc}
                    className="bg-indigo-600 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-700 transition-all flex items-center gap-1.5 shadow-sm shadow-indigo-100"
                  >
                    <Download size={14} /> Tải file mẫu (.docx)
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Cách 1: Tải lên tệp văn bản</label>
                    <div className="border-2 border-dashed border-gray-305 border-gray-300 p-4 rounded-xl hover:border-indigo-400 transition-colors flex flex-col items-center justify-center bg-gray-50 cursor-pointer relative min-h-[96px]">
                      <Upload size={24} className="text-gray-400 mb-1" />
                      <span className="text-[10px] text-gray-500 font-semibold uppercase">Chọn tệp (.txt / .doc / .docx)</span>
                      <input 
                        type="file" 
                        accept=".txt,.doc,.docx" 
                        onChange={handleWordFileChange}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Phân loại dưới Thư mục</label>
                    <select
                      value={manualFolderId}
                      onChange={(e) => setManualFolderId(e.target.value)}
                      className="w-full px-4 py-3.5 border border-gray-300 rounded-xl text-sm"
                    >
                      <option value="">-- Không phân loại --</option>
                      {getFolderDropdownList(visibleFolders).map(f => (
                        <option key={f.id} value={f.id}>
                          {"\u00A0\u00A0".repeat(f.level * 2)}{f.level > 0 ? "↳ " : ""}📁 {f.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Cách 2: Sao chép dán trực tiếp nội dung file Word</label>
                  <textarea
                    value={importText}
                    onChange={(e) => handleImportTextChange(e.target.value)}
                    placeholder="Mở tài liệu Word của bạn, sao chép nội dung rồi dán (Ctrl+V) vào ô này..."
                    rows={6}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {previewQuestions.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-emerald-600 uppercase flex items-center gap-1">
                      <Check size={14} /> Hệ thống đã tách được ({previewQuestions.length}) câu hỏi:
                    </p>
                    <div className="max-h-48 overflow-y-auto border border-emerald-150 rounded-xl p-3 bg-emerald-50/20 space-y-3">
                      {previewQuestions.map((q, idx) => (
                        <div key={idx} className="bg-white p-3 rounded-xl border border-emerald-100 text-xs shadow-sm">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-indigo-700 font-mono">[Phần {q.part}]</span>
                            <span className="text-gray-400">Câu {idx + 1}</span>
                          </div>
                          <div className="font-semibold text-gray-800 leading-normal mb-1.5"><SafeHtmlRenderer html={q.question} /></div>
                          {q.part === PartType.PART1 && (
                            <div className="text-[10px] text-gray-500 mt-1 grid grid-cols-1 md:grid-cols-2 gap-x-2 gap-y-1">
                              <span className="flex items-start gap-1"><b>A:</b> <SafeHtmlRenderer html={q.A} /></span>
                              <span className="flex items-start gap-1"><b>B:</b> <SafeHtmlRenderer html={q.B} /></span>
                              <span className="flex items-start gap-1"><b>C:</b> <SafeHtmlRenderer html={q.C} /></span>
                              <span className="flex items-start gap-1"><b>D:</b> <SafeHtmlRenderer html={q.D} /></span>
                              <span className="md:col-span-2 font-bold text-emerald-600 mt-0.5">Đáp án đúng: {q.answer as string}</span>
                            </div>
                          )}
                          {q.part === PartType.PART2 && q.statements && (
                            <div className="text-[10px] text-gray-500 mt-1 space-y-1">
                              <div className="flex items-start gap-1"><b>a.</b> <SafeHtmlRenderer html={q.statements.a} /> ({(q.answer as any).a ? "Đúng" : "Sai"})</div>
                              <div className="flex items-start gap-1"><b>b.</b> <SafeHtmlRenderer html={q.statements.b} /> ({(q.answer as any).b ? "Đúng" : "Sai"})</div>
                              <div className="flex items-start gap-1"><b>c.</b> <SafeHtmlRenderer html={q.statements.c} /> ({(q.answer as any).c ? "Đúng" : "Sai"})</div>
                              <div className="flex items-start gap-1"><b>d.</b> <SafeHtmlRenderer html={q.statements.d} /> ({(q.answer as any).d ? "Đúng" : "Sai"})</div>
                            </div>
                          )}
                          {q.part === PartType.PART3 && (
                            <div className="text-[10px] text-gray-500 mt-1 font-bold text-emerald-600">
                              Đáp án: {q.answer as string}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-6 pt-4 border-t border-gray-100">
                <button 
                  onClick={() => setIsWordImportModalOpen(false)} 
                  className="flex-1 py-2 text-gray-500 font-bold text-sm"
                >
                  Hủy bỏ
                </button>
                <button 
                  disabled={previewQuestions.length === 0}
                  onClick={saveImportedQuestions} 
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl font-bold text-sm transition-all shadow-sm"
                >
                  Lưu vào Ngân hàng ({previewQuestions.length})
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CUSTOM CONFIRM DIALOG */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-black/45 flex items-center justify-center p-4 z-[99999] font-sans">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            className="bg-white rounded-2xl p-6 w-full max-w-sm border border-gray-150 shadow-2xl"
          >
            <div className="flex items-start gap-3.5 mb-4">
              <div className="p-2.5 bg-rose-50 rounded-xl text-rose-600 shrink-0">
                <Info size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-905 text-gray-900">{confirmModal.title}</h3>
                <p className="text-xs text-gray-550 mt-1.5 leading-relaxed">{confirmModal.message}</p>
              </div>
            </div>
            <div className="flex gap-2.5 mt-5">
              <button
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="flex-1 py-1.5 border border-gray-200 text-gray-600 rounded-xl font-bold text-xs hover:bg-gray-50 transition-colors cursor-pointer text-center"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => {
                  confirmModal.onConfirm();
                  setConfirmModal(prev => ({ ...prev, isOpen: false }));
                }}
                className="flex-1 py-1.5 bg-rose-600 text-white rounded-xl font-bold text-xs hover:bg-rose-700 transition-colors shadow-sm cursor-pointer text-center"
              >
                Xác nhận
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* CUSTOM TOAST NOTIFICATION */}
      {toastNotification.isOpen && (
        <div className="fixed bottom-5 right-5 z-[100000] flex items-center gap-2.5 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-gray-800 text-xs font-semibold">
          {toastNotification.type === "success" && <Check className="text-green-400 shrink-0" size={16} />}
          {toastNotification.type === "error" && <X className="text-rose-400 shrink-0" size={16} />}
          {toastNotification.type === "info" && <Info className="text-indigo-400 shrink-0" size={16} />}
          <span>{toastNotification.message}</span>
        </div>
      )}
    </div>
  );
}

// ----------------- MAIN APP COMPONENT -----------------

export default function App() {
  const [view, setView] = useState<View>("home");
  const [user, setUser] = useState<{ name: string; sbd: string; role: "student" | "admin" | "teacher"; className?: string; teacherId?: string; isFree?: boolean } | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [questions, setQuestions] = useState<Question[]>(SAMPLE_QUESTIONS);
  const [students, setStudents] = useState<Student[]>([]);
  const [examRooms, setExamRooms] = useState<ExamRoom[]>([]);
  const [results, setResults] = useState<StudentResult[]>([]);
  const [currentExam, setCurrentExam] = useState<ExamRoom | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isExamStarted, setIsExamStarted] = useState(false);
  const [viewingResultId, setViewingResultId] = useState<string | null>(null);

  const [studentConfirm, setStudentConfirm] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {}
  });

  const showStudentConfirm = (title: string, message: string, onConfirm: () => void) => {
    setStudentConfirm({
      isOpen: true,
      title,
      message,
      onConfirm
    });
  };

  // Load data from SQLite database on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const foldersRes = await fetch("/api/folders");
        const foldersData = await foldersRes.json();
        setFolders(foldersData);

        const studentsRes = await fetch("/api/students");
        const studentsData = await studentsRes.json();
        setStudents(studentsData);

        const roomsRes = await fetch("/api/exam-rooms");
        const roomsData = await roomsRes.json();
        setExamRooms(roomsData);

        const resultsRes = await fetch("/api/results");
        const resultsData = await resultsRes.json();
        setResults(resultsData);

        const teachersRes = await fetch("/api/teachers");
        const teachersData = await teachersRes.json();
        setTeachers(teachersData);

        const questionsRes = await fetch("/api/questions");
        const questionsData = await questionsRes.json();
        if (questionsData.length === 0) {
          // If empty, seed database on server with default sample questions
          await fetch("/api/questions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(SAMPLE_QUESTIONS)
          });
          setQuestions(SAMPLE_QUESTIONS);
        } else {
          setQuestions(questionsData);
        }
      } catch (err) {
        console.error("Failed to load data from SQLite backend, using local defaults:", err);
      }
    };
    loadData();
  }, []);

  // Timer logic for exam
  useEffect(() => {
    let timer: any;
    if (isExamStarted && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isExamStarted) {
      submitExam();
    }
    return () => clearInterval(timer);
  }, [isExamStarted, timeLeft]);

  // Periodic background check to sync active exams & results for student-home view
  useEffect(() => {
    if (view !== "student-home") return;
    const interval = setInterval(async () => {
      try {
        const roomsRes = await fetch("/api/exam-rooms");
        if (roomsRes.ok) {
          const roomsData = await roomsRes.json();
          setExamRooms(roomsData);
        }
        const resultsRes = await fetch("/api/results");
        if (resultsRes.ok) {
          const resultsData = await resultsRes.json();
          setResults(resultsData);
        }
      } catch (err) {
        console.error("Failed to background-sync exam rooms or results:", err);
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [view]);

  const handleStudentLogin = (name: string, sbd: string, isFree?: boolean) => {
    // Validate SBD if student list is populated and not free student
    if (!isFree && students.length > 0) {
       // Search by SBD (trimmed, case-insensitive)
       let student = students.find(s => s.id.trim().toLowerCase() === sbd.trim().toLowerCase());
       
       // Fallback: Search by student's name (trimmed, case-insensitive)
       if (!student && name.trim()) {
         student = students.find(s => s.name.trim().toLowerCase() === name.trim().toLowerCase());
       }

       if (!student) {
         alert("Số báo danh hoặc Họ tên không tồn tại trong danh sách thí sinh đã được khai báo!");
         return;
       }
       setUser({ 
         name: student.name, 
         sbd: student.id, 
         role: "student", 
         className: student.className, 
         teacherId: student.teacherId,
         isFree: false
       });
    } else {
      setUser({ name, sbd, role: "student", isFree: true });
    }
    setView("student-home");
  };

  const handleFreeStudentDirectStart = (name: string, sbd: string, examCode: string) => {
    setUser({ name, sbd, role: "student", isFree: true });
    const room = examRooms.find(r => r.code.toUpperCase() === examCode.toUpperCase());
    if (!room) {
      alert("Phòng thi không tồn tại!");
      setView("home");
      return;
    }
    setViewingResultId(null);
    setCurrentExam(room);
    setTimeLeft(room.duration * 60);
    setAnswers({});
    setIsExamStarted(true);
    setView("exam");
  };

  const handleAdminLogin = (password: string) => {
    if (password === "admin123") {
      setUser({ name: "Teacher / Administrator", sbd: "ADMIN", role: "admin" });
      setView("admin-dashboard");
    } else {
      alert("Mật khẩu admin không chính xác!");
    }
  };

  const handleTeacherLogin = (teacherId: string, password: string) => {
    const teacher = teachers.find(t => t.id.toLowerCase() === teacherId.toLowerCase() && t.password === password);
    if (teacher) {
      setUser({ name: teacher.name, sbd: teacher.id, role: "teacher", className: teacher.className });
      setView("admin-dashboard");
    }
  };

  const handleTeacherRegister = (teacher: Teacher) => {
    setTeachers(prev => [...prev.filter(t => t.id !== teacher.id), teacher]);
    fetch("/api/teachers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(teacher)
    }).catch(err => console.error("Error registering teacher:", err));
  };

  const handleViewResultDetail = (result: StudentResult) => {
    const examId = result.examId || result.answers?._examId;
    const examResolved = examRooms.find(e => e.id === examId);
    if (examResolved) {
      setCurrentExam(examResolved);
    } else {
      setCurrentExam({
        id: examId || "fallback_free",
        name: result.examName || "Bài thi tự do",
        code: "",
        duration: 45,
        questionIds: Object.keys(result.answers).filter(k => !k.startsWith("_")),
        isActive: false,
        allowReview: true
      });
    }
    setViewingResultId(result.id);
    setView("result");
  };

  const startExam = async (examCode: string) => {
    let latestRooms = examRooms;
    try {
      const roomsRes = await fetch("/api/exam-rooms");
      if (roomsRes.ok) {
        latestRooms = await roomsRes.json();
        setExamRooms(latestRooms);
      }
    } catch (err) {
      console.error("Could not fetch latest exam rooms before starting:", err);
    }

    const room = latestRooms.find(r => r.code.toUpperCase() === examCode.toUpperCase() && r.isActive);
    if (!room) {
      alert("Mã phòng thi không chính xác, phòng thi này đã bị xóa hoặc đang tạm thời đóng!");
      return;
    }

    // Verify visibility/ownership permissions for student
    if (user?.role === "student") {
      const isDemoExam = room.id.startsWith("demo-") || ["TOAN2026", "LY2026", "ENG2026"].includes(room.code.toUpperCase());
      const isFreeExamAvailable = isDemoExam || room.isFree;
      if (user.isFree && !isFreeExamAvailable) {
        alert("Phòng thi này là phòng thi chính thức của lớp học. Thí sinh tự do không được phép tham gia!");
        return;
      }
      if (!user.isFree && isDemoExam) {
        alert("Đây là đề ôn luyện tự do/thực hành, vui lòng đăng nhập tài khoản Thí sinh tự do để làm đề này!");
        return;
      }
      if (!user.isFree && room.teacherId && room.teacherId !== user.teacherId) {
        alert("Bạn không thuộc danh sách thí sinh được tham gia phòng thi của giáo viên này!");
        return;
      }
    }

    const now = new Date();
    if (room.startTime) {
      const start = new Date(room.startTime);
      if (now < start) {
        alert(`Phòng thi chưa đến giờ bắt đầu! \nThời gian bắt đầu: ${new Date(room.startTime).toLocaleString('vi-VN')}`);
        return;
      }
    }
    if (room.endTime) {
      const end = new Date(room.endTime);
      if (now > end) {
        alert(`Phòng thi đã kết thúc thời gian thi! \nThời gian kết thúc: ${new Date(room.endTime).toLocaleString('vi-VN')}`);
        return;
      }
    }

    setViewingResultId(null);
    setCurrentExam(room);
    setTimeLeft(room.duration * 60);
    setAnswers({});
    setIsExamStarted(true);
    setView("exam");
  };

  const submitExam = () => {
    if (!currentExam || !user) return;

    let part1Score = 0;
    let part2Score = 0;
    let part3Score = 0;

    const examQuestions = questions.filter(q => currentExam.questionIds.includes(q.id));

    const p1Pt = typeof currentExam.part1Point === 'number' ? currentExam.part1Point : 0.25;
    const p2Pt1 = typeof currentExam.part2Point1 === 'number' ? currentExam.part2Point1 : 0.1;
    const p2Pt2 = typeof currentExam.part2Point2 === 'number' ? currentExam.part2Point2 : 0.25;
    const p2Pt3 = typeof currentExam.part2Point3 === 'number' ? currentExam.part2Point3 : 0.5;
    const p2Pt4 = typeof currentExam.part2Point4 === 'number' ? currentExam.part2Point4 : 1.0;
    const p3Pt = typeof currentExam.part3Point === 'number' ? currentExam.part3Point : 0.5;

    examQuestions.forEach(q => {
      const userAnswer = answers[q.id];
      if (q.part === PartType.PART1) {
        if (userAnswer === q.answer) part1Score += p1Pt;
      } else if (q.part === PartType.PART2) {
        if (typeof userAnswer === 'object' && typeof q.answer === 'object') {
          let correctCount = 0;
          ['a', 'b', 'c', 'd'].forEach(key => {
            if (userAnswer[key] === (q.answer as any)[key]) correctCount++;
          });
          if (correctCount === 1) part2Score += p2Pt1;
          else if (correctCount === 2) part2Score += p2Pt2;
          else if (correctCount === 3) part2Score += p2Pt3;
          else if (correctCount === 4) part2Score += p2Pt4;
        }
      } else if (q.part === PartType.PART3) {
        if (userAnswer?.toString().trim().toLowerCase() === q.answer?.toString().trim().toLowerCase()) {
          part3Score += p3Pt;
        }
      }
    });

    const totalScore = part1Score + part2Score + part3Score;

    const result: StudentResult = {
      id: Date.now().toString(),
      studentName: user.name,
      studentId: user.sbd,
      score: totalScore,
      part1Score,
      part2Score,
      part3Score,
      timestamp: new Date().toISOString(),
      answers: { ...answers, _examId: currentExam.id, _examName: currentExam.name },
      examId: currentExam.id,
      examName: currentExam.name
    };

    setResults(prev => [...prev, result]);
    fetch("/api/results", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result)
    }).catch(err => console.error("Error submitting result to SQLite database:", err));
    
    // Clear session-based attempt seed so retaking or next login gets freshly randomized shuffled sequence
    try {
      const sessionKey = `exam-attempt-seed-${currentExam.id}-${user.sbd}`;
      sessionStorage.removeItem(sessionKey);
    } catch (e) {}

    setIsExamStarted(false);
    setView("result");
  };

  const logout = () => {
    if (user && currentExam) {
      try {
        const sessionKey = `exam-attempt-seed-${currentExam.id}-${user.sbd}`;
        sessionStorage.removeItem(sessionKey);
      } catch (e) {}
    }
    setUser(null);
    setView("home");
    setIsExamStarted(false);
  };

  return (
    <div className="antialiased text-gray-900 font-sans">
      <AnimatePresence mode="wait">
        {view === "home" && (
          <HomeView 
            key="home"
            examRooms={examRooms}
            questions={questions}
            folders={folders}
            onStartExam={startExam}
            onStudentLogin={handleStudentLogin}
            onNavigateToLogin={() => setView("login")}
            onNavigateToAdmin={() => setView("admin-login")}
            onStartFreeExamDirectly={handleFreeStudentDirectStart}
            setExamRooms={setExamRooms}
          />
        )}
        {view === "login" && (
          <Login 
            key="login"
            students={students}
            onStudentLogin={handleStudentLogin}
            onGoToAdmin={() => setView("admin-login")}
            onBackToHome={() => setView("home")}
          />
        )}
        {view === "admin-login" && (
          <AdminLogin 
            key="admin-login"
            teachers={teachers}
            onAdminLogin={handleAdminLogin}
            onTeacherLogin={handleTeacherLogin}
            onTeacherRegister={handleTeacherRegister}
            onBack={() => setView("login")}
          />
        )}
        {view === "student-home" && (
          <StudentHome 
            key="student-home"
            user={user}
            results={results}
            examRooms={examRooms}
            onStartExam={startExam}
            onLogout={logout}
            onViewResultDetail={handleViewResultDetail}
          />
        )}
        {view === "admin-dashboard" && (
          <AdminDashboard 
            key="admin-dashboard"
            user={user}
            teachers={teachers}
            setTeachers={setTeachers}
            folders={folders}
            setFolders={setFolders}
            questions={questions}
            setQuestions={setQuestions}
            students={students}
            setStudents={setStudents}
            examRooms={examRooms}
            setExamRooms={setExamRooms}
            results={results}
            setResults={setResults}
            onViewResultDetail={handleViewResultDetail}
            onLogout={logout}
          />
        )}
        {view === "exam" && currentExam && (
          <ExamView 
            key="exam"
            currentExam={currentExam}
            questions={questions}
            user={user}
            timeLeft={timeLeft}
            answers={answers}
            setAnswers={setAnswers}
            onSubmitExam={submitExam}
            showConfirm={showStudentConfirm}
          />
        )}
        {view === "result" && (
          <ResultView 
            key="result"
            results={results}
            onGoToHome={() => {
              if (user?.role === "teacher" || user?.role === "admin") {
                setView("admin-dashboard");
              } else {
                setView("student-home");
              }
            }}
            questions={questions}
            currentExam={
              (user?.role === "teacher" || user?.role === "admin") && viewingResultId
                ? (examRooms.find(room => room.id === results.find(r => r.id === viewingResultId)?.examId) || null)
                : currentExam
            }
            viewingResultId={viewingResultId}
          />
        )}
      </AnimatePresence>

      {/* STUDENT SUBMIT CONFIRMATION OVERLAY */}
      {studentConfirm.isOpen && (
        <div className="fixed inset-0 bg-black/45 flex items-center justify-center p-4 z-[99999] font-sans">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            className="bg-white rounded-2xl p-6 w-full max-w-sm border border-gray-150 shadow-2xl"
          >
            <div className="flex items-start gap-3.5 mb-4">
              <div className="p-2.5 bg-green-50 rounded-xl text-green-650 shrink-0">
                <Info size={20} className="text-green-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">{studentConfirm.title}</h3>
                <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{studentConfirm.message}</p>
              </div>
            </div>
            <div className="flex gap-2.5 mt-5">
              <button
                onClick={() => setStudentConfirm(prev => ({ ...prev, isOpen: false }))}
                className="flex-1 py-1.5 border border-gray-200 text-gray-600 rounded-xl font-bold text-xs hover:bg-gray-50 transition-colors cursor-pointer text-center"
              >
                 Hủy bỏ
              </button>
              <button
                onClick={() => {
                  studentConfirm.onConfirm();
                  setStudentConfirm(prev => ({ ...prev, isOpen: false }));
                }}
                className="flex-1 py-1.5 bg-green-600 text-white rounded-xl font-bold text-xs hover:bg-green-700 transition-colors shadow-sm cursor-pointer text-center"
              >
                Xác nhận
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
