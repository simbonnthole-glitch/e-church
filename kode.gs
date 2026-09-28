/**
 * ============================================================================
 * GEREJA HUB - SISTEM INFORMASI GEREJA + WEBSITE PUBLIK
 * Version 1.0.0 (Production Modular Monolith for Google Apps Script)
 * File: Kode.gs (Server-side Core Engine)
 * ============================================================================
 */

// ============================================================================
// 1. GLOBAL CONFIGURATION & CONSTANTS
// ============================================================================
var APP_CONFIG = {
  APP_NAME: "GEREJA HUB",
  APP_VERSION: "1.0.0",
  TIMEZONE: "Asia/Jakarta",
  LOCALE: "id-ID",
  CURRENCY: "IDR",
  SESSION_DURATION_HOURS: 12,
  MAX_LOGIN_ATTEMPTS: 5,
  LOCK_TIMEOUT_MS: 30000,
  PROPERTIES_KEYS: {
    SPREADSHEET_ID: "GEREJA_HUB_SPREADSHEET_ID",
    DRIVE_FOLDER_ID: "GEREJA_HUB_DRIVE_FOLDER_ID",
    INITIALIZED: "GEREJA_HUB_INITIALIZED",
    CONFIRMATION_TOKEN: "GEREJA_HUB_CONFIRMATION_TOKEN"
  }
};

// ============================================================================
// 2. CENTRAL SCHEMA REGISTRY
// ============================================================================
var SCHEMA_REGISTRY = {
  users: {
    sheetName: "users",
    idPrefix: "USR",
    headers: ["id", "email", "password_hash", "name", "role_id", "is_active", "last_login_at", "created_at", "updated_at"]
  },
  roles: {
    sheetName: "roles",
    idPrefix: "ROL",
    headers: ["id", "name", "description", "created_at"]
  },
  permissions: {
    sheetName: "permissions",
    idPrefix: "PRM",
    headers: ["id", "code", "name", "description"]
  },
  role_permissions: {
    sheetName: "role_permissions",
    idPrefix: "RPM",
    headers: ["role_id", "permission_id"]
  },
  families: {
    sheetName: "families",
    idPrefix: "FAM",
    headers: ["id", "family_number", "family_name", "address", "phone", "notes", "created_at", "updated_at"]
  },
  members: {
    sheetName: "members",
    idPrefix: "MBR",
    headers: ["id", "family_id", "member_number", "full_name", "gender", "birth_date", "phone", "email", "address", "membership_status", "joined_at", "photo_url", "notes", "created_at", "updated_at", "deleted_at"]
  },
  ministry_types: {
    sheetName: "ministry_types",
    idPrefix: "MNT",
    headers: ["id", "name", "description", "is_active", "created_at"]
  },
  ministry_requests: {
    sheetName: "ministry_requests",
    idPrefix: "REQ",
    headers: ["id", "type_id", "member_id", "assigned_user_id", "requester_name", "requester_phone", "requester_email", "description", "status", "priority", "created_at", "updated_at", "resolved_at"]
  },
  counseling_notes: {
    sheetName: "counseling_notes",
    idPrefix: "CSL",
    headers: ["id", "request_id", "author_id", "content", "created_at", "updated_at"]
  },
  events: {
    sheetName: "events",
    idPrefix: "EVT",
    headers: ["id", "title", "slug", "description", "location", "start_at", "end_at", "capacity", "registration_open", "registration_close", "status", "is_published", "cover_image_url", "created_by", "created_at", "updated_at"]
  },
  event_registrations: {
    sheetName: "event_registrations",
    idPrefix: "REG",
    headers: ["id", "event_id", "name", "phone", "email", "participant_count", "notes", "status", "registered_at"]
  },
  income_categories: {
    sheetName: "income_categories",
    idPrefix: "INC",
    headers: ["id", "name", "description", "is_active"]
  },
  expense_categories: {
    sheetName: "expense_categories",
    idPrefix: "EXP",
    headers: ["id", "name", "description", "is_active"]
  },
  financial_transactions: {
    sheetName: "financial_transactions",
    idPrefix: "TRX",
    headers: ["id", "transaction_number", "type", "category_id", "amount", "transaction_date", "description", "reference_number", "attachment_url", "created_by", "created_at", "updated_at"]
  },
  pages: {
    sheetName: "pages",
    idPrefix: "PGE",
    headers: ["id", "title", "slug", "content", "status", "meta_title", "meta_description", "published_at", "created_by", "updated_by", "created_at", "updated_at"]
  },
  posts: {
    sheetName: "posts",
    idPrefix: "PST",
    headers: ["id", "title", "slug", "category", "excerpt", "content", "cover_image_url", "status", "published_at", "author_id", "created_at", "updated_at"]
  },
  galleries: {
    sheetName: "galleries",
    idPrefix: "GAL",
    headers: ["id", "title", "description", "cover_image_url", "created_at", "updated_at"]
  },
  gallery_items: {
    sheetName: "gallery_items",
    idPrefix: "GLI",
    headers: ["id", "gallery_id", "image_url", "caption", "sort_order", "created_at"]
  },
  worship_schedules: {
    sheetName: "worship_schedules",
    idPrefix: "WSH",
    headers: ["id", "name", "day_of_week", "start_time", "end_time", "location", "description", "is_active"]
  },
  audit_logs: {
    sheetName: "audit_logs",
    idPrefix: "LOG",
    headers: ["id", "user_id", "action", "entity", "entity_id", "old_data", "new_data", "ip_address", "user_agent", "created_at"]
  }
};

// ============================================================================
// 3. TOP-LEVEL OPERATOR RUNNABLE FUNCTIONS (MANDATORY APPS SCRIPT SURFACES)
// ============================================================================

function doGet(e) {
  try {
    var template = HtmlService.createTemplateFromFile('Index');
    return template.evaluate()
      .setTitle(APP_CONFIG.APP_NAME + " - Sistem Informasi Gereja")
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } catch (err) {
    return HtmlService.createHtmlOutput("<h2>Gereja Hub Initialization Error</h2><p>" + err.message + "</p>");
  }
}

