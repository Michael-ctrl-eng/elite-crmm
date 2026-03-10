import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create a test tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'demo-workspace' },
    update: {},
    create: {
      name: 'Demo Workspace',
      slug: 'demo-workspace',
      plan: 'pro',
      maxUsers: 10,
      active: true,
      settings: JSON.stringify({ features: ['deals', 'meetings', 'tasks'] }),
    },
  });

  console.log('✅ Created tenant:', tenant.name);

  // Create admin user
  const adminPassword = await hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    update: {},
    create: {
      email: 'admin@demo.com',
      name: 'Admin User',
      password: adminPassword,
      role: 'ADMIN',
      status: 'Active',
      tenantId: tenant.id,
    },
  });

  console.log('✅ Created admin user:', admin.email, '(password: admin123)');

  // Create manager user
  const managerPassword = await hash('manager123', 10);
  const manager = await prisma.user.upsert({
    where: { email: 'manager@demo.com' },
    update: {},
    create: {
      email: 'manager@demo.com',
      name: 'Manager User',
      password: managerPassword,
      role: 'MANAGER',
      status: 'Active',
      tenantId: tenant.id,
    },
  });

  console.log('✅ Created manager user:', manager.email, '(password: manager123)');

  // Create viewer user
  const viewerPassword = await hash('viewer123', 10);
  const viewer = await prisma.user.upsert({
    where: { email: 'viewer@demo.com' },
    update: {},
    create: {
      email: 'viewer@demo.com',
      name: 'Viewer User',
      password: viewerPassword,
      role: 'VIEWER',
      status: 'Active',
      tenantId: tenant.id,
    },
  });

  console.log('✅ Created viewer user:', viewer.email, '(password: viewer123)');

  // Create a second tenant for testing multi-tenancy
  const tenant2 = await prisma.tenant.upsert({
    where: { slug: 'acme-corp' },
    update: {},
    create: {
      name: 'Acme Corporation',
      slug: 'acme-corp',
      plan: 'free',
      maxUsers: 5,
      active: true,
    },
  });

  console.log('✅ Created second tenant:', tenant2.name);

  const acmeAdminPassword = await hash('acme123', 10);
  const acmeAdmin = await prisma.user.upsert({
    where: { email: 'admin@acme.com' },
    update: {},
    create: {
      email: 'admin@acme.com',
      name: 'Acme Admin',
      password: acmeAdminPassword,
      role: 'ADMIN',
      status: 'Active',
      tenantId: tenant2.id,
    },
  });

  console.log('✅ Created acme admin user:', acmeAdmin.email, '(password: acme123)');

  // Create sample deals for demo tenant
  const deal1 = await prisma.deal.create({
    data: {
      dealName: 'Enterprise Software License',
      stage: 'Proposal',
      amount: 50000,
      currency: 'USD',
      ownerId: admin.id,
      tenantId: tenant.id,
      tags: 'enterprise,software',
      notes: 'Potential enterprise customer',
    },
  });

  console.log('✅ Created sample deal:', deal1.dealName);

  const deal2 = await prisma.deal.create({
    data: {
      dealName: 'Consulting Services',
      stage: 'Negotiation',
      amount: 25000,
      currency: 'USD',
      ownerId: manager.id,
      tenantId: tenant.id,
      tags: 'consulting,services',
      notes: 'Follow up next week',
    },
  });

  console.log('✅ Created sample deal:', deal2.dealName);

  // Create sample company
  const company = await prisma.company.create({
    data: {
      fullName: 'Tech Solutions Inc',
      industry: 'Technology',
      email: 'contact@techsolutions.com',
      phone: '+1-555-0123',
      status: 'Active',
      ownerId: admin.id,
      userId: admin.id,
      tenantId: tenant.id,
      tags: 'enterprise,tech',
    },
  });

  console.log('✅ Created sample company:', company.fullName);

  // Create sample customer
  const customer = await prisma.customer.create({
    data: {
      fullName: 'John Smith',
      email: 'john.smith@example.com',
      phone: '+1-555-0456',
      status: 'Active',
      companyId: company.id,
      ownerId: admin.id,
      userId: admin.id,
      tenantId: tenant.id,
      tags: 'vip,enterprise',
    },
  });

  console.log('✅ Created sample customer:', customer.fullName);

  console.log('\n🎉 Seeding completed!');
  console.log('\n📋 Test Accounts:');
  console.log('┌─────────────────────────────────────────────────────────┐');
  console.log('│ Demo Workspace                                          │');
  console.log('│ - admin@demo.com / admin123 (Admin)                     │');
  console.log('│ - manager@demo.com / manager123 (Manager)               │');
  console.log('│ - viewer@demo.com / viewer123 (Viewer)                  │');
  console.log('├─────────────────────────────────────────────────────────┤');
  console.log('│ Acme Corporation                                        │');
  console.log('│ - admin@acme.com / acme123 (Admin)                      │');
  console.log('└─────────────────────────────────────────────────────────┘');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
