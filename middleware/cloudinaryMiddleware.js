// middleware/cloudinaryMiddleware.js
import cloudinary from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

// Cloudinary configuration
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Cloudinary storage setup
const storage = new CloudinaryStorage({
  cloudinary: cloudinary.v2,
  params: {
    folder: 'your-app-name', // Aapka app name yahan dalen
    format: async (req, file) => {
      // Automatically determine format
      const ext = file.originalname.split('.').pop();
      return ext || 'jpg';
    },
    public_id: (req, file) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      return file.fieldname + '-' + uniqueSuffix;
    },
  },
});

// Multer with Cloudinary - Same file filter logic as uploadMiddleware
const upload = multer({
  storage: storage,
  limits: { 
    fileSize: 50000000, // 50MB (same as before)
    files: 10 // Allow up to 10 files (same as before)
  },
  fileFilter: function (req, file, cb) {
    try {
      // Same file filter logic as uploadMiddleware
      const filetypes = /jpeg|jpg|png|gif|webp|bmp|tiff|svg|avif|heic|heif|ico|jfif|pjpeg|pjp|apng/i;
      const extname = filetypes.test(file.originalname.split('.').pop().toLowerCase());
      const mimetype = file.mimetype.startsWith('image/') || 
                      file.mimetype === 'image/avif' ||
                      file.mimetype === 'image/heic' ||
                      file.mimetype === 'image/heif' ||
                      file.mimetype === 'application/octet-stream';
      
      console.log('Cloudinary - Checking file:', file.originalname);
      console.log('Cloudinary - Extension check:', extname, 'MIME check:', mimetype);
      
      if (mimetype || extname) {
        console.log('Cloudinary - File accepted:', file.originalname);
        return cb(null, true);
      } else {
        console.log('Cloudinary - File rejected:', file.originalname);
        cb(new Error('Only image files are allowed'));
      }
    } catch (error) {
      console.error('Cloudinary file filter error:', error);
      cb(new Error('File processing error'));
    }
  }
});

// Export different upload configurations (same as uploadMiddleware)
export const uploadSingle = upload.single('image');
export const uploadMultiple = upload.array('images', 10);
export const uploadFields = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'images', maxCount: 10 }
]);

export default upload;