import { ActivityAction } from '@prisma/client';
import { prisma } from './prisma';

export interface ActivityLogData {
  entityType: string;
  entityId: string;
  action: ActivityAction;
  changedFields?: string[];
  previousValues?: any;
  newValues?: any;
  metadata?: any;
  performedById: string;
  tenantId: string;
}

export async function logActivity(data: ActivityLogData) {
  try {
    await prisma.activityLog.create({
      data: {
        entityType: data.entityType,
        entityId: data.entityId,
        action: data.action,
        changedFields: Array.isArray(data.changedFields) ? data.changedFields.join(',') : (data.changedFields || ''),
        previousValues: data.previousValues ? JSON.stringify(data.previousValues) : null,
        newValues: data.newValues ? JSON.stringify(data.newValues) : null,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
        performedById: data.performedById,
        tenantId: data.tenantId,
      },
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
    // Don't throw the error to avoid breaking the main operation
  }
}

// Helper function to get changed fields between two objects
export function getChangedFields<T extends Record<string, any>>(
  oldObj: T,
  newObj: T
): string[] {
  const changedFields: string[] = [];
  
  // Check all keys in new object
  Object.keys(newObj).forEach(key => {
    if (JSON.stringify(oldObj[key]) !== JSON.stringify(newObj[key])) {
      changedFields.push(key);
    }
  });

  // Check for keys that were in old object but not in new (deletions)
  Object.keys(oldObj).forEach(key => {
    if (!(key in newObj) && !changedFields.includes(key)) {
      changedFields.push(key);
    }
  });

  return changedFields;
}
