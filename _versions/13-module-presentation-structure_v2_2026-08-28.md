# สรุป · module-presentation-structure.md — **v2**

> **เอกสารต้นทาง:** `claude/module-presentation-structure.md` · ปรับปรุง 28 ส.ค. 2569
> **กลุ่ม:** เอกสารนำเสนอลูกค้า
> **บทบาท:** โครงสไลด์ **56 หน้า ฉบับเขียนให้ลูกค้าอ่าน** — ตัดศัพท์เทคนิคออกทั้งหมด
> **ฉบับเต็ม:** `_versions/13-module-presentation-structure_v2-full-56pages_2026-08-28.md`
> **ฉบับก่อนหน้า:** `_versions/13-module-presentation-structure_v1_2026-08-28.md`

---

## เปลี่ยนอะไรจาก v1

| # | เปลี่ยน | เดิม (v1) | ใหม่ (v2) |
|---|---|---|---|
| 1 | **ยุบฟังก์ชัน** | 64 ฟังก์ชัน | **46 ฟังก์ชัน** |
| 2 | ยุบหน้า Workflow | 4 วงจร | **1 วงจร 12 ขั้น** (ทำไปแล้วใน v1 ตอนท้าย) |
| 3 | ย้ายโมดูล | `Team Directory` อยู่ M1 | ย้ายไป **M7** (ใช้ตอนมอบหมายงาน) |
| 4 | ถอดจากการ์ด | `AI Swappable` เป็น Core Function | เหลือเป็น**หมายเหตุ**ใต้หน้า Function ของ M2 |
| 5 | แก้ที่ไม่ตรงกัน | M4 แถบ Site Map กับตาราง Core Functions คนละชุด | ตรงกันแล้ว |
| 6 | ลูกศรในเนื้อความ | ใช้ `→` `←` 42 จุด | เปลี่ยนเป็นคำเชื่อม (`ถ้า…จะ…` · `กลายเป็น` · `แล้ว`) — คง `↓` เฉพาะหน้า Workflow |

---

## ชื่อฟังก์ชัน v2 (46 อัน)

| โมดูล | จำนวน | ชื่อฟังก์ชัน |
|---|:---:|---|
| **M1 LINE INTAKE** | 6 | Instant Capture · Batch Upload · Smart Menu · Remember My Choice · Duplicate Check · Auto Fix Image |
| **M2 OCR & EXTRACTION** | 5 | AI Reader · Auto Check · Smart Flag · Auto Category · Never Lose a File |
| **M3 DOCUMENT STORAGE** | 6 | Secure Storage · Drive Sync · Auto Organize · Space Alert · Private Link · Safe Delete |
| **M4 REVIEW & CORRECTION** | 6 | Review Only What Matters · Review Card · Easy Fix · Smart Validation · Learn From You · Change Alert |
| **M5 EXPORT & REPORT** | 6 | Excel Report · PDF Report · Export History · Ready to Use · Private Send · Monthly Summary |
| **M6 PERMISSION & USER** | 5 | Group Setup · Access Levels · New Member Alert · Activity History · White-Label Ready |
| **M7 TASK TRACKER** | 7 | Team Directory · Assign Task · Smart Reminder · One Daily Summary · Mark Done · Auto Complete · Approval Request |
| **M8 CONSOLE & DASHBOARD** | 5 | แท็บเอกสาร · แท็บงาน · ตัวเลขสรุป · ศูนย์ส่งออก · Settings & Members |

**คู่ที่ยุบรวม** — `Instant Receive`+`Safe Capture`→`Instant Capture` · `Smart Command`+`Button Menu`→`Smart Menu` · `Confidence Level`+`Smart Flag`→`Smart Flag` · `Auto Check`+`Tax ID Guard`→`Auto Check` · `Auto Folder`+`Smart Naming`→`Auto Organize` · `Drive Sync`+`Your Own Drive`→`Drive Sync` · `Pick Any Field`+`Type to Fix`→`Easy Fix` · `Auto Recalculate`+`Instant Check`→`Smart Validation` · `Thai Ready`+`Number Safe`→`Ready to Use` · `Team Access`+`Financial Access`+`Owner Only`→`Access Levels` · `Group Setup`+`Verify Once`→`Group Setup` · `Assign in Group`+`Assign Privately`→`Assign Task` · `Mark Done`+`Reopen Task`→`Mark Done` · `จัดการสมาชิก`+`ตั้งค่าสำนักงาน`+`ประวัติการใช้งาน`→`Settings & Members`

**ที่ไม่ยุบ (ตั้งใจ)** — `Auto Category` แยกจาก `AI Reader` เพราะเป็นคุณค่าที่คุณตี๋สนใจตรง · `Space Alert` แยกจาก `Drive Sync` เพราะเป็นข้อจำกัดที่ลูกค้าต้องรู้ล่วงหน้า · `One Daily Summary` แยกจาก `Smart Reminder` เพราะรวมเรื่องเอกสารด้วย

---

## กติกาการเขียน (คงเดิมจาก v1)

- **คงเป็นอังกฤษ** ตามเทมเพลต: `Platform Types` · `User Permissions` · `User Capabilities` · `Core Functions` · `NOTIFICATION` · `Tech Stack` · `Third-Party API Integration` และชื่อฟังก์ชัน
- **เนื้อหาที่อธิบาย** เขียนเป็นภาษาที่ลูกค้าอ่านเข้าใจ ไม่ใช้ศัพท์ระบบหรือชื่อตารางฐานข้อมูล
- **กล่องล่างหน้า Site Map** ช่องซ้ายและกลางเป็นศัพท์เทคนิค (Tech Stack · รายชื่อฟังก์ชันอังกฤษ)

---

## Platform Workflow 12 ขั้นตอน (หน้า 43) — คงเดิม

| รับเอกสารและอ่านข้อมูล | จัดเก็บ ตรวจ และติดตาม | ปิดรอบและวนกลับ |
|---|---|---|
| 1 พนักงานส่งใบเสร็จเข้ากลุ่มไลน์ | 5 ระบบเก็บไฟล์ และส่งสำเนาเข้า Drive | 9 เก็บทุกการแก้เป็นตัวอย่างที่ถูกต้อง |
| 2 เก็บไฟล์ทันที และตรวจใบซ้ำ | 6 บอทตอบการ์ดผลพร้อมปุ่ม | 10 สำนักงานกดส่งออก Excel และ PDF |
| 3 AI อ่านใบเสร็จ และจัดหมวด | 7 สรุปเช้าวันละครั้ง | 11 ปิดงาน "ส่งออกเดือนนี้" และส่ง PDF |
| 4 ตรวจตัวเลขด้วยสูตร และติดธง | 8 สำนักงานตรวจเฉพาะใบติดธง | 12 เจ้าของรับสรุป และมอบหมายงานรอบใหม่ |

**แถบล่างคลุมทั้ง 12 ขั้น:** 🔒 PERMISSION & USER — ทุกขั้นอยู่ภายใต้สิทธิ์ 3 ชั้น และบันทึกว่าใครทำอะไร
**ลูกศรวนกลับ:** ขั้น 12 ย้อนกลับไปขั้น 1 (วงจรที่ทำซ้ำทุกเดือน)

---

## ⚠️ สถานะ ณ ปัจจุบัน (28 ส.ค. 69)

| จุดสังเกต | |
|---|---|
| 🔴 **M8 ขัดกับ Canva** | Canva ใช้อังกฤษ 8 ชื่อ: Documents Tab · Tasks Tab · Quick Stats · **Company Switch** · Export Center · **Member Manager** · **Office Settings** · **Activity Log** — แต่ v2 ยุบ 3 ตัวท้ายเป็น `Settings & Members` และตัด `Company Switch` เป็น bullet **ต้องตัดสินว่าจะยึดฝั่งไหน** |
| 🟡 **ฟังก์ชัน 46 อัน ยังไม่ลง Canva** | Canva/pptx สร้างจากชุด 64 อัน — ถ้าจะยึด v2 ต้องแก้เด็คตาม |
| จำนวนหน้า | เอกสาร 56 หน้า · pptx 47 หน้า · Canva 45 หน้า (ตัดบางส่วนตามที่ตกลง) |
| ส่วนที่ตัดออกใน Canva | ตารางสิทธิ์ · หน้าตั้งค่า · Positioning & Business · Competitive · Business Model · Cost Structure (ย้ายไปรวมใน Budget) · Phase 2 · Roadmap · สิ่งที่ตกลงแล้ว/ยังต้องการ · เรื่องที่ต้องระวัง · Closing |
| 🟡 ชื่อคำเรียกบอท `ฉับไว` | ชื่อชั่วคราว รอยืนยัน |
| 🟡 Google Sheets สำหรับงาน | ยังไม่ตัดสินว่าจะซิงก์ออกไปไหม |

---

## วิธีเรียกคืนเวอร์ชันเดิม

คัดลอกไฟล์จาก `_versions/` ทับไฟล์ที่ root ได้เลย — ไฟล์ในโฟลเดอร์นี้ไม่ถูกแก้ทับ มีแต่เพิ่มเข้าไป

```
_versions/
  13-module-presentation-structure_v1_2026-08-28.md              สรุป · 64 ฟังก์ชัน
  13-module-presentation-structure_v2_2026-08-28.md              สรุป · 46 ฟังก์ชัน  ← ไฟล์นี้
  13-module-presentation-structure_v2-full-56pages_2026-08-28.md ฉบับเต็ม เอาไปวาง Canva ได้
```
