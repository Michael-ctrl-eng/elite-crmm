// src/feature/meetings/api/apiMeetings.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/feature/auth/lib/auth";
import { prisma } from "@/libs/prisma";
import { createMeetingSchema, updateMeetingSchema } from "../schema/meetingSchema";
import { withActivityLogging } from "@/libs/apiUtils";
import { ActivityAction, Prisma } from "@prisma/client";
import { canPerform } from "@/libs/rbac";

function toDate(val: any): Date | null | undefined {
  if (val === undefined) return undefined;
  if (val === null || val === "") return null;
  return val instanceof Date ? val : new Date(val);
}

function arrayToString(arr: string[] | undefined | null): string {
  if (!arr || !Array.isArray(arr)) return "";
  return arr.filter(Boolean).join(",");
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.tenantId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!canPerform(session.user.role as any, "create", "meetings")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const bodyRaw = await req.json();

    const parsed = createMeetingSchema.safeParse({
      ...bodyRaw,
      startDate: toDate(bodyRaw.startDate),
      startTime: toDate(bodyRaw.startTime),
      endTime: toDate(bodyRaw.endTime),
      ownerId: bodyRaw.ownerId || session.user.id,
      linkedId: bodyRaw.linkedId, 
      assignedId: bodyRaw.assignedId && bodyRaw.assignedId.trim() !== "" ? bodyRaw.assignedId : null,
    });
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.flatten() },
        { status: 422 }
      );
    }

    const parsedData = parsed.data as any;
    const data = {
      title: parsedData.title,
      startDate: parsedData.startDate,
      startTime: parsedData.startTime,
      endTime: parsedData.endTime,
      repeatMeeting: parsedData.repeatMeeting ?? false,
      frequency: parsedData.frequency,
      repeatOn: parsedData.repeatOn ?? null,
      repeatEvery: typeof parsedData.repeatEvery === "number" ? parsedData.repeatEvery : 0,
      ends: parsedData.ends,
      linkedId: parsedData.linkedId || session.user.id,
      location: parsedData.location ?? null,
      assignedId: parsedData.assignedId || null,
      link: parsedData.link ?? null,
      participants: arrayToString(parsedData.participants),
      status: parsedData.status,
      tags: arrayToString(parsedData.tags),
      notes: parsedData.notes ?? null,
      files: parsedData.files ? JSON.stringify(parsedData.files) : null,
      ownerId: session.user.id,
      tenantId: session.user.tenantId,
    };

    const created = await withActivityLogging(
      async () => {
        return await prisma.meeting.create({    
          data,
          include: {
            linkedTo: true,
            assignedTo: true
          },
        });
      },
      {
        entityType: 'Meeting',
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
    console.error("POST /meetings error", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.tenantId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!canPerform(session.user.role as any, "read", "meetings")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const url = new URL(req.url);
    const limit = Number(url.searchParams.get("limit") ?? 50);
    const ownerId = url.searchParams.get("ownerId");
    const search = url.searchParams.get("search");
    
    const status = url.searchParams.get("status")?.split(",").filter(Boolean) || [];
    const owners = url.searchParams.get("owners")?.split(",").filter(Boolean) || [];
    const tags = url.searchParams.get("tags")?.split(",").filter(Boolean) || [];

    const where: any = {
      tenantId: session.user.tenantId,
      ...(ownerId ? { ownerId } : {}),
      ...(search
        ? {
            title: {
              contains: search,
              mode: Prisma.QueryMode.insensitive,
            },
          }
        : {}),
    };

    if (status.length > 0) {
      where.status = { in: status };
    }

    if (owners.length > 0) {
      where.ownerId = { in: owners };
    }

    if (tags.length > 0) {
      where.OR = tags.map(tag => ({
        tags: { contains: tag }
      }));
    }

    const meetings = await prisma.meeting.findMany({
      where,
      include: {
        linkedTo: true,
        assignedTo: true,
      },
      orderBy: { createdAt: "desc" },
      take: Math.min(limit, 200),
    });

    return NextResponse.json(meetings);
  } catch (err) {
    console.error("GET /meetings error", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function handleMethodWithId(req: Request, id: string) {
  try {
    const method = req.method?.toUpperCase();

    if (method === "GET") {
      const session = await getServerSession(authOptions);
      if (!session?.user?.tenantId)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

      const meeting = await prisma.meeting.findFirst({
        where: { id, tenantId: session.user.tenantId },
        include: {
          linkedTo: true,
          assignedTo: true,
        }
      });
      if (!meeting) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json(meeting);
    }

    if (method === "PATCH") {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id || !session?.user?.tenantId)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

      if (!canPerform(session.user.role as any, "update", "meetings")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const bodyRaw = await req.json();
      const parsed = updateMeetingSchema.safeParse({ ...bodyRaw, id, });
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Validation error", details: parsed.error.flatten() },
          { status: 422 }
        );
      }

      const parsedData = parsed.data as any;
      const data: any = {
          title: parsedData.title,
          startDate: toDate(parsedData.startDate),
          startTime: toDate(parsedData.startTime),
          endTime: toDate(parsedData.endTime),
          repeatMeeting: parsedData.repeatMeeting,
          frequency: parsedData.frequency,
          repeatOn: parsedData.repeatOn ?? undefined,
          repeatEvery: parsedData.repeatEvery,
          ends: parsedData.ends,
          linkedId: parsedData.linkedId || session.user.id,
          location: parsedData.location ?? undefined,
          assignedId: parsedData.assignedId && parsedData.assignedId.trim() !== "" ? parsedData.assignedId : null,
          link: parsedData.link ?? undefined,
          participants: parsedData.participants ? arrayToString(parsedData.participants) : undefined,
          status: parsedData.status,
          tags: parsedData.tags ? arrayToString(parsedData.tags) : undefined,
          notes: parsedData.notes ?? undefined,
          files: parsedData.files ? JSON.stringify(parsedData.files) : undefined,
        };

      const getPreviousData = async () => {
        return await prisma.meeting.findFirst({
          where: { id: id, tenantId: session.user.tenantId },
        });
      };

      const existingMeeting = await getPreviousData();
      if (!existingMeeting) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }

      const updatedMeeting = await withActivityLogging(
        async () => {
          return await prisma.meeting.update({
            where: { id: id },
            data,
            include: {
              linkedTo: true,
              assignedTo: true, 
            },
          });
        },
        {
          entityType: 'Meeting',
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

      return NextResponse.json(updatedMeeting);
    }

    if (method === "DELETE") {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id || !session?.user?.tenantId)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

      if (!canPerform(session.user.role as any, "delete", "meetings")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const getPreviousData = async () => {
        return await prisma.meeting.findFirst({
          where: { id, tenantId: session.user.tenantId },
        });
      };

      const existingMeeting = await getPreviousData();
      if (!existingMeeting) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      
      await withActivityLogging(
        async () => {
          return await prisma.meeting.delete({
            where: { id },
          });
        },
        {
          entityType: 'Meeting',
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
    console.error("meetings/:id handler error", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
