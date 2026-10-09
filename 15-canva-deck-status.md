# สรุป · canva-deck-status.md

> **เอกสารต้นทาง:** `claude/canva-deck-status.md` · สร้าง 27 ส.ค. 2569
> **กลุ่ม:** เอกสารนำเสนอลูกค้า
> **บทบาท:** สถานะการทำเด็คใน Canva — **เอกสารล่าสุดของสายงานนำเสนอ**

---

## สรุป 5 บรรทัด

1. Design ที่แก้ไข: **DAHTc43GlqE** · ปัจจุบัน **45 หน้า** · ต้นฉบับลูกค้า **DAHTYuri008** (Koolpunt / Chap Wai, 97 หน้า) — **ห้ามแก้**
2. หน้า 1–39 (Cover + 8 โมดูล + Workflow) **เสร็จแล้ว** + หน้าท้ายเล่ม (Timeline · Budget · Thank You)
3. เปลี่ยนชื่อฟังก์ชัน **M8 เป็นภาษาอังกฤษ** ตามคำขอลูกค้า
4. เก็บกวาดกล่องล่างของหน้า Site Map ทั้ง 8 หน้า
5. **ต้องทำเองใน Canva 2 ข้อ** + บันทึกข้อจำกัดของ Canva MCP 7 ข้อ

---

## ผังหน้า

| หน้า | เนื้อหา | สถานะ |
|---|---|---|
| 1 | Cover | ✓ |
| 2 | Objective | ✓ |
| 3 | Proposed Solution (8 การ์ด) | ✓ *ฟอนต์ 6 กล่องที่สร้างใหม่ยังไม่ตรง* |
| 4–8 | M1 LINE INTAKE | ✓ |
| 9–13 | M2 OCR & EXTRACTION | ✓ |
| 14–17 | M3 DOCUMENT STORAGE | ✓ |
| 18–21 | M4 REVIEW & CORRECTION | ✓ |
| 22–25 | M5 EXPORT & REPORT | ✓ |
| 26–29 | M6 PERMISSION & USER | ✓ |
| 30–33 | M7 TASK TRACKER | ✓ |
| 34–37 | M8 CONSOLE & DASHBOARD | ✓ |
| 38 | Divider — Workflow | ✓ |
| 39 | Platform Workflow · 12 ขั้นตอน | ✓ |
| — | หน้าที่เหลือจากต้นฉบับ Koolpunt | **ให้ลบทิ้ง** |
| ท้ายเล่ม | Project Timeline · Project Budget (One-Time + Recurring) · Budget งวดชำระ · Thank You | ✓ |

---

## ชื่อฟังก์ชัน M8 — เปลี่ยนเป็นภาษาอังกฤษแล้ว

| เดิม (ไทย) | ใหม่ (EN) |
|---|---|
| แท็บเอกสาร | **Documents Tab** |
| แท็บงาน | **Tasks Tab** |
| ตัวเลขสรุป | **Quick Stats** |
| สลับบริษัท | **Company Switch** |
| ศูนย์ส่งออก | **Export Center** |
| จัดการสมาชิก | **Member Manager** |
| ตั้งค่าสำนักงาน | **Office Settings** |
| ประวัติการใช้งาน | **Activity Log** |

*(กล่องรวมในผัง Site Map ที่รวมสองฟังก์ชัน ใช้ชื่อ **Members & Settings**)*
คำอธิบายใต้ชื่อฟังก์ชันยังเป็นภาษาไทย ตามรูปแบบเดียวกับ M1–M7

⚠️ **ยังไม่ได้แก้:** ตารางใน `module-presentation-structure.md` ยังใช้ชื่อไทย

---

## เก็บกวาดกล่องล่างหน้า Site Map (ทั้ง 8 หน้า)

**1. หัวกล่องกลาง** เปลี่ยนจาก `N Functions` (ของเทมเพลต Koolpunt) เป็น `<Module> Functions`
→ Intake · OCR · Storage · Review · Export · Permission · Task · Console Functions

**2. Third-Party API** ตัดรายการที่ไม่มีในเอกสารออก
- M2 → Claude Vision API · Prompt Caching / Batch API
- M3 → Google Drive API · Google Workspace / Gmail
- M6 → LINE Messaging API · Join / Leave Events
- M7 → LINE Messaging API · Claude API
- M8 → LINE Messaging API · Google Drive API

> **Supabase Auth / RLS ไม่ใช่ third-party API ของโครงการ** — เป็น tech stack ของเราเอง ติดมาจากเทมเพลตเดิม

**3. Tech Stack** ปรับคำกำกับ: M2 → `Node.js (Worker)` · M3 → `Node.js (Sync Worker)` · M7 → `Node.js (Backend + Scheduler)`

