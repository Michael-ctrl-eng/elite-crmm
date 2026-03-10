import { PrismaClient, UserRole, UserStatus } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting seed...')

  // 1. Create the centralized "Elite CRM" Tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'elite-crm' },
    update: {},
    create: {
      name: 'Elite CRM',
      slug: 'elite-crm',
      plan: 'pro',
      maxUsers: 20,
      active: true,
    },
  })

  console.log(`Tenant created/found: ${tenant.name} (${tenant.id})`)

  // 2. Define users to seed
  const usersToSeed = [
    {
      email: 'sales@admin.com',
      password: 'adminsales@elite1',
      name: 'Elite CRM Admin',
      role: UserRole.ADMIN,
    },
    {
      email: 'Shahdhanyyy456@gmail.com',
      password: 'shahdhany@elite1',
      name: 'Shahdhany Manager',
      role: UserRole.MANAGER,
    },
    {
      email: 'Mazen.ibrahim.tawela@gmail.com',
      password: 'mazenibrahim@elite1',
      name: 'Mazen Ibrahim',
      role: UserRole.MANAGER,
    },
    {
      email: 'elkabary1911@gmail.com',
      password: 'elkabary@elite1',
      name: 'Elkabary Manager',
      role: UserRole.MANAGER,
    },
  ]

  // 3. Seed users
  for (const userData of usersToSeed) {
    const hashedPassword = await hash(userData.password, 10)

    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {
        password: hashedPassword,
        role: userData.role,
        status: UserStatus.Active,
        tenantId: tenant.id,
      },
      create: {
        email: userData.email,
        password: hashedPassword,
        name: userData.name,
        role: userData.role,
        status: UserStatus.Active,
        tenantId: tenant.id,
      },
    })
    console.log(`User seeded: ${user.email} as ${user.role}`)
  }

  console.log('Seeding finished successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