function apiRequest(payload) {
  return handleApiDispatcher_(payload);
}

function setupDatabase() {
  return executeSetupDatabase_();
}

function authorizeRequiredServices() {
  ScriptApp.requireAllScopes(ScriptApp.AuthMode.FULL);
  return { status: "SUCCESS", message: "Otorisasi Google Services berhasil diperbarui." };
}

function checkAuthorizationStatus() {
  return checkAuthStatus_();
}

function testSpreadsheetAccess() {
  try {
    var ss = getSpreadsheet_();
    return { status: "SUCCESS", spreadsheetName: ss.getName(), id: ss.getId(), url: ss.getUrl() };
  } catch (err) {
    return { status: "FAILED", error: err.message };
  }
}

function testDriveAccess() {
  try {
    var folder = getDriveFolder_();
    return { status: "SUCCESS", folderName: folder.getName(), id: folder.getId() };
  } catch (err) {
    return { status: "FAILED", error: err.message };
  }
}

function testExternalRequestAccess() {
  try {
    var res = UrlFetchApp.fetch("https://httpbin.org/get", { muteHttpExceptions: true });
    return { status: "SUCCESS", responseCode: res.getResponseCode() };
  } catch (err) {
    return { status: "FAILED", error: err.message };
  }
}

function validateEnvironment() {
  return validateEnv_();
}

function validateDatabaseSchema() {
  return validateSchema_();
}

function migrateDatabase() {
  return runMigrations_();
}

function repairDatabaseSchema() {
  return executeSetupDatabase_();
}

function seedInitialData() {
  var ss = getSpreadsheet_();
  seedRolesAndPermissions_(ss);
  seedInitialCategories_(ss);
  return { status: "SUCCESS", message: "Data awal (Roles, Permissions, Categories) berhasil ditanamkan." };
}

function installAppTriggers() {
  return installTriggers_();
}

function removeAppTriggers() {
  var triggers = ScriptApp.getProjectTriggers();
  var count = 0;
  for (var i = 0; i < triggers.length; i++) {
    ScriptApp.deleteTrigger(triggers[i]);
    count++;
  }
  return { status: "SUCCESS", removedCount: count };
}

function healthCheck() {
  return executeHealthCheck_();
}

function backupDatabase() {
  return createDatabaseBackup_();
}

function cleanupExpiredSessions() {
  CacheService.getScriptCache().removeAll(["active_sessions_list"]);
  return { status: "SUCCESS", message: "Sesi expired dan cache temporary telah dibersihkan." };
}

function resetDemoData(confirmationToken) {
  var storedToken = PropertiesService.getScriptProperties().getProperty(APP_CONFIG.PROPERTIES_KEYS.CONFIRMATION_TOKEN);
  if (!confirmationToken || confirmationToken !== storedToken) {
    return { status: "FAILED", error: "Token konfirmasi reset data tidak valid!" };
  }
  return executeSetupDatabase_();
}

function exportDatabaseBackup() {
  return createDatabaseBackup_();
}

// ============================================================================
// 4. DATABASE & STORAGE RESOLVER ENGINE
// ============================================================================

function getSpreadsheet_() {
  var props = PropertiesService.getScriptProperties();
  var ssId = props.getProperty(APP_CONFIG.PROPERTIES_KEYS.SPREADSHEET_ID);
  
  if (ssId) {
    try {
      return SpreadsheetApp.openById(ssId);
    } catch (e) {
      // Retrying binding if stored ID is invalid
    }
  }
  
  try {
    var activeSs = SpreadsheetApp.getActiveSpreadsheet();
    if (activeSs) {
      props.setProperty(APP_CONFIG.PROPERTIES_KEYS.SPREADSHEET_ID, activeSs.getId());
      return activeSs;
    }
  } catch (e) {}

  var newSs = SpreadsheetApp.create("Database - " + APP_CONFIG.APP_NAME);
  props.setProperty(APP_CONFIG.PROPERTIES_KEYS.SPREADSHEET_ID, newSs.getId());
  return newSs;
}

function getDriveFolder_() {
  var props = PropertiesService.getScriptProperties();
  var folderId = props.getProperty(APP_CONFIG.PROPERTIES_KEYS.DRIVE_FOLDER_ID);
  
  if (folderId) {
    try {
      return DriveApp.getFolderById(folderId);
    } catch (e) {}
  }
  
  var folders = DriveApp.getFoldersByName(APP_CONFIG.APP_NAME + " Storage");
  if (folders.hasNext()) {
    var folder = folders.next();
    props.setProperty(APP_CONFIG.PROPERTIES_KEYS.DRIVE_FOLDER_ID, folder.getId());
    return folder;
  }
  
  var newFolder = DriveApp.createFolder(APP_CONFIG.APP_NAME + " Storage");
  props.setProperty(APP_CONFIG.PROPERTIES_KEYS.DRIVE_FOLDER_ID, newFolder.getId());
  return newFolder;
}

/**
 * Dedicated Resolver for \image folder.
 * Ensures every uploaded image is safely structured under \image with optimized access permissions.
 */
