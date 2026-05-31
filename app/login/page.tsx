import { Metadata } from "next"
import LoginPage from "./login"

export const metadata: Metadata = {
    title: "เข้าสู่ระบบ",
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

export default function SignUpPage() {
    return (
        <>
            <LoginPage />
        </>
    )
}