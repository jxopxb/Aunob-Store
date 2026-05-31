"use server";

import { prisma } from "@/lib/prisma";

// ดึงรายชื่อลูกหนี้ทั้งหมด
export async function getDebtors() {
  try {
    const debtors = await prisma.debtor.findMany({
      orderBy: {
        updatedAt: 'desc',
      },
    });
    return debtors;
  } catch (error) {
    console.error("Failed to fetch debtors:", error);
    throw new Error("Failed to fetch debtors");
  }
}

// ดึงประวัติธุรกรรมตาม ID ลูกหนี้
export async function getTransactionsByDebtor(debtorId: number) {
  try {
    const transactions = await prisma.transaction.findMany({
      where: {
        debtorId: debtorId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return transactions;
  } catch (error) {
    console.error("Failed to fetch transactions:", error);
    throw new Error("Failed to fetch transactions");
  }
}