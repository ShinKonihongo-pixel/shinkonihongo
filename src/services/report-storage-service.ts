// Report Storage Service
// Handles saving and retrieving student reports from Firebase Storage

import { ref, uploadBytes, getDownloadURL, listAll, deleteObject } from 'firebase/storage';
import { collection, addDoc, getDocs, query, where, deleteDoc, doc } from 'firebase/firestore';
import { storage, db } from '../lib/firebase';
import type { ReportMetadata } from '../types/student-report';

// Collection name for report metadata
const REPORTS_COLLECTION = 'student_reports';

// Storage path: reports/{classroomId}/{studentId}/{filename}
function getReportPath(classroomId: string, studentId: string, filename: string): string {
  return `reports/${classroomId}/${studentId}/${filename}`;
}

// Save report PDF to Firebase Storage and metadata to Firestore
export async function saveReportToStorage(
  classroomId: string,
  studentId: string,
  studentName: string,
  periodStart: string,
  periodEnd: string,
  pdfBlob: Blob,
  generatedBy: string
): Promise<ReportMetadata> {
  const now = new Date().toISOString();
  const safeStudentName = studentName.replace(/[^a-zA-Z0-9]/g, '_');
  const datePart = now.split('T')[0].replace(/-/g, '');
  const fileName = `BaoCao_${safeStudentName}_${datePart}.pdf`;

  // Upload to Storage
  const path = getReportPath(classroomId, studentId, fileName);
  const storageRef = ref(storage, path);

  await uploadBytes(storageRef, pdfBlob, {
    contentType: 'application/pdf',
    customMetadata: {
      studentId,
      classroomId,
      periodStart,
      periodEnd,
      generatedAt: now,
    },
  });

  const downloadUrl = await getDownloadURL(storageRef);

  // Save metadata to Firestore
  const metadata: Omit<ReportMetadata, 'id'> = {
    classroomId,
    studentId,
    studentName,
    periodStart,
    periodEnd,
    generatedAt: now,
    generatedBy,
    downloadUrl,
    fileName,
  };

  const docRef = await addDoc(collection(db, REPORTS_COLLECTION), metadata);

  return { id: docRef.id, ...metadata };
}

// Get all reports for a student
export async function getStudentReports(
  classroomId: string,
  studentId: string
): Promise<ReportMetadata[]> {
  const q = query(
    collection(db, REPORTS_COLLECTION),
    where('classroomId', '==', classroomId),
    where('studentId', '==', studentId)
  );

  const snapshot = await getDocs(q);
  const reports = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  } as ReportMetadata));

  // Sort by date descending
  return reports.sort((a, b) =>
    new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
  );
}

// Get all reports for a classroom
export async function getClassroomReports(classroomId: string): Promise<ReportMetadata[]> {
  const q = query(
    collection(db, REPORTS_COLLECTION),
    where('classroomId', '==', classroomId)
  );

  const snapshot = await getDocs(q);
  const reports = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  } as ReportMetadata));

  // Sort by date descending
  return reports.sort((a, b) =>
    new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
  );
}

// Delete a report (both storage and metadata)
export async function deleteReport(report: ReportMetadata): Promise<void> {
  // Delete from Storage
  const path = getReportPath(report.classroomId, report.studentId, report.fileName);
  const storageRef = ref(storage, path);

  try {
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Error deleting report file:', error);
    // Continue to delete metadata even if file deletion fails
  }

  // Delete metadata from Firestore
  await deleteDoc(doc(db, REPORTS_COLLECTION, report.id));
}

// Delete all reports for a student
export async function deleteStudentReports(
  classroomId: string,
  studentId: string
): Promise<number> {
  const reports = await getStudentReports(classroomId, studentId);

  for (const report of reports) {
    await deleteReport(report);
  }

  return reports.length;
}

// List all report files in storage for a student (for cleanup)
export async function listStorageReports(
  classroomId: string,
  studentId: string
): Promise<string[]> {
  const folderPath = `reports/${classroomId}/${studentId}`;
  const folderRef = ref(storage, folderPath);

  try {
    const result = await listAll(folderRef);
    return result.items.map(item => item.fullPath);
  } catch {
    return [];
  }
}

// Download report by URL (useful for re-downloading)
export function downloadReport(downloadUrl: string, fileName: string): void {
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = fileName;
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
