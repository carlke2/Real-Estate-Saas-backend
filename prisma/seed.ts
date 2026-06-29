import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import PrismaService from '@prisma/client';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const { Pool } = pg;
const { PrismaClient } = PrismaService as any;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding HomeSphere database...');

  // ------------------------------------------------------------------
  // 1. USERS - Admin, Agents, Normal User
  // ------------------------------------------------------------------
  const commonPassword = process.env.SEED_COMMON_PASSWORD || 'Password@123';
  const hashedPassword = await bcrypt.hash(commonPassword, 10);

  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@homesphere.co.ke';
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      fullName: 'HomeSphere Admin',
      phone: '0700000001',
      password: hashedPassword,
      role: 'ADMIN',
      isVerified: true,
      isAgentVerified: true,
    },
  });

  const agent1Email = process.env.SEED_AGENT_1_EMAIL || 'anya.muthoni@homesphere.co.ke';
  const agentAnya = await prisma.user.upsert({
    where: { email: agent1Email },
    update: {},
    create: {
      email: agent1Email,
      fullName: 'Anya Muthoni',
      phone: '0711222333',
      password: hashedPassword,
      role: 'AGENT',
      isVerified: true,
      isAgentVerified: true,
      bio: 'Top-rated agent specializing in Nairobi and Kiambu luxury residential properties.',
    },
  });

  const agent2Email = process.env.SEED_AGENT_2_EMAIL || 'david.kamau@homesphere.co.ke';
  const agentKamau = await prisma.user.upsert({
    where: { email: agent2Email },
    update: {},
    create: {
      email: agent2Email,
      fullName: 'David Kamau',
      phone: '0722333444',
      password: hashedPassword,
      role: 'AGENT',
      isVerified: true,
      isAgentVerified: true,
      bio: 'Expert in Mombasa beachfront, coastal, and commercial properties.',
    },
  });

  const userEmail = process.env.SEED_DEFAULT_USER_EMAIL || 'wanjiku@example.com';
  const userWanjiku = await prisma.user.upsert({
    where: { email: userEmail },
    update: {},
    create: {
      email: userEmail,
      fullName: 'Grace Wanjiku',
      phone: '0799888777',
      password: hashedPassword,
      role: 'USER',
      isVerified: true,
    },
  });

  console.log('✅ Users seeded');

  // ------------------------------------------------------------------
  // 2. PROPERTIES — Nairobi, Mombasa, Kisumu, Nakuru, Eldoret
  // ------------------------------------------------------------------
  const listings = [
    // -------- NAIROBI --------
    {
      title: 'Luxury 4BR Villa — Karen, Nairobi',
      description: 'A stunning executive villa nestled in the lush greenery of Karen. Features soaring ceilings, a gourmet kitchen, and manicured gardens with a heated infinity pool. The master suite offers panoramic views of the Ngong Hills. This is Nairobi living at its finest.',
      price: 48_000_000,
      location: 'Karen',
      county: 'Nairobi',
      address: 'Karen Road, off Ngong Road',
      bedrooms: 4,
      bathrooms: 4,
      furnishing: 'FULLY_FURNISHED',
      propertyType: 'Villa',
      listingType: 'SALE' as const,
      status: 'VERIFIED' as const,
      isFeatured: true,
      isAvailable: true,
      viewCount: 412,
      area: 6500,
      latitude: -1.3200,
      longitude: 36.7100,
      createdById: agentAnya.id,
      images: [
        'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800',
        'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
      ],
    },
    {
      title: 'Modern 2BR Apartment — Westlands',
      description: 'Sleek, fully serviced apartment in a boutique development in the heart of Westlands. Perfect for young professionals. Walking distance to Westgate, Sarit Centre, and top restaurants. High-speed fibre, 24/7 security with concierge.',
      price: 85_000,
      location: 'Westlands',
      county: 'Nairobi',
      address: 'Westlands Road, Westlands',
      bedrooms: 2,
      bathrooms: 2,
      furnishing: 'FULLY_FURNISHED',
      propertyType: 'Apartment',
      listingType: 'RENT' as const,
      status: 'VERIFIED' as const,
      isFeatured: false,
      isAvailable: true,
      viewCount: 276,
      area: 1100,
      latitude: -1.2641,
      longitude: 36.8057,
      createdById: agentAnya.id,
      images: [
        'https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=800',
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
      ],
    },
    {
      title: 'Prime Commercial Office Space — Upper Hill',
      description: 'Grade-A office space available in a newly completed tower in the Upper Hill financial district. Full floor available with stunning city views, open plan layout, raised floors, and central A/C. Ideal for blue-chip corporates and regional headquarters.',
      price: 180_000,
      location: 'Upper Hill',
      county: 'Nairobi',
      address: 'Upper Hill Road, Upper Hill',
      bedrooms: 0,
      bathrooms: 6,
      furnishing: 'UNFURNISHED',
      propertyType: 'Commercial',
      listingType: 'RENT' as const,
      status: 'VERIFIED' as const,
      isFeatured: true,
      isAvailable: true,
      viewCount: 188,
      area: 4200,
      latitude: -1.2992,
      longitude: 36.8122,
      createdById: agentKamau.id,
      images: [
        'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800',
        'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800',
      ],
    },
    {
      title: 'Penthouse 3BR — Kilimani',
      description: 'Exclusive top-floor penthouse in one of Kilimani\'s most prestigious addresses. Double-volume living areas, a private rooftop terrace with Jacuzzi, and premium European finishes throughout. Three secure parking bays included.',
      price: 38_500_000,
      location: 'Kilimani',
      county: 'Nairobi',
      address: 'Kindaruma Road, Kilimani',
      bedrooms: 3,
      bathrooms: 3,
      furnishing: 'SEMI_FURNISHED',
      propertyType: 'Apartment',
      listingType: 'SALE' as const,
      status: 'VERIFIED' as const,
      isFeatured: true,
      isAvailable: true,
      viewCount: 340,
      area: 3200,
      latitude: -1.2913,
      longitude: 36.7866,
      createdById: agentAnya.id,
      images: [
        'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800',
      ],
    },
    {
      title: '40-Acre Farm Land — Limuru',
      description: 'Rare opportunity to acquire 40 acres of prime, fully arable agricultural land in the cool highlands of Limuru. Red volcanic soil, year-round water from seasonal streams, and existing farm structures. Clear title deed. Ideal for tea, flowers, or mixed horticulture.',
      price: 56_000_000,
      location: 'Limuru',
      county: 'Kiambu',
      address: 'Limuru-Kinale Road, Limuru',
      bedrooms: 0,
      bathrooms: 0,
      furnishing: null,
      propertyType: 'Land',
      listingType: 'SALE' as const,
      status: 'VERIFIED' as const,
      isFeatured: false,
      isAvailable: true,
      viewCount: 98,
      area: 1_742_400,
      latitude: -1.1040,
      longitude: 36.6468,
      createdById: agentAnya.id,
      images: [
        'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800',
      ],
    },
    // -------- MOMBASA --------
    {
      title: 'Beachfront 5BR Residence — Nyali',
      description: 'Spectacular beachfront home in exclusive Nyali. Direct private access to a pristine stretch of white sand. The property features a large pool, tropical gardens, and a separate guest cottage. Your own slice of Kenyan paradise.',
      price: 95_000_000,
      location: 'Nyali',
      county: 'Mombasa',
      address: 'Nyali Beach Road, Nyali, Mombasa',
      bedrooms: 5,
      bathrooms: 5,
      furnishing: 'FULLY_FURNISHED',
      propertyType: 'Villa',
      listingType: 'SALE' as const,
      status: 'VERIFIED' as const,
      isFeatured: true,
      isAvailable: true,
      viewCount: 561,
      area: 8000,
      latitude: -4.0240,
      longitude: 39.7183,
      createdById: agentKamau.id,
      images: [
        'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800',
        'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800',
      ],
    },
    {
      title: 'Furnished Studio — Bamburi Beach',
      description: 'Cozy, modern studio apartment just 200m from Bamburi Beach. Perfect for a vacation rental or short-term let. Comes with a kitchenette, high-speed Wi-Fi, and access to a shared swimming pool. Great rental yields.',
      price: 45_000,
      location: 'Bamburi',
      county: 'Mombasa',
      address: 'Bamburi Beach Road, Bamburi, Mombasa',
      bedrooms: 1,
      bathrooms: 1,
      furnishing: 'FULLY_FURNISHED',
      propertyType: 'Apartment',
      listingType: 'RENT' as const,
      status: 'VERIFIED' as const,
      isFeatured: false,
      isAvailable: true,
      viewCount: 203,
      area: 450,
      latitude: -3.9701,
      longitude: 39.7154,
      createdById: agentKamau.id,
      images: [
        'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800',
      ],
    },
    // -------- KISUMU --------
    {
      title: 'Lakeside 3BR Home — Milimani, Kisumu',
      description: 'Tranquil, well-maintained three-bedroom home on a large plot in the prestigious Milimani estate of Kisumu. Enjoy peaceful lake breezes and partial views of Lake Victoria from the upper veranda. Mature gardens, borehole, and standby generator.',
      price: 18_500_000,
      location: 'Milimani',
      county: 'Kisumu',
      address: 'Milimani Road, Kisumu',
      bedrooms: 3,
      bathrooms: 2,
      furnishing: 'SEMI_FURNISHED',
      propertyType: 'Bungalow',
      listingType: 'SALE' as const,
      status: 'VERIFIED' as const,
      isFeatured: false,
      isAvailable: true,
      viewCount: 134,
      area: 2800,
      latitude: -0.0984,
      longitude: 34.7479,
      createdById: agentAnya.id,
      images: [
        'https://images.unsplash.com/photo-1571939228382-b2f2b585ce15?w=800',
        'https://images.unsplash.com/photo-1567767292278-a4f21aa2d36e?w=800',
      ],
    },
    // -------- NAKURU --------
    {
      title: 'Executive 4BR Townhouse — Flamingo Estate, Nakuru',
      description: 'Elegant townhouse in the sought-after Flamingo gated estate. Modern architecture with smart home wiring, solar hot water, and a large garage. Close to good schools, hospitals, and the Nakuru CBD. Ideal for a growing family.',
      price: 16_800_000,
      location: 'Flamingo',
      county: 'Nakuru',
      address: 'Flamingo Road, Nakuru',
      bedrooms: 4,
      bathrooms: 3,
      furnishing: 'UNFURNISHED',
      propertyType: 'Townhouse',
      listingType: 'SALE' as const,
      status: 'VERIFIED' as const,
      isFeatured: false,
      isAvailable: true,
      viewCount: 87,
      area: 3100,
      latitude: -0.2797,
      longitude: 36.0665,
      createdById: agentAnya.id,
      images: [
        'https://images.unsplash.com/photo-1628744448839-f09a94772886?w=800',
      ],
    },
    // -------- ELDORET --------
    {
      title: '2BR Apartment — Eldoret Town Centre',
      description: 'Affordable, well-located apartment in the heart of Eldoret. Ideal for students, young professionals, or as a rental investment. Walking distance to the main matatu terminus, shops, and the market. Good security.',
      price: 35_000,
      location: 'Eldoret Town',
      county: 'Uasin Gishu',
      address: 'Uganda Road, Eldoret',
      bedrooms: 2,
      bathrooms: 1,
      furnishing: 'UNFURNISHED',
      propertyType: 'Apartment',
      listingType: 'RENT' as const,
      status: 'VERIFIED' as const,
      isFeatured: false,
      isAvailable: true,
      viewCount: 55,
      area: 900,
      latitude: 0.5143,
      longitude: 35.2698,
      createdById: agentKamau.id,
      images: [
        'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800',
      ],
    },
  ];

  for (const listing of listings) {
    const { images, ...data } = listing;

    // Check if already exists
    const existing = await prisma.property.findFirst({ where: { title: data.title } });
    if (existing) {
      console.log(`  ⏭  Skipping "${data.title}" (already exists)`);
      continue;
    }

    const property = await prisma.property.create({ data });

    // Create images
    for (let i = 0; i < images.length; i++) {
      await prisma.propertyImage.create({
        data: {
          propertyId: property.id,
          imageUrl: images[i],
          isPrimary: i === 0,
        },
      });
    }

    console.log(`  🏠 Created: ${data.title}`);
  }

  console.log('\n✅ All properties seeded!');
  console.log('\n📝 Seed configuration complete (Credentials in .env)\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
