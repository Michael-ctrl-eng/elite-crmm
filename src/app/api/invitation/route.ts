import { NextResponse } from "next/server";
import { prisma } from "@/libs/prisma";

// GET - Check invitation validity
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: {
        tenant: {
          select: { id: true, name: true, slug: true }
        }
      }
    });

    if (!invitation) {
      return NextResponse.json({ error: "Invalid invitation token", valid: false }, { status: 400 });
    }

    if (invitation.status !== "pending") {
      return NextResponse.json({ error: "Invitation has already been used", valid: false }, { status: 400 });
    }

    if (new Date() > invitation.expiresAt) {
      return NextResponse.json({ error: "Invitation has expired", valid: false }, { status: 400 });
    }

    return NextResponse.json({
      valid: true,
      invitation: {
        email: invitation.email,
        role: invitation.role,
        tenant: invitation.tenant,
      }
    });
  } catch (error) {
    console.error("Error checking invitation:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
