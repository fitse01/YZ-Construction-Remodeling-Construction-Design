import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '52428800', 10); // 50MB default

// Allowed file types
const ALLOWED_IMAGE_TYPES = (process.env.ALLOWED_IMAGE_TYPES || 'image/jpeg,image/png,image/webp,image/gif,image/svg+xml').split(',');
const ALLOWED_VIDEO_TYPES = (process.env.ALLOWED_VIDEO_TYPES || 'video/mp4,video/webm,video/quicktime').split(',');
const ALLOWED_DOC_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

// Ensure folder directory exists
export const ensureFolderDir = (folder: string) => {
  const safeFolder = folder.replace(/[^a-zA-Z0-9_-]/g, '') || 'general';
  const dir = path.join(UPLOAD_DIR, safeFolder);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return { dir, safeFolder };
};

const generateFilename = (originalName: string) => {
  const ext = path.extname(originalName).toLowerCase();
  const uniqueId = uuidv4();
  return `${uniqueId}${ext}`;
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let targetFolder = req.params.folder || req.query.folder as string || 'general';
    if (!targetFolder || targetFolder === 'general') {
      if (req.params.projectId) targetFolder = 'projects';
      else if (req.params.serviceId) targetFolder = 'services';
      else if (file.mimetype.startsWith('video/')) targetFolder = 'videos';
      else if (file.mimetype.startsWith('image/')) targetFolder = 'gallery';
      else targetFolder = 'documents';
    }
    const { dir } = ensureFolderDir(targetFolder);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const filename = generateFilename(file.originalname);
    cb(null, filename);
  },
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allAllowed = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES, ...ALLOWED_DOC_TYPES];
  if (allAllowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not supported.`));
  }
};

export const uploadGeneric = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});

export const uploadImages = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Invalid image file type.'));
  },
  limits: { fileSize: MAX_FILE_SIZE },
});

export const uploadVideos = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (ALLOWED_VIDEO_TYPES.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Invalid video file type.'));
  },
  limits: { fileSize: MAX_FILE_SIZE },
});

export const processImage = async (filePath: string) => {
  try {
    const image = sharp(filePath);
    const metadata = await image.metadata();

    const ext = path.extname(filePath);
    const thumbnailPath = filePath.replace(ext, `_thumb${ext}`);

    if (metadata.format !== 'svg') {
      await image
        .resize(400, 400, { fit: 'cover', position: 'center' })
        .toFile(thumbnailPath);
    }

    return {
      width: metadata.width || 0,
      height: metadata.height || 0,
      thumbnailPath: fs.existsSync(thumbnailPath) ? thumbnailPath : filePath,
    };
  } catch (error) {
    console.error('Image processing fallback:', error);
    return { width: 0, height: 0, thumbnailPath: filePath };
  }
};
