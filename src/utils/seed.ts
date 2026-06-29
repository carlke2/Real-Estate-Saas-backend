/**
 * HomeSphere Admin Seed Script
 * Creates an admin user if none exists.
 * Run with: npm run seed
 */
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import PrismaService from '@prisma/client';

const { Pool } = pg;
const { PrismaClient } = PrismaService as any;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function seed() {
  console.log('🌱 Starting HomeSphere seed...');

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@homesphere.co.ke';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@HomeSphere2026!';
  const adminName = process.env.ADMIN_NAME || 'HomeSphere Admin';

  // Check if admin already exists
  const existingAdmin = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
  });

  if (existingAdmin) {
    console.log(`Admin already exists: ${existingAdmin.email}`);
  } else {
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    const admin = await prisma.user.create({
      data: {
        fullName: adminName,
        email: adminEmail,
        phone: '+254700000000',
        password: hashedPassword,
        role: 'ADMIN',
        isVerified: true,
        isAgentVerified: true,
      },
    });

    console.log(`🎉 Admin created successfully:`);
    console.log(`   Email:    ${admin.email}`);
    console.log(`   Password: ${adminPassword}`);
    console.log(`   Role:     ${admin.role}`);
  }

  // Create a demo agent if none exists (for testing)
  const existingAgent = await prisma.user.findFirst({
    where: { role: 'AGENT' },
  });

  if (!existingAgent) {
    const agentPassword = await bcrypt.hash('Agent@1234!', 12);
    const agent = await prisma.user.create({
      data: {
        fullName: 'Jane Wanjiru (Demo Agent)',
        email: 'agent@homesphere.co.ke',
        phone: '+254712345678',
        password: agentPassword,
        role: 'AGENT',
        isVerified: true,
        bio: 'Premium property specialist based in Nairobi. 8+ years of experience in luxury residential and commercial real estate.',
      },
    });
    console.log(`🏠 Demo agent created: ${agent.email} / Agent@1234!`);
  } else {
    console.log(`✅ Agent already exists: ${existingAgent.email}`);
  }

  await prisma.$disconnect();
  console.log('\n✅ Seed complete.');
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
