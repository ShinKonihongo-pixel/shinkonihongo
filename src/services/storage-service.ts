// Firebase Storage service for media file uploads
// Used by PPTX import to store extracted images

import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../lib/firebase';

// Storage path: lectures/{lectureId}/media/{filename}
function getMediaPath(lectureId: string, filename: string): string {
  return `lectures/${lectureId}/media/${filename}`;
}

// Upload a single media file and return download URL
export async function uploadLectureMedia(
  lectureId: string,
  file: Blob,
  filename: string
): Promise<string> {
  const path = getMediaPath(lectureId, filename);
  const storageRef = ref(storage, path);

  await uploadBytes(storageRef, file);
  const downloadUrl = await getDownloadURL(storageRef);

  return downloadUrl;
}

// Upload multiple media files with progress callback
export async function uploadMultipleMedia(
  lectureId: string,
  files: Map<string, Blob>,
  onProgress?: (uploaded: number, total: number) => void
): Promise<Map<string, string>> {
  const results = new Map<string, string>();
  const total = files.size;
  let uploaded = 0;

  for (const [filename, file] of files) {
    try {
      const url = await uploadLectureMedia(lectureId, file, filename);
      results.set(filename, url);
    } catch (error) {
      console.error(`Failed to upload ${filename}:`, error);
      // Continue with other files, store empty string for failed
      results.set(filename, '');
    }

    uploaded++;
    onProgress?.(uploaded, total);
  }

  return results;
}

// Delete a media file from storage
export async function deleteLectureMedia(
  lectureId: string,
  filename: string
): Promise<void> {
  const path = getMediaPath(lectureId, filename);
  const storageRef = ref(storage, path);

  try {
    await deleteObject(storageRef);
  } catch (error) {
    console.error(`Failed to delete ${filename}:`, error);
  }
}

// Convert base64 data URL to Blob for upload
export function base64ToBlob(base64: string): Blob {
  const parts = base64.split(';base64,');
  const contentType = parts[0].split(':')[1] || 'image/png';
  const raw = atob(parts[1]);
  const rawLength = raw.length;
  const uInt8Array = new Uint8Array(rawLength);

  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }

  return new Blob([uInt8Array], { type: contentType });
}

// Get file extension from MIME type
export function getExtensionFromMime(mimeType: string): string {
  const mimeMap: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/svg+xml': 'svg',
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'audio/mpeg': 'mp3',
    'audio/wav': 'wav',
    'audio/ogg': 'ogg',
  };

  return mimeMap[mimeType] || 'bin';
}
