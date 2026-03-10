import { NextResponse } from "next/server"
import { prisma } from "@/libs/prisma"
import { hash } from "bcryptjs"
import { sendEmail } from "@/libs/email"
import { randomBytes } from "crypto"

function generateTenantSlug(name: string): string {
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 30);

  const randomSuffix = randomBytes(4).toString('hex');
  return `${baseSlug}-${randomSuffix}`;
}

export async function POST(req: Request) {
  try {
    const { email, password, name, tenantName, createNewTenant, inviteToken } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    }

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 })
    }

    let tenantId: string;
    let userRole: "ADMIN" | "MANAGER" | "VIEWER" = "VIEWER";

    // Check if user is accepting an invitation
    if (inviteToken) {
      const invitation = await prisma.invitation.findUnique({
        where: { token: inviteToken },
        include: { tenant: true }
      });

      if (!invitation) {
        return NextResponse.json({ error: "Invalid invitation token" }, { status: 400 });
      }

      if (invitation.status !== "pending") {
        return NextResponse.json({ error: "Invitation has already been used" }, { status: 400 });
      }

      if (new Date() > invitation.expiresAt) {
        return NextResponse.json({ error: "Invitation has expired" }, { status: 400 });
      }

      tenantId = invitation.tenantId;
      userRole = invitation.role as "ADMIN" | "MANAGER" | "VIEWER";

      // Mark invitation as accepted
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: "accepted" }
      });
    } else if (createNewTenant) {
      // Create new tenant
      const tenantSlug = generateTenantSlug(tenantName || name || "workspace");

      const tenant = await prisma.tenant.create({
        data: {
          name: tenantName || `${name}'s Workspace`,
          slug: tenantSlug,
          plan: "free",
          maxUsers: 5,
          active: true,
        }
      });

      tenantId = tenant.id;
      userRole = "ADMIN";
    } else {
      return NextResponse.json({ error: "Must either create a new tenant or accept an invitation" }, { status: 400 });
    }

    const hashedPassword = await hash(password, 10)
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: userRole,
        status: 'Active',
        tenantId,
      },
      include: {
        tenant: true,
      }
    })

    try {
      // Generate verification token and URL
      const token = randomBytes(32).toString('hex')
      const verificationUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/verify?token=${token}&email=${encodeURIComponent(email)}&action=verify`

      await sendEmail({
        to: email,
        subject: "Welcome to Elite CRM!",
        text: `Hello${name ? ` ${name}` : ''},\n\nYour account has been created successfully!\n\nWorkspace: ${user.tenant.name}\nRole: ${userRole}\n\nYou can now log in and start using Elite CRM.\n\nIf you didn't create this account, please ignore this email.`,
        html: `<p>Hello${name ? ` ${name}` : ''},</p><p>Your account has been created successfully!</p><p><strong>Workspace:</strong> ${user.tenant.name}</p><p><strong>Role:</strong> ${userRole}</p><p>You can now <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth">log in</a> and start using Elite CRM.</p><p>If you didn't create this account, please ignore this email.</p>`,
      })
    } catch (e) {
      console.error('Failed to send welcome email', e)
      // proceed without failing the signup
    }

    return NextResponse.json({ success: true, user: { id: user.id, email: user.email, name: user.name, role: user.role, tenantId: user.tenantId } })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
