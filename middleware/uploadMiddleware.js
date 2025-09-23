// middleware/uploadMiddleware.js

import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure uploads directory exists
const uploadsDir = './uploads/';
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Set up storage engine
const storage = multer.diskStorage({
    destination: './uploads/',
    filename: function (req, file, cb) {
        // Create a unique filename to avoid overwriting files
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// UPDATED: Accept ALL image types including modern formats
function checkFileType(file, cb) {
    console.log('Checking file:', file.originalname, 'MIME type:', file.mimetype);
    
    // Allowed extensions - ALL modern image formats
    const filetypes = /jpeg|jpg|png|gif|webp|bmp|tiff|svg|avif|heic|heif|ico|jfif|pjpeg|pjp|apng/i;
    
    // Check extension
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    // Check mime type - Very flexible check for all image types
    const mimetype = file.mimetype.startsWith('image/') || 
                    file.mimetype === 'image/avif' ||
                    file.mimetype === 'image/heic' ||
                    file.mimetype === 'image/heif' ||
                    file.mimetype === 'application/octet-stream'; // Some browsers send this for AVIF
    
    console.log('Extension check:', extname, 'MIME check:', mimetype);
    console.log('File extension:', path.extname(file.originalname).toLowerCase());
    
    // Accept if EITHER condition is true (more flexible)
    if (mimetype || extname) {
        console.log('File accepted:', file.originalname);
        return cb(null, true);
    } else {
        console.log('File rejected:', file.originalname);
        cb(new Error('Only image files are allowed'));
    }
}

// UPDATED: More generous file size and better error handling
const upload = multer({
    storage: storage,
    limits: { 
        fileSize: 50000000, // Increased to 50MB for larger images
        files: 10 // Allow up to 10 files
    },
    fileFilter: function (req, file, cb) {
        try {
            checkFileType(file, cb);
        } catch (error) {
            console.error('File filter error:', error);
            cb(new Error('File processing error'));
        }
    }
});

// Export different upload configurations
export const uploadSingle = upload.single('image');
export const uploadMultiple = upload.array('images', 10);
export const uploadFields = upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'images', maxCount: 10 }
]);

export default upload;