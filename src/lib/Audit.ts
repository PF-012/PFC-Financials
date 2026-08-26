import { addDoc, collection, db, serverTimestamp } from './firebase';
import { AuditLog } from '../types';

export async function auditUpdateDoc(
  docRef: any,
  originalState: any,
  newState: any,
  metadata: { userId: string; userEmail: string; companyId: string; entityId: string; entityType: string }
) {
  const changes: any[] = [];
  
  // Basic diffing
  for (const key of Object.keys(newState)) {
    if (key === 'id') continue;
    const oldVal = JSON.stringify(originalState[key]);
    const newVal = JSON.stringify(newState[key]);
    
    if (oldVal !== newVal) {
      changes.push({
        field: key,
        oldValue: originalState[key] !== undefined ? JSON.stringify(originalState[key]) : 'null',
        newValue: JSON.stringify(newState[key])
      });
    }
  }

  if (changes.length > 0) {
    const auditData: Omit<AuditLog, 'id'> = {
      companyId: metadata.companyId,
      entityId: metadata.entityId,
      entityType: metadata.entityType,
      changes,
      timestamp: new Date().toISOString(), // Strict UTC requirement
      userId: metadata.userId,
      userEmail: metadata.userEmail
    };
    await addDoc(collection(db, 'audit_logs'), auditData);
  }
}
