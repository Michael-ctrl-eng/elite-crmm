import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/feature/auth/lib/auth";
import { prisma } from "@/libs/prisma";
import { isAdmin } from "@/libs/rbac";
import { randomBytes } from "crypto";
import { sendEmail } from "@/libs/email";

// POST - Create invitation (admin only)
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId || !isAdmin(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized - Admin only" }, { status: 401 });
    }

    const { email, role } = await req.json();

    if (!email || !role) {
      return NextResponse.json({ error: "Email and role are required" }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 400 });
    }

    // Check for existing pending invitation
    const existingInvitation = await prisma.invitation.findFirst({
      where: {
        email,
        tenantId: session.user.tenantId,
        status: "pending",
        expiresAt: { gt: new Date() }
      }
    });

    if (existingInvitation) {
      return NextResponse.json({ error: "A pending invitation already exists for this email" }, { status: 400 });
    }

    // Create invitation
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invitation = await prisma.invitation.create({
      data: {
        email,
        token,
        role,
        status: "pending",
        expiresAt,
        tenantId: session.user.tenantId,
        invitedBy: session.user.id,
      }
    });

    // Get tenant info
    const tenant = await prisma.tenant.findUnique({
      where: { id: session.user.tenantId },
      select: { name: true }
    });

    // Send invitation email
    const inviteUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth?invite=${token}`;
    
    try {
      await sendEmail({
        to: email,
        subject: `You're invited to join ${tenant?.name || 'a workspace'} on Klickbee CRM`,
        text: `Hello,\n\nYou have been invited to join ${tenant?.name || 'a workspace'} on Klickbee CRM.\n\nRole: ${role}\n\nClick the link below to accept the invitation and create your account:\n\n${inviteUrl}\n\nThis invitation will expire in 7 days.\n\nIf you didn't expect this invitation, please ignore this email.`,
        html: `<p>Hello,</p><p>You have been invited to join <strong>${tenant?.name || 'a workspace'}</strong> on Klickbee CRM.</p><p><strong>Role:</strong> ${role}</p><p>Click the button below to accept the invitation and create your account:</p><p><a href="${inviteUrl}" style="background-color: #000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Accept Invitation</a></p><p>This invitation will expire in 7 days.</p><p>If you didn't expect this invitation, please ignore this email.</p>`,
      });
    } catch (emailError) {
      console.error('Failed to send invitation email:', emailError);
      // Continue - invitation is still created
    }

    return NextResponse.json({ success: true, invitation });
  } catch (error) {
    console.error("Error creating invitation:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET - List invitations (admin only)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId || !isAdmin(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized - Admin only" }, { status: 401 });
    }

    const invitations = await prisma.invitation.findMany({
      where: { tenantId: session.user.tenantId },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(invitations);
  } catch (error) {
    console.error("Error fetching invitations:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE - Cancel invitation (admin only)
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId || !isAdmin(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized - Admin only" }, { status: 401 });
    }

    const { id } = await req.json();

    const invitation = await prisma.invitation.findFirst({
      where: { id, tenantId: session.user.tenantId }
    });

    if (!invitation) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
    }

    await prisma.invitation.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting invitation:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