> ⚠️ **ยังต่างจากเอกสาร:** เอกสารระบุ tech stack แบบ *รายโมดูล* แต่ในเด็คแสดงชุดเต็ม 4 โลโก้เหมือนกันทุกหน้า (เพราะเป็นสแตกจริงของทั้งแพลตฟอร์ม + ตัดออกจะทำให้ตาราง 2×2 มีช่องว่าง)

---

## หน้า Project Budget

**One-Time Project-Based Cost** — 8 โมดูล (**66 functions**) · ค่าพัฒนา **฿30,000 – 160,000** (ยังไม่รวม VAT 7%)

**Recurring / Operational Cost** — 5 หัวข้อ
| หัวข้อ | สาระ |
|---|---|
| Domain & Essential Services | Domain (.com) + SSL ≈ 1,000 บาท/ปี |
| Cloud Server & Database | Vercel + Supabase · เริ่มฟรี → 900–1,800 บาท/เดือน |
| LINE Messaging API | Free 300 · Basic 1,280 = 15,000 · Pro 1,780 = 35,000 |
| AI Document Reading (OCR) | 0.13–0.40 บาท/ใบ · 10,000 ใบ/เดือน ≈ 1,300–4,000 บาท |
| Maintenance Service Agreement (Optional) | 10% ของมูลค่าโครงการต่อปี · ไม่รวมฟีเจอร์ใหม่ |

---

## ที่ตัดออกตามที่ตกลง

ตารางสิทธิ์ · หน้าตั้งค่า · POSITIONING & BUSINESS · Competitive Landscape · Business Model · Cost Structure (หน้าแยก — ย้ายไปรวมใน Project Budget) · PHASE 2 & BEYOND · Roadmap · สิ่งที่ตกลงแล้ว/ยังต้องการ · เรื่องที่ต้องระวัง · Closing

---

## 🔧 ต้องทำเองใน Canva (2 ข้อ)

1. **ลบหน้าที่เหลือจากต้นฉบับ Koolpunt** — Divider "Reference" · Project Timeline · Project Budget งวดชำระที่ยังมีเลข **900,000 บาท** ⚠️ (Canva MCP ลบหน้าไม่ได้)
2. **แก้ฟอนต์ของ 6 กล่องข้อความบนหน้า 3** (การ์ด TASK TRACKER และ CONSOLE & DASHBOARD ที่สร้างใหม่) — API ตั้งฟอนต์ไม่ได้

---

## ข้อจำกัดของ Canva MCP ที่พบ (7 ข้อ)

- **ทำสำเนาหน้าไม่ได้** (`add_page` ได้แต่หน้าว่าง) และ **ลบหน้าไม่ได้**
- **`format_text` ไม่มีพารามิเตอร์ font family** — ข้อความที่สร้างด้วย `add_text` ได้ฟอนต์ default (`YACgEZ1cb1Q`) ต่างจากฟอนต์เด็ค (`YAFdJsSpokU`)
- `edit-design` commit แล้ว **ย้อนกลับไม่ได้** — ต้องทำทีละโมดูลแล้ว commit
- URL thumbnail ที่มี `fallbackstale=T` เป็นภาพเก่า — ต้องตรวจด้วยการอ่าน `design_content`
- บางครั้ง API **ทำสระ/ตัวสะกดไทยหายไป 1 ตัว** ตอน `replace_text` — ต้องอ่านซ้ำแล้วแก้
- ข้อความอังกฤษกว้างกว่าไทยที่จำนวนอักษรเท่ากัน — เปลี่ยนภาษาแล้วต้องเช็กความกว้างกล่อง
- ไอคอนในกล่องล่างเป็นภาพแยกชิ้นจากข้อความ — ลบรายการต้องลบทั้งสอง (จับคู่จากพิกัดกึ่งกลาง)

---

## ⚠️ สถานะ ณ ปัจจุบัน (28 ส.ค. 69)

✅ **นี่คือสถานะล่าสุดของเด็คนำเสนอ**

| งานค้าง | ความเร่งด่วน |
|---|---|
| ลบหน้า Budget งวดชำระที่มีเลข **900,000 บาท** ค้างอยู่ | 🔴 **สูง — ตัวเลขผิดจากโปรเจกต์อื่น ถ้าลูกค้าเห็นจะสับสน** |
| แก้ฟอนต์ 6 กล่องหน้า 3 | 🟡 |
| อัปเดตชื่อ M8 ใน `module-presentation-structure.md` ให้ตรงกับ Canva | 🟡 |
| แก้ **66 functions** ในหน้า Budget ให้ตรงกับ **69** ใน `dev-scope-and-estimate.md` | 🟡 |
| ใส่โลโก้ MAZ จริง · เปลี่ยนภาพหน้าปก · สกรีนช็อต demo | 🟡 |
