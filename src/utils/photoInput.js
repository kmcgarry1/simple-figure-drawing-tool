import {
  ALLOWED_IMAGE_EXTENSIONS,
  ALLOWED_IMAGE_MIME_TYPES,
  DEFAULT_DURATION_SECONDS,
  MAX_DURATION_SECONDS,
  MAX_UPLOAD_FILE_COUNT,
  MAX_UPLOAD_FILE_SIZE_BYTES,
  MAX_UPLOAD_FILE_SIZE_MB,
  MIN_DURATION_SECONDS
} from "../config";

function getLowercaseExtension(fileName) {
  const parts = fileName.toLowerCase().split(".");
  if (parts.length < 2) {
    return "";
  }
  return `.${parts.at(-1)}`;
}

function isAllowedImageType(file) {
  const mimeType = String(file?.type || "").toLowerCase().trim();
  if (mimeType) {
    return ALLOWED_IMAGE_MIME_TYPES.has(mimeType);
  }

  const extension = getLowercaseExtension(file?.name || "");
  return ALLOWED_IMAGE_EXTENSIONS.has(extension);
}

function randomInt(upperExclusive) {
  if (upperExclusive <= 1) {
    return 0;
  }

  if (globalThis.crypto?.getRandomValues) {
    const rand = new Uint32Array(1);
    globalThis.crypto.getRandomValues(rand);
    return rand[0] % upperExclusive;
  }

  return Math.floor(Math.random() * upperExclusive);
}

export function createPhotoId(file) {
  const safeName = String(file?.name ?? "").trim();
  const safeSize = Number(file?.size) || 0;
  const safeModified = Number(file?.lastModified) || 0;
  return `${safeName}|${safeSize}|${safeModified}`;
}

export function clampDurationSeconds(value) {
  const parsed = Number.parseInt(String(value), 10);
  if (Number.isNaN(parsed)) {
    return DEFAULT_DURATION_SECONDS;
  }

  return Math.min(MAX_DURATION_SECONDS, Math.max(MIN_DURATION_SECONDS, parsed));
}

export function chooseRandomPhotos(files, count) {
  const shuffled = [...files];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = randomInt(i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
}

export function normalizeUploadedPhotos(rawFiles) {
  const incomingFiles = Array.from(rawFiles || []);
  const accepted = [];
  const seen = new Set();

  let rejectedType = 0;
  let rejectedSize = 0;
  let rejectedDuplicate = 0;
  let rejectedLimit = 0;

  for (const file of incomingFiles) {
    if (accepted.length >= MAX_UPLOAD_FILE_COUNT) {
      rejectedLimit += 1;
      continue;
    }

    if (!isAllowedImageType(file)) {
      rejectedType += 1;
      continue;
    }

    if (file.size <= 0 || file.size > MAX_UPLOAD_FILE_SIZE_BYTES) {
      rejectedSize += 1;
      continue;
    }

    const fileKey = createPhotoId(file);
    if (seen.has(fileKey)) {
      rejectedDuplicate += 1;
      continue;
    }

    seen.add(fileKey);
    accepted.push(file);
  }

  const notices = [];
  if (rejectedType > 0) {
    notices.push(`${rejectedType} file(s) ignored: unsupported image type.`);
  }
  if (rejectedSize > 0) {
    notices.push(
      `${rejectedSize} file(s) ignored: empty or larger than ${MAX_UPLOAD_FILE_SIZE_MB}MB.`
    );
  }
  if (rejectedDuplicate > 0) {
    notices.push(`${rejectedDuplicate} duplicate file(s) ignored.`);
  }
  if (rejectedLimit > 0) {
    notices.push(`${rejectedLimit} file(s) ignored: upload limit is ${MAX_UPLOAD_FILE_COUNT}.`);
  }

  return { photos: accepted, notices };
}
