# สรุป · line-file-intake-flow-spec.md

> **เอกสารต้นทาง:** `claude/line-file-intake-flow-spec.md` · สร้าง 24 ส.ค. 2569
> **กลุ่ม:** การออกแบบ OCR และ Flow
> **บทบาท:** สเปก flow รับไฟล์จาก LINE → OCR/เก็บไฟล์ (ฉบับร่างให้ทีม Dev)

---

## สรุป 5 บรรทัด

1. สเปกละเอียดของ **โมดูลรับเอกสารผ่าน LINE OA** พร้อม state diagram ครบทุกเส้นทาง
2. หลักการ 3 ข้อ: OCR เก็บไฟล์เสมอ · ถามให้น้อยที่สุด · บันทึกทุกใบแล้วติดธง
3. มี **ข้อความบอทตัวอย่าง** ทุกขั้นตอน — เอาไปทำ Clickable Demo ได้เลย
4. มี **Data model ร่าง 5 ตาราง** + กติกา validate + โครงสร้าง Drive + ชื่อไฟล์
5. ตาราง **error cases 8 กรณี** ที่ต้องรองรับ

---

## Flow หลัก

```
RECEIVED → FETCHED → GROUPING → ASKING/AUTO → EXTRACTING → VALIDATING
                                                    ↓
                              SAVED / SAVED_FLAGGED / STORED_ONLY / STORED
```

### 4.1 รับไฟล์ (RECEIVED → FETCHED)
⚠️ **ต้องดึงไฟล์จาก LINE Content API ทันทีที่รับ webhook** ไม่ใช่รอผู้ใช้ตอบ — ไฟล์มีอายุจำกัด
- เก็บใน staging แบบชั่วคราวมี TTL
- บันทึก `pending_upload` record
- ตอบ ack เร็ว · งานหนักทำใน background job

### 4.2 รวมชุด (GROUPING)
รูปที่ส่งติดกันภายใน **10 วินาที** จากคนเดียวกัน = ชุดเดียว ถามครั้งเดียว

### 4.3 ถาม (ASKING)
ใช้ Quick Reply / ปุ่มบน Flex Message ไม่ให้พิมพ์ตอบ · บอทเดาประเภทเอกสารก่อน
```
ได้รับ 12 รูปแล้วครับ 📄
ดูเหมือนใบกำกับภาษี/ใบเสร็จ
[ อ่านข้อมูล + เก็บไฟล์ ]  ← แนะนำ
[ เก็บไฟล์เฉย ๆ ]
[ ทำแบบนี้ทุกครั้งเลย ]
```
**Timeout 24 ชม.** → default ระบบ = เก็บไฟล์

### 4.4 กติกา Validate
| กติกา | เงื่อนไข |
|---|---|
| ยอดรวม | ผลบวกรายการ = ยอดรวม (±0.01) |
| VAT | VAT = 7% ของฐาน (±0.05) |
| เลขผู้เสียภาษี | 13 หลัก + checksum ผ่าน |
| วันที่ | แปลง ISO ได้ · ไม่เป็นอนาคต · ไม่เก่ากว่า 2 ปี (เตือน) |

### 4.5 ตัดสินใจตาม confidence — บันทึกเสมอ ไม่กั้น
| กรณี | สถานะ | ข้อความบอท |
|---|---|---|
| ทุกฟิลด์มั่นใจ + validate ผ่าน | `clean` | `✅ บันทึกแล้ว — บริษัท ABC · 1,070.50 บาท (VAT 70.00)` |
| มีฟิลด์ไม่มั่นใจ | `flagged` | `✅ บันทึกแล้ว แต่ช่วยดูจุดนี้ — ⚠️ เลขผู้เสียภาษีไม่ชัด` |
| อ่านไม่ออกเลย | `unreadable` | `📥 เก็บไฟล์ไว้แล้ว แต่อ่านข้อมูลไม่ออก [📷 ถ่ายใหม่]` |

→ สำนักงานกรองดูเฉพาะ `flagged` = **คุณค่าหลักของระบบ** (จาก 100 ใบ ตรวจแค่ 15)

### 4.6 การแก้ไข
- **เฟส 1:** ปุ่ม "แก้ไข" → บอทถามทีละฟิลด์ที่ติดธง ไม่ต้องสร้างหน้าเว็บ
- **เฟส 2:** LIFF/Dashboard แสดงรูปคู่ฟอร์ม (ถ้าปริมาณโตจนแก้ผ่านแชทไม่ไหว)
- ⭐ ทุกครั้งที่แก้ ต้องเก็บ: `ภาพต้นฉบับ + ค่าที่ AI อ่าน + ค่าที่ถูก + ใครแก้ + เมื่อไหร่`

