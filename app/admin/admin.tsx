// app/admin/admin.tsx
import { prisma } from "@/lib/prisma";
import AdminClient from "./AdminClient";

export default async function AdminPage() {
  const debtors = await prisma.debtor.findMany({
    orderBy: { createdAt: "desc" },
  });

  const transactions = await prisma.transaction.findMany({
    orderBy: { createdAt: "desc" },
  });

  // รายรับ = income + debt_payment (ลูกหนี้ชำระหนี้)
  const totalIncome = transactions
    .filter((t: any) => t.type === "income" || t.type === "debt_payment")
    .reduce((sum: number, t: any) => sum + t.amount, 0);

  // รายจ่าย = expense + debt_add (ให้ลูกหนี้ยืมเพิ่ม)
  const totalExpense = transactions
    .filter((t: any) => t.type === "expense" || t.type === "debt_add")
    .reduce((sum: number, t: any) => sum + Math.abs(t.amount), 0);

  const netProfit = totalIncome - totalExpense;

  const totalOutstandingDebt = await prisma.debtor.aggregate({
    _sum: { totalDebt: true },
  });

  const stats = {
    netProfit,
    totalIncome,
    totalExpense,
    totalOutstandingDebt: totalOutstandingDebt._sum.totalDebt || 0,
  };

  return (
    <AdminClient
      initialDebtors={JSON.parse(JSON.stringify(debtors))}
      initialTransactions={JSON.parse(JSON.stringify(transactions))}
      stats={stats}
    />
  );
}