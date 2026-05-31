// app/admin/actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// 1. เพิ่มลูกหนี้ใหม่
export async function createDebtor(
  name: string,
  note: string,
  initialDebt?: number
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.debtor.create({
      data: { name, note, totalDebt: initialDebt || 0 },
    });
    revalidatePath("/");
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "เกิดข้อผิดพลาดในการสร้างลูกหนี้" };
  }
}

// 2. อัปเดตยอดหนี้ (ลด/เพิ่ม) และบันทึกประวัติ
export async function updateDebt(
  debtorId: number,
  amount: number,
  description: string,
  type: 'debt_payment' | 'debt_add'
): Promise<{ success: boolean; error?: string }> {
  const debtor = await prisma.debtor.findUnique({ where: { id: debtorId } });
  if (!debtor) return { success: false, error: "ไม่พบลูกหนี้" };

  const newTotal = type === 'debt_payment'
    ? debtor.totalDebt - amount
    : debtor.totalDebt + amount;

  await prisma.$transaction([
    prisma.debtor.update({
      where: { id: debtorId },
      data: { totalDebt: newTotal }
    }),
    prisma.transaction.create({
      data: {
        debtorId,
        type,
        amount: type === 'debt_payment' ? -amount : amount,
        description
      }
    })
  ]);

  revalidatePath("/");
  revalidatePath("/admin");
  return { success: true };
}

// 3. บันทึกรายรับ-รายจ่ายทั่วไป
export async function addGeneralTransaction(
  type: 'income' | 'expense',
  amount: number,
  description: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.transaction.create({
      data: {
        type,
        amount: type === 'expense' ? -amount : amount,
        description
      }
    });
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "เกิดข้อผิดพลาดในการบันทึกธุรกรรม" };
  }
}

// 4. ลบลูกหนี้ (ห้ามลบถ้ามีประวัติหนี้)
export async function deleteDebtor(id: number): Promise<{ success: boolean; error?: string }> {
  const txCount = await prisma.transaction.count({ where: { debtorId: id } });
  if (txCount > 0) {
    return { success: false, error: "ไม่สามารถลบได้ เนื่องจากมีประวัติธุรกรรม" };
  }
  
  await prisma.debtor.delete({ where: { id } });
  revalidatePath("/");
  revalidatePath("/admin");
  return { success: true };
}

// 5. ตัวกลางสร้างธุรกรรม (UI เรียกใช้)
export async function createTransaction(data: {
  type: string;
  amount: number;
  description: string;
  debtorId?: number | null;
}): Promise<{ success: boolean; error?: string }> {
  if (data.type === "debt_payment" || data.type === "debt_add") {
    if (!data.debtorId) return { success: false, error: "กรุณาระบุลูกหนี้" };
    return updateDebt(data.debtorId, data.amount, data.description || "", data.type);
  }

  if (data.type === "income" || data.type === "expense") {
    return addGeneralTransaction(data.type, data.amount, data.description || "");
  }

  return { success: false, error: "ประเภทธุรกรรมไม่ถูกต้อง" };
}

// 6. ลบธุรกรรม (คืนยอดหนี้ให้ถูกต้อง)
export async function deleteTransaction(id: number): Promise<{ success: boolean; error?: string }> {
  try {
    const tx = await prisma.transaction.findUnique({ where: { id } });
    if (!tx) return { success: false, error: "ไม่พบรายการ" };

    if (tx.debtorId && (tx.type === "debt_payment" || tx.type === "debt_add")) {
      const debtor = await prisma.debtor.findUnique({ where: { id: tx.debtorId } });
      if (debtor) {
        const reverseAmount = tx.type === "debt_payment" ? tx.amount : -tx.amount;
        await prisma.debtor.update({
          where: { id: tx.debtorId },
          data: { totalDebt: debtor.totalDebt + reverseAmount },
        });
      }
    }

    await prisma.transaction.delete({ where: { id } });
    revalidatePath("/");
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "เกิดข้อผิดพลาดในการลบ" };
  }
}

// 7. ดึงสรุปยอดรายเดือน (รายรับ รายจ่าย กำไร)
export async function getMonthlySummary(month: number, year: number) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);

  const transactions = await prisma.transaction.findMany({
    where: {
      type: { in: ['income', 'expense'] },
      createdAt: { gte: startDate, lte: endDate }
    },
    orderBy: { createdAt: 'desc' }
  });

  const incomeTotal = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const expenseTotal = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const profit = incomeTotal - expenseTotal;

  return { incomeTotal, expenseTotal, profit, transactions };
}

// 8. ดึงรายชื่อเดือนที่มีข้อมูล
export async function getAvailableMonths() {
  const transactions = await prisma.transaction.findMany({
    select: { createdAt: true },
    orderBy: { createdAt: 'desc' }
  });

  const months = new Set<string>();
  transactions.forEach(t => {
    const d = new Date(t.createdAt);
    months.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  });

  return Array.from(months).sort().reverse();
}