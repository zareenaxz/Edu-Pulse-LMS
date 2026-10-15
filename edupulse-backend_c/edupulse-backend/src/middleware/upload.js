const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '..', '..', 'uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ============================================================
// COMMON DISK STORAGE
// Used for:
// - Assignment submissions
// - Instructor profile image
// - Other existing file uploads
// ============================================================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(
      null,
      `${unique}${path.extname(file.originalname).toLowerCase()}`
    );
  },
});

// ============================================================
// EXISTING UPLOADER
// 25 MB, any file type
// ============================================================

const upload = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024,
  },
});

// ============================================================
// LESSON CONTENT FILE TYPES
// ============================================================

const FILE_TYPES = {
  video: ['.mp4', '.webm', '.mov', '.mkv', '.avi', '.m4v'],

  audio: ['.mp3', '.wav', '.m4a', '.ogg', '.aac', '.flac'],

  pdf: ['.pdf'],

  document: [
    '.doc',
    '.docx',
    '.txt',
    '.rtf',
    '.odt',
    '.md',
  ],

  slide: [
    '.ppt',
    '.pptx',
    '.odp',
    '.key',
  ],

  spreadsheet: [
    '.xls',
    '.xlsx',
    '.csv',
    '.ods',
  ],

  image: [
    '.png',
    '.jpg',
    '.jpeg',
    '.gif',
    '.webp',
    '.svg',
  ],

  archive: [
    '.zip',
    '.rar',
    '.7z',
    '.tar',
    '.gz',
  ],

  other: [
    '.py',
    '.ipynb',
    '.js',
    '.java',
    '.c',
    '.cpp',
    '.json',
    '.sql',
    '.html',
    '.css',
  ],
};

// ============================================================
// EXTENSION -> TYPE
// ============================================================

const EXT_TO_TYPE = {};

Object.entries(FILE_TYPES).forEach(([type, extensions]) => {
  extensions.forEach((extension) => {
    EXT_TO_TYPE[extension] = type;
  });
});

// ============================================================
// CLASSIFY FILE
// ============================================================

const classify = (filename) => {
  const extension = path
    .extname(filename || '')
    .toLowerCase();

  return EXT_TO_TYPE[extension] || null;
};

// ============================================================
// LESSON UPLOADER
// 500 MB per file
// Maximum 10 files
// ============================================================

const lessonUpload = multer({
  storage,

  limits: {
    fileSize: 500 * 1024 * 1024,
    files: 10,
  },

  fileFilter: (req, file, cb) => {
    const type = classify(file.originalname);

    if (!type) {
      return cb(
        new Error(
          `File type not allowed: ${
            path.extname(file.originalname) || file.originalname
          }`
        )
      );
    }

    cb(null, true);
  },
});

// ============================================================
// CV UPLOADER
// IMPORTANT:
// CV is stored in MEMORY because the controller will save
// the CV data into instructor_applications.cv_data in MySQL.
// ============================================================

const cvStorage = multer.memoryStorage();

const cvUpload = multer({
  storage: cvStorage,

  limits: {
    fileSize: 25 * 1024 * 1024,
  },

  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(
        new Error('Only PDF files are allowed for CV.')
      );
    }

    cb(null, true);
  },
});

// ============================================================
// EXPORTS
// ============================================================

module.exports = upload;

module.exports.lessonUpload = lessonUpload;

module.exports.cvUpload = cvUpload;

module.exports.classify = classify;

module.exports.FILE_TYPES = FILE_TYPES;

module.exports.uploadDir = uploadDir;