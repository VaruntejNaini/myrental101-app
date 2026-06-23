import multer from "multer";

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  console.log('>>> MULTER: fileFilter called for', file.originalname, file.mimetype, file.size);
  if (file.mimetype && file.mimetype.startsWith && file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    console.log('>>> MULTER: Rejected file', file.originalname, file.mimetype);
    cb(new Error("Only image files are allowed!"), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});