function getImageDriveFolder_() {
  var parentFolder = getDriveFolder_();
  var subFolders = parentFolder.getFoldersByName("image");
  if (subFolders.hasNext()) {
    return subFolders.next();
  }
  
  var newImageFolder = parentFolder.createFolder("image");
  try {
    // Set public view sharing so compressed images load at maximum CDN speed
    newImageFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (e) {}
  return newImageFolder;
}

/**
 * High-performance Image Uploader & Processor
 * Saves base64-encoded optimized image (WebP / compressed JPG) into the \image folder.
 */
function uploadImageFile_(params, session) {
  if (!params || !params.base64) {
    throw new Error("Data gambar base64 tidak ditemukan!");
  }
  
  var folder = getImageDriveFolder_();
  var base64Data = params.base64;
  var mimeType = "image/webp";
  var ext = ".webp";

  if (base64Data.indexOf("data:") === 0) {
    var parts = base64Data.split(",");
    var meta = parts[0];
    base64Data = parts[1];
    if (meta.indexOf("image/jpeg") !== -1 || meta.indexOf("image/jpg") !== -1) {
      mimeType = "image/jpeg";
      ext = ".jpg";
    } else if (meta.indexOf("image/png") !== -1) {
      mimeType = "image/png";
      ext = ".png";
    } else if (meta.indexOf("image/webp") !== -1) {
      mimeType = "image/webp";
      ext = ".webp";
    }
  }

  var rawBytes = Utilities.base64Decode(base64Data);
  var baseName = params.fileName ? params.fileName.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "_") : ("IMG_" + Utilities.formatDate(new Date(), APP_CONFIG.TIMEZONE, "yyyyMMdd_HHmmss"));
  var finalFileName = baseName + ext;

  var blob = Utilities.newBlob(rawBytes, mimeType, finalFileName);
  var file = folder.createFile(blob);
  
  try {
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (e) {}

  var fileId = file.getId();
  // Fast loading direct CDN URLs
  var directUrl = "https://lh3.googleusercontent.com/d/" + fileId;
  var fallbackUrl = "https://drive.google.com/uc?export=view&id=" + fileId;

  createAuditLog_(session ? session.userId : "SYSTEM", "UPLOAD_IMAGE", "image_storage", fileId, {}, {
    fileName: finalFileName,
    folder: "\\image",
    sizeBytes: rawBytes.length
  });

  return {
    fileId: fileId,
    fileName: finalFileName,
    url: directUrl,
    fallbackUrl: fallbackUrl,
    folder: "\\image",
    mimeType: mimeType,
    sizeBytes: rawBytes.length
  };
}

function executeSetupDatabase_() {
  var startTime = new Date().getTime();
  var report = {
    requestId: generateUUID_(),
    startedAt: new Date().toISOString(),
    spreadsheetId: "",
    createdSheets: [],
    existingSheets: [],
    addedColumns: [],
    migrationsApplied: [],
    seedSummary: {},
    warnings: [],
    errors: [],
    overallStatus: "SUCCESS"
  };

  try {
    var ss = getSpreadsheet_();
    report.spreadsheetId = ss.getId();
    
    // Set random confirmation token for dangerous ops
    PropertiesService.getScriptProperties().setProperty(
      APP_CONFIG.PROPERTIES_KEYS.CONFIRMATION_TOKEN,
      generateUUID_()
    );

    // 1. Setup sheets from schema registry
    for (var key in SCHEMA_REGISTRY) {
      if (SCHEMA_REGISTRY.hasOwnProperty(key)) {
        var schema = SCHEMA_REGISTRY[key];
        var sheet = ss.getSheetByName(schema.sheetName);
        
        if (!sheet) {
          sheet = ss.insertSheet(schema.sheetName);
          report.createdSheets.push(schema.sheetName);
        } else {
          report.existingSheets.push(schema.sheetName);
        }
        
        // Header verification
        var currentHeaders = [];
        if (sheet.getLastRow() > 0) {
          currentHeaders = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0];
        }
        
        if (currentHeaders.length === 0 || !currentHeaders[0]) {
          sheet.getRange(1, 1, 1, schema.headers.length).setValues([schema.headers]);
          sheet.getRange(1, 1, 1, schema.headers.length).setFontWeight("bold").setBackground("#e8f0fe");
          sheet.setFrozenRows(1);
        } else {
          // Append missing columns safely
          for (var i = 0; i < schema.headers.length; i++) {
            var targetHeader = schema.headers[i];
            if (currentHeaders.indexOf(targetHeader) === -1) {
              var nextCol = sheet.getLastColumn() + 1;
              sheet.getRange(1, nextCol).setValue(targetHeader).setFontWeight("bold").setBackground("#f1f3f4");
              report.addedColumns.push(schema.sheetName + "." + targetHeader);
            }
          }
        }
      }
    }
    
    // Clean default sheet if extra
    var defaultSheet = ss.getSheetByName("Sheet1") || ss.getSheetByName("Lembar1");
    if (defaultSheet && ss.getSheets().length > 1) {
      try { ss.deleteSheet(defaultSheet); } catch (e) {}
    }

    // 2. Seed Master Data
    report.seedSummary.roles = seedRolesAndPermissions_(ss);
    report.seedSummary.categories = seedInitialCategories_(ss);
    report.seedSummary.admin = seedDefaultAdminUser_(ss);

    // 3. Mark initialized
    PropertiesService.getScriptProperties().setProperty(APP_CONFIG.PROPERTIES_KEYS.INITIALIZED, "TRUE");

  } catch (err) {
    report.overallStatus = "FAILED";
    report.errors.push(err.message);
  }

  report.completedAt = new Date().toISOString();
  report.durationMs = new Date().getTime() - startTime;
  return report;
}

// ============================================================================
// 5. SEEDING & SCHEMAS INITIALIZATION
// ============================================================================

