// src/feature/deals/api/apiDeals.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/feature/auth/lib/auth";
import { prisma } from "@/libs/prisma";
import { createDealSchema, updateDealSchema } from "../schema/dealSchema";
import { withActivityLogging } from "@/libs/apiUtils";
import { ActivityAction, Prisma } from "@prisma/client";
import { canPerform } from "@/libs/rbac";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.tenantId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Check permission
    if (!canPerform(session.user.role as any, 'create', 'deals')) {
      return NextResponse.json({ error: "Forbidden - Cannot create deals" }, { status: 403 });
    }

    const body = await req.json();

    // ✅ validate with zod
    const parsed = createDealSchema.safeParse({
      ...body,
      ownerId: body.owner?.id || session.user.id,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.flatten() },
        { status: 422 }
      );
    }

    const parsedData = parsed.data;
    const data = {
        dealName: parsedData.dealName,
        stage: parsedData.stage,
        amount: parsedData.amount,
        currency: parsedData.currency,
        ownerId: parsedData.ownerId || session.user.id,
        companyId: parsedData.companyId ?? null,
        contactId: parsedData.contactId ?? null,
        closeDate: parsedData.closeDate ? new Date(parsedData.closeDate) : null,
        tags: Array.isArray(parsedData.tags) ? parsedData.tags.join(',') : (parsedData.tags ?? ''),
        notes: parsedData.notes ?? null,
        files: parsedData.files ? JSON.stringify(parsedData.files) : null,
        // Tenant isolation
        tenantId: session.user.tenantId,
      }

    const created = await withActivityLogging(
          async () => {
            return await prisma.deal.create({
              data,
              include: {
                owner: true,
                company: true,
                contact: true, 
              },
            });
          },
          {
            entityType: 'Deal',
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
    console.error("POST /deals error", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.tenantId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Check permission
    if (!canPerform(session.user.role as any, 'read', 'deals')) {
      return NextResponse.json({ error: "Forbidden - Cannot read deals" }, { status: 403 });
    }

    const url = new URL(req.url);
    const limit = Number(url.searchParams.get("limit") ?? 50);
    const ownerId = url.searchParams.get("ownerId");
    const companyId = url.searchParams.get("companyId");
    const contactId = url.searchParams.get("contactId");
    const search = url.searchParams.get("search");
    
    // New filter parameters
    const stages = url.searchParams.get("stages")?.split(",").filter(Boolean) || [];
    const owners = url.searchParams.get("owners")?.split(",").filter(Boolean) || [];
    const tags = url.searchParams.get("tags")?.split(",").filter(Boolean) || [];
    const closeDateFrom = url.searchParams.get("closeDateFrom");

    const where: any = {
      // Tenant isolation - CRITICAL
      tenantId: session.user.tenantId,
      ...(ownerId ? { ownerId } : {}),
      ...(companyId ? { companyId } : {}),
      ...(contactId ? { contactId } : {}),
      ...(search
        ? {
              dealName: {
              contains: search,
              mode: Prisma.QueryMode.insensitive,
            },
          }
        : {}),
    };

    // Add stage filtering
    if (stages.length > 0) {
      where.stage = { in: stages };
    }

    // Add owner filtering
    if (owners.length > 0) {
      where.ownerId = { in: owners };
    }

    // Add tags filtering (string contains)
    if (tags.length > 0) {
      // For SQLite, we need to check if the tags string contains the tag
      where.OR = tags.map(tag => ({
        tags: { contains: tag }
      }));
    }

    // Add close date filtering
    if (closeDateFrom) {
      where.closeDate = {
        gte: closeDateFrom
      };
    }
    
    const deals = await prisma.deal.findMany({
      where,
      include: { owner: true, company: true, contact: true },
      orderBy: { createdAt: "desc" },
      take: Math.min(limit, 200),
    });

    return NextResponse.json(deals);
  } catch (err) {
    console.error("GET /deals error", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function handleMethodWithId(req: Request, id: string) {
  try {
    const method = req.method?.toUpperCase();

    if (method === "GET") {
      const session = await getServerSession(authOptions);
      if (!session?.user?.tenantId)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

      const deal = await prisma.deal.findFirst({ 
        where: { 
          id,
          tenantId: session.user.tenantId 
        } 
      });
      if (!deal) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json(deal);
    }

    if (method === "PATCH") {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id || !session?.user?.tenantId)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

      // Check permission
      if (!canPerform(session.user.role as any, 'update', 'deals')) {
        return NextResponse.json({ error: "Forbidden - Cannot update deals" }, { status: 403 });
      }

      // Verify deal belongs to tenant
      const existingDeal = await prisma.deal.findFirst({
        where: { id, tenantId: session.user.tenantId }
      });
      if (!existingDeal) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }

      const body = await req.json();

      const parsed = updateDealSchema.safeParse({ ...body, id, ownerId: body.owner?.id || body.ownerId });
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Validation error", details: parsed.error.flatten() },
          { status: 422 }
        );
      }

      const parsedData = parsed.data;
      const data: any = {
          dealName: parsedData.dealName,
          companyId: parsedData.companyId,
          contactId: parsedData.contactId,
          ownerId: parsedData.ownerId || session.user.id,
          stage: parsedData.stage,
          amount: parsedData.amount,
          currency: parsedData.currency,
          closeDate: parsedData.closeDate ? new Date(parsedData.closeDate) : undefined,
          tags: Array.isArray(parsedData.tags) ? parsedData.tags.join(',') : parsedData.tags,
          notes: parsedData.notes ?? undefined,
          files: parsedData.files ? JSON.stringify(parsedData.files) : undefined,
        }

      const getPreviousData = async () => {
        const deal = await prisma.deal.findUnique({
          where: { id: id },
        });
        return deal;
      };

      const previousDeal = await getPreviousData();
      const isStageChanging = previousDeal && previousDeal.stage !== parsedData.stage;
      
      if (isStageChanging) {
        data.lastActivity = new Date();
      }

      const updatedDeal = await withActivityLogging(
        async () => {
          return await prisma.deal.update({
            where: { id: id },
            data,
            include: {
              owner: true,
              company: true,
              contact: true, 
            },
          });
        },
        {
          entityType: 'Deal',
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

      return NextResponse.json(updatedDeal);
    }

    if (method === "DELETE") {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id || !session?.user?.tenantId)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

      // Check permission
      if (!canPerform(session.user.role as any, 'delete', 'deals')) {
        return NextResponse.json({ error: "Forbidden - Cannot delete deals" }, { status: 403 });
      }

      // Verify deal belongs to tenant
      const existingDeal = await prisma.deal.findFirst({
        where: { id, tenantId: session.user.tenantId }
      });
      if (!existingDeal) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }

      const getPreviousData = async () => {
        return await prisma.deal.findUnique({
          where: { id },
        });
      };
      
      await withActivityLogging(
        async () => {
          return await prisma.deal.delete({
            where: { id },
          });
        },
        {
          entityType: 'Deal',
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
    console.error("deals/:id handler error", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
