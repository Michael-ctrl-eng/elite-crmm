// src/feature/prospects/api/apiProspects.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/feature/auth/lib/auth";
import { prisma } from "@/libs/prisma";
import { createProspectSchema, updateProspectSchema } from "../schema/prospectSchema";
import { withActivityLogging } from "@/libs/apiUtils";
import { ActivityAction, Prisma } from "@prisma/client";
import { canPerform } from "@/libs/rbac";

// Helper function to convert array to comma-separated string
function arrayToString(arr: string[] | undefined | null): string {
  if (!arr || !Array.isArray(arr)) return "";
  return arr.filter(Boolean).join(",");
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Permission check
    if (!canPerform(session.user.role, "create", "prospects")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();

    const parsed = createProspectSchema.safeParse({
      ...body,
      ownerId: body.owner?.id || session.user.id,
      userId: session.user.id,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.flatten() },
        { status: 422 }
      );
    }

    const parsedData = parsed.data as any;
    const data = {
      fullName: parsedData.fullName,
      companyId: parsedData.companyId || null,
      email: parsedData.email || null,
      phone: parsedData.phone || null,
      status: parsedData.status,
      tags: arrayToString(parsedData.tags),
      notes: parsedData.notes || null,
      ownerId: parsedData.ownerId || session.user.id,
      userId: parsedData.userId,
      tenantId: session.user.tenantId,
    };

    const created = await withActivityLogging(
      async () => {
        return await prisma.prospect.create({
          data,
          include: {
            owner: true,
            company: true,
          },
        });
      },
      {
        entityType: 'Prospect',
        entityId: '',
        action: ActivityAction.Create,
        userId: session.user.id,
        tenantId: session.user.tenantId,
        getCurrentData: async (result: any) => {
          return result;
        },
        metadata: {
          createdFields: Object.keys(data),
        },
      }
    );

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error("POST /prospects error", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Permission check
    if (!canPerform(session.user.role, "read", "prospects")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const url = new URL(req.url);
    const limit = Number(url.searchParams.get("limit") ?? 50);
    const ownerId = url.searchParams.get("ownerId");
    const companyId = url.searchParams.get("companyId");
    const search = url.searchParams.get("search");
    
    // New filter parameters
    const status = url.searchParams.get("status")?.split(",").filter(Boolean) || [];
    const owners = url.searchParams.get("owners")?.split(",").filter(Boolean) || [];
    const tags = url.searchParams.get("tags")?.split(",").filter(Boolean) || [];

    const where: any = {
      tenantId: session.user.tenantId,
      ...(ownerId ? { ownerId } : {}),
      ...(companyId ? { companyId } : {}),
      ...(search
        ? {
            fullName: {
              contains: search,
              mode: Prisma.QueryMode.insensitive,
            },
          }
        : {}),
    };

    // Add status filtering
    if (status.length > 0) {
      where.status = { in: status };
    }

    // Add owner filtering
    if (owners.length > 0) {
      where.ownerId = { in: owners };
    }

    // Add tags filtering (comma-separated string contains)
    if (tags.length > 0) {
      where.OR = tags.map(tag => ({
        tags: { contains: tag }
      }));
    }

    const prospects = await prisma.prospect.findMany({
      where,
      include: {
        owner: true, 
        company: true, 
      },
      orderBy: { createdAt: "desc" },
      take: Math.min(limit, 200),
    });

    return NextResponse.json(prospects);
  } catch (err) {
    console.error("GET /prospects error", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function handleMethodWithId(req: Request, id: string) {
  try {
    const method = req.method?.toUpperCase();

    if (method === "GET") {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id || !session?.user?.tenantId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // Permission check
      if (!canPerform(session.user.role, "read", "prospects")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const prospect = await prisma.prospect.findFirst({ 
        where: { id, tenantId: session.user.tenantId } 
      });
      if (!prospect) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json(prospect);
    }

    if (method === "PATCH") {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id || !session?.user?.tenantId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // Permission check
      if (!canPerform(session.user.role, "update", "prospects")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const body = await req.json();
      const parsed = updateProspectSchema.safeParse({ ...body, id, ownerId: body.owner || session.user.id });
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Validation error", details: parsed.error.flatten() },
          { status: 422 }
        );
      }

      const parsedData = parsed.data as any;
      const data: any = {
        fullName: parsedData.fullName,
        companyId: parsedData.companyId ?? null,
        email: parsedData.email ?? null,
        phone: parsedData.phone ?? null,
        status: parsedData.status,
        tags: parsedData.tags ? arrayToString(parsedData.tags) : undefined,
        notes: parsedData.notes ?? null,
        ownerId: parsedData.ownerId || session.user.id,
        lastContact: undefined as Date | undefined,
      };

      const getPreviousData = async () => {
        const prospect = await prisma.prospect.findFirst({
          where: { id: id, tenantId: session.user.tenantId },
        });
        return prospect;
      };

      // Check if status is being updated to set lastContact
      const previousProspect = await getPreviousData();
      const isStatusChanging = previousProspect && previousProspect.status !== parsedData.status;
      
      // Add lastContact to data if status is changing
      if (isStatusChanging) {
        data.lastContact = new Date();
      }

      const updatedProspect = await withActivityLogging(
        async () => {
          return await prisma.prospect.update({
            where: { id: id },
            data,
            include: {
              owner: true,
              company: true,
            },
          });
        },
        {
          entityType: 'Prospect',
          entityId: id,
          action: ActivityAction.Update,
          userId: session.user.id,
          tenantId: session.user.tenantId,
          getPreviousData,
          getCurrentData: async (result: any) => {
            return result;
          },
          metadata: {
            updatedFields: Object.keys(data),
          },
        }
      );

      return NextResponse.json(updatedProspect);
    }

    if (method === "DELETE") {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id || !session?.user?.tenantId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // Permission check
      if (!canPerform(session.user.role, "delete", "prospects")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const getPreviousData = async () => {
        return await prisma.prospect.findFirst({
          where: { id, tenantId: session.user.tenantId },
        });
      };

      await withActivityLogging(
        async () => {
          return await prisma.prospect.delete({
            where: { id },
          });
        },
        {
          entityType: 'Prospect',
          entityId: id,
          action: ActivityAction.Delete,
          userId: session.user.id,
          tenantId: session.user.tenantId,
          getPreviousData,
          metadata: {
            deletedAt: new Date().toISOString(),
          },
        }
      );
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
  } catch (err) {
    console.error("prospects/:id handler error", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