function seedRolesAndPermissions_(ss) {
  var rolesSheet = ss.getSheetByName(SCHEMA_REGISTRY.roles.sheetName);
  var permSheet = ss.getSheetByName(SCHEMA_REGISTRY.permissions.sheetName);
  var rolePermSheet = ss.getSheetByName(SCHEMA_REGISTRY.role_permissions.sheetName);

  var roles = [
    { id: "ROL-ADMIN", name: "ADMIN", description: "Akses penuh operasional & sistem" },
    { id: "ROL-PASTOR", name: "PASTOR", description: "Akses pelayanan pastoral & konseling" },
    { id: "ROL-TREASURER", name: "TREASURER", description: "Pengelolaan keuangan & laporan kas" },
    { id: "ROL-SECRETARY", name: "SECRETARY", description: "Pengelolaan jemaat, kegiatan & CMS" },
    { id: "ROL-WORKER", name: "MINISTRY_WORKER", description: "Pelayan ibadah & tugas lapangan" }
  ];

  var permissions = [
    { id: "PRM-001", code: "members.read", name: "Lihat Data Jemaat", description: "Membaca profil jemaat" },
    { id: "PRM-002", code: "members.create", name: "Tambah Jemaat", description: "Menambah jemaat baru" },
    { id: "PRM-003", code: "members.update", name: "Edit Jemaat", description: "Memperbarui data jemaat" },
    { id: "PRM-004", code: "members.delete", name: "Hapus Jemaat", description: "Menghapus/soft delete jemaat" },
    { id: "PRM-005", code: "finance.read", name: "Lihat Keuangan", description: "Membaca kas dan transaksi" },
    { id: "PRM-006", code: "finance.create", name: "Tambah Transaksi", description: "Mencatat pemasukan/pengeluaran" },
    { id: "PRM-007", code: "finance.update", name: "Edit Keuangan", description: "Mengubah transaksi keuangan" },
    { id: "PRM-008", code: "finance.delete", name: "Hapus Keuangan", description: "Menghapus transaksi keuangan" },
    { id: "PRM-009", code: "ministry.read", name: "Lihat Pelayanan", description: "Melihat jadwal & permohonan" },
    { id: "PRM-010", code: "ministry.manage", name: "Kelola Pelayanan & Konseling", description: "Menangani doa & konseling" },
    { id: "PRM-011", code: "cms.read", name: "Lihat CMS", description: "Melihat artikel, berita & page" },
    { id: "PRM-012", code: "cms.manage", name: "Kelola CMS Website", description: "Menerbitkan berita & galeri" }
  ];

  // Seed Roles
  if (rolesSheet.getLastRow() <= 1) {
    for (var r = 0; r < roles.length; r++) {
      rolesSheet.appendRow([roles[r].id, roles[r].name, roles[r].description, new Date().toISOString()]);
    }
  }

  // Seed Permissions
  if (permSheet.getLastRow() <= 1) {
    for (var p = 0; p < permissions.length; p++) {
      permSheet.appendRow([permissions[p].id, permissions[p].code, permissions[p].name, permissions[p].description]);
    }
  }

  // Seed Role Permissions Mapping
  if (rolePermSheet.getLastRow() <= 1) {
    for (var i = 0; i < permissions.length; i++) {
      rolePermSheet.appendRow(["ROL-ADMIN", permissions[i].id]);
      if (permissions[i].code.indexOf("members.") === 0) {
        rolePermSheet.appendRow(["ROL-SECRETARY", permissions[i].id]);
      }
      if (permissions[i].code.indexOf("finance.") === 0) {
        rolePermSheet.appendRow(["ROL-TREASURER", permissions[i].id]);
      }
      if (permissions[i].code.indexOf("ministry.") === 0) {
        rolePermSheet.appendRow(["ROL-PASTOR", permissions[i].id]);
        rolePermSheet.appendRow(["ROL-WORKER", permissions[i].id]);
      }
    }
  }

  return "Roles & Permissions Seeded";
}

function seedInitialCategories_(ss) {
  var incSheet = ss.getSheetByName(SCHEMA_REGISTRY.income_categories.sheetName);
  var expSheet = ss.getSheetByName(SCHEMA_REGISTRY.expense_categories.sheetName);

  if (incSheet.getLastRow() <= 1) {
    incSheet.appendRow(["INC-001", "Persembahan Mingguan", "Kantong persembahan ibadah minggu", "TRUE"]);
    incSheet.appendRow(["INC-002", "Persembahan Perpuluhan", "Perpuluhan jemaat", "TRUE"]);
    incSheet.appendRow(["INC-003", "Donasi Pembangunan", "Sumbangan gedung & fasilitas", "TRUE"]);
  }

  if (expSheet.getLastRow() <= 1) {
    expSheet.appendRow(["EXP-001", "Operasional & Listrik", "Pembayaran listrik, air & internet", "TRUE"]);
    expSheet.appendRow(["EXP-002", "Honorarium & Pelayanan", "Apresiasi pembicara / pelayan", "TRUE"]);
    expSheet.appendRow(["EXP-003", "Perlengkapan Ibadah", "Beli alat musik, sound system & multimedia", "TRUE"]);
  }

  return "Categories Seeded";
}

function seedDefaultAdminUser_(ss) {
  var userSheet = ss.getSheetByName(SCHEMA_REGISTRY.users.sheetName);
  if (userSheet.getLastRow() <= 1) {
    var adminEmail = "admin@gerejahub.org";
    var defaultPassHash = hashPassword_("Admin123!");
    userSheet.appendRow([
      "USR-ADMIN",
      adminEmail,
      defaultPassHash,
      "Administrator Utama",
      "ROL-ADMIN",
      "TRUE",
      "",
      new Date().toISOString(),
      new Date().toISOString()
    ]);
    return "Admin default created: " + adminEmail + " / Admin123!";
  }
  return "Admin user already exists";
}

// ============================================================================
// 6. GENERIC REPOSITORY HELPER FUNCTIONS
// ============================================================================

function findRows_(entityKey, filterFn) {
  var schema = SCHEMA_REGISTRY[entityKey];
  if (!schema) throw new Error("Entity key error: " + entityKey);
  
  var ss = getSpreadsheet_();
  var sheet = ss.getSheetByName(schema.sheetName);
  if (!sheet || sheet.getLastRow() <= 1) return [];

  var data = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
  var results = [];

  for (var i = 0; i < data.length; i++) {
    var rowObj = {};
    for (var j = 0; j < schema.headers.length; j++) {
      rowObj[schema.headers[j]] = data[i][j];
    }
    rowObj._rowIndex = i + 2; // Real spreadsheet row index
    if (!filterFn || filterFn(rowObj)) {
      results.push(rowObj);
    }
  }
  return results;
}

