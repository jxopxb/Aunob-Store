// app/api/login/route.ts
import { NextResponse } from "next/server";
import { SignJWT } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "super-secret-luxury-key-1234"
);

export async function POST(request: Request) {
  const { email, password } = await request.json();

  // ตรวจสอบ email/password จาก env (เปลี่ยนตามต้องการ)
  if (
    email === process.env.ADMIN_EMAIL &&
    password === process.env.ADMIN_PASSWORD
  ) {
    // สร้าง JWT ( payload ง่าย ๆ แค่ระบุว่าเป็น admin )
    const token = await new SignJWT({ role: "admin" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("1d") // หมดอายุ 1 วัน
      .sign(JWT_SECRET);

    const response = NextResponse.json({ success: true });

    // ตั้ง cookie ชื่อ admin_session ตามที่ middleware อ่าน
    response.cookies.set("admin_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 1 วัน
    });

    return response;
  }

  return NextResponse.json(
    { error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" },
    { status: 401 }
  );
}