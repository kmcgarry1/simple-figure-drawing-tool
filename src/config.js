export const SESSION_PHOTO_LIMIT = 10;

export const DEFAULT_DURATION_SECONDS = 60;
export const MIN_DURATION_SECONDS = 5;
export const MAX_DURATION_SECONDS = 600;

export const MAX_UPLOAD_FILE_COUNT = 200;
export const MAX_UPLOAD_FILE_SIZE_MB = 25;
export const MAX_UPLOAD_FILE_SIZE_BYTES = MAX_UPLOAD_FILE_SIZE_MB * 1024 * 1024;

// SVG is intentionally excluded to avoid scriptable image formats.
export const ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/bmp",
  "image/avif"
]);

export const ALLOWED_IMAGE_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".bmp",
  ".avif"
]);

export const FILE_INPUT_ACCEPT =
  ".jpg,.jpeg,.png,.webp,.gif,.bmp,.avif,image/jpeg,image/png,image/webp,image/gif,image/bmp,image/avif";
