import { NextResponse } from "next/server"
import { prisma } from "@/libs/prisma"
import { hash } from "bcryptjs"
import { sendEmail } from "@/libs/email"
import { withActivityLogging } from "@/libs/apiUtils"
import { ActivityAction } from "@prisma/client"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/feature/auth/lib/auth"
import { randomBytes } from "crypto"

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const limit = Number(url.searchParams.get("limit") ?? 50);
    const userId = url.searchParams.get("userId");
    const status = url.searchParams.get("status");

    const where = {
      ...(userId ? { userId } : {}),
      ...(status ? { status } : {})
    } as any;
    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: Math.min(limit, 200),
    });

    return NextResponse.json({ success: true, users })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { email, name } = await req.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: "User already exists" }, { status: 409 })
    }

    const dummyPassword = await hash("temporary-invite-password", 10)

    const createdUser = await withActivityLogging(
      async () => {
        return prisma.user.create({
          data: {
            email,
            name: name ?? null,
            password: dummyPassword,
            status: 'Invite' as any,
            tenantId: session.user.tenantId,
          }
        })
      },
      {
        entityType: "User",
        entityId: "",
        action: ActivityAction.Create,
        userId: session.user.id,
        tenantId: session.user.tenantId,
        getCurrentData: async (result: any) => result,
        metadata: { reason: "User invited" },
      }
    )

    try {
      // Generate verification token and URL for password setup
      const token = randomBytes(32).toString('hex')
      const verificationUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/verify?token=${token}&email=${encodeURIComponent(email)}&action=set_password`

      await sendEmail({
        to: email,
        subject: "You're invited to Elite CRM",
        text: `Hello${name ? ` ${name}` : ""},

You've been invited to Elite CRM. Please click the link below to set your password and activate your account:

${verificationUrl}

If you didn't expect this invitation, please ignore this email.`,
        html: `<p>Hello${name ? ` ${name}` : ""},</p><p>You've been invited to <b>Elite CRM</b>.</p><p>Please click the button below to set your password and activate your account:</p><p><a href="${verificationUrl}" style="background-color: #000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Set Password & Activate</a></p><p>If the button doesn't work, copy and paste this link into your browser:</p><p>${verificationUrl}</p><p>If you didn't expect this invitation, please ignore this email.</p>`,
      })
    } catch (mailErr) {
      console.error("Failed to send invite email", mailErr)
      // Non-blocking: user creation succeeded; report email failure separately
      return NextResponse.json(
        { success: true, user: createdUser, emailSent: false },
        { status: 201 }
      )
    }

    return NextResponse.json({ success: true, user: createdUser, emailSent: true }, { status: 201 })
  } catch (err) {
    console.error("POST /users invite error", err)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { userIds } = await req.json()

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: "User IDs array is required" }, { status: 400 })
    }

    // Validate that all IDs are strings
    if (!userIds.every(id => typeof id === 'string' && id.trim().length > 0)) {
      return NextResponse.json({ error: "All user IDs must be valid strings" }, { status: 400 })
    }

    // Check if any of the users to be deleted are the current user
    if (userIds.includes(session.user.id)) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 })
    }

    // Get previous data for activity logging
    const getPreviousData = async () => {
      return await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, email: true, name: true, status: true }
      })
    }

    const previousUsers = await getPreviousData()

    // Update all users to deleted status
    const updatedUsers = await withActivityLogging(
      async () => {
        return await prisma.user.updateMany({
          where: { id: { in: userIds } },
          data: { status: 'Deleted' as any }
        })
      },
      {
        entityType: "User",
        entityId: userIds.join(','),
        action: ActivityAction.Delete,
        userId: session.user.id,
        tenantId: session.user.tenantId,
        getPreviousData: async () => previousUsers,
        getCurrentData: async (result: any) => {
          return await prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, email: true, name: true, status: true }
          })
        },
        metadata: {
          action: "bulk_delete",
          deletedUserIds: userIds,
          deletedUserCount: userIds.length
        },
      }
    )

    return NextResponse.json({
      success: true,
      message: `Successfully marked ${updatedUsers.count} user(s) as deleted`,
      deletedCount: updatedUsers.count
    })
  } catch (err) {
    console.error("DELETE /users error", err)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}