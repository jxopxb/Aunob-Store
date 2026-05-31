// src/app/admin/page.tsx
import { prisma } from "@/lib/prisma";
import AdminClient from "./AdminClient";

export const revalidate = 0; // ดึงข้อมูลสดใหม่เสมอ ไม่แคชค้าง

export default async function AdminDashboard() {
  // 1. ดึงข้อมูลลูกหนี้ทั้งหมดจากตาราง debtors
  const debtors = await prisma.debtor.findMany({
    orderBy: { updatedAt: "desc" },
  });

  // 2. ดึงข้อมูลธุรกรรมทั้งหมดจากตาราง transactions
  const transactions = await prisma.transaction.findMany({
    orderBy: { createdAt: "desc" },
  });

  // 3. คำนวณยอดเงินตามประเภทธุรกรรม (type) จริงใน Schema
  // รายรับเข้ากระเป๋า = income + debt_payment (ลูกหนี้เอาเงินมาคืน)
  const totalIncome = transactions
    .filter((t) => t.type === "income" || t.type === "debt_payment")
    .reduce((sum, t) => sum + t.amount, 0);

  // รายจ่ายออกจากกระเป๋า = expense + debt_add (ควักเงินตัวเองให้เขายืมเพิ่ม)
  const totalExpense = transactions
    .filter((t) => t.type === "expense" || t.type === "debt_add")
    .reduce((sum, t) => sum + t.amount, 0);

  const netProfit = totalIncome - totalExpense;

  // 4. คำนวณยอดหนี้ค้างรวมทั้งหมดของลูกหนี้ทุกคน (ใช้ฟิลด์ totalDebt)
  const totalOutstandingDebt = debtors.reduce((sum, d) => sum + d.totalDebt, 0);

  const stats = {
    netProfit,
    totalIncome,
    totalExpense,
    totalOutstandingDebt,
  };

  return (
    <AdminClient 
      initialDebtors={JSON.parse(JSON.stringify(debtors))} 
      initialTransactions={JSON.parse(JSON.stringify(transactions))}
      stats={stats}
    />
  );
}