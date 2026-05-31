import DashboardClient from "./DashboardClient";
import { getDebtors } from "@/app/actions/debt";
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "หน้าหลัก",
  description:
      "เช็คคนเชื่อของคุณได้ง่ายๆ ด้วยระบบบัญชีของฉันที่ใช้งานง่ายและปลอดภัย พร้อมฟีเจอร์ที่ช่วยให้คุณจัดการบัญชีของคุณได้อย่างมีประสิทธิภาพ",
  keywords: [
      "แก้ไขนิยาย",
      "my novels",
      "บัญชีของฉัน", 
      "Yaniyaa My Novels",
      "Better Auth",
      "ระบบสมาชิก",
  ],
}


export default async function DashboardPage() {
  // ดึงข้อมูลรายชื่อจาก DB ฝั่งเซิร์ฟเวอร์
  const initialDebtors = await getDebtors();

  // ส่งข้อมูลไปให้ฝั่ง Client จัดการต่อ
  return <DashboardClient initialDebtors={initialDebtors} />;
}