function insertRow_(entityKey, record) {
  var schema = SCHEMA_REGISTRY[entityKey];
  var ss = getSpreadsheet_();
  var sheet = ss.getSheetByName(schema.sheetName);
  
  if (!record.id) {
    record.id = schema.idPrefix + "-" + generateShortId_();
  }
  if (schema.headers.indexOf("created_at") !== -1 && !record.created_at) {
    record.created_at = new Date().toISOString();
  }
  if (schema.headers.indexOf("updated_at") !== -1 && !record.updated_at) {
    record.updated_at = new Date().toISOString();
  }

  var rowArray = [];
  for (var i = 0; i < schema.headers.length; i++) {
    var h = schema.headers[i];
    rowArray.push(record[h] !== undefined ? record[h] : "");
  }

  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(APP_CONFIG.LOCK_TIMEOUT_MS);
    sheet.appendRow(rowArray);
  } finally {
    lock.releaseLock();
  }

  return record;
}

function updateRow_(entityKey, id, updateObj) {
  var schema = SCHEMA_REGISTRY[entityKey];
  var rows = findRows_(entityKey, function(r) { return r.id === id; });
  if (rows.length === 0) throw new Error("Record not found with ID: " + id);

  var targetRow = rows[0];
  var ss = getSpreadsheet_();
  var sheet = ss.getSheetByName(schema.sheetName);

  if (schema.headers.indexOf("updated_at") !== -1) {
    updateObj.updated_at = new Date().toISOString();
  }

  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(APP_CONFIG.LOCK_TIMEOUT_MS);
    for (var j = 0; j < schema.headers.length; j++) {
      var header = schema.headers[j];
      if (updateObj.hasOwnProperty(header)) {
        sheet.getRange(targetRow._rowIndex, j + 1).setValue(updateObj[header]);
      }
    }
  } finally {
    lock.releaseLock();
  }

  return true;
}

function softDeleteRow_(entityKey, id) {
  var schema = SCHEMA_REGISTRY[entityKey];
  if (schema.headers.indexOf("deleted_at") === -1) {
    throw new Error("Soft delete not supported for " + entityKey);
  }
  return updateRow_(entityKey, id, { deleted_at: new Date().toISOString() });
}

function deleteRowPermanent_(entityKey, id) {
  var schema = SCHEMA_REGISTRY[entityKey];
  var rows = findRows_(entityKey, function(r) { return r.id === id; });
  if (rows.length === 0) return { message: "Data tidak ditemukan atau sudah dihapus." };

  var targetRow = rows[0];
  var ss = getSpreadsheet_();
  var sheet = ss.getSheetByName(schema.sheetName);

  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(APP_CONFIG.LOCK_TIMEOUT_MS);
    sheet.deleteRow(targetRow._rowIndex);
  } finally {
    lock.releaseLock();
  }

  return { message: "Data berhasil dihapus." };
}

// ============================================================================
// 7. SECURITY & AUTHENTICATION ENGINE
// ============================================================================

function hashPassword_(password) {
  var raw = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password, Utilities.Charset.UTF_8);
  var hashStr = "";
  for (var i = 0; i < raw.length; i++) {
    var byteVal = raw[i];
    if (byteVal < 0) byteVal += 256;
    var byteHex = byteVal.toString(16);
    if (byteHex.length == 1) byteHex = "0" + byteHex;
    hashStr += byteHex;
  }
  return hashStr;
}

function generateUUID_() {
  return Utilities.getUuid();
}

function generateShortId_() {
  return Math.random().toString(36).substring(2, 9).toUpperCase();
}

function authenticateUser_(email, password) {
  var users = findRows_("users", function(u) {
    return String(u.email).toLowerCase() === String(email).toLowerCase() && String(u.is_active).toUpperCase() === "TRUE";
  });

  if (users.length === 0) {
    throw new Error("Email atau password tidak ditemukan!");
  }

  var user = users[0];
  var hashedInput = hashPassword_(password);

  if (user.password_hash !== hashedInput) {
    throw new Error("Email atau password salah!");
  }

  // Update last login
  updateRow_("users", user.id, { last_login_at: new Date().toISOString() });

  // Create session
  var sessionToken = "SESS-" + generateUUID_();
  var sessionData = {
    token: sessionToken,
    userId: user.id,
    userName: user.name,
    email: user.email,
    roleId: user.role_id,
    createdAt: new Date().getTime(),
    expiresAt: new Date().getTime() + (APP_CONFIG.SESSION_DURATION_HOURS * 3600 * 1000)
  };

  CacheService.getScriptCache().put(sessionToken, JSON.stringify(sessionData), APP_CONFIG.SESSION_DURATION_HOURS * 3600);
  
  createAuditLog_(user.id, "LOGIN", "users", user.id, {}, { status: "SUCCESS" });

  delete user.password_hash;
  return {
    token: sessionToken,
    user: user
  };
}

function verifySession_(token) {
  if (!token) return null;
  var cached = CacheService.getScriptCache().get(token);
  if (!cached) return null;
  try {
    var session = JSON.parse(cached);
    if (new Date().getTime() > session.expiresAt) return null;
    return session;
  } catch (e) {
    return null;
  }
}

function checkUserPermission_(roleId, permissionCode) {
  if (roleId === "ROL-ADMIN") return true; // Admin bypasses all checks

  var perms = findRows_("permissions", function(p) { return p.code === permissionCode; });
  if (perms.length === 0) return false;
  var permId = perms[0].id;

  var rolePerms = findRows_("role_permissions", function(rp) {
    return rp.role_id === roleId && rp.permission_id === permId;
  });

  return rolePerms.length > 0;
}

// ============================================================================
// 8. AUDIT LOGGING ENGINE
// ============================================================================

function createAuditLog_(userId, action, entity, entityId, oldData, newData) {
  try {
    insertRow_("audit_logs", {
      user_id: userId || "SYSTEM",
      action: action,
      entity: entity,
      entity_id: entityId || "",
      old_data: JSON.stringify(oldData || {}),
      new_data: JSON.stringify(newData || {}),
      ip_address: "GAS_SERVER",
      user_agent: "GAS_INTERNAL"
    });
  } catch (err) {
    // Audit logging failure should not break primary workflow
  }
}

