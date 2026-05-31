"use client";

import Link from "next/link";
import React, { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Wallet,
  Users,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Trash2,
  TrendingUp,
  X,
  DollarSign,
  ArrowLeftFromLine,
  ChevronDown,
  ChevronRight,
  Receipt,
  UserCheck,
  Activity,
  PiggyBank,
  PieChart,
  Calendar,
  Loader2,
  LogOut,
} from "lucide-react";
import {
  createDebtor,
  createTransaction,
  deleteTransaction,
  deleteDebtor,
  getMonthlySummary,
  getAvailableMonths,
} from "./actions";

// --- Types ---
interface Debtor {
  id: number;
  name: string;
  note?: string | null;
  totalDebt: number;
  createdAt: string;
  updatedAt: string;
}

interface Transaction {
  id: number;
  debtorId?: number | null;
  type: "income" | "expense" | "debt_payment" | "debt_add" | string;
  amount: number;
  description?: string | null;
  createdAt: string | Date;
}

interface MonthlySummary {
  incomeTotal: number;
  expenseTotal: number;
  profit: number;
  transactions: Transaction[];
}

interface AdminClientProps {
  initialDebtors: Debtor[];
  initialTransactions: Transaction[];
  stats: {
    netProfit: number;
    totalIncome: number;
    totalExpense: number;
    totalOutstandingDebt: number;
  };
}

type ActiveView =
  | "overview"
  | "cashflow_summary"
  | "cashflow_income"
  | "cashflow_expense"
  | "cashflow_all"
  | "cashflow_monthly"
  | "debtors_list"
  | "debtors_activity";

interface SidebarSection {
  id: string;
  label: string;
  icon: React.ElementType;
  children: { id: ActiveView; label: string; icon: React.ElementType }[];
}

export default function AdminClient({
  initialDebtors,
  initialTransactions,
  stats,
}: AdminClientProps) {
  const router = useRouter();

  const [activeView, setActiveView] = useState<ActiveView>("overview");
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    cashflow: true,
    debtors: true,
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isOpenTxModal, setIsOpenTxModal] = useState(false);
  const [isOpenDebtorModal, setIsOpenDebtorModal] = useState(false);

  const [txForm, setTxForm] = useState({
    type: "income",
    amount: "",
    description: "",
    debtorId: "",
  });

  const [debtorForm, setDebtorForm] = useState({
    name: "",
    note: "",
    initialDebt: "",
  });

  // ---- Monthly View States ----
  const [monthlyView, setMonthlyView] = useState<string>(""); // "YYYY-MM"
  const [monthlyData, setMonthlyData] = useState<MonthlySummary | null>(null);
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [loadingMonthly, setLoadingMonthly] = useState(false);

  // โหลดเดือนที่มีข้อมูลตอน mount
  useEffect(() => {
    getAvailableMonths().then(setAvailableMonths);
  }, []);

  // เมื่อเลือกเดือน → โหลดสรุป
  useEffect(() => {
    if (!monthlyView) return;
    const [year, month] = monthlyView.split("-").map(Number);
    setLoadingMonthly(true);
    getMonthlySummary(month, year).then((data) => {
      setMonthlyData(data);
      setLoadingMonthly(false);
    });
  }, [monthlyView]);

  const sidebarSections: SidebarSection[] = [
    {
      id: "cashflow",
      label: "บัญชีรับ-จ่าย",
      icon: Wallet,
      children: [
        { id: "cashflow_summary", label: "ภาพรวม", icon: PieChart },
        { id: "cashflow_all", label: "ทั้งหมด", icon: Receipt },
        { id: "cashflow_income", label: "รายรับ", icon: ArrowUpRight },
        { id: "cashflow_expense", label: "รายจ่าย", icon: ArrowDownLeft },
        { id: "cashflow_monthly", label: "รายเดือน", icon: Calendar },
      ],
    },
    {
      id: "debtors",
      label: "ลูกหนี้",
      icon: Users,
      children: [
        { id: "debtors_list", label: "รายชื่อลูกหนี้", icon: UserCheck },
        { id: "debtors_activity", label: "ความเคลื่อนไหวหนี้", icon: Activity },
      ],
    },
  ];

  const toggleSection = (id: string) => {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleNavClick = (view: ActiveView) => {
    setActiveView(view);
    setIsSidebarOpen(false);
  };

  const handleTxSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txForm.amount || parseFloat(txForm.amount) <= 0)
      return alert("กรุณากรอกจำนวนเงินให้ถูกต้อง");
    startTransition(async () => {
      const res = await createTransaction({
        type: txForm.type,
        amount: parseFloat(txForm.amount),
        description: txForm.description,
        debtorId: txForm.debtorId ? parseInt(txForm.debtorId) : null,
      });
      if (res?.success) {
        setIsOpenTxModal(false);
        setTxForm({ type: "income", amount: "", description: "", debtorId: "" });
        router.refresh();
      } else {
        alert((res as any)?.error || "เกิดข้อผิดพลาด");
      }
    });
  };

  const handleDebtorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!debtorForm.name.trim()) return alert("กรุณากรอกชื่อลูกหนี้");
    startTransition(async () => {
      const res = await createDebtor(
        debtorForm.name,
        debtorForm.note,
        debtorForm.initialDebt ? parseFloat(debtorForm.initialDebt) : 0
      );
      if (res?.success) {
        setIsOpenDebtorModal(false);
        setDebtorForm({ name: "", note: "", initialDebt: "" });
        router.refresh();
      } else {
        alert((res as any)?.error || "เกิดข้อผิดพลาด");
      }
    });
  };

  const openActionForDebtor = (
    debtorId: number,
    type: "debt_payment" | "debt_add"
  ) => {
    setTxForm({
      type,
      amount: "",
      description: type === "debt_payment" ? "ชำระคืนหนี้" : "ยืมเงินเพิ่ม",
      debtorId: debtorId.toString(),
    });
    setIsOpenTxModal(true);
  };

  const handleDeleteDebtor = async (debtorId: number, debtorName: string) => {
    if (!confirm(`คุณแน่ใจหรือไม่ที่จะลบ "${debtorName}"?\nการกระทำนี้ไม่สามารถกู้คืนได้`))
      return;
    const res = await deleteDebtor(debtorId);
    if (res?.success) {
      router.refresh();
    } else {
      alert((res as any)?.error || "ไม่สามารถลบลูกหนี้ได้");
    }
  };

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    router.push("/");
  };

  const getTransactionBadge = (type: string) => {
    switch (type) {
      case "income":
        return { label: "รายรับ", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" };
      case "debt_payment":
        return { label: "ชำระหนี้", color: "text-teal-400 bg-teal-500/10 border-teal-500/20" };
      case "expense":
        return { label: "รายจ่าย", color: "text-rose-400 bg-rose-500/10 border-rose-500/20" };
      case "debt_add":
        return { label: "ให้ยืมเพิ่ม", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" };
      default:
        return { label: type, color: "text-zinc-400 bg-zinc-500/10 border-zinc-500/20" };
    }
  };

  const txTypeOptions = [
    { value: "income", label: "รายรับ", icon: ArrowUpRight, active: "text-emerald-400 border-emerald-400/40 bg-emerald-400/5" },
    { value: "expense", label: "รายจ่าย", icon: ArrowDownLeft, active: "text-rose-400 border-rose-400/40 bg-rose-400/5" },
    { value: "debt_payment", label: "รับชำระหนี้", icon: DollarSign, active: "text-teal-400 border-teal-400/40 bg-teal-400/5" },
    { value: "debt_add", label: "ให้ยืมเพิ่ม", icon: Plus, active: "text-amber-400 border-amber-400/40 bg-amber-400/5" },
  ];

  // ---- แก้ไขการคำนวณให้ใช้ค่าบวกสำหรับรายจ่าย ----
  const incomeTransactions = initialTransactions.filter((t) => t.type === "income");
  const expenseTransactions = initialTransactions.filter((t) => t.type === "expense");
  const debtTransactions = initialTransactions.filter((t) => t.type === "debt_payment" || t.type === "debt_add");

  const incomeTotal = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
  const expenseTotal = expenseTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const cashflowProfit = incomeTotal - expenseTotal;

  const getPageTitle = () => {
    switch (activeView) {
      case "overview": return { sub: "แผงควบคุม", main: "ภาพรวมของระบบ" };
      case "cashflow_summary": return { sub: "บัญชีรับ-จ่าย", main: "ภาพรวมรายรับ-รายจ่าย" };
      case "cashflow_all": return { sub: "บัญชีรับ-จ่าย", main: "รายการธุรกรรมทั้งหมด" };
      case "cashflow_income": return { sub: "บัญชีรับ-จ่าย", main: "รายรับ" };
      case "cashflow_expense": return { sub: "บัญชีรับ-จ่าย", main: "รายจ่าย" };
      case "cashflow_monthly": return { sub: "บัญชีรับ-จ่าย", main: "สรุปรายเดือน" };
      case "debtors_list": return { sub: "ลูกหนี้", main: "รายชื่อและยอดค้างชำระ" };
      case "debtors_activity": return { sub: "ลูกหนี้", main: "ความเคลื่อนไหวหนี้" };
    }
  };

  const pageTitle = getPageTitle();

  const TransactionTable = ({ transactions }: { transactions: Transaction[] }) => (
    <div className="bg-[#121418] border border-zinc-900 rounded-2xl overflow-x-auto">
      {transactions.length === 0 ? (
        <div className="py-16 text-center text-zinc-600 text-xs tracking-widest">ไม่มีรายการ</div>
      ) : (
        <table className="w-full text-left border-collapse min-w-[560px]">
          <thead>
            <tr className="border-b border-zinc-900 bg-[#16191E]">
              <th className="py-3 px-3 sm:py-4 sm:px-5 text-[10px] font-medium tracking-widest text-zinc-500">ประเภท</th>
              <th className="py-3 px-3 sm:py-4 sm:px-5 text-[10px] font-medium tracking-widest text-zinc-500">รายละเอียด</th>
              <th className="py-3 px-3 sm:py-4 sm:px-5 text-[10px] font-medium tracking-widest text-zinc-500">วันที่</th>
              <th className="py-3 px-3 sm:py-4 sm:px-5 text-[10px] font-medium tracking-widest text-zinc-500 text-right">จำนวนเงิน</th>
              <th className="py-3 px-3 sm:py-4 sm:px-5 text-[10px] font-medium tracking-widest text-zinc-500 text-center">ลบ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900/60">
            {transactions.map((t) => {
              const badge = getTransactionBadge(t.type);
              const isInflow = t.type === "income" || t.type === "debt_payment";
              const displayAmount = isInflow ? t.amount : Math.abs(t.amount);
              const prefix = isInflow ? "+" : "-";
              return (
                <tr key={t.id} className="hover:bg-zinc-900/20 transition-colors group">
                  <td className="py-2.5 px-3 sm:py-3.5 sm:px-5">
                    <span className={`text-[10px] px-2 py-0.5 rounded border whitespace-nowrap ${badge.color}`}>{badge.label}</span>
                  </td>
                  <td className="py-2.5 px-3 sm:py-3.5 sm:px-5 text-xs text-zinc-300 font-light">{t.description || "—"}</td>
                  <td className="py-2.5 px-3 sm:py-3.5 sm:px-5 text-[11px] text-zinc-500 font-light whitespace-nowrap">
                    {new Date(t.createdAt).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" })}
                  </td>
                  <td className={`py-2.5 px-3 sm:py-3.5 sm:px-5 text-xs font-mono text-right font-light whitespace-nowrap ${isInflow ? "text-emerald-400" : "text-rose-400"}`}>
                    {prefix}฿{displayAmount.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 sm:py-3.5 sm:px-5 text-center">
                    <button
                      onClick={async () => {
                        if (!confirm("ยืนยันการลบรายการนี้?")) return;
                        const res = await deleteTransaction(t.id);
                        if (!res?.success) alert((res as any)?.error);
                        else router.refresh();
                      }}
                      className="text-zinc-700 hover:text-rose-400 p-1.5 rounded transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="px-6 py-7 border-b border-zinc-900">
        <p className="text-[9px] tracking-[0.4em] text-zinc-600 uppercase font-bold">พื้นที่ทำงาน</p>
        <h2 className="text-sm font-light text-zinc-200 tracking-wider mt-1">AUNOB STORE</h2>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <button
          onClick={() => handleNavClick("overview")}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs tracking-wide transition-all ${
            activeView === "overview" ? "bg-zinc-800/80 text-zinc-100 border border-zinc-700/40" : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/60"
          }`}
        >
          <LayoutDashboard size={14} className={activeView === "overview" ? "text-zinc-300" : "text-zinc-600"} />
          <span className="font-light">ภาพรวม</span>
        </button>
        {sidebarSections.map((section) => {
          const SectionIcon = section.icon;
          const isOpen = openSections[section.id];
          const isChildActive = section.children.some((c) => c.id === activeView);
          return (
            <div key={section.id}>
              <button
                onClick={() => toggleSection(section.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs tracking-wide transition-all group ${
                  isChildActive && !isOpen ? "text-zinc-200 bg-zinc-900/60" : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/40"
                }`}
              >
                <div className="flex items-center gap-3">
                  <SectionIcon size={14} className={isChildActive ? "text-zinc-400" : "text-zinc-600 group-hover:text-zinc-500"} />
                  <span className="font-light">{section.label}</span>
                </div>
                {isOpen ? <ChevronDown size={12} className="text-zinc-600" /> : <ChevronRight size={12} className="text-zinc-600" />}
              </button>
              {isOpen && (
                <div className="ml-4 mt-0.5 pl-3 border-l border-zinc-800/60 space-y-0.5">
                  {section.children.map((child) => {
                    const ChildIcon = child.icon;
                    const isActive = activeView === child.id;
                    return (
                      <button
                        key={child.id}
                        onClick={() => handleNavClick(child.id)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[11px] tracking-wide transition-all ${
                          isActive ? "bg-zinc-800/70 text-zinc-100 border border-zinc-700/30" : "text-zinc-600 hover:text-zinc-300 hover:bg-zinc-900/50"
                        }`}
                      >
                        <ChildIcon size={12} className={isActive ? "text-zinc-300" : "text-zinc-700"} />
                        <span className="font-light">{child.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
      <div className="px-3 py-4 border-t border-zinc-900 space-y-2">
        <Link href="/">
          <button className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs text-zinc-600 hover:text-zinc-300 hover:bg-zinc-900/40 transition-all">
            <ArrowLeftFromLine size={14} />
            <span className="font-light">กลับหน้าหลัก</span>
          </button>
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all"
        >
          <LogOut size={14} />
          <span className="font-light">ออกจากระบบ</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#0B0C0E] text-[#E4E6EB] font-sans antialiased">
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex w-56 lg:w-64 border-r border-zinc-900 bg-[#0F1013] flex-col fixed h-full z-10 shrink-0">
        <SidebarContent />
      </aside>
      {/* MOBILE SIDEBAR OVERLAY */}
      {isSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
          <aside className="relative w-64 bg-[#0F1013] border-r border-zinc-900 flex flex-col z-10 h-full">
            <button onClick={() => setIsSidebarOpen(false)} className="absolute top-4 right-4 text-zinc-600 hover:text-zinc-300">
              <X size={16} />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}
      {/* MAIN CONTENT */}
      <main className="flex-1 md:pl-56 lg:pl-64 min-h-screen pb-10">
        {/* TOP BAR */}
        <div className="sticky top-0 z-30 bg-[#0B0C0E]/90 backdrop-blur-sm border-b border-zinc-900">
          <div className="max-w-5xl mx-auto px-4 sm:px-5 md:px-8 py-3 sm:py-4 flex items-center justify-between gap-2 sm:gap-4">
            <button className="md:hidden flex flex-col gap-1 p-1.5 shrink-0" onClick={() => setIsSidebarOpen(true)}>
              <span className="w-4 h-px bg-zinc-400" />
              <span className="w-4 h-px bg-zinc-400" />
              <span className="w-3 h-px bg-zinc-400" />
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] tracking-[0.3em] text-zinc-600 uppercase font-medium hidden sm:block">{pageTitle.sub}</p>
              <h1 className="text-sm md:text-base font-light text-zinc-100 tracking-wide truncate">{pageTitle.main}</h1>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <button onClick={() => setIsOpenTxModal(true)} className="flex items-center gap-1 sm:gap-1.5 bg-zinc-100 text-zinc-950 hover:bg-white px-2 sm:px-3 py-1.5 rounded-lg text-xs font-normal transition-all">
                <Plus size={13} />
                <span className="hidden sm:inline">บันทึกธุรกรรม</span>
              </button>
              <button onClick={() => setIsOpenDebtorModal(true)} className="flex items-center gap-1 sm:gap-1.5 border border-zinc-800 bg-zinc-900/50 text-zinc-200 hover:bg-zinc-800 px-2 sm:px-3 py-1.5 rounded-lg text-xs font-normal transition-all">
                <Users size={13} />
                <span className="hidden sm:inline">เพิ่มลูกหนี้</span>
              </button>
              <Link href="/" className="hidden sm:flex items-center gap-1.5 border border-zinc-800 bg-zinc-900/50 text-zinc-200 hover:bg-zinc-800 px-3 py-1.5 rounded-lg text-xs font-normal transition-all">
                <ArrowLeftFromLine size={13} />
                <span className="hidden sm:inline">กลับหน้าหลัก</span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 sm:gap-1.5 border border-zinc-800 bg-zinc-900/50 text-zinc-200 hover:bg-zinc-800 hover:text-red-400 px-2 sm:px-3 py-1.5 rounded-lg text-xs font-normal transition-all"
                title="ออกจากระบบ"
              >
                <LogOut size={13} />
                <span className="hidden sm:inline">ออกจากระบบ</span>
              </button>
            </div>
          </div>
        </div>

        {/* PAGE CONTENT */}
        <div className="max-w-5xl mx-auto px-4 sm:px-5 md:px-8 py-6 sm:py-8 space-y-6 animate-in fade-in duration-300">
          {/* ─── OVERVIEW ─── */}
          {activeView === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: "กำไรสุทธิ", value: stats.netProfit, color: "text-zinc-100", icon: TrendingUp, iconColor: "text-zinc-500", border: "border-zinc-800/50" },
                  { label: "รายรับ", value: stats.totalIncome, color: "text-emerald-400", icon: ArrowUpRight, iconColor: "text-emerald-600", border: "border-emerald-900/30" },
                  { label: "รายจ่าย", value: stats.totalExpense, color: "text-rose-400", icon: ArrowDownLeft, iconColor: "text-rose-600", border: "border-rose-900/30" },
                  { label: "ยอดหนี้ค้างชำระ", value: stats.totalOutstandingDebt, color: "text-amber-400", icon: PiggyBank, iconColor: "text-amber-600", border: "border-amber-900/30" },
                ].map(({ label, value, color, icon: Icon, iconColor, border }) => (
                  <div key={label} className={`bg-[#121418] border ${border} rounded-2xl p-3 sm:p-4 md:p-5`}>
                    <div className="flex justify-between items-start">
                      <p className="text-[9px] md:text-[10px] tracking-widest text-zinc-500 font-light leading-relaxed">{label}</p>
                      <Icon size={14} className={iconColor} />
                    </div>
                    <p className={`text-lg sm:text-xl md:text-2xl font-light mt-2 sm:mt-3 ${color}`}>฿{value.toLocaleString()}</p>
                  </div>
                ))}
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-[#121418] border border-zinc-900 rounded-2xl p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[10px] tracking-widest text-zinc-400 font-light">รายรับ-จ่ายล่าสุด</h3>
                    <button onClick={() => setActiveView("cashflow_all")} className="text-[10px] text-zinc-600 hover:text-zinc-300 transition-colors">ดูทั้งหมด →</button>
                  </div>
                  <div className="divide-y divide-zinc-900/40 space-y-0">
                    {initialTransactions.filter((t) => t.type === "income" || t.type === "expense").slice(0, 5).map((t) => {
                      const isInflow = t.type === "income";
                      const displayAmount = isInflow ? t.amount : Math.abs(t.amount);
                      return (
                        <div key={t.id} className="flex justify-between items-center py-2.5 sm:py-3 first:pt-0 last:pb-0">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${isInflow ? "bg-emerald-500" : "bg-rose-500"}`} />
                            <p className="text-xs text-zinc-300 font-light truncate">{t.description || "ไม่ระบุ"}</p>
                          </div>
                          <span className={`text-xs font-mono ml-3 shrink-0 ${isInflow ? "text-emerald-400" : "text-rose-400"}`}>
                            {isInflow ? "+" : "-"}฿{displayAmount.toLocaleString()}
                          </span>
                        </div>
                      );
                    })}
                    {initialTransactions.filter((t) => t.type === "income" || t.type === "expense").length === 0 && (
                      <p className="text-zinc-600 text-xs py-4 text-center">ยังไม่มีรายการ</p>
                    )}
                  </div>
                </div>
                <div className="bg-[#121418] border border-zinc-900 rounded-2xl p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[10px] tracking-widest text-zinc-400 font-light">ความเคลื่อนไหวหนี้ล่าสุด</h3>
                    <button onClick={() => setActiveView("debtors_activity")} className="text-[10px] text-zinc-600 hover:text-zinc-300 transition-colors">ดูทั้งหมด →</button>
                  </div>
                  <div className="divide-y divide-zinc-900/40">
                    {debtTransactions.slice(0, 5).map((t) => {
                      const isPay = t.type === "debt_payment";
                      const debtor = initialDebtors.find((d) => d.id === t.debtorId);
                      const displayAmount = isPay ? Math.abs(t.amount) : t.amount;
                      return (
                        <div key={t.id} className="flex justify-between items-center py-2.5 sm:py-3 first:pt-0 last:pb-0">
                          <div className="min-w-0">
                            <p className="text-xs text-zinc-300 font-light truncate">{debtor?.name || t.description || "—"}</p>
                            <p className="text-[10px] text-zinc-600 mt-0.5">{isPay ? "ชำระคืน" : "ยืมเพิ่ม"}</p>
                          </div>
                          <span className={`text-xs font-mono ml-3 shrink-0 ${isPay ? "text-teal-400" : "text-amber-400"}`}>
                            {isPay ? "-" : "+"}฿{displayAmount.toLocaleString()}
                          </span>
                        </div>
                      );
                    })}
                    {debtTransactions.length === 0 && <p className="text-zinc-600 text-xs py-4 text-center">ยังไม่มีรายการ</p>}
                  </div>
                </div>
              </div>
              <div className="bg-[#121418] border border-zinc-900 rounded-2xl p-4 sm:p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[10px] tracking-widest text-zinc-400 font-light">สรุปยอดลูกหนี้</h3>
                  <button onClick={() => setActiveView("debtors_list")} className="text-[10px] text-zinc-600 hover:text-zinc-300 transition-colors">จัดการ →</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {initialDebtors.slice(0, 6).map((d) => (
                    <div key={d.id} className="flex items-center gap-2 bg-zinc-900/60 border border-zinc-800/40 rounded-xl px-3 py-2">
                      <div className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center">
                        <span className="text-[9px] text-zinc-400">{d.name.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="text-[11px] text-zinc-300">{d.name}</p>
                        <p className="text-[10px] text-amber-400 font-mono">฿{d.totalDebt.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                  {initialDebtors.length === 0 && <p className="text-zinc-600 text-xs py-2">ยังไม่มีลูกหนี้ในระบบ</p>}
                </div>
              </div>
            </div>
          )}

          {/* ─── CASHFLOW SUMMARY ─── */}
          {activeView === "cashflow_summary" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { label: "รายรับ", value: incomeTotal, color: "text-emerald-400", icon: ArrowUpRight, iconColor: "text-emerald-600", border: "border-emerald-900/30" },
                  { label: "รายจ่าย", value: expenseTotal, color: "text-rose-400", icon: ArrowDownLeft, iconColor: "text-rose-600", border: "border-rose-900/30" },
                  { label: "กำไรสุทธิ", value: cashflowProfit, color: "text-zinc-100", icon: TrendingUp, iconColor: "text-zinc-500", border: "border-zinc-800/50" },
                ].map(({ label, value, color, icon: Icon, iconColor, border }) => (
                  <div key={label} className={`bg-[#121418] border ${border} rounded-2xl p-3 sm:p-4 md:p-5`}>
                    <div className="flex justify-between items-start">
                      <p className="text-[9px] md:text-[10px] tracking-widest text-zinc-500 font-light leading-relaxed">{label}</p>
                      <Icon size={14} className={iconColor} />
                    </div>
                    <p className={`text-lg sm:text-xl md:text-2xl font-light mt-2 sm:mt-3 ${color}`}>฿{value.toLocaleString()}</p>
                  </div>
                ))}
              </div>
              <TransactionTable transactions={[...incomeTransactions, ...expenseTransactions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())} />
            </div>
          )}

          {/* ─── CASHFLOW ALL ─── */}
          {activeView === "cashflow_all" && (
            <div className="space-y-4">
              <div className="flex gap-3 text-xs">
                <div className="bg-[#121418] border border-zinc-900 rounded-xl px-4 py-3">
                  <p className="text-zinc-600 text-[10px]">รายรับ</p>
                  <p className="text-emerald-400 font-mono mt-0.5">฿{incomeTotal.toLocaleString()}</p>
                </div>
                <div className="bg-[#121418] border border-zinc-900 rounded-xl px-4 py-3">
                  <p className="text-zinc-600 text-[10px]">รายจ่าย</p>
                  <p className="text-rose-400 font-mono mt-0.5">฿{expenseTotal.toLocaleString()}</p>
                </div>
              </div>
              <TransactionTable transactions={initialTransactions.filter((t) => t.type === "income" || t.type === "expense")} />
            </div>
          )}

          {/* ─── CASHFLOW INCOME ─── */}
          {activeView === "cashflow_income" && (
            <div className="space-y-4">
              <div className="bg-[#121418] border border-emerald-900/30 rounded-xl px-4 sm:px-5 py-3 sm:py-4 inline-flex items-center gap-3">
                <ArrowUpRight size={16} className="text-emerald-500" />
                <div>
                  <p className="text-[10px] text-zinc-500">รายรับทั้งหมด</p>
                  <p className="text-emerald-400 text-lg font-mono font-light">฿{incomeTotal.toLocaleString()}</p>
                </div>
              </div>
              <TransactionTable transactions={incomeTransactions} />
            </div>
          )}

          {/* ─── CASHFLOW EXPENSE ─── */}
          {activeView === "cashflow_expense" && (
            <div className="space-y-4">
              <div className="bg-[#121418] border border-rose-900/30 rounded-xl px-4 sm:px-5 py-3 sm:py-4 inline-flex items-center gap-3">
                <ArrowDownLeft size={16} className="text-rose-500" />
                <div>
                  <p className="text-[10px] text-zinc-500">รายจ่ายทั้งหมด</p>
                  <p className="text-rose-400 text-lg font-mono font-light">฿{expenseTotal.toLocaleString()}</p>
                </div>
              </div>
              <TransactionTable transactions={expenseTransactions} />
            </div>
          )}

          {/* ─── CASHFLOW MONTHLY ─── */}
          {activeView === "cashflow_monthly" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h2 className="text-lg font-semibold text-white">สรุปรายเดือน</h2>
                <div className="relative w-full sm:w-64">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
                  <select
                    value={monthlyView}
                    onChange={(e) => setMonthlyView(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-10 text-sm text-white appearance-none focus:outline-none focus:border-amber-400/40 focus:ring-2 focus:ring-amber-400/10"
                  >
                    <option value="" disabled>เลือกเดือน</option>
                    {availableMonths.map((m) => (
                      <option key={m} value={m}>
                        {new Date(m + "-01").toLocaleDateString("th-TH", { month: "long", year: "numeric" })}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {loadingMonthly ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="w-6 h-6 text-zinc-500 animate-spin" />
                </div>
              ) : monthlyData ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { label: "รายรับ", value: monthlyData.incomeTotal, color: "text-emerald-400", icon: ArrowUpRight, border: "border-emerald-500/20", bg: "bg-emerald-500/5" },
                      { label: "รายจ่าย", value: monthlyData.expenseTotal, color: "text-rose-400", icon: ArrowDownLeft, border: "border-rose-500/20", bg: "bg-rose-500/5" },
                      { label: "กำไรสุทธิ", value: monthlyData.profit, color: "text-amber-400", icon: TrendingUp, border: "border-amber-500/20", bg: "bg-amber-500/5" },
                    ].map(({ label, value, color, icon: Icon, border, bg }) => (
                      <div key={label} className={`${bg} border ${border} rounded-2xl p-4 sm:p-5`}>
                        <div className="flex justify-between items-start">
                          <p className="text-xs text-zinc-500 uppercase tracking-widest">{label}</p>
                          <Icon size={18} className={color} />
                        </div>
                        <p className={`text-xl sm:text-2xl font-bold mt-3 ${color}`}>฿{value.toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                  <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
                    <div className="p-4 border-b border-white/10">
                      <p className="text-sm font-medium text-zinc-300">รายการในเดือนนี้</p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left min-w-[500px]">
                        <thead className="bg-white/5">
                          <tr className="text-[10px] uppercase tracking-widest text-zinc-500">
                            <th className="py-3 px-3 sm:px-5">ประเภท</th>
                            <th className="py-3 px-3 sm:px-5">รายละเอียด</th>
                            <th className="py-3 px-3 sm:px-5">วันที่</th>
                            <th className="py-3 px-3 sm:px-5 text-right">จำนวนเงิน</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                          {monthlyData.transactions.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="py-10 text-center text-zinc-600 text-xs">ไม่มีรายการ</td>
                            </tr>
                          ) : (
                            monthlyData.transactions.map((tx) => {
                              const isInflow = tx.type === "income";
                              const displayAmount = isInflow ? tx.amount : Math.abs(tx.amount);
                              const prefix = isInflow ? "+" : "-";
                              return (
                                <tr key={tx.id} className="hover:bg-white/5">
                                  <td className="py-2.5 px-3 sm:py-3 sm:px-5">
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                                      tx.type === "income" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                    }`}>
                                      {tx.type === "income" ? "รายรับ" : "รายจ่าย"}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3 sm:py-3 sm:px-5 text-sm text-zinc-300 truncate max-w-[200px]">{tx.description || "—"}</td>
                                  <td className="py-2.5 px-3 sm:py-3 sm:px-5 text-xs text-zinc-500 whitespace-nowrap">
                                    {new Date(tx.createdAt).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" })}
                                  </td>
                                  <td className={`py-2.5 px-3 sm:py-3 sm:px-5 text-sm font-medium text-right ${isInflow ? "text-emerald-400" : "text-rose-400"}`}>
                                    {prefix}฿{displayAmount.toLocaleString()}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-20 text-zinc-500">กรุณาเลือกเดือน</div>
              )}
            </div>
          )}

          {/* ─── DEBTORS LIST ─── */}
          {activeView === "debtors_list" && (
            <div className="space-y-4">
              <div className="bg-[#121418] border border-amber-900/30 rounded-xl px-4 sm:px-5 py-3 sm:py-4 inline-flex items-center gap-3">
                <Users size={16} className="text-amber-500" />
                <div>
                  <p className="text-[10px] text-zinc-500">ยอดหนี้รวมทั้งหมด</p>
                  <p className="text-amber-400 text-lg font-mono font-light">฿{stats.totalOutstandingDebt.toLocaleString()}</p>
                </div>
              </div>
              <div className="bg-[#121418] border border-zinc-900 rounded-2xl overflow-x-auto">
                {initialDebtors.length === 0 ? (
                  <div className="py-16 text-center text-zinc-600 text-xs tracking-widest">ยังไม่มีลูกหนี้ในระบบ</div>
                ) : (
                  <table className="w-full text-left border-collapse min-w-[500px]">
                    <thead>
                      <tr className="border-b border-zinc-900 bg-[#16191E]">
                        <th className="py-3 px-3 sm:py-4 sm:px-5 text-[10px] font-medium tracking-widest text-zinc-500">ชื่อลูกหนี้</th>
                        <th className="py-3 px-3 sm:py-4 sm:px-5 text-[10px] font-medium tracking-widest text-zinc-500">หมายเหตุ</th>
                        <th className="py-3 px-3 sm:py-4 sm:px-5 text-[10px] font-medium tracking-widest text-zinc-500 text-right">ยอดค้าง</th>
                        <th className="py-3 px-3 sm:py-4 sm:px-5 text-[10px] font-medium tracking-widest text-zinc-500 text-center">จัดการ</th>
                        <th className="py-3 px-3 sm:py-4 sm:px-5 text-[10px] font-medium tracking-widest text-zinc-500 text-center">ลบ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-900/60">
                      {initialDebtors.map((d) => (
                        <tr key={d.id} className="hover:bg-zinc-900/20 transition-colors">
                          <td className="py-3 px-3 sm:py-4 sm:px-5">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700/50 flex items-center justify-center shrink-0">
                                <span className="text-[11px] text-zinc-300">{d.name.charAt(0)}</span>
                              </div>
                              <span className="text-xs text-zinc-200 font-light">{d.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3 sm:py-4 sm:px-5 text-xs text-zinc-500 font-light">{d.note || "—"}</td>
                          <td className="py-3 px-3 sm:py-4 sm:px-5 text-right">
                            <span className={`text-xs font-mono font-light ${d.totalDebt > 0 ? "text-amber-400" : "text-emerald-400"}`}>฿{d.totalDebt.toLocaleString()}</span>
                          </td>
                          <td className="py-3 px-3 sm:py-4 sm:px-5">
                            <div className="flex items-center justify-center gap-1 sm:gap-2">
                              <button onClick={() => openActionForDebtor(d.id, "debt_payment")} className="flex items-center gap-1 sm:gap-1.5 text-[10px] font-light text-teal-400 border border-teal-500/20 bg-teal-500/10 hover:bg-teal-500/20 px-2 sm:px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap">
                                <DollarSign size={11} /> ชำระ
                              </button>
                              <button onClick={() => openActionForDebtor(d.id, "debt_add")} className="flex items-center gap-1 sm:gap-1.5 text-[10px] font-light text-rose-400 border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 px-2 sm:px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap">
                                <Plus size={11} /> เพิ่ม
                              </button>
                            </div>
                          </td>
                          <td className="py-3 px-3 sm:py-4 sm:px-5 text-center">
                            <button onClick={() => handleDeleteDebtor(d.id, d.name)} className="p-1.5 rounded-lg text-zinc-600 hover:text-rose-400 hover:bg-rose-500/10 transition-colors" title="ลบลูกหนี้">
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* ─── DEBTORS ACTIVITY ─── */}
          {activeView === "debtors_activity" && (
            <div className="space-y-4">
              <p className="text-[10px] text-zinc-600 tracking-widest uppercase">รายการรับชำระและการให้ยืมทั้งหมด</p>
              <TransactionTable transactions={debtTransactions} />
            </div>
          )}
        </div>
      </main>

      {/* ─── MODAL: บันทึกธุรกรรม ─── */}
      {isOpenTxModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0F1115] border border-zinc-900 rounded-[20px] w-full max-w-sm p-5 sm:p-6 relative shadow-2xl">
            <div className="flex justify-between items-start mb-5 sm:mb-6">
              <div>
                <p className="text-[10px] tracking-[0.2em] text-zinc-600 uppercase mb-1">ธุรกรรม</p>
                <h2 className="text-[14px] sm:text-[15px] font-light text-zinc-200 tracking-wide">
                  {txForm.type === "debt_payment" ? "บันทึกการชำระหนี้" : txForm.type === "debt_add" ? "บันทึกการยืมเพิ่ม" : "บันทึกรายการใหม่"}
                </h2>
              </div>
              <button onClick={() => setIsOpenTxModal(false)} className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-zinc-300">
                <X size={14} />
              </button>
            </div>
            <form onSubmit={handleTxSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] tracking-[0.15em] text-zinc-600 uppercase mb-2">ประเภท</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {txTypeOptions.map(({ value, label, icon: Icon, active }) => (
                    <button key={value} type="button" onClick={() => setTxForm({ ...txForm, type: value, debtorId: "" })}
                      className={`flex items-center gap-2 px-2.5 sm:px-3 py-2.5 rounded-xl border text-[11px] transition-all ${txForm.type === value ? active : "border-zinc-800 bg-zinc-900/40 text-zinc-500"}`}>
                      <Icon size={12} /> {label}
                    </button>
                  ))}
                </div>
              </div>
              {(txForm.type === "debt_payment" || txForm.type === "debt_add") && (
                <div>
                  <label className="block text-[10px] tracking-[0.15em] text-zinc-600 uppercase mb-2">เลือกลูกหนี้</label>
                  <select required value={txForm.debtorId} onChange={(e) => setTxForm({ ...txForm, debtorId: e.target.value })}
                    className="w-full bg-zinc-900/40 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-zinc-300 focus:outline-none">
                    <option value="">— กรุณาเลือก —</option>
                    {initialDebtors.map((d) => (
                      <option key={d.id} value={d.id}>{d.name} · ค้าง ฿{d.totalDebt.toLocaleString()}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-[10px] tracking-[0.15em] text-zinc-600 uppercase mb-2">จำนวนเงิน</label>
                <div className="flex items-center bg-zinc-900/40 border border-zinc-800 rounded-xl px-4 h-12">
                  <span className="text-zinc-600 text-base mr-2">฿</span>
                  <input type="number" step="0.01" required placeholder="0.00" value={txForm.amount}
                    onChange={(e) => setTxForm({ ...txForm, amount: e.target.value })}
                    className="flex-1 bg-transparent text-lg sm:text-xl font-light text-zinc-200 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] tracking-[0.15em] text-zinc-600 uppercase mb-2">รายละเอียด</label>
                <input type="text" placeholder="ระบุคำอธิบายสั้นๆ..." value={txForm.description}
                  onChange={(e) => setTxForm({ ...txForm, description: e.target.value })}
                  className="w-full bg-zinc-900/40 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-zinc-300 focus:outline-none" />
              </div>
              <div className="border-t border-zinc-900 pt-4">
                <button type="submit" disabled={isPending} className="w-full bg-zinc-100 hover:bg-white text-zinc-950 py-2.5 rounded-xl text-xs transition-all disabled:opacity-40">
                  {isPending ? "กำลังบันทึก..." : "ยืนยันการบันทึก →"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: เพิ่มลูกหนี้ ─── */}
      {isOpenDebtorModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0F1115] border border-zinc-900 rounded-[20px] w-full max-w-sm p-5 sm:p-6 relative shadow-2xl">
            <div className="flex justify-between items-start mb-5 sm:mb-6">
              <div>
                <p className="text-[10px] tracking-[0.2em] text-zinc-600 uppercase mb-1">ลูกหนี้</p>
                <h2 className="text-[14px] sm:text-[15px] font-light text-zinc-200 tracking-wide">เพิ่มรายชื่อใหม่</h2>
              </div>
              <button onClick={() => setIsOpenDebtorModal(false)} className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-zinc-300">
                <X size={14} />
              </button>
            </div>
            <form onSubmit={handleDebtorSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] tracking-[0.15em] text-zinc-600 uppercase mb-2">ชื่อ-นามสกุล</label>
                <div className="flex items-center bg-zinc-900/40 border border-zinc-800 rounded-xl px-3 h-10 gap-2">
                  <Users size={13} className="text-zinc-600 shrink-0" />
                  <input type="text" required placeholder="กรอกชื่อลูกหนี้..." value={debtorForm.name}
                    onChange={(e) => setDebtorForm({ ...debtorForm, name: e.target.value })}
                    className="flex-1 bg-transparent text-xs text-zinc-200 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] tracking-[0.15em] text-zinc-600 uppercase mb-2">ยอดหนี้ตั้งต้น</label>
                <div className="flex items-center bg-zinc-900/40 border border-zinc-800 rounded-xl px-4 h-12">
                  <span className="text-zinc-600 text-base mr-2">฿</span>
                  <input type="number" step="0.01" placeholder="0.00" value={debtorForm.initialDebt}
                    onChange={(e) => setDebtorForm({ ...debtorForm, initialDebt: e.target.value })}
                    className="flex-1 bg-transparent text-lg sm:text-xl font-light text-zinc-200 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] tracking-[0.15em] text-zinc-600 uppercase mb-2">หมายเหตุ / ช่องทางติดต่อ</label>
                <textarea rows={2} placeholder="เบอร์โทร, ลิงก์โซเชียล..." value={debtorForm.note}
                  onChange={(e) => setDebtorForm({ ...debtorForm, note: e.target.value })}
                  className="w-full bg-zinc-900/40 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-zinc-300 resize-none focus:outline-none" />
              </div>
              <div className="border-t border-zinc-900 pt-4">
                <button type="submit" disabled={isPending} className="w-full bg-zinc-100 hover:bg-white text-zinc-950 py-2.5 rounded-xl text-xs transition-all disabled:opacity-40">
                  {isPending ? "กำลังบันทึก..." : "เพิ่มรายชื่อลงระบบ →"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}