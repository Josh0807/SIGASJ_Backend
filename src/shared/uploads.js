import fs from 'node:fs';
import path from 'node:path';
import { config } from './config.js';
import { badRequest } from './errors.js';

export function extensionFromFile(file, allowed) {
  const fromMime = allowed[file.mimetype];
  if (fromMime) return fromMime;
  const ext = path.extname(file.originalname).replace('.', '').toLowerCase();
  if (ext === 'jpeg') return 'jpg';
  return ext;
}

export function saveUpload(subdir, id, file, allowed, maxBytes, invalidMessage) {
  if (!file) throw badRequest('El archivo es obligatorio.');
  if (file.size > maxBytes) throw badRequest('El archivo supera el tamaño permitido.');

  const ext = extensionFromFile(file, allowed);
  if (!Object.values(allowed).includes(ext) && !allowed[file.mimetype]) {
    throw badRequest(invalidMessage);
  }

  const dir = path.join(config.uploadsDir, subdir);
  fs.mkdirSync(dir, { recursive: true });
  const filename = `${id}.${ext}`;
  fs.writeFileSync(path.join(dir, filename), file.buffer);
  return `/uploads/${subdir}/${filename}`;
}

export function unlinkIfLocal(fileUrl) {
  if (!fileUrl || !fileUrl.startsWith('/uploads/')) return;
  const full = path.join(config.rootDir, fileUrl.replace(/^\//, ''));
  if (fs.existsSync(full)) fs.unlinkSync(full);
}