// ============================================================================
// 9. API DISPATCHER & BUSINESS SERVICE HANDLERS
// ============================================================================

function handleApiDispatcher_(payload) {
  var response = { success: false, data: null, error: null, timestamp: new Date().toISOString() };

  try {
    if (!payload || !payload.action) {
      throw new Error("Invalid API Request Payload!");
    }

    var action = payload.action;
    var params = payload.params || {};
    var session = verifySession_(payload.token);

    // Public Route Bypass
    if (action.indexOf("public/") === 0 || action === "auth/login") {
      response.data = dispatchPublicAction_(action, params);
      response.success = true;
      return response;
    }

    // Require Auth for non-public routes
    if (!session) {
      throw new Error("UNAUTHORIZED: Session telah berakhir atau tidak valid. Silakan login ulang.");
    }

    // Execute Internal Authorized Module
    response.data = dispatchProtectedAction_(action, params, session);
    response.success = true;

  } catch (err) {
    response.success = false;
    response.error = err.message || "Terjadi kesalahan server internal.";
  }

  return response;
}

function dispatchPublicAction_(action, params) {
  switch (action) {
    case "auth/login":
      return authenticateUser_(params.email, params.password);

    case "public/church":
      return {
        name: APP_CONFIG.APP_NAME,
        address: "Jl. Gereja Utama No. 12, Karanganyar",
        phone: "0812-3456-7890",
        email: "info@gerejahub.org",
        vision: "Membangun Jemaat yang Bertumbuh dan Berdampak",
        mission: "1. Pelayanan Pastoral Kasih\n2. Pemberdayaan Jemaat\n3. Penginjilan Kasih"
      };

    case "public/worship-schedules":
      return findRows_("worship_schedules", function(w) { return String(w.is_active).toUpperCase() === "TRUE"; });

    case "public/events":
      return findRows_("events", function(e) { return String(e.is_published).toUpperCase() === "TRUE"; });

    case "public/posts":
      return findRows_("posts", function(p) { return p.status === "PUBLISHED"; });

    case "public/pages":
      return findRows_("pages", function(pg) { return pg.slug === params.slug && pg.status === "PUBLISHED"; });

    case "public/galleries":
      var items = findRows_("gallery_items");
      return items.map(function(item) {
        return {
          id: item.id,
          title: item.caption || item.title || "Dokumentasi Kegiatan GBIS",
          category: item.gallery_id || item.category || "Dokumentasi",
          image_url: item.image_url,
          created_at: item.created_at || new Date().toISOString().substring(0, 10),
          folder: "\\image"
        };
      });

    case "public/register-event":
      if (!params.event_id || !params.name || !params.phone) {
        throw new Error("Lengkapi nama, HP, dan event pilihan!");
      }
      var reg = insertRow_("event_registrations", {
        event_id: params.event_id,
        name: params.name,
        phone: params.phone,
        email: params.email || "",
        participant_count: params.participant_count || 1,
        notes: params.notes || "",
        status: "REGISTERED",
        registered_at: new Date().toISOString()
      });
      return { registration_id: reg.id, message: "Pendaftaran berhasil disimpan." };

    case "public/prayer-request":
      if (!params.requester_name || !params.description) {
        throw new Error("Nama dan isi permohonan doa wajib diisi!");
      }
      var reqP = insertRow_("ministry_requests", {
        type_id: "MNT-PRAYER",
        requester_name: params.requester_name,
        requester_phone: params.requester_phone || "",
        requester_email: params.requester_email || "",
        description: params.description,
        status: "NEW",
        priority: params.priority || "NORMAL"
      });
      return { request_id: reqP.id, message: "Permohonan doa berhasil dikirim secara privat." };

    default:
      throw new Error("Public action not recognized: " + action);
  }
}

