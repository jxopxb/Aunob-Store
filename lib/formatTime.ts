// src/lib/formatTime.ts

export function formatRelativeTimeThai(dateInput: Date | string | number): string {
    const now = new Date();
    const past = new Date(dateInput);
    const diffMs = now.getTime() - past.getTime();
  
    // ป้องกันกรณีเวลาคลาดเคลื่อนเล็กน้อย
    if (diffMs < 0) return "เมื่อครู่";
  
    const diffMins = Math.floor(diffMs / 60000); // 1 นาที = 60,000 ms
    if (diffMins < 1) return "เมื่อครู่";
    if (diffMins < 60) return `${diffMins} นาทีที่แล้ว`;
  
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} ชม. ที่แล้ว`;
  
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return `${diffDays} วันที่แล้ว`;
  
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths < 12) return `${diffMonths} เดือนที่แล้ว`;
  
    const diffYears = Math.floor(diffMonths / 12);
    return `${diffYears} ปีที่แล้ว`;
  }