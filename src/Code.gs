// ============================================================
//  CODE.GS — โรงเรียนโซ่พิสัยพิทยาคม ระบบยืม–คืนอุปกรณ์
//  v3.0 — GitHub + Catalog + Image per Item
// ============================================================

const CONFIG = {
  ADMIN_PASSWORD: "12345",
  SPREADSHEET_ID: "1mLFrsrGK-u-Ei3aSbfzhH-I2NFDxxheqb0D5Ncim1v4",
  FOLDER_ID: "1mJYe08APA3uTzSim-xAzUtx-3EwVFVpv"
};

// ── Entry Point ───────────────────────────────────────────────
function doGet() {
  return HtmlService.createTemplateFromFile("Index")
    .evaluate()
    .setTitle("ระบบยืม–คืนอุปกรณ์ | โรงเรียนโซ่พิสัยพิทยาคม")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag("viewport", "width=device-width, initial-scale=1.0");
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// ── Spreadsheet Helpers ───────────────────────────────────────
function getSheet(name) {
  return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID).getSheetByName(name);
}

// HEADERS v3 (Stock now has รูปภาพURL as col 8):
// Stock col:        ID(1) | รายการ(2) | หมายเลขครุภัณฑ์(3) | หมวดหมู่(4) | ทั้งหมด(5) | คงเหลือ(6) | หมายเหตุ(7) | รูปภาพURL(8)
// Transactions col: TransID(1) | ประเภทผู้ยืม(2) | ชื่อผู้ยืม(3) | รหัสประจำตัว/ห้อง/สังกัด(4) |
//                   IDอุปกรณ์(5) | หมายเลขครุภัณฑ์(6) | จำนวนที่ยืม(7) | จำนวนที่คืน(8) |
//                   วันที่ยืม(9) | วันที่คืน(10) | สถานะ(11) | ImageURL(12) | SignatureURL(13)

function ensureHeaders() {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);

  // Stock
  let st = ss.getSheetByName("Stock");
  if (!st) st = ss.insertSheet("Stock");
  if (st.getLastRow() === 0 || st.getRange(1,1).getValue() !== "ID") {
    st.getRange(1,1,1,8).setValues([[
      "ID","รายการ","หมายเลขครุภัณฑ์","หมวดหมู่",
      "ทั้งหมด","คงเหลือ","หมายเหตุ","รูปภาพURL"
    ]]);
  } else if (st.getLastColumn() < 8) {
    // Migrate: add รูปภาพURL column if missing
    st.getRange(1, 8).setValue("รูปภาพURL");
  }

  // Transactions
  let tx = ss.getSheetByName("Transactions");
  if (!tx) tx = ss.insertSheet("Transactions");
  if (tx.getLastRow() === 0 || tx.getRange(1,1).getValue() !== "TransID") {
    tx.getRange(1,1,1,13).setValues([[
      "TransID","ประเภทผู้ยืม","ชื่อผู้ยืม","รหัสประจำตัว/ห้อง/สังกัด",
      "IDอุปกรณ์","หมายเลขครุภัณฑ์","จำนวนที่ยืม","จำนวนที่คืน",
      "วันที่ยืม","วันที่คืน","สถานะ","ImageURL","SignatureURL"
    ]]);
  }
}

// ── Data Access ───────────────────────────────────────────────
function getStockData() {
  ensureHeaders();
  const rows = getSheet("Stock").getDataRange().getValues();
  if (rows.length < 2) return [];
  const h = rows[0];
  return rows.slice(1).filter(r => r[0] !== "").map(r => {
    const o = {};
    h.forEach((k,i) => o[k] = r[i] || "");
    return o;
  });
}

