# 🛠️ คู่มือติดตั้ง ระบบยืม–คืนอุปกรณ์

## ⚡ วิธีที่ 1 — ติดตั้งผ่าน GitHub + clasp (แนะนำ)

### ก่อนเริ่ม ต้องมี
- บัญชี GitHub
- บัญชี Google (เดียวกับที่ใช้ Google Sheets)
- Node.js 18+ (ดาวน์โหลดที่ nodejs.org)

---

### ขั้นตอน 1 — Fork / Clone โปรเจกต์

```bash
# Clone ลงเครื่อง
git clone https://github.com/YOUR_USERNAME/spk-borrow-system.git
cd spk-borrow-system

# ติดตั้ง clasp
npm install
```

---

### ขั้นตอน 2 — Login clasp ด้วย Google Account

```bash
npx clasp login
```
> จะเปิดเบราว์เซอร์ให้ Login — อนุญาตสิทธิ์ทั้งหมด

---

### ขั้นตอน 3 — สร้าง GAS Project ใหม่

1. ไปที่ https://script.google.com
2. คลิก **"โปรเจกต์ใหม่"**
3. ตั้งชื่อ เช่น `SPK-Borrow-System`
4. Copy **Script ID** จาก URL:
   ```
   https://script.google.com/home/projects/[SCRIPT_ID_ตรงนี้]/edit
   ```

---

### ขั้นตอน 4 — ใส่ Script ID ใน .clasp.json

แก้ไขไฟล์ `.clasp.json`:
```json
{
  "scriptId": "SCRIPT_ID_ที่คัดลอกมา",
  "rootDir": "./src"
}
```

---

### ขั้นตอน 5 — Push โค้ดขึ้น GAS

```bash
npm run push
# หรือ: npx clasp push
```

---

### ขั้นตอน 6 — Deploy เป็น Web App

```bash
npm run deploy
```

**หรือผ่านหน้าเว็บ GAS:**
1. GAS Editor → **"Deploy"** → **"New deployment"**
2. ประเภท: **Web app**
3. Execute as: **Me**
4. Who has access: **Anyone** (หรือ Anyone within [domain])
5. กด **Deploy** → Copy URL ที่ได้

---

### ขั้นตอน 7 — (ถ้าต้องการ) เชื่อม GitHub Actions

ทำให้โค้ด Push ขึ้น GAS อัตโนมัติทุกครั้งที่ push ไป GitHub:

**1. หา CLASPRC_JSON:**
```bash
cat ~/.clasprc.json
```
Copy ทั้งหมด

**2. หา DEPLOYMENT_ID:**
```bash
npm run status
# หรือ: npx clasp deployments
```

**3. ตั้ง GitHub Secrets:**
ไปที่ GitHub Repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

| ชื่อ Secret | ค่า |
|------------|-----|
| `CLASPRC_JSON` | เนื้อหาของ ~/.clasprc.json |
| `DEPLOYMENT_ID` | ID จาก clasp deployments |

ตั้งแล้ว ทุกครั้งที่ `git push` ไป branch `main` จะ deploy อัตโนมัติ!

---

## ⚡ วิธีที่ 2 — Copy วางตรงๆ ใน GAS Editor (ง่ายสุด)

1. เปิด https://script.google.com → สร้างโปรเจกต์ใหม่
2. **Code.gs** → วางโค้ดจาก `src/Code.gs`
3. สร้างไฟล์ HTML ใหม่ชื่อ **Index** → วางจาก `src/Index.html`
4. สร้างไฟล์ HTML ใหม่ชื่อ **CSS** → วางจาก `src/CSS.html`
5. สร้างไฟล์ HTML ใหม่ชื่อ **JS** → วางจาก `src/JS.html`
6. Deploy → Web App → Anyone → Deploy

---

## 🔐 รหัสผ่าน Admin

รหัสเริ่มต้น: **`12345`**

เปลี่ยนได้ใน `src/Code.gs` บรรทัด:
```javascript
ADMIN_PASSWORD: "12345",  // เปลี่ยนตรงนี้
```

---

## 📊 Google Sheets ที่ใช้

Spreadsheet ID: `1mLFrsrGK-u-Ei3aSbfzhH-I2NFDxxheqb0D5Ncim1v4`

ระบบจะสร้าง Sheet headers อัตโนมัติเมื่อรันครั้งแรก

**Sheet Stock** (8 คอลัมน์):
```
ID | รายการ | หมายเลขครุภัณฑ์ | หมวดหมู่ | ทั้งหมด | คงเหลือ | หมายเหตุ | รูปภาพURL
```

**Sheet Transactions** (13 คอลัมน์):
```
TransID | ประเภทผู้ยืม | ชื่อผู้ยืม | รหัสประจำตัว/ห้อง/สังกัด |
IDอุปกรณ์ | หมายเลขครุภัณฑ์ | จำนวนที่ยืม | จำนวนที่คืน |
วันที่ยืม | วันที่คืน | สถานะ | ImageURL | SignatureURL
```

---

## 🖼️ วิธีเพิ่มรูปภาพพัสดุ (แคตตาล็อก)

**วิธีที่ 1 — อัปโหลดตรงจากแคตตาล็อก:**
- เปิดหน้า **🖼️ แคตตาล็อก**
- Hover บนการ์ดพัสดุ → กดปุ่ม **📷**
- เลือกรูปจากเครื่อง → อัปโหลดขึ้น Google Drive อัตโนมัติ

**วิธีที่ 2 — ใส่ URL ตรงๆ:**
- หน้า **📦 คลัง** → กด ✏️ แก้ไข
- ใส่ URL รูปในช่อง "URL รูปภาพพัสดุ"
- รองรับ: imgbb.com, Google Drive share link, หรือ URL รูปทั่วไป

---

## 🆘 แก้ปัญหาที่พบบ่อย

| ปัญหา | วิธีแก้ |
|------|---------|
| `Error: PERMISSION_DENIED` | ตรวจสอบ Spreadsheet ID และสิทธิ์ |
| `clasp push` ไม่ได้ | รัน `clasp login` ใหม่ |
| รูปภาพไม่แสดง | ตรวจสอบว่า Drive folder เป็น Public |
| หน้าเว็บขาว | ดู GAS Logs: Extensions → Apps Script → Executions |

---

## 📞 ติดต่อ
กลุ่มงานบริหารงานทั่วไป โรงเรียนโซ่พิสัยพิทยาคม
