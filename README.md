# 📦 ระบบยืม–คืนอุปกรณ์ | โรงเรียนโซ่พิสัยพิทยาคม

ระบบ Web Application ยืม–คืนอุปกรณ์/พัสดุออนไลน์ พัฒนาด้วย **Google Apps Script (GAS)**
พร้อมแคตตาล็อกพัสดุ, Dashboard Real-time, ระบบพิมพ์ทะเบียน และลายเซ็นดิจิทัล

## 📁 โครงสร้างโปรเจกต์
```
spk-borrow-system/
├── src/
│   ├── Code.gs          ← Backend: Logic ทั้งหมด, CRUD, Borrow, Return, Stats
│   ├── Index.html       ← UI หลัก: Dashboard, ยืม, คืน, คลัง, แคตตาล็อก, ประวัติ
│   ├── CSS.html         ← Styles: Bento Grid Glassmorphism 2026
│   ├── JS.html          ← Client JS: Real-time, Signature, Catalog, Print
│   └── appsscript.json  ← GAS Manifest
├── .clasp.json          ← clasp configuration (ใส่ scriptId ของคุณ)
├── .gitignore
└── README.md
```

## 🚀 วิธีติดตั้ง

### 1. Clone & ติดตั้ง clasp
```bash
git clone https://github.com/YOUR_USERNAME/spk-borrow-system.git
cd spk-borrow-system
npm install -g @google/clasp
clasp login
```

### 2. เชื่อมกับ GAS Project
แก้ไข `.clasp.json` ใส่ Script ID จาก script.google.com:
```json
{ "scriptId": "YOUR_SCRIPT_ID_HERE", "rootDir": "./src" }
```

### 3. Push & Deploy
```bash
clasp push
clasp deploy --description "v1.0"
```

## 🔐 รหัสผ่าน Admin เริ่มต้น: `12345`

## ⚙️ GitHub Actions (Auto Deploy on push)
สร้าง `.github/workflows/deploy.yml` และตั้ง Secrets:
- `CLASP_TOKEN` = เนื้อหาใน ~/.clasprc.json
- `DEPLOYMENT_ID` = จาก `clasp deployments`

```yaml
name: Deploy to GAS
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm install -g @google/clasp
      - run: echo '${{ secrets.CLASP_TOKEN }}' > ~/.clasprc.json
      - run: clasp push --force
      - run: clasp deploy --deploymentId ${{ secrets.DEPLOYMENT_ID }} --description "Auto $(date)"
```

## 🗄️ Sheet Headers
**Stock:** ID | รายการ | หมายเลขครุภัณฑ์ | หมวดหมู่ | ทั้งหมด | คงเหลือ | หมายเหตุ | รูปภาพURL

**Transactions:** TransID | ประเภทผู้ยืม | ชื่อผู้ยืม | รหัสประจำตัว/ห้อง/สังกัด | IDอุปกรณ์ | หมายเลขครุภัณฑ์ | จำนวนที่ยืม | จำนวนที่คืน | วันที่ยืม | วันที่คืน | สถานะ | ImageURL | SignatureURL

## 📜 MIT License — โรงเรียนโซ่พิสัยพิทยาคม © 2026