function getTransactionData() {
  ensureHeaders();
  const rows = getSheet("Transactions").getDataRange().getValues();
  if (rows.length < 2) return [];
  const h = rows[0];
  return rows.slice(1).filter(r => r[0] !== "").map(r => {
    const o = {};
    h.forEach((k,i) => {
      o[k] = r[i] instanceof Date
        ? Utilities.formatDate(r[i], Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm")
        : (r[i] || "");
    });
    return o;
  });
}

function getAllData() {
  ensureHeaders();
  return {
    stock: getStockData(),
    transactions: getTransactionData(),
    ts: new Date().getTime()
  };
}

// ── Stock CRUD ────────────────────────────────────────────────
function addStockItem(data) {
  ensureHeaders();
  const sheet = getSheet("Stock");
  const newId = "ITM" + String(sheet.getLastRow()).padStart(4,"0");
  sheet.appendRow([
    newId, data.name, data.assetNo||"", data.category||"",
    Number(data.total)||0, Number(data.total)||0,
    data.remark||"", data.imageUrl||""
  ]);
  return { success:true, id:newId };
}

function updateStockItem(data) {
  const sheet = getSheet("Stock");
  const rows = sheet.getDataRange().getValues();
  for (let i=1;i<rows.length;i++) {
    if (String(rows[i][0])===String(data.id)) {
      sheet.getRange(i+1,2,1,7).setValues([[
        data.name, data.assetNo||"", data.category||"",
        Number(data.total)||0, Number(data.remaining)||0,
        data.remark||"", data.imageUrl||""
      ]]);
      return { success:true };
    }
  }
  return { success:false, error:"ไม่พบรายการ" };
}

function updateStockImage(id, imageUrl) {
  const sheet = getSheet("Stock");
  const rows = sheet.getDataRange().getValues();
  for (let i=1;i<rows.length;i++) {
    if (String(rows[i][0])===String(id)) {
      sheet.getRange(i+1, 8).setValue(imageUrl);
      return { success:true };
    }
  }
  return { success:false, error:"ไม่พบรายการ" };
}

function deleteStockItem(id) {
  const sheet = getSheet("Stock");
  const rows = sheet.getDataRange().getValues();
  for (let i=1;i<rows.length;i++) {
    if (String(rows[i][0])===String(id)) {
      sheet.deleteRow(i+1);
      return { success:true };
    }
  }
  return { success:false, error:"ไม่พบรายการ" };
}

// ── Borrow Logic ──────────────────────────────────────────────
function submitBorrow(payload) {
  try {
    ensureHeaders();
    const stockSheet = getSheet("Stock");
    const txSheet    = getSheet("Transactions");
    let stockRows    = stockSheet.getDataRange().getValues();
    const transId    = "TXN" + new Date().getTime();
    const dateStr    = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm");

    // Validate
    for (const item of payload.items) {
      let found = false;
      for (let i=1;i<stockRows.length;i++) {
        if (String(stockRows[i][0])===String(item.itemId)) {
          found = true;
          if (Number(stockRows[i][5]) < Number(item.qty))
            return { success:false, error:`"${stockRows[i][1]}" คงเหลือเพียง ${stockRows[i][5]} ชิ้น` };
          break;
        }
      }
      if (!found) return { success:false, error:"ไม่พบอุปกรณ์รหัส: "+item.itemId };
    }

    let imageUrl = "";
    if (payload.imageBase64 && payload.imageBase64.length>200)
      imageUrl = uploadFileToDrive(payload.imageBase64,"img_"+transId+".jpg","image/jpeg");
    let signatureUrl = "";
    if (payload.signatureBase64 && payload.signatureBase64.length>200)
      signatureUrl = uploadFileToDrive(payload.signatureBase64,"sig_"+transId+".png","image/png");

    stockRows = stockSheet.getDataRange().getValues();
    for (const item of payload.items) {
      for (let i=1;i<stockRows.length;i++) {
        if (String(stockRows[i][0])===String(item.itemId)) {
          stockSheet.getRange(i+1,6).setValue(Number(stockRows[i][5])-Number(item.qty));
          stockRows[i][5] = Number(stockRows[i][5])-Number(item.qty);
          txSheet.appendRow([
            transId, payload.borrowerType, payload.borrowerName, payload.borrowerId,
            item.itemId, stockRows[i][2], Number(item.qty), 0,
            dateStr, "", "ยืมอยู่", imageUrl, signatureUrl
          ]);
          break;
        }
      }
    }
    return { success:true, transId };
  } catch(e) { return { success:false, error:e.message }; }
}

// ── Return Logic ──────────────────────────────────────────────
function verifyAdmin(pw) { return pw === CONFIG.ADMIN_PASSWORD; }

function getPendingTransactions() {
  const txData    = getTransactionData();
  const stockData = getStockData();
  return txData
    .filter(r => r["สถานะ"]==="ยืมอยู่" || r["สถานะ"]==="คืนบางส่วน")
    .map(r => {
      const s = stockData.find(x => String(x["ID"])===String(r["IDอุปกรณ์"]));
      return {
        transId:  r["TransID"],
        type:     r["ประเภทผู้ยืม"],
        borrower: r["ชื่อผู้ยืม"],
        code:     r["รหัสประจำตัว/ห้อง/สังกัด"],
        itemId:   r["IDอุปกรณ์"],
        itemName: s ? s["รายการ"] : r["IDอุปกรณ์"],
        assetNo:  r["หมายเลขครุภัณฑ์"],
        borrowed: Number(r["จำนวนที่ยืม"]),
        returned: Number(r["จำนวนที่คืน"]),
        canReturn:Number(r["จำนวนที่ยืม"])-Number(r["จำนวนที่คืน"]),
        borrowDate:r["วันที่ยืม"],
        status:   r["สถานะ"]
      };
    });
}

function submitReturn(payload) {
  try {
    if (!verifyAdmin(payload.adminPass)) return { success:false, error:"รหัสผ่านไม่ถูกต้อง" };
    const stockSheet = getSheet("Stock");
    const txSheet    = getSheet("Transactions");
    const txRows     = txSheet.getDataRange().getValues();
    const stockRows  = stockSheet.getDataRange().getValues();
    const dateStr    = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm");

    for (let i=1;i<txRows.length;i++) {
      if (String(txRows[i][0])===String(payload.transId) &&
          String(txRows[i][4])===String(payload.itemId)) {
        const orig = Number(txRows[i][6]);
        const done = Number(txRows[i][7]);
        const ret  = Number(payload.returnQty);
        const tot  = done + ret;
        if (ret<1||ret>(orig-done)) return { success:false, error:`คืนได้ 1–${orig-done} ชิ้น` };
        const status = tot>=orig ? "คืนแล้ว" : "คืนบางส่วน";
        txSheet.getRange(i+1,8).setValue(tot);
        txSheet.getRange(i+1,10).setValue(dateStr);
        txSheet.getRange(i+1,11).setValue(status);
        for (let j=1;j<stockRows.length;j++) {
          if (String(stockRows[j][0])===String(payload.itemId)) {
            stockSheet.getRange(j+1,6).setValue(Number(stockRows[j][5])+ret);
            break;
          }
        }
        return { success:true, status };
      }
    }
    return { success:false, error:"ไม่พบรายการ" };
  } catch(e) { return { success:false, error:e.message }; }
}

// ── Dashboard Stats ───────────────────────────────────────────
function getDashboardStats() {
  const stock = getStockData();
  const tx    = getTransactionData();
  const totalItems     = stock.reduce((s,r)=>s+Number(r["ทั้งหมด"]||0),0);
  const totalRemaining = stock.reduce((s,r)=>s+Number(r["คงเหลือ"]||0),0);
  const activeBorrows  = tx.filter(r=>r["สถานะ"]==="ยืมอยู่"||r["สถานะ"]==="คืนบางส่วน").length;
  const totalBorrowCount = new Set(tx.map(r=>r["TransID"])).size;

  const countMap = {};
  tx.forEach(r => {
    if (!r["IDอุปกรณ์"]) return;
    countMap[r["IDอุปกรณ์"]] = (countMap[r["IDอุปกรณ์"]]||0)+Number(r["จำนวนที่ยืม"]||0);
  });
  const topItems = Object.entries(countMap).sort((a,b)=>b[1]-a[1]).slice(0,10)
    .map(([id,count])=>{
      const s=stock.find(x=>String(x["ID"])===String(id));
      return { name:s?s["รายการ"]:id, count };
    });

  const overdueList = [];
  tx.forEach(r => {
    if (r["สถานะ"]==="คืนแล้ว") return;
    const parts = String(r["วันที่ยืม"]).split(" ")[0].split("/");
    if (parts.length<3) return;
    let yr=Number(parts[2]); if(yr>2500)yr-=543;
    const days=(new Date()-new Date(yr,Number(parts[1])-1,Number(parts[0])))/86400000;
    if (days>7) {
      const s=stock.find(x=>String(x["ID"])===String(r["IDอุปกรณ์"]));
      overdueList.push({
        transId:r["TransID"],borrower:r["ชื่อผู้ยืม"],type:r["ประเภทผู้ยืม"],
        itemName:s?s["รายการ"]:r["IDอุปกรณ์"],
        qty:Number(r["จำนวนที่ยืม"])-Number(r["จำนวนที่คืน"]),
        borrowDate:r["วันที่ยืม"],days:Math.floor(days),status:r["สถานะ"]
      });
    }
  });

  return { totalItems,totalRemaining,activeBorrows,totalBorrowCount,
           stockCount:stock.length,topItems,overdueList,ts:new Date().getTime() };
}

// ── Print Register ────────────────────────────────────────────
function getRegisterData(filter) {
  const tx=getTransactionData(), stock=getStockData();
  let rows=tx;
  if (filter==="pending")      rows=tx.filter(r=>r["สถานะ"]!=="คืนแล้ว");
  else if (filter&&filter!=="all") rows=tx.filter(r=>r["TransID"]===filter);
  return rows.map((r,i)=>{
    const s=stock.find(x=>String(x["ID"])===String(r["IDอุปกรณ์"]));
    return {
      no:i+1, itemName:s?s["รายการ"]:(r["IDอุปกรณ์"]||"-"),
      assetNo:r["หมายเลขครุภัณฑ์"]||"-", qty:r["จำนวนที่ยืม"]||0,
      borrowDate:r["วันที่ยืม"]||"-", borrower:r["ชื่อผู้ยืม"]||"-",
      returnDate:r["วันที่คืน"]||"-",
      returner:r["วันที่คืน"]?(r["ชื่อผู้ยืม"]||"-"):"-",
      status:r["สถานะ"]||"-", signatureUrl:r["SignatureURL"]||"",
      transId:r["TransID"]||""
    };
  });
}

// ── Upload to Drive ───────────────────────────────────────────
function uploadFileToDrive(base64Data, fileName, mimeType) {
  try {
    const folder=DriveApp.getFolderById(CONFIG.FOLDER_ID);
    const raw=base64Data.includes(",")?base64Data.split(",")[1]:base64Data;
    const blob=Utilities.newBlob(Utilities.base64Decode(raw),mimeType,fileName);
    const file=folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK,DriveApp.Permission.VIEW);
    return "https://drive.google.com/uc?id="+file.getId();
  } catch(e){ Logger.log("Drive error: "+e.message); return ""; }
}

// Upload catalog image for a stock item
function uploadCatalogImage(id, base64Data) {
  try {
    const url = uploadFileToDrive(base64Data, "catalog_"+id+"_"+Date.now()+".jpg", "image/jpeg");
    if (url) {
      updateStockImage(id, url);
      return { success:true, url };
    }
    return { success:false, error:"อัปโหลดไม่สำเร็จ" };
  } catch(e){ return { success:false, error:e.message }; }
}
