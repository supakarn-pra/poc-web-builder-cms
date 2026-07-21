// Centralized copy — ห้ามใช้ศัพท์เทคนิค (margin/padding/container) ใน UI
// เพิ่ม key ที่นี่แทนการ hard-code ข้อความในคอมโพเนนต์
export const t = {
  app: {
    name: "POC Web Builder",
    tagline: "สร้างเว็บไซต์เป็นของตัวเอง เข้าใจง่ายเหมือนทำ Presentation",
  },
  nav: {
    dashboard: "ภาพรวม",
    // เว็บหนึ่งมีได้หลาย "เวอร์ชัน" (Website record) — ใช้งานจริงได้ทีละอัน
    websites: "เวอร์ชันเว็บไซต์",
    pages: "หน้าเว็บ",
    posts: "บทความ",
    media: "รูปภาพ",
    menu: "ส่วนหัว/ส่วนท้าย",
    popups: "Pop-up",
    settings: "ตั้งค่า",
  },
  action: {
    createWebsite: "สร้างเวอร์ชันใหม่",
    createPage: "เพิ่มหน้าใหม่",
    createPost: "เขียนบทความใหม่",
    editWebsite: "แก้ไขเว็บไซต์",
    preview: "ดูตัวอย่าง",
    publish: "เผยแพร่",
    save: "บันทึก",
    saved: "บันทึกแล้ว",
    cancel: "ยกเลิก",
    delete: "ลบ",
    duplicate: "ทำสำเนา",
    hide: "ซ่อน",
    show: "แสดง",
    addSection: "เพิ่มส่วนใหม่",
    logout: "ออกจากระบบ",
    login: "เข้าสู่ระบบ",
  },
  builder: {
    sections: "โครงสร้างหน้า",
    settings: "ตั้งค่ารูปแบบ",
    preview: "หน้าเว็บไซต์",
    device: {
      desktop: "คอมพิวเตอร์",
      tablet: "แท็บเล็ต",
      mobile: "มือถือ",
    },
    style: {
      background: "สีพื้นหลัง",
      backgroundImage: "รูปพื้นหลัง",
      layout: "การจัดวาง",
      spacing: "ระยะห่าง",
      innerSpacing: "ระยะห่างภายใน",
      outerSpacing: "ระยะห่างด้านนอก",
      contentWidth: "ความกว้างของเนื้อหา",
    },
  },
  onboarding: [
    "คลิกข้อความเพื่อแก้ไข",
    "กดเพิ่มส่วนใหม่",
    "ลากเพื่อจัดลำดับ",
    "กดเผยแพร่เมื่อพร้อม",
  ],
} as const;