function dispatchProtectedAction_(action, params, session) {
  switch (action) {
    // ---------------- AUTH & USERS ----------------
    case "auth/me":
      var users = findRows_("users", function(u) { return u.id === session.userId; });
      if (users.length === 0) throw new Error("User profile not found");
      delete users[0].password_hash;
      return users[0];

    case "users/list":
      if (!checkUserPermission_(session.roleId, "members.read")) throw new Error("Akses ditolak!");
      var userList = findRows_("users");
      userList.forEach(function(u) { delete u.password_hash; });
      return userList;

    case "users/create":
      if (session.roleId !== "ROL-ADMIN") throw new Error("Hanya Admin yang dapat membuat user!");
      var newUser = insertRow_("users", {
        email: params.email,
        password_hash: hashPassword_(params.password || "Gereja123!"),
        name: params.name,
        role_id: params.role_id,
        is_active: "TRUE"
      });
      delete newUser.password_hash;
      return newUser;

    // ---------------- JEMAAT & KELUARGA ----------------
    case "members/list":
      if (!checkUserPermission_(session.roleId, "members.read")) throw new Error("Akses ditolak!");
      return findRows_("members", function(m) { return !m.deleted_at; });

    case "members/create":
      if (!checkUserPermission_(session.roleId, "members.create")) throw new Error("Akses ditolak!");
      var newMbr = insertRow_("members", params);
      createAuditLog_(session.userId, "CREATE", "members", newMbr.id, {}, newMbr);
      return newMbr;

    case "members/update":
      if (!checkUserPermission_(session.roleId, "members.update")) throw new Error("Akses ditolak!");
      updateRow_("members", params.id, params);
      createAuditLog_(session.userId, "UPDATE", "members", params.id, {}, params);
      return { message: "Data jemaat diperbarui" };

    case "members/delete":
      if (!checkUserPermission_(session.roleId, "members.delete")) throw new Error("Akses ditolak!");
      softDeleteRow_("members", params.id);
      createAuditLog_(session.userId, "DELETE", "members", params.id, {}, {});
      return { message: "Data jemaat dihapus secara aman" };

    case "families/list":
      return findRows_("families");

    case "families/create":
      if (!checkUserPermission_(session.roleId, "members.create")) throw new Error("Akses ditolak!");
      return insertRow_("families", params);

    // ---------------- PELAYANAN & KONSELING (PRIVAT) ----------------
    case "ministry/requests":
      if (!checkUserPermission_(session.roleId, "ministry.read")) throw new Error("Akses ditolak!");
      return findRows_("ministry_requests");

    case "ministry/assign":
      if (!checkUserPermission_(session.roleId, "ministry.manage")) throw new Error("Akses ditolak!");
      updateRow_("ministry_requests", params.id, {
        assigned_user_id: params.assigned_user_id,
        status: "ASSIGNED"
      });
      return { message: "Tugas pelayanan berhasil dialokasikan" };

    case "ministry/counseling/notes":
      // STRICT RECORD-LEVEL PRIVACY: Only Pastor or Assigned Worker
      if (session.roleId !== "ROL-ADMIN" && session.roleId !== "ROL-PASTOR") {
        throw new Error("AKSES PRIVAT: Hanya Pendeta yang berwenang melihat catatan konseling.");
      }
      return findRows_("counseling_notes", function(c) { return c.request_id === params.request_id; });

    case "ministry/counseling/add-note":
      if (session.roleId !== "ROL-ADMIN" && session.roleId !== "ROL-PASTOR") {
        throw new Error("AKSES PRIVAT: Hanya Pendeta yang berwenang mengisi catatan konseling.");
      }
      return insertRow_("counseling_notes", {
        request_id: params.request_id,
        author_id: session.userId,
        content: params.content
      });

    // ---------------- KEANGAAN & KAS ----------------
    case "finance/transactions":
      if (!checkUserPermission_(session.roleId, "finance.read")) throw new Error("Akses ditolak!");
      return findRows_("financial_transactions");

    case "finance/create":
      if (!checkUserPermission_(session.roleId, "finance.create")) throw new Error("Akses ditolak!");
      if (Number(params.amount) <= 0) throw new Error("Nominal transaksi harus lebih dari 0!");
      var newTrx = insertRow_("financial_transactions", {
        transaction_number: "TRX-" + generateShortId_(),
        type: params.type,
        category_id: params.category_id,
        amount: Number(params.amount),
        transaction_date: params.transaction_date || new Date().toISOString().substring(0, 10),
        description: params.description,
        reference_number: params.reference_number || "",
        created_by: session.userId
      });
      createAuditLog_(session.userId, "FINANCIAL_CREATE", "financial_transactions", newTrx.id, {}, newTrx);
      return newTrx;

    case "finance/summary":
      if (!checkUserPermission_(session.roleId, "finance.read")) throw new Error("Akses ditolak!");
      var trxs = findRows_("financial_transactions");
      var totalIncome = 0;
      var totalExpense = 0;
      for (var t = 0; t < trxs.length; t++) {
        if (trxs[t].type === "INCOME") totalIncome += Number(trxs[t].amount || 0);
        if (trxs[t].type === "EXPENSE") totalExpense += Number(trxs[t].amount || 0);
      }
      return {
        totalIncome: totalIncome,
        totalExpense: totalExpense,
        balance: totalIncome - totalExpense
      };

    // ---------------- EVENTS & REGISTRATION ----------------
    case "events/list":
      return findRows_("events");

    case "events/create":
      if (!checkUserPermission_(session.roleId, "cms.manage")) throw new Error("Akses ditolak!");
      params.created_by = session.userId;
      return insertRow_("events", params);

    // ---------------- MEDIA & IMAGE STORAGE (\image) ----------------
    case "media/upload-image":
      if (!checkUserPermission_(session.roleId, "cms.manage")) throw new Error("Akses ditolak!");
      return uploadImageFile_(params, session);

    // ---------------- CMS WEBSITE & GALERI ----------------
    case "cms/posts/list":
      return findRows_("posts");

    case "cms/posts/create":
      if (!checkUserPermission_(session.roleId, "cms.manage")) throw new Error("Akses ditolak!");
      params.author_id = session.userId;
      return insertRow_("posts", params);

    case "cms/posts/update":
      if (!checkUserPermission_(session.roleId, "cms.manage")) throw new Error("Akses ditolak!");
      var postUpdatePayload = {};
      if (params.title !== undefined) postUpdatePayload.title = params.title;
      if (params.category !== undefined) postUpdatePayload.category = params.category;
      if (params.excerpt !== undefined) postUpdatePayload.excerpt = params.excerpt;
      if (params.content !== undefined) postUpdatePayload.content = params.content;
      if (params.cover_image_url !== undefined) postUpdatePayload.cover_image_url = params.cover_image_url;
      if (params.status !== undefined) postUpdatePayload.status = params.status;
      if (params.published_at !== undefined) postUpdatePayload.published_at = params.published_at;
      updateRow_("posts", params.id, postUpdatePayload);
      return { message: "Artikel warta berhasil diperbarui." };

    case "cms/posts/delete":
      if (!checkUserPermission_(session.roleId, "cms.manage")) throw new Error("Akses ditolak!");
      return deleteRowPermanent_("posts", params.id);

    case "cms/gallery/list":
      var list = findRows_("gallery_items");
      return list.map(function(item) {
        return {
          id: item.id,
          title: item.caption || item.title || "Dokumentasi Kegiatan GBIS",
          category: item.gallery_id || item.category || "Dokumentasi",
          image_url: item.image_url,
          created_at: item.created_at || new Date().toISOString().substring(0, 10),
          folder: "\\image"
        };
      });

    case "cms/gallery/create":
      if (!checkUserPermission_(session.roleId, "cms.manage")) throw new Error("Akses ditolak!");
      var galItem = insertRow_("gallery_items", {
        gallery_id: params.category || "Dokumentasi",
        image_url: params.image_url,
        caption: params.title || params.caption || "Dokumentasi Kegiatan",
        sort_order: 1
      });
      return {
        id: galItem.id,
        title: galItem.caption,
        category: galItem.gallery_id,
        image_url: galItem.image_url,
        created_at: galItem.created_at,
        folder: "\\image"
      };

    case "cms/gallery/update":
      if (!checkUserPermission_(session.roleId, "cms.manage")) throw new Error("Akses ditolak!");
      var galUpdatePayload = {
        caption: params.title || params.caption,
        gallery_id: params.category
      };
      if (params.image_url) {
        galUpdatePayload.image_url = params.image_url;
      }
      updateRow_("gallery_items", params.id, galUpdatePayload);
      return { message: "Data foto galeri berhasil diperbarui." };

    case "cms/gallery/delete":
      if (!checkUserPermission_(session.roleId, "cms.manage")) throw new Error("Akses ditolak!");
      return deleteRowPermanent_("gallery_items", params.id);

    case "cms/schedules/list":
      return findRows_("worship_schedules");

    case "cms/schedules/create":
      if (!checkUserPermission_(session.roleId, "cms.manage")) throw new Error("Akses ditolak!");
      return insertRow_("worship_schedules", {
        name: params.name,
        day_of_week: params.day_of_week || "Minggu",
        start_time: params.start_time,
        end_time: params.end_time || params.start_time,
        location: params.location,
        is_active: params.is_active || "TRUE"
      });

    case "cms/schedules/update":
      if (!checkUserPermission_(session.roleId, "cms.manage")) throw new Error("Akses ditolak!");
      var schUpdatePayload = {};
      if (params.name !== undefined) schUpdatePayload.name = params.name;
      if (params.day_of_week !== undefined) schUpdatePayload.day_of_week = params.day_of_week;
      if (params.start_time !== undefined) schUpdatePayload.start_time = params.start_time;
      if (params.end_time !== undefined) schUpdatePayload.end_time = params.end_time;
      if (params.location !== undefined) schUpdatePayload.location = params.location;
      if (params.description !== undefined) schUpdatePayload.description = params.description;
      if (params.is_active !== undefined) schUpdatePayload.is_active = params.is_active;
      updateRow_("worship_schedules", params.id, schUpdatePayload);
      return { message: "Jadwal sesi ibadah berhasil diperbarui." };

    case "cms/schedules/delete":
      if (!checkUserPermission_(session.roleId, "cms.manage")) throw new Error("Akses ditolak!");
      return deleteRowPermanent_("worship_schedules", params.id);

    // ---------------- DASHBOARD AGGREGATION ----------------
    case "dashboard/summary":
      var mbrsCount = findRows_("members", function(m) { return !m.deleted_at; }).length;
      var evtsCount = findRows_("events").length;
      var reqsCount = findRows_("ministry_requests", function(r) { return r.status === "NEW"; }).length;
      
      var finSummary = { totalIncome: 0, totalExpense: 0, balance: 0 };
      if (checkUserPermission_(session.roleId, "finance.read")) {
        var allTrx = findRows_("financial_transactions");
        for (var k = 0; k < allTrx.length; k++) {
          if (allTrx[k].type === "INCOME") finSummary.totalIncome += Number(allTrx[k].amount || 0);
          if (allTrx[k].type === "EXPENSE") finSummary.totalExpense += Number(allTrx[k].amount || 0);
        }
        finSummary.balance = finSummary.totalIncome - finSummary.totalExpense;
      }

      return {
        totalMembers: mbrsCount,
        totalEvents: evtsCount,
        pendingMinistryRequests: reqsCount,
        finance: finSummary
      };

    default:
      throw new Error("Action not supported: " + action);
  }
}

