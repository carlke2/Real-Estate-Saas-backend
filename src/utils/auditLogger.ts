import { prisma } from '../index.js';

interface AuditParams {
  userId: string | null | undefined;
  action: string;
  entity: string;
  entityId?: string | null | undefined;
  metadata?: any;
}

export const logAudit = async ({
  userId,
  action,
  entity,
  entityId,
  metadata,
}: AuditParams): Promise<void> => {
  try {
    await prisma.auditLog.create({
      data: {
        userId: userId || null,
        action,
        entity,
        entityId: entityId || null,
        metadata: metadata || null,
      },
    });
  } catch {
    // Audit logging should never crash the main request
  }
};
