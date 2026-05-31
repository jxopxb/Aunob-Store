// app/admin/page.tsx
import { prisma } from "@/lib/prisma";
import AdminClient from "./AdminClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "แอดมินแดชบอร์ด",
  description: "แดชบอร์ดสำหรับผู้ดูแลระบบในการจัดการลูกหนี้และธุรกรรม",
  keywords: ["admin dashboard", "จัดการลูกหนี้", "ธุรกรรม", "รายรับ", "รายจ่าย", "กำไรสุทธิ"],
};

export default async function AdminPage() {
  // ดึงข้อมูลลูกหนี้และธุรกรรมทั้งหมด
  const debtors = await prisma.debtor.findMany({
    orderBy: { createdAt: "desc" },
  });

  const transactions = await prisma.transaction.findMany({
    orderBy: { createdAt: "desc" },
  });

  // คำนวณรายรับ (เป็นบวกเสมอ)
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  // คำนวณรายจ่าย (ใน DB เก็บเป็นลบ → ใช้ Math.abs เพื่อทำให้เป็นบวก)
  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  // กำไรสุทธิ = รายรับ - รายจ่าย (บวก)
  const netProfit = totalIncome - totalExpense;

  // ยอดหนี้รวมจากทุกลูกหนี้
  const totalOutstandingDebt = await prisma.debtor.aggregate({
    _sum: { totalDebt: true },
  });

  const stats = {
    netProfit,
    totalIncome,
    totalExpense,
    totalOutstandingDebt: totalOutstandingDebt._sum.totalDebt || 0,
  };

  // ส่งข้อมูลไปยัง Client Component (ต้อง serialize Date ให้เป็น string)
  return (
    <AdminClient
      initialDebtors={JSON.parse(JSON.stringify(debtors))}
      initialTransactions={JSON.parse(JSON.stringify(transactions))}
      stats={stats}
    />
  );
}