// ============================================================================
// 10. DIAGNOSTIC & MAINTENANCE UTILITIES
// ============================================================================

function validateEnv_() {
  var props = PropertiesService.getScriptProperties();
  return {
    spreadsheetIdSet: !!props.getProperty(APP_CONFIG.PROPERTIES_KEYS.SPREADSHEET_ID),
    driveFolderIdSet: !!props.getProperty(APP_CONFIG.PROPERTIES_KEYS.DRIVE_FOLDER_ID),
    initialized: !!props.getProperty(APP_CONFIG.PROPERTIES_KEYS.INITIALIZED)
  };
}

function checkAuthStatus_() {
  return {
    authMode: "FULL",
    userEmail: Session.getActiveUser().getEmail(),
    effectiveUser: Session.getEffectiveUser().getEmail()
  };
}

function validateSchema_() {
  var ss = getSpreadsheet_();
  var missing = [];
  for (var k in SCHEMA_REGISTRY) {
    if (!ss.getSheetByName(SCHEMA_REGISTRY[k].sheetName)) {
      missing.push(SCHEMA_REGISTRY[k].sheetName);
    }
  }
  return { valid: missing.length === 0, missingSheets: missing };
}

function runMigrations_() {
  return executeSetupDatabase_();
}

function installTriggers_() {
  removeAppTriggers();
  ScriptApp.newTrigger("cleanupExpiredSessions")
    .timeBased()
    .everyHours(6)
    .create();
  return { status: "SUCCESS", message: "Time-driven trigger berhasil dipasang." };
}

function executeHealthCheck_() {
  var env = validateEnv_();
  var schema = validateSchema_();
  return {
    status: (env.initialized && schema.valid) ? "HEALTHY" : "NEEDS_ATTENTION",
    environment: env,
    schemaStatus: schema,
    timestamp: new Date().toISOString()
  };
}

function createDatabaseBackup_() {
  var ss = getSpreadsheet_();
  var folder = getDriveFolder_();
  var backupName = "BACKUP_" + APP_CONFIG.APP_NAME + "_" + Utilities.formatDate(new Date(), APP_CONFIG.TIMEZONE, "yyyyMMdd_HHmmss");
  var copy = ss.copy(backupName);
  DriveApp.getFileById(copy.getId()).moveTo(folder);
  return { status: "SUCCESS", backupName: backupName, backupUrl: copy.getUrl() };
}