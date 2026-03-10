// src/feature/todo/api/apiTodos.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/feature/auth/lib/auth";
import { prisma } from "@/libs/prisma";
import { createTodoSchema, updateTodoSchema } from "../schema/todoSchema";
import { ActivityAction, Prisma } from "@prisma/client";
import { withActivityLogging } from "@/libs/apiUtils";
import { canPerform } from "@/libs/rbac";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.tenantId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!canPerform(session.user.role as any, "create", "tasks")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const raw = await req.json();
    const parsed = createTodoSchema.safeParse({
      ...raw,
      linkedId: session.user.id,
      assignedId: raw?.assignedTo || session.user.id,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.flatten() },
        { status: 422 }
      );
    }

    const parsedData = parsed.data as any;
    const data = {
      taskName: parsedData.taskName,
      linkedId: parsedData.linkedId,
      assignedId: parsedData.assignedId || null,
      ownerId: session.user.id,
      status: parsedData.status,
      priority: parsedData.priority,
      dueDate: parsedData.dueDate ? new Date(parsedData.dueDate) : null,
      notes: parsedData.notes ?? null,
      files: parsedData.files ? JSON.stringify(parsedData.files) : null,
      tenantId: session.user.tenantId,
    };

    const created = await withActivityLogging(
      async () => {
        return await prisma.todo.create({
          data,
          include: {
            owner: true,
            linkedTo: true,
            assignedTo: true
          },
        });
      },
      {
        entityType: 'Todo',
        entityId: '',
        action: ActivityAction.Create,
        userId: session.user.id,
        tenantId: session.user.tenantId,
        getCurrentData: async (result: any) => result,
        metadata: { createdFields: Object.keys(data) },
      }
    );

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error("POST /todos error", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.tenantId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!canPerform(session.user.role as any, "read", "tasks")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const url = new URL(req.url);
    const limit = Number(url.searchParams.get("limit") ?? 50);
    const linkedId = url.searchParams.get("linkedId");
    const search = url.searchParams.get("search");
    
    const status = url.searchParams.get("status")?.split(",").filter(Boolean) || [];
    const priority = url.searchParams.get("priority")?.split(",").filter(Boolean) || [];
    const assignedIds = url.searchParams.get("assignedId")?.split(",").filter(Boolean) || [];

    const where: any = {
      tenantId: session.user.tenantId,
      ...(linkedId ? { linkedId } : {}),
      ...(search
        ? {
            taskName: {
              contains: search,
              mode: Prisma.QueryMode.insensitive,
            },
          }
        : {}),
    };

    if (status.length > 0) {
      where.status = { in: status };
    }

    if (priority.length > 0) {
      where.priority = { in: priority };
    }

    if (assignedIds.length > 0) {
      where.assignedId = { in: assignedIds };
    }

    const todos = await prisma.todo.findMany({
      where,
      include: { linkedTo: true, assignedTo: true },
      orderBy: { createdAt: "desc" },
      take: Math.min(limit, 200),
    });

    return NextResponse.json(todos);
  } catch (err) {
    console.error("GET /todos error", err);
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

      const todo = await prisma.todo.findFirst({ 
        where: { id, tenantId: session.user.tenantId }, 
        include: { linkedTo: true, assignedTo: true } 
      });
      if (!todo) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json(todo);
    }

    if (method === "PATCH") {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id || !session?.user?.tenantId)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

      if (!canPerform(session.user.role as any, "update", "tasks")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const body = await req.json();
      const parsed = updateTodoSchema.safeParse({ ...body, linkedTo: body.linkedTo });
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Validation error", details: parsed.error.flatten() },
          { status: 422 }
        );
      }

      const parsedData = parsed.data as any;
      const data: any = {
        taskName: parsedData.taskName,
        linkedId: parsedData.linkedTo || session.user.id,
        assignedId: parsedData.assignedId || null,
        status: parsedData.status,
        priority: parsedData.priority,
        dueDate: parsedData.dueDate ? new Date(parsedData.dueDate) : undefined,
        notes: parsedData.notes ?? undefined,
        files: parsedData.files ? JSON.stringify(parsedData.files) : undefined,
      };

      const getPreviousData = async () => {
        return await prisma.todo.findFirst({
          where: { id: id, tenantId: session.user.tenantId },
        });
      };

      const existingTodo = await getPreviousData();
      if (!existingTodo) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }

      const updatedTodo = await withActivityLogging(
        async () => {
          return await prisma.todo.update({
            where: { id: id },
            data,
            include: {
              owner: true,
              linkedTo: true,
              assignedTo: true, 
            },
          });
        },
        {
          entityType: 'Todo',
          entityId: id,
          action: ActivityAction.Update,
          userId: session.user.id,
          tenantId: session.user.tenantId,
          getPreviousData,
          getCurrentData: async (result: any) => result,
          metadata: { updatedFields: Object.keys(data) },
        }
      );

      return NextResponse.json(updatedTodo);
    }

    if (method === "DELETE") {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id || !session?.user?.tenantId)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

      if (!canPerform(session.user.role as any, "delete", "tasks")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const getPreviousData = async () => {
        return await prisma.todo.findFirst({
          where: { id, tenantId: session.user.tenantId },
        });
      };

      const existingTodo = await getPreviousData();
      if (!existingTodo) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }

      await withActivityLogging(
        async () => {
          return await prisma.todo.delete({
            where: { id },
          });
        },
        {
          entityType: 'Todo',
          entityId: id,
          action: ActivityAction.Delete,
          userId: session.user.id,
          tenantId: session.user.tenantId,
          getPreviousData,
          metadata: { deletedAt: new Date().toISOString() },
        }
      );
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
  } catch (err) {
    console.error("todos/:id handler error", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
