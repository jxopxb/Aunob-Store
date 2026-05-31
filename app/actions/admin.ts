// src/app/actions/admin.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// 1. เพิ่มลูกหนี้ใหม่
export async function createDebtor(name: string, note: string) {
  await prisma.debtor.create({
    data: { name, note, totalDebt: 0 },
  });
  revalidatePath("/");
  revalidatePath("/admin");
}

// 2. อัปเดตยอดหนี้ (ลด/เพิ่ม) และบันทึกประวัติ
export async function updateDebt(
  debtorId: number,
  amount: number,
  description: string,
  type: 'debt_payment' | 'debt_add'
) {
  const debtor = await prisma.debtor.findUnique({ where: { id: debtorId } });
  if (!debtor) return { success: false };

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

// 3. บันทึกรายรับ-รายจ่ายทั่วไป (ไม่เกี่ยวกับลูกหนี้)
export async function addGeneralTransaction(
  type: 'income' | 'expense',
  amount: number,
  description: string
) {
  await prisma.transaction.create({
    data: {
      type,
      amount: type === 'expense' ? -amount : amount,
      description
    }
  });
  revalidatePath("/admin");
}

// 4. ลบลูกหนี้ (ถ้ามีประวัติหนี้จะไม่อนุญาตให้ลบ)
export async function deleteDebtor(id: number) {
  // ตรวจสอบว่ามีธุรกรรมที่เกี่ยวข้องหรือไม่
  const txCount = await prisma.transaction.count({ where: { debtorId: id } });
  if (txCount > 0) {
    return { success: false, error: "ไม่สามารถลบได้ เนื่องจากมีประวัติธุรกรรม" };
  }
  
  await prisma.debtor.delete({ where: { id } });
  revalidatePath("/");
  revalidatePath("/admin");
  return { success: true };
}

// 5. ตัวกลางสำหรับสร้างธุรกรรม (รองรับทั้งหนี้และรายรับ-จ่าย) — UI เรียกใช้
export async function createTransaction(data: {
  type: string;
  amount: number;
  description: string;
  debtorId?: number | null;
}) {
  if (data.type === "debt_payment" || data.type === "debt_add") {
    if (!data.debtorId) return { success: false, error: "กรุณาระบุลูกหนี้" };
    return updateDebt(
      data.debtorId,
      data.amount,
      data.description || "",
      data.type
    );
  }

  if (data.type === "income" || data.type === "expense") {
    await addGeneralTransaction(
      data.type,
      data.amount,
      data.description || ""
    );
    return { success: true };
  }

  return { success: false, error: "ประเภทธุรกรรมไม่ถูกต้อง" };
}

// 6. ลบธุรกรรม (คืนยอดหนี้ให้ถูกต้องด้วย)
export async function deleteTransaction(id: number) {
  try {
    const tx = await prisma.transaction.findUnique({ where: { id } });
    if (!tx) return { success: false, error: "ไม่พบรายการ" };

    // ถ้าธุรกรรมเกี่ยวกับหนี้ ให้คืนยอดหนี้กลับก่อนลบ
    if (tx.debtorId && (tx.type === "debt_payment" || tx.type === "debt_add")) {
      const debtor = await prisma.debtor.findUnique({ where: { id: tx.debtorId } });
      if (debtor) {
        const reverseAmount =
          tx.type === "debt_payment" ? tx.amount : -tx.amount;
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