---

## โครงสร้าง Google Drive

```
/CFO OnDemand/
  /2026/
    /08-สิงหาคม/
      /ใบกำกับภาษี/  /ใบเสร็จ/  /สลิปโอนเงิน/  /อื่น ๆ/
  /_รอตรวจสอบ/          ← ไฟล์ที่ OCR ไม่ผ่าน
```

**ชื่อไฟล์:** OCR สำเร็จ → `2026-08-24_บริษัทABC_1070.50.jpg` · ไม่สำเร็จ → `2026-08-24_1432_LINE_a1b2c3.jpg`
**กันไฟล์ซ้ำ:** เช็ค `file_hash` (SHA-256) ก่อนบันทึก — ลูกค้าส่งใบเดิมซ้ำบ่อยมาก

---

## Data Model ร่าง

```
pending_uploads   id, user_id, line_message_id, staging_path, file_hash,
                  mime_type, received_at, status, group_id

documents         id, user_id, drive_file_id, drive_path, file_hash,
                  doc_type, uploaded_at, source

extractions       id, document_id, model_used, raw_json, vendor_name, tax_id,
                  doc_date, amount_before_vat, vat_amount, total_amount,
                  expense_category, confidence_overall, confidence_per_field,
                  validation_errors, status, created_at

corrections       id, extraction_id, field_name, ai_value, corrected_value,
                  corrected_by, corrected_at

user_preferences  user_id, default_action, default_folder_id, updated_at
```

> `documents.file_hash` unique ต่อ user · `extractions` แยกจาก `documents` เพราะไฟล์เดียวอาจ OCR ซ้ำได้

---

## Error cases 8 กรณี

| กรณี | การจัดการ |
|---|---|
| HEIC จาก iPhone | แปลงเป็น JPG ก่อน (ต้องทำ ไม่ใช่ option) |
| PDF หลายหน้า | ถามก่อนว่าอ่านทุกหน้าไหม — ค่า API ต่างกัน |
| Excel/CSV/งบการเงิน | ไม่เข้า flow OCR → ส่งเข้า flow วิเคราะห์งบ |
| ไฟล์ใหญ่เกิน | แจ้งขีดจำกัด + ขอถ่ายใหม่ |
| ดึงไฟล์จาก LINE ไม่ได้ | แจ้งขอให้ส่งใหม่ |
| Drive เต็ม / token หมดอายุ | เก็บใน staging ไว้ก่อน + แจ้ง **ห้ามทิ้งไฟล์** |
| LLM API ล่ม | retry แบบ backoff → เก็บไฟล์ + เข้าคิว ไม่ทิ้งงาน |
| ส่งรูปที่ไม่ใช่เอกสาร | ตอบสุภาพว่าไม่ใช่เอกสารบัญชี ไม่บันทึก |

---

## ข้อเสนอ Demo

ทำลึกเส้นทางเดียว: ส่งรูปใบกำกับภาษี 1 ใบในแชท 1-1 → บอทเดาประเภท → กด "อ่านข้อมูล + เก็บไฟล์" → แสดงผลพร้อมยืนยัน → บันทึก + แสดงชื่อไฟล์ใน Drive

---

## ⚠️ สถานะ ณ ปัจจุบัน (28 ส.ค. 69)

| เรื่อง | สถานะ |
|---|---|
| Flow ทั้งหมด · กติกา validate · โครงสร้าง Drive | ✅ ยังใช้อยู่ — กลายเป็นโมดูล 1 + 2 + 3 |
| Data model 5 ตาราง | ✅ ยังใช้ — ขยายเป็น **10 ตาราง** ใน `technical-notes-for-dev.md` (เพิ่ม companies, group_members, tasks, edit_sessions, audit_log) |
| ข้อ 9 ประเด็นค้าง #1 PDPA | ✅ เคลียร์แล้ว (B-1) |
| ข้อ 9 ประเด็นค้าง #2 OCR เฟสไหน | ✅ เคลียร์แล้ว — เฟส 1 (B-3) |
| **LIFF ในเฟส 2** | ❌ **ตัดออกจากแผนแล้ว** (B-8) — ใช้ Flex Message แทน มีเงื่อนไขปลดล็อกชัดเจน |
| ประเด็นค้าง #3–#7 | 🟡 ยังค้าง (ตรวจซ้ำอะไร · staging · threshold · PDF หลายหน้า · เก็บกี่ปี) |
