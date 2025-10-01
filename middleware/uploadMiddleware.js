// middleware/uploadMiddleware.js - Fixed version
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const __dirname = path.resolve();

// CRITICAL: Ensure uploads directory exists with proper path
const uploadsDir = path.join(__dirname, 'uploads');
console.log('Uploads directory path:', uploadsDir);

if (!fs.existsSync(uploadsDir)) {
    console.log('Creating uploads directory...');
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('✅ Uploads directory created');
} else {
    console.log('✅ Uploads directory exists');
}

// Enhanced storage configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        console.log('Setting destination for file:', file.originalname);
        cb(null, uploadsDir); // Use absolute path
    },
    filename: function (req, file, cb) {
        console.log('Generating filename for:', file.originalname);
        
        // Create unique filename matching your database pattern
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const filename = 'image-' + uniqueSuffix + path.extname(file.originalname);
        
        console.log('Generated filename:', filename);
        cb(null, filename);
    }
});

// Comprehensive file type checking
function checkFileType(file, cb) {
    console.log('🔍 Checking file:', {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size
    });
    
    // Allowed extensions
    const allowedExtensions = /jpeg|jpg|png|gif|webp|bmp|tiff|svg|avif|heic|heif|ico|jfif/i;
    const extname = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
    
    // Allowed MIME types
    const allowedMimes = [
        'image/jpeg',
        'image/jpg', 
        'image/png',
        'image/gif',
        'image/webp',
        'image/bmp',
        'image/tiff',
        'image/svg+xml',
        'image/avif',
        'image/heic',
        'image/heif',
        'image/x-icon',
        'image/vnd.microsoft.icon',
        'application/octet-stream' // Some browsers send this for AVIF/HEIC
    ];
    
    const mimetypeAllowed = allowedMimes.includes(file.mimetype) || file.mimetype.startsWith('image/');
    
    console.log('File validation:', {
        extension: path.extname(file.originalname).toLowerCase(),
        extensionValid: extname,
        mimeType: file.mimetype,
        mimeTypeValid: mimetypeAllowed
    });
    
    if (extname && mimetypeAllowed) {
        console.log('✅ File accepted:', file.originalname);
        return cb(null, true);
    } else {
        console.log('❌ File rejected:', file.originalname);
        return cb(new Error(`File type not allowed. Got: ${file.mimetype}`));
    }
}

// Enhanced multer configuration
const upload = multer({
    storage: storage,
    limits: { 
        fileSize: 50 * 1024 * 1024, // 50MB in bytes
        files: 10
    },
    fileFilter: function (req, file, cb) {
        try {
            checkFileType(file, cb);
        } catch (error) {
            console.error('❌ File filter error:', error);
            cb(error);
        }
    }
});

// Middleware wrapper with enhanced logging
const uploadSingleWithLogging = (fieldName = 'image') => {
    return (req, res, next) => {
        console.log('\n🚀 Starting file upload process...');
        console.log('Field name:', fieldName);
        console.log('Request headers:', {
            'content-type': req.headers['content-type'],
            'content-length': req.headers['content-length']
        });
        
        upload.single(fieldName)(req, res, (err) => {
            if (err) {
                console.error('❌ Upload error:', err.message);
                return res.status(400).json({
                    error: 'File upload failed',
                    message: err.message,
                    details: err.code || 'UPLOAD_ERROR'
                });
            }
            
            // Check if file was uploaded
            if (!req.file) {
                console.log('⚠️ No file uploaded');
                return next(); // Continue without file
            }
            
            console.log('✅ File uploaded successfully:', {
                originalname: req.file.originalname,
                filename: req.file.filename,
                size: req.file.size,
                path: req.file.path,
                destination: req.file.destination
            });
            
            // Verify file actually exists
            const filePath = path.join(req.file.destination, req.file.filename);
            if (fs.existsSync(filePath)) {
                console.log('✅ File verified on disk:', filePath);
            } else {
                console.error('❌ File not found on disk:', filePath);
            }
            
            next();
        });
    };
};

// Multiple file upload
const uploadMultipleWithLogging = (fieldName = 'images', maxCount = 10) => {
    return (req, res, next) => {
        console.log('\n🚀 Starting multiple file upload...');
        
        upload.array(fieldName, maxCount)(req, res, (err) => {
            if (err) {
                console.error('❌ Multiple upload error:', err.message);
                return res.status(400).json({
                    error: 'Multiple file upload failed',
                    message: err.message
                });
            }
            
            if (!req.files || req.files.length === 0) {
                console.log('⚠️ No files uploaded');
                return next();
            }
            
            console.log(`✅ ${req.files.length} files uploaded successfully`);
            req.files.forEach((file, index) => {
                console.log(`File ${index + 1}:`, {
                    originalname: file.originalname,
                    filename: file.filename,
                    size: file.size
                });
            });
            
            next();
        });
    };
};

export { uploadSingleWithLogging as uploadSingle };
export { uploadMultipleWithLogging as uploadMultiple };
export default upload;