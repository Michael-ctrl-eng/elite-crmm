import { prisma } from "@/libs/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/feature/auth/lib/auth";

/**
 * Get the current user's session with tenant info
 */
export async function getSessionWithTenant() {
  const session = await getServerSession(authOptions);
  return session;
}

/**
 * Verify user belongs to the tenant
 */
export async function verifyTenantAccess(userId: string, tenantId: string): Promise<boolean> {
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      tenantId: tenantId,
    },
  });
  return !!user;
}

/**
 * Get tenant by slug
 */
export async function getTenantBySlug(slug: string) {
  return prisma.tenant.findUnique({
    where: { slug },
    include: {
      users: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          lastLogin: true,
        }
      },
      _count: {
        select: {
          users: true,
          deals: true,
          customers: true,
          companies: true,
        }
      }
    }
  });
}

/**
 * Check if tenant has reached max users
 */
export async function hasReachedMaxUsers(tenantId: string): Promise<boolean> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      _count: { select: { users: true } }
    }
  });
  
  if (!tenant) return true;
  return tenant._count.users >= tenant.maxUsers;
}

/**
 * Generate unique slug for tenant
 */
export function generateTenantSlug(name: string): string {
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 30);
  
  const randomSuffix = Math.random().toString(36).substring(2, 6);
  return `${baseSlug}-${randomSuffix}`;
}
