// utils/fileHelper.js - Enhanced version based on your existing code
import fs from 'fs';
import path from 'path';

export const deleteFile = (filePath) => {
    if (!filePath) {
        console.log('No file path provided for deletion');
        return;
    }

    console.log('Attempting to delete file:', filePath);

    // filePath is stored as '/uploads/filename.ext'. We need to remove the leading '/'.
    const correctPath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
    const fullPath = path.join(process.cwd(), correctPath);
    
    console.log('Full path for deletion:', fullPath);
    
    // Check if file exists before deletion
    if (!fs.existsSync(fullPath)) {
        console.log('File does not exist, skipping deletion:', fullPath);
        return;
    }

    fs.unlink(fullPath, (err) => {
        if (err && err.code !== 'ENOENT') { // ENOENT means file not found, which is ok
            console.error(`Error deleting file: ${fullPath}`, err);
        } else if (!err) {
            console.log('File deleted successfully:', fullPath);
        }
    });
};

// Create directory if it doesn't exist
export const ensureDirectoryExists = (dirPath) => {
    try {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
            console.log('Directory created:', dirPath);
            return true;
        }
        return true;
    } catch (error) {
        console.error('Error creating directory:', error.message);
        return false;
    }
};

// Get file info
export const getFileInfo = (filePath) => {
    try {
        let fullPath;
        
        if (path.isAbsolute(filePath)) {
            fullPath = filePath;
        } else {
            const cleanPath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
            fullPath = path.join(__dirname, cleanPath);
        }
        
        if (!fs.existsSync(fullPath)) {
            return null;
        }
        
        const stats = fs.statSync(fullPath);
        
        return {
            exists: true,
            path: fullPath,
            size: stats.size,
            modified: stats.mtime,
            created: stats.birthtime,
            isFile: stats.isFile(),
            isDirectory: stats.isDirectory()
        };
        
    } catch (error) {
        console.error('Error getting file info:', error.message);
        return null;
    }
};

// List files in directory
export const listFiles = (dirPath) => {
    try {
        let fullPath;
        
        if (path.isAbsolute(dirPath)) {
            fullPath = dirPath;
        } else {
            fullPath = path.join(__dirname, dirPath);
        }
        
        if (!fs.existsSync(fullPath)) {
            console.log('Directory does not exist:', fullPath);
            return [];
        }
        
        const files = fs.readdirSync(fullPath);
        console.log(`Found ${files.length} files in ${fullPath}`);
        
        return files.map(file => ({
            name: file,
            fullPath: path.join(fullPath, file),
            stats: fs.statSync(path.join(fullPath, file))
        }));
        
    } catch (error) {
        console.error('Error listing files:', error.message);
        return [];
    }
};