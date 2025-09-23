import fs from 'fs';
import path from 'path';

export const deleteFile = (filePath) => {
    if (!filePath) return;

    // filePath is stored as '/uploads/filename.ext'. We need to remove the leading '/'.
    const correctPath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
    const fullPath = path.join(process.cwd(), correctPath);

    fs.unlink(fullPath, (err) => {
        if (err && err.code !== 'ENOENT') { // ENOENT means file not found, which is ok
            console.error(`Error deleting file: ${fullPath}`, err);
        }
    });
};