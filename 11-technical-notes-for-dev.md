# สรุป · technical-notes-for-dev.md

> **เอกสารต้นทาง:** `claude/technical-notes-for-dev.md` · สร้าง 27 ส.ค. 2569
> **กลุ่ม:** เอกสารสำหรับทีมพัฒนา
> **บทบาท:** โครงสไลด์ **61 หน้า ฉบับเทคนิค** — มีชื่อตาราง/ฟิลด์/ข้อควรระวังตอนเขียนโค้ด

---

## สรุป 5 บรรทัด

1. โครงสไลด์ฉบับเทคนิคสำหรับทีม dev (คู่กับ `module-presentation-structure.md` ที่เขียนให้ลูกค้าอ่าน)
2. ⭐ **ย้าย Task Tracker + Dashboard เข้าเฟส 1** → จาก 6 เป็น **8 โมดูล** สร้างครั้งเดียว ไม่ต้องรื้อ
3. **ตัด Rich Menu และ LIFF ออก** — ใช้คำกระตุ้น `ฉับไว` + Quick Reply + Flex Message แทน
4. แยกสิทธิ์เป็น **ระดับ 1 / 2a / 2b** พร้อม Permission Matrix เต็ม 5 บทบาท
5. มี **Data model 10 ตาราง** + 4 Platform Workflow + Decisions **B-1 ถึง B-12**

---

## 9 ข้อที่เปลี่ยนจากฉบับแรก

| # | เปลี่ยนอะไร |
|---|---|
| 1 | **UI ชุดเดียว** — ไม่แยกดีไซน์ 1-1 กับกลุ่ม ยึด Quick Reply เป็นแกน |
| 2 | **ตัด Rich Menu** ใช้คำกระตุ้น `ฉับไว` เป็นทางเข้าเดียวทุกห้อง |
| 3 | **ตัด LIFF** ใช้ Flex Message แสดงรูปคู่ตัวเลขในบับเบิลเดียว |
| 4 | **เปิดสิทธิ์ดูเอกสารทั้งบริษัท** — เส้นแบ่งอยู่ที่ *ตัวเลขสรุป* ไม่ใช่ *เอกสารรายใบ* |
| 5 | **แยกระดับ 2 เป็น 2a (ดูตัวเลข) กับ 2b (เปลี่ยนสถานะระบบ)** |
| 6 | ⭐ **ย้าย Task Tracker + Dashboard เข้าเฟส 1** → 8 โมดูล |
| 7 | **กลไกอนุมัติเข้าเฟส 1** ใช้ตาราง `tasks` ร่วมกัน |
| 8 | **แจ้งเตือนรวมเป็นข้อความเดียวต่อกลุ่มต่อวัน** |
| 9 | เพิ่มหน้า **วัตถุประสงค์** เป็นหน้า 2 |

---

## 8 โมดูลเฟส 1

| # | โมดูล | Core Functions |
|---|---|---|
| 1 | **LINE INTAKE** | Webhook & Instant Fetch · Batch Grouping · Trigger + Quick Reply · Duplicate Guard |
| 2 | **OCR & EXTRACTION** | Vision Extract (JSON) · Rule Validation · Confidence Scoring · Status Flagging |
| 3 | **DOCUMENT STORAGE** | Primary Storage · One-way Drive Sync · Smart File Naming · Quota Guard |
| 4 | **REVIEW & CORRECTION** | Flex Review Card · Field Picker · Corrections Dataset · Audit Trail |
| 5 | **EXPORT & REPORT** | Excel 2 ชีต · PDF ตรวจรายใบ · Export Batch State · Thai-safe Rendering |
| 6 | **PERMISSION & USER** | Group Binding · Level 2a/2b · Activity Log · Tenant Isolation |
| 7 | **TASK TRACKER** | Assign · Reminder Ladder · Auto-close · Approval Flow |
| 8 | **CONSOLE & DASHBOARD** | แท็บเอกสาร · แท็บงาน · Export · Audit |

> โมดูล 7–8 เดิมวางไว้เฟส 2 — **ย้ายมาทำพร้อมกันเพราะใช้ webhook · สิทธิ์ · scheduler · การแจ้งเตือน · คอนโซล ชุดเดียวกัน** แยกทำภายหลัง = สร้างซ้ำสองรอบ

---

## โครงสิทธิ์ 3 ชั้น

```
ระดับ 1 (กลุ่ม)     ส่งไฟล์ · OCR · ดูเอกสารทั้งหมดของบริษัทตัวเอง · ยืนยัน/แก้ไข · จัดการงาน
ระดับ 2a (ดูตัวเลข)  ยอดสรุป · ภาษีซื้อรวม · export — ตั้งค่าได้รายบริษัท (financial_visibility)
ระดับ 2b (เปลี่ยนสถานะระบบ)  ผูก/ยกเลิกกลุ่ม · ตั้งค่า · ลบเอกสาร · ให้/ถอน role — เจ้าของเท่านั้น
```
**เหตุผลที่แยก 2a/2b:** 2a พลาด = คนเห็นสิ่งที่ไม่ควรเห็น · **2b พลาด = ระบบหยุดทำงานทั้งบริษัท**

**5 บทบาท:** `member` · `owner` · `accountant` · `office_admin` · `sys_admin`
**เส้นที่ห้ามหลุด:** `company_id` — ลูกค้า A ต้องไม่เห็นข้อมูลลูกค้า B

---

## Data Model 10 ตาราง

| ตาราง | ฟิลด์ที่ห้ามลืม |
|---|---|
| `pending_uploads` | line_message_id, staging_path, file_hash, group_id |
| `documents` | company_id, uploaded_by, file_hash, **exported_at, export_batch_id**, deleted_at |
| `extractions` | document_id, **model_used**, confidence_per_field (jsonb), validation_errors (jsonb), status |
| `corrections` | extraction_id, field_name, ai_value, corrected_value, corrected_by, corrected_at |
| `companies` | **tenant_id**, group_id, **owner_user_id**, **financial_visibility**, digest_time |
| `group_members` 🆕 | group_id, line_user_id, display_name, first_seen_at, last_seen_at |
| `tasks` 🆕 | **type** (`task`\|`approval`), assignee_id, due_at, requires_evidence, **completed_by**, auto_close_rule |
| `edit_sessions` 🆕 | line_user_id, document_id, field_name, step, expires_at |
| `user_preferences` | user_id, default_action, default_folder_id |
| `audit_log` 🆕 | actor_user_id, company_id, action, before, after, at |

**ต้องมีทุกที่:** `line_user_id` ในทุก log · `tenant_id` · แยกฟิลด์อ่อนไหว/ไม่อ่อนไหว

---

## กติกาข้ามโมดูลที่ dev ต้องยึด

1. **ทุกเส้นทางต้องทำงานได้แม้ไม่มี LLM** — LLM เป็นทางลัด ไม่ใช่ทางเดียว มีทางปุ่มสำรองเสมอ
2. **บันทึกทุกใบ ไม่กั้น** — ติดธงแทนการบล็อก
3. **ไม่กั้น แต่ให้เห็น** — เปิดสิทธิ์กว้าง แต่บันทึกว่าใครทำอะไรเสมอ
4. **1 กลุ่ม = 1 push ต่อวัน** — รวมเรื่องเอกสารกับเรื่องงาน
5. **Drive เป็นชั้นรอง** — Drive ล้ม ≠ ระบบล้ม · ซิงก์ทางเดียวเท่านั้น
6. **Single source of truth = DB**
7. **ตรวจสิทธิ์ตอนรับ postback ทุกครั้ง** — ปุ่มที่ส่งเข้ากลุ่ม ใครในกลุ่มก็กดได้
8. **เมนูตั้งค่าต้องไม่ตอบในห้องกลุ่ม**

---

## Decisions B-1 ถึง B-12 (เพิ่มจาก briefing)

| # | ประเด็น | คำตอบ |
|---|---|---|
| B-7 🆕 | Rich Menu | ✅ **ไม่ทำ** — ลดภาระรูป × จำนวน tenant |
| B-8 🆕 | LIFF | ✅ **ตัดออก** — ใช้ Flex Message · มีเงื่อนไขปลดล็อกชัดเจน |
| B-9 🆕 | สิทธิ์ดูเอกสาร | ✅ ทุกคนในกลุ่มดูเอกสารของบริษัทตัวเองได้ |
| B-10 🆕 | สิทธิ์ดูตัวเลขสรุป | ✅ ตั้งค่าได้รายบริษัท ค่าเริ่มต้น = เปิด |
| B-11 🆕 | Task Tracker + Dashboard | ✅ **เข้าเฟส 1 พร้อมส่วนอื่น** |
| B-12 🆕 | กลไกอนุมัติ | ✅ เข้าเฟส 1 — ใช้ `tasks` (`type = task \| approval`) |

---

## กับดักใหม่ที่ระบุเพิ่ม

| กับดัก | อาการ | วิธีแก้ |
|---|---|---|
| **ปุ่มในกลุ่ม** | ใครในกลุ่มก็กดได้ — postback บอกแค่ว่าใครกด | เช็ก `line_user_id` กับ role **ทุกครั้งตอนรับ postback** |
| **บอทไม่รู้จักสมาชิก** | มอบหมายงานให้คนที่ไม่เคยพิมพ์ไม่ได้ | เก็บ `group_members` + ขอให้ทุกคนทักทายตอนบอทเข้ากลุ่ม |
| **แก้ข้อมูลชนกันในกลุ่ม** | หลายคนหลายใบพร้อมกัน บอทสับสน | `edit_sessions` ผูกกับ (คน + เอกสาร) |
| **เตือนงานทุกวันไม่จบ** | คนเริ่มมองข้ามทั้งสรุป | บันไดเตือน — เลย 7 วันบอทหยุดตาม แล้วถาม owner |

---

## ⚠️ สถานะ ณ ปัจจุบัน (28 ส.ค. 69)

✅ **นี่คือเอกสารอ้างอิงหลักของทีม dev** — ยังใช้ได้ครบทั้งฉบับ

| จุดสังเกต | |
|---|---|
| ชื่อไฟล์ vs เนื้อหา | ⚠️ ชื่อไฟล์คือ `technical-notes-for-dev.md` แต่หัวเอกสารข้างในเขียนว่า "Module Presentation Structure" — อาจสับสนกับ `module-presentation-structure.md` |
| จำนวนหน้า | 61 หน้า (ฉบับเทคนิค) vs 56 หน้า (ฉบับลูกค้า) |
| ชื่อคำกระตุ้น `ฉับไว` | 🟡 ชื่อชั่วคราว รอยืนยัน |
| ชื่อฟังก์ชัน M8 | ⚠️ ยังเป็นภาษาไทย ขณะที่ Canva เปลี่ยนเป็นอังกฤษแล้ว |

**ใช้คู่กับ:** `dev-scope-and-estimate.md` (แจกแจง 69 ฟังก์ชัน + วัน-คน)
