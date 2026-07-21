import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '10485760'); // 10MB default

// Allowed file types
const ALLOWED_IMAGE_TYPES = (process.env.ALLOWED_IMAGE_TYPES || 'image/jpeg,image/png,image/webp,image/gif').split(',');
const ALLOWED_VIDEO_TYPES = (process.env.ALLOWED_VIDEO_TYPES || 'video/mp4,video/webm,video/quicktime').split(',');

// Ensure upload directories exist
const ensureUploadDir = (projectId: string, type: 'images' | 'videos') => {
  const dir = path.join(UPLOAD_DIR, 'projects', projectId, type);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
};

// Generate unique filename
const generateFilename = (originalName: string) => {
  const ext = path.extname(originalName);
  const baseName = path.basename(originalName, ext);
  const uniqueId = uuidv4();
  return `${uniqueId}${ext}`;
};

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const { projectId } = req.params;
    const type = file.mimetype.startsWith('image/') ? 'images' : 'videos';
    const dir = ensureUploadDir(projectId, type);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const filename = generateFilename(file.originalname);
    cb(null, filename);
  },
});

// File filter
const fileFilter = (allowedTypes: string[]) => {
  return (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`));
    }
  };
};

// Image processing: compress and generate thumbnail
const processImage = async (filePath: string) => {
  try {
    const image = sharp(filePath);
    const metadata = await image.metadata();

    // Generate compressed version
    const compressedPath = filePath.replace(/(\.[^.]+)$/, '_compressed$1');
    await image
      .jpeg({ quality: 80 })
      .toFile(compressedPath);

    // Generate thumbnail
    const thumbnailPath = filePath.replace(/(\.[^.]+)$/, '_thumb$1');
    await image
      .resize(300, 300, { fit: 'cover' })
      .jpeg({ quality: 70 })
      .toFile(thumbnailPath);

    return {
      width: metadata.width,
      height: metadata.height,
      compressedPath,
      thumbnailPath,
    };
  } catch (error) {
    console.error('Image processing error:', error);
    throw error;
  }
};

// Multer instances
export const uploadImages = multer({
  storage,
  fileFilter: fileFilter(ALLOWED_IMAGE_TYPES),
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 10, // Max 10 images at once
  },
});

export const uploadVideos = multer({
  storage,
  fileFilter: fileFilter(ALLOWED_VIDEO_TYPES),
  limits: {
    fileSize: MAX_FILE_SIZE * 5, // Allow larger videos (50MB)
    files: 3, // Max 3 videos at once
  },
});

// Middleware to process uploaded images
export const processUploadedImages = async (req: any, res: any, next: any) => {
  if (!req.files || req.files.length === 0) {
    return next();
  }

  try {
    const processedFiles = await Promise.all(
      req.files.map(async (file: Express.Multer.File) => {
        if (file.mimetype.startsWith('image/')) {
          const processed = await processImage(file.path);
          return {
            ...file,
            ...processed,
          };
        }
        return file;
      })
    );

    req.files = processedFiles;
    next();
  } catch (error) {
    console.error('Image processing error:', error);
    return res.status(500).json({ error: 'Failed to process images' });
  }
};
