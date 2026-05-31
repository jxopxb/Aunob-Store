"use client";

import { useState } from "react";
import {
  User,
  ChevronRight,
  X,
  Search,
  Clock,
  LogIn,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { getTransactionsByDebtor } from "@/app/actions/debt";

// -------------------- HELPERS --------------------
function formatRelativeTimeThai(dateInput: Date | string): string {
  const date = new Date(dateInput);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  if (diffMs < 0) return "เมื่อครู่";

  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "เมื่อครู่";
  if (diffMins < 60) return `${diffMins} นาทีที่แล้ว`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} ชม. ที่แล้ว`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays} วันที่แล้ว`;

  return `${Math.floor(diffDays / 30)} เดือนที่แล้ว`;
}

// -------------------- TYPES --------------------
type Debtor = {
  id: number;
  name: string;
  totalDebt: number;
  updatedAt: Date;
  createdAt: Date;
  note?: string | null;
  descriptionShort?: string | null;
  initial?: string | null;
};

type Transaction = {
  id: number;
  description: string | null;
  amount: number;
  createdAt: Date;
  debtorId: number | null;
  type: string;
};

// -------------------- COMPONENT --------------------
export default function DashboardClient({ initialDebtors }: { initialDebtors: Debtor[] }) {
  const [filterMode, setFilterMode] = useState<"active" | "settled">("active");
  const [selectedDebtor, setSelectedDebtor] = useState<Debtor | null>(null);
  const [currentTransactions, setCurrentTransactions] = useState<Transaction[]>([]);
  const [isLoadingTx, setIsLoadingTx] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // กรองตามชื่อ + สถานะหนี้
  const searchedDebtors = initialDebtors.filter((d) =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const activeDebtors = searchedDebtors.filter((d) => d.totalDebt > 0);
  const settledDebtors = searchedDebtors.filter((d) => d.totalDebt <= 0);
  const displayData = filterMode === "active" ? activeDebtors : settledDebtors;

  // จำนวนรวม
  const activeCount = initialDebtors.filter((d) => d.totalDebt > 0).length;
  const settledCount = initialDebtors.filter((d) => d.totalDebt <= 0).length;

  // ยอดค้างทั้งหมด
  const grandTotal = initialDebtors
    .filter((d) => d.totalDebt > 0)
    .reduce((sum, d) => sum + d.totalDebt, 0);

  // เลือกลูกหนี้ → โหลดประวัติ
  const handleSelectDebtor = async (debtor: Debtor) => {
    setSelectedDebtor(debtor);
    setCurrentTransactions([]);
    setIsLoadingTx(true);
    try {
      const txData = await getTransactionsByDebtor(debtor.id);
      setCurrentTransactions(txData);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingTx(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0C0E] text-[#E4E6EB] font-sans selection:bg-amber-500/20 antialiased">
      {/* ===== HEADER ===== */}
      <header className="border-b border-zinc-900 bg-[#0B0C0E]/80 backdrop-blur-md sticky top-0 z-20 px-4 sm:px-8 py-4">
        <div className="max-w-[1600px] mx-auto flex flex-row items-center justify-between gap-4">
          <div>
            <p className="text-[9px] sm:text-[10px] tracking-[0.2em] text-zinc-500 uppercase font-medium">DEBT LEDGER</p>
            <h1 className="text-base sm:text-xl font-light text-zinc-200 mt-0.5 tracking-wide">
              รายการคนเชื่อของ
            </h1>
          </div>

          <div className="flex items-center gap-3 sm:gap-8">
            <div className="text-right hidden sm:block">
              <p className="text-xs text-zinc-500 tracking-wider">ยอดคงค้างทั้งหมด</p>
              <p className="text-xl font-light text-amber-400 mt-0.5">
                ฿{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>

            {/* ✅ เปลี่ยนจาก /login เป็น /admin */}
            <Link href="/admin">
              <button className="flex items-center gap-2 border border-zinc-800 hover:border-amber-400/40 text-zinc-400 hover:text-amber-400 text-[10px] sm:text-xs px-3 sm:px-4 py-2 rounded-full tracking-widest uppercase font-medium transition-all duration-300 bg-zinc-950/40 hover:bg-zinc-950 shadow-md">
                <LogIn size={14} className="text-zinc-500 shrink-0" />
                <span className="hidden sm:inline">Admin</span>
              </button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-4 sm:px-8 py-6 sm:py-10 space-y-6 sm:space-y-8">
        
        {/* แสดงยอดเงินบนมือถือ */}
        <div className="sm:hidden bg-[#121418] border border-zinc-900/60 rounded-2xl p-4 flex justify-between items-center shadow-lg">
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest">ยอดคงค้างรวม</p>
          <p className="text-lg font-medium text-amber-400">
            ฿{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        {/* ===== แท็บ + ค้นหา ===== */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          {/* Tabs */}
          <div className="flex w-full sm:w-fit gap-1 p-1 bg-zinc-900/60 rounded-xl">
            <button
              onClick={() => setFilterMode("active")}
              className={`flex-1 sm:flex-none px-4 py-2.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-300 ${
                filterMode === "active"
                  ? "bg-amber-500/20 text-amber-400 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
              }`}
            >
              ค้างชำระ ({activeCount})
            </button>
            <button
              onClick={() => setFilterMode("settled")}
              className={`flex-1 sm:flex-none px-4 py-2.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-300 ${
                filterMode === "settled"
                  ? "bg-emerald-500/20 text-emerald-400 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
              }`}
            >
              ชำระครบ ({settledCount})
            </button>
          </div>

          {/* Search */}
          <div className="flex items-center gap-2.5 w-full sm:w-72 bg-zinc-900/50 border border-zinc-800 focus-within:border-amber-500/40 focus-within:bg-zinc-900 rounded-xl px-3.5 py-2.5 transition-all">
            <Search className="h-4 w-4 text-zinc-500 shrink-0" />
            <input
              type="text"
              placeholder="ค้นหาชื่อลูกหนี้..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-sm text-zinc-200 placeholder:text-zinc-600 w-full min-w-0"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="w-5 h-5 flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-full shrink-0 transition-colors"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* ===== การ์ดลูกหนี้ (ปรับสำหรับมือถือ) ===== */}
        <div className="grid grid-cols-1 min-[500px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-5">
          {displayData.length === 0 && (
            <div className="col-span-full py-20 text-center border border-dashed border-zinc-800 rounded-2xl">
              <Search size={24} className="text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-500 text-sm">
                {filterMode === "active" ? "ไม่มีลูกหนี้ที่ค้างชำระ" : "ไม่มีลูกหนี้ที่ชำระครบแล้ว"}
              </p>
            </div>
          )}
          {displayData.map((debtor) => (
            <div
              key={debtor.id}
              onClick={() => handleSelectDebtor(debtor)}
              className="group relative bg-[#121418] border border-zinc-900/80 rounded-2xl p-3 sm:p-4 flex flex-col cursor-pointer transition-all duration-300 hover:border-zinc-700 hover:bg-[#16191E] hover:shadow-xl active:scale-[0.98]"
            >
              {/* Banner */}
              <div className="w-full h-28 sm:h-36 bg-zinc-950 rounded-xl relative overflow-hidden border border-zinc-900/80 shadow-inner">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/10"></div>
                <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-[1px] flex items-center justify-center">
                  <User size={28} strokeWidth={1} className="text-zinc-800 group-hover:text-amber-500/20 transition-colors sm:size-8" />
                </div>
                <div className="absolute top-1.5 left-1.5 text-[10px] bg-zinc-900/90 text-zinc-400 px-2 py-1 rounded-md border border-zinc-800 flex items-center gap-1.5 backdrop-blur-sm">
                  <Clock size={10} className="text-amber-400/70" />
                  <span className="truncate">{formatRelativeTimeThai(debtor.updatedAt)}</span>
                </div>
              </div>

              <h3 className="text-sm sm:text-base font-medium text-zinc-200 mt-3 sm:mt-4 tracking-tight truncate group-hover:text-amber-300 transition-colors">
                {debtor.name}
              </h3>

              <div className="flex items-center space-x-2 mt-2 sm:mt-2.5">
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-800 text-zinc-500 text-[10px] sm:text-xs shadow-md shrink-0">
                  {debtor.initial || debtor.name.charAt(0).toUpperCase()}
                </div>
                <p className="text-[9px] sm:text-[10px] text-zinc-500 uppercase tracking-wider font-medium truncate">
                  {debtor.totalDebt > 0 ? "CUSTOMER" : "CLEARED"}
                </p>
              </div>

              <div className="flex items-center flex-wrap gap-1 sm:gap-1.5 mt-2 sm:mt-3 text-[10px]">
                {debtor.descriptionShort && (
                  <div className="bg-zinc-900 text-zinc-400 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded border border-zinc-800/60 truncate max-w-[100px] sm:max-w-[120px] text-[10px]">
                    {debtor.descriptionShort}
                  </div>
                )}
                {debtor.totalDebt <= 0 && (
                  <div className="text-emerald-400 bg-emerald-400/5 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded border border-emerald-400/10 font-medium text-[10px]">
                    จ่ายครบแล้ว
                  </div>
                )}
              </div>

              <hr className="border-zinc-900/80 my-3 sm:my-4" />

              <div className="flex justify-between items-end mt-auto">
                <div>
                  <p className="text-[9px] sm:text-[10px] uppercase text-zinc-600 tracking-wider mb-0.5">ยอดค้างทั้งหมด</p>
                  <p className="text-sm sm:text-base font-medium text-amber-400">
                    ฿{debtor.totalDebt.toLocaleString()}
                  </p>
                </div>
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-zinc-900 border border-zinc-800/80 flex items-center justify-center text-zinc-500 group-hover:bg-zinc-800 group-hover:text-zinc-300 transition-all shrink-0">
                  <ChevronRight size={14} strokeWidth={1.5} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ===== DETAIL DRAWER ===== */}
        {selectedDebtor && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-end z-50 transition-opacity">
            <div className="w-full sm:max-w-md bg-[#0F1115] border-l border-zinc-900 h-full p-5 sm:p-8 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400 border border-zinc-800 shrink-0">
                    <User size={18} />
                  </div>
                  <h2 className="text-base font-medium text-zinc-200 tracking-wide truncate">
                    {selectedDebtor.name}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedDebtor(null)}
                  className="p-2 rounded-full bg-zinc-900 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 border border-zinc-800/50 transition-colors shrink-0 ml-2"
                >
                  <X size={16} />
                </button>
              </div>

              <hr className="border-zinc-900 my-5" />

              <p className="text-xs tracking-widest text-zinc-500 mb-4 font-medium uppercase">
                Statement History
              </p>

              <div className="flex-1 space-y-2.5 overflow-y-auto pr-1 custom-scrollbar">
                {isLoadingTx ? (
                  <div className="flex justify-center items-center py-10">
                    <Loader2 className="w-6 h-6 text-zinc-600 animate-spin" />
                  </div>
                ) : currentTransactions.length > 0 ? (
                  currentTransactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="bg-[#14171C] border border-zinc-900/60 rounded-xl p-4 flex justify-between items-center gap-3 hover:border-zinc-700 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-light text-zinc-300 truncate">
                          {tx.description || "ไม่มีคำอธิบาย"}
                        </p>
                        <p className="text-[10px] text-zinc-500 mt-1">
                          {new Date(tx.createdAt).toLocaleDateString("th-TH", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <p
                        className={`text-sm font-medium whitespace-nowrap shrink-0 ${
                          tx.amount < 0 ? "text-emerald-500" : "text-zinc-300"
                        }`}
                      >
                        {tx.amount < 0
                          ? `-${Math.abs(tx.amount).toLocaleString()}`
                          : `+${tx.amount.toLocaleString()}`}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 text-zinc-600 text-xs border border-dashed border-zinc-800 rounded-xl">
                    ไม่พบประวัติการทำรายการ
                  </div>
                )}
              </div>

              <div className="mt-5 pt-2">
                <div className="bg-[#121418] border border-zinc-900 rounded-2xl p-5 shadow-xl">
                  <div className="flex justify-between items-center gap-2">
                    <p className="text-xs text-zinc-500 uppercase tracking-wider shrink-0">
                      Net Outstanding
                    </p>
                    <p className="text-2xl font-medium text-amber-400 truncate">
                      ฿{selectedDebtor.totalDebt.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 20px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
}