import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const OGUN_LGAS = [
  { name: 'Abeokuta North', wards: ['Ago Ika', 'Ake', 'Igbore', 'Ikereku', 'Kemta I', 'Kemta II', 'Kobinu', 'Lafenwa', 'Olomore', 'Totoro'] },
  { name: 'Abeokuta South', wards: ['Adatan', 'Ago Oko', 'Elega', 'Ibara', 'Ibara Orile', 'Ikija', 'Ilugun', 'Isale Igbehin', 'Oke Ilewo', 'Panseke'] },
  { name: 'Ado-Odo/Ota', wards: ['Agbara I', 'Agbara II', 'Ilogbo', 'Ota I', 'Ota II', 'Ota III', 'Owode', 'Sango I', 'Sango II', 'Sango III'] },
  { name: 'Ewekoro', wards: ['Arigbajo', 'Ewekoro I', 'Ewekoro II', 'Itori I', 'Itori II', 'Makun', 'Onidundu', 'Wasimi'] },
  { name: 'Ifo', wards: ['Coker', 'Ibogun', 'Ifo I', 'Ifo II', 'Ifo III', 'Ojuore', 'Oke Aro', 'Toluwalaje'] },
  { name: 'Ijebu East', wards: ['Atan', 'Ibonwon', 'Ilaporu', 'Ode Lemo', 'Oru', 'Oru Ijebu', 'Ijebu East'] },
  { name: 'Ijebu North', wards: ['Ago Iwoye I', 'Ago Iwoye II', 'Ijebu Igbo I', 'Ijebu Igbo II', 'Japara', 'Mamu', 'Ode Remo'] },
  { name: 'Ijebu North East', wards: ['Atan Ota', 'Ibiade', 'Ijebu North East I', 'Ijebu North East II'] },
  { name: 'Ijebu Ode', wards: ['Ago Oniworo', 'Igbeba', 'Ijebu Ode I', 'Ijebu Ode II', 'Ijebu Ode III', 'Itoro', 'Ojudo'] },
  { name: 'Ikenne', wards: ['Ilishan I', 'Ilishan II', 'Ipara', 'Sagamu I', 'Sagamu II', 'Sagamu III'] },
  { name: 'Imeko Afon', wards: ['Afon', 'Imeko I', 'Imeko II', 'Imeko III'] },
  { name: 'Ipokia', wards: ['Badagry', 'Idiroko', 'Ipokia I', 'Ipokia II', 'Oja Odan'] },
  { name: 'Obafemi Owode', wards: ['Funaab', 'Ibogun', 'Obafemi I', 'Obafemi II', 'Owode I', 'Owode II'] },
  { name: 'Odeda', wards: ['Alabata', 'Olodo', 'Odeda I', 'Odeda II'] },
  { name: 'Odogbolu', wards: ['Ibiyabo', 'Ilese', 'Odogbolu I', 'Odogbolu II', 'Ogere'] },
  { name: 'Ogun Waterside', wards: ['Abigi', 'Erohwa', 'Ogun Waterside I', 'Ogun Waterside II'] },
  { name: 'Remo North', wards: ['Akaka', 'Isara', 'Remo North I', 'Remo North II', 'Wasinmi'] },
  { name: 'Sagamu', wards: ['Makun', 'Ogun', 'Sagamu I', 'Sagamu II', 'Sagamu III', 'Sagamu IV'] },
  { name: 'Shagamu', wards: ['Shagamu I', 'Shagamu II', 'Shagamu III', 'Shagamu IV'] },
  { name: 'Yewa North', wards: ['Ayetoro', 'Imala', 'Igbogila', 'Ilaro', 'Yewa North I', 'Yewa North II'] },
];

const PERMISSIONS = [
  { name: 'members.read', displayName: 'Read Members', module: 'members' },
  { name: 'members.create', displayName: 'Create Members', module: 'members' },
  { name: 'members.update', displayName: 'Update Members', module: 'members' },
  { name: 'members.verify', displayName: 'Verify Members', module: 'members' },
  { name: 'members.reject', displayName: 'Reject Members', module: 'members' },
  { name: 'members.suspend', displayName: 'Suspend Members', module: 'members' },
  { name: 'states.read', displayName: 'Read States', module: 'organization' },
  { name: 'states.create', displayName: 'Create States', module: 'organization' },
  { name: 'states.update', displayName: 'Update States', module: 'organization' },
  { name: 'lgas.read', displayName: 'Read LGAs', module: 'organization' },
  { name: 'lgas.create', displayName: 'Create LGAs', module: 'organization' },
  { name: 'lgas.update', displayName: 'Update LGAs', module: 'organization' },
  { name: 'wards.read', displayName: 'Read Wards', module: 'organization' },
  { name: 'wards.create', displayName: 'Create Wards', module: 'organization' },
  { name: 'wards.update', displayName: 'Update Wards', module: 'organization' },
  { name: 'events.read', displayName: 'Read Events', module: 'events' },
  { name: 'events.create', displayName: 'Create Events', module: 'events' },
  { name: 'events.update', displayName: 'Update Events', module: 'events' },
  { name: 'events.delete', displayName: 'Delete Events', module: 'events' },
  { name: 'news.read', displayName: 'Read News', module: 'news' },
  { name: 'news.create', displayName: 'Create News', module: 'news' },
  { name: 'news.update', displayName: 'Update News', module: 'news' },
  { name: 'news.publish', displayName: 'Publish News', module: 'news' },
  { name: 'announcements.read', displayName: 'Read Announcements', module: 'announcements' },
  { name: 'announcements.create', displayName: 'Create Announcements', module: 'announcements' },
  { name: 'announcements.update', displayName: 'Update Announcements', module: 'announcements' },
  { name: 'auditLogs.read', displayName: 'Read Audit Logs', module: 'audit' },
  { name: 'administrators.manage', displayName: 'Manage Administrators', module: 'admins' },
];

const ROLES = [
  { name: 'SUPER_ADMIN', displayName: 'Super Administrator', description: 'Full platform control', permissions: PERMISSIONS.map(p => p.name) },
  { name: 'STATE_ADMIN', displayName: 'State Administrator', description: 'Manages a state', permissions: ['members.read', 'members.update', 'members.verify', 'members.reject', 'members.suspend', 'lgas.read', 'wards.read', 'events.read', 'events.create', 'events.update', 'news.read', 'news.create', 'news.publish', 'announcements.read', 'announcements.create', 'auditLogs.read'] },
  { name: 'LGA_ADMIN', displayName: 'LGA Administrator', description: 'Manages an LGA', permissions: ['members.read', 'members.verify', 'members.reject', 'members.suspend', 'wards.read', 'events.read', 'news.read', 'announcements.read'] },
  { name: 'WARD_ADMIN', displayName: 'Ward Administrator', description: 'Manages a ward', permissions: ['members.read', 'events.read', 'news.read', 'announcements.read'] },
  { name: 'MEMBER', displayName: 'Member', description: 'Regular GMT member', permissions: [] },
];

async function main() {
  console.log('🌱 Seeding database...');

  // Seed permissions
  for (const perm of PERMISSIONS) {
    await prisma.permission.upsert({ where: { name: perm.name }, update: {}, create: { ...perm, description: perm.displayName } });
  }
  console.log(`✅ ${PERMISSIONS.length} permissions seeded`);

  // Seed roles
  for (const role of ROLES) {
    const { permissions, ...roleData } = role;
    const createdRole = await prisma.role.upsert({
      where: { name: role.name }, update: {}, create: { ...roleData, isSystem: true },
    });
    // Assign permissions to role
    for (const permName of permissions) {
      const perm = await prisma.permission.findUnique({ where: { name: permName } });
      if (perm) {
        await prisma.rolePermission.upsert({
          where: { roleId_permissionId: { roleId: createdRole.id, permissionId: perm.id } },
          update: {},
          create: { roleId: createdRole.id, permissionId: perm.id },
        });
      }
    }
  }
  console.log(`✅ ${ROLES.length} roles seeded`);

  // Seed Ogun State
  const ogunState = await prisma.state.upsert({
    where: { code: 'OG' },
    update: {},
    create: { name: 'Ogun State', code: 'OG' },
  });
  console.log(`✅ Ogun State seeded: ${ogunState.id}`);

  // Seed LGAs and Wards
  for (const lgaData of OGUN_LGAS) {
    const lga = await prisma.lGA.upsert({
      where: { name_stateId: { name: lgaData.name, stateId: ogunState.id } },
      update: {},
      create: { name: lgaData.name, stateId: ogunState.id },
    });
    for (let wIdx = 0; wIdx < lgaData.wards.length; wIdx++) {
      const wardName = lgaData.wards[wIdx];
      const ward = await prisma.ward.upsert({
        where: { name_lgaId: { name: wardName, lgaId: lga.id } },
        update: {},
        create: { name: wardName, lgaId: lga.id },
      });

      const puTemplates = [
        { name: `${wardName} Primary School I`, code: `27/OG/${String(wIdx + 1).padStart(2, '0')}/001` },
        { name: `${wardName} Town Hall / Civic Centre`, code: `27/OG/${String(wIdx + 1).padStart(2, '0')}/002` },
        { name: `${wardName} Health Centre Dispensary`, code: `27/OG/${String(wIdx + 1).padStart(2, '0')}/003` },
        { name: `${wardName} Market Square Open Space`, code: `27/OG/${String(wIdx + 1).padStart(2, '0')}/004` },
      ];

      for (const pu of puTemplates) {
        await prisma.pollingUnit.upsert({
          where: { name_wardId: { name: pu.name, wardId: ward.id } },
          update: {},
          create: { name: pu.name, code: pu.code, wardId: ward.id },
        });
      }
    }
  }
  console.log(`✅ ${OGUN_LGAS.length} LGAs, wards, and polling units seeded`);

  // Seed Super Admin
  const superAdminRole = await prisma.role.findUnique({ where: { name: 'SUPER_ADMIN' } });
  let adminUserId = '';
  if (superAdminRole) {
    const existingAdmin = await prisma.user.findUnique({ where: { email: 'admin@gmt.ng' } });
    if (!existingAdmin) {
      const passwordHash = await bcrypt.hash('Admin@GMT2026', 12);
      const adminUser = await prisma.user.create({
        data: {
          email: 'admin@gmt.ng',
          passwordHash,
          isEmailVerified: true,
          memberProfile: {
            create: { firstName: 'Super', lastName: 'Admin' },
          },
        },
      });
      await prisma.admin.create({
        data: { userId: adminUser.id, roleId: superAdminRole.id },
      });
      adminUserId = adminUser.id;
      console.log('✅ Super Admin created: admin@gmt.ng / Admin@GMT2026');
    } else {
      adminUserId = existingAdmin.id;
      console.log('ℹ️  Super Admin already exists');
    }
  }

  // Seed Events
  const SEED_EVENTS = [
    {
      title: 'Ogun Central Grassroots Leadership Townhall',
      description: 'Strategic gathering of ward mobilizers and grassroots executives to discuss development initiatives, voter sensitization, and community empowerment across Abeokuta and surrounding constituencies.',
      location: 'June 12 Cultural Centre, Kuto, Abeokuta',
      startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // +14 days
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
      status: 'PUBLISHED' as const,
      stateId: ogunState.id,
      createdById: adminUserId,
    },
    {
      title: 'Ward Coordinators Digital Verification Workshop',
      description: 'Comprehensive technical workshop training ward administrators and polling unit leads on verifying voter records, NIN validation, and registering new grassroots members.',
      location: 'Ijebu-Ode Town Hall, Ijebu-Ode',
      startDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // +21 days
      endDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000),
      status: 'PUBLISHED' as const,
      stateId: ogunState.id,
      createdById: adminUserId,
    },
    {
      title: 'Grassroots Farmers & SME Cooperative Forum',
      description: 'Distribution of agricultural inputs, high-yield seedlings, fertilizer vouchers, and SME seed grants to rural cooperative members across Ogun State.',
      location: 'Sango-Ota Community Centre, Ota',
      startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 days
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
      status: 'PUBLISHED' as const,
      stateId: ogunState.id,
      createdById: adminUserId,
    },
    {
      title: 'Ogun West Youth Innovation & Leadership Summit',
      description: 'Interactive symposium connecting young tech innovators, artisans, and student leaders with mentorship, startup grants, and digital skill vouchers.',
      location: 'Ilaro Civic Centre, Ilaro',
      startDate: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000), // +40 days
      endDate: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000),
      status: 'PUBLISHED' as const,
      stateId: ogunState.id,
      createdById: adminUserId,
    },
  ];

  for (const evt of SEED_EVENTS) {
    const existing = await prisma.event.findFirst({ where: { title: evt.title } });
    if (!existing) {
      await prisma.event.create({ data: evt });
    }
  }
  console.log(`✅ ${SEED_EVENTS.length} Events seeded`);

  // Seed Empowerments
  const SEED_EMPOWERMENTS = [
    {
      title: 'Youth Tech & Digital Skills Initiative',
      description: 'Providing subsidized laptops, intensive digital marketing, web engineering training, and internet stipends for 2,000 ambitious youth across Ogun State wards.',
      category: 'Youth & Tech',
      statOrBudget: '2,000+ Youths Targeted',
      targetAudience: '20 LGAs in Ogun State',
      icon: '💻',
      status: 'PUBLISHED' as const,
      stateId: ogunState.id,
      createdById: adminUserId,
    },
    {
      title: 'Market Women & SME Support Grants',
      description: 'Direct micro-grants and point-of-sale equipment provided to trade cooperatives to expand local businesses and support market women.',
      category: 'SME Support',
      statOrBudget: '₦50M Micro-Fund',
      targetAudience: 'Market Cooperatives in Ogun',
      icon: '🏪',
      status: 'PUBLISHED' as const,
      stateId: ogunState.id,
      createdById: adminUserId,
    },
    {
      title: 'Grassroots Agri-Seedling Distribution',
      description: 'High-yield hybrid seeds, eco-friendly fertilizers, and farming implements distributed directly to rural farmer clusters.',
      category: 'Agriculture',
      statOrBudget: '20 LGAs Covered',
      targetAudience: 'Smallholder Farmers',
      icon: '🌾',
      status: 'PUBLISHED' as const,
      stateId: ogunState.id,
      createdById: adminUserId,
    },
    {
      title: 'Community Healthcare & Wellness Outreach',
      description: 'Free hypertension screening, blood sugar checks, distribution of prescription reading glasses, and health kits at ward centres.',
      category: 'Healthcare',
      statOrBudget: '10,000 Beneficiaries',
      targetAudience: 'Ward Community Centres',
      icon: '🩺',
      status: 'PUBLISHED' as const,
      stateId: ogunState.id,
      createdById: adminUserId,
    },
    {
      title: 'Artisan & Vocational Apprenticeship Toolkits',
      description: 'Providing certified apprentices with modern equipment, toolboxes, and starter funds for mechanics, fashion designers, and electricians.',
      category: 'Education & Skills',
      statOrBudget: '1,500 Artisans Equipped',
      targetAudience: 'Young Vocational Apprentices',
      icon: '⚙️',
      status: 'PUBLISHED' as const,
      stateId: ogunState.id,
      createdById: adminUserId,
    },
  ];

  for (const emp of SEED_EMPOWERMENTS) {
    const existing = await prisma.empowerment.findFirst({ where: { title: emp.title } });
    if (!existing) {
      await prisma.empowerment.create({ data: emp });
    }
  }
  console.log(`✅ ${SEED_EMPOWERMENTS.length} Empowerment initiatives seeded`);

  // Seed Media & Press Releases (News)
  const SEED_NEWS = [
    {
      title: 'GMT Ogun State Digital Grassroots Portal Officially Unveiled',
      slug: 'gmt-ogun-state-digital-grassroots-portal-officially-unveiled',
      excerpt: 'Grassroots Movement for Tinubu activates full digital membership registration across all 20 LGAs and 236 Wards in Ogun State.',
      content: 'The Grassroots Movement for Tinubu (GMT) has officially launched its state-of-the-art digital membership registration and mobilization portal in Ogun State. The platform enables citizens across all 20 Local Government Areas and 236 Electoral Wards to verify their voter status, register as active members, and connect directly with ward coordinators. Speaking at the launch in Abeokuta, leaders emphasized that this digital initiative brings transparent, accountable grassroots organizing directly to the community level.',
      status: 'PUBLISHED' as const,
      publishedAt: new Date(),
      stateId: ogunState.id,
      createdById: adminUserId,
    },
    {
      title: 'Youth & Women Empowerment Tour Concludes in Abeokuta',
      slug: 'youth-women-empowerment-tour-concludes-in-abeokuta',
      excerpt: 'Over 1,200 micro-entrepreneurs received digital tools, vocational equipment, and business startup grants under the GMT umbrella.',
      content: 'The first phase of the GMT Grassroots Empowerment Tour concluded successfully in Abeokuta. More than 1,200 young innovators, traders, and cooperative members received practical business kits, agricultural vouchers, and startup grants. Ward leaders praised the direct delivery mechanism that ensures support reaches real grassroots citizens at the ward level.',
      status: 'PUBLISHED' as const,
      publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      stateId: ogunState.id,
      createdById: adminUserId,
    },
    {
      title: 'Ward-by-Ward Voter Sensitization & Verification Drive Commences',
      slug: 'ward-by-ward-voter-sensitization-verification-drive-commences',
      excerpt: 'Ensuring all citizens confirm their 20-digit Voter Identification Numbers (VIN) and polling units ahead of upcoming elections.',
      content: 'A state-wide voter awareness campaign has kicked off across Ogun State, spearheaded by GMT ward executives. The campaign helps registered voters confirm their 20-digit Voter Identification Numbers (VIN), verify their designated polling units, and assists eligible non-voters in learning about the ongoing voter registration processes.',
      status: 'PUBLISHED' as const,
      publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      stateId: ogunState.id,
      createdById: adminUserId,
    },
    {
      title: 'GMT Agricultural Cooperative Cluster Launched to Boost Food Security',
      slug: 'gmt-agricultural-cooperative-cluster-launched',
      excerpt: 'Farming clusters across Yewa, Remo, and Ijebu receive subsidized fertilizers and hybrid seedlings.',
      content: 'In line with national Renewed Hope agricultural goals, GMT has inaugurated the Ogun State Farmers Empowerment Cluster. Over 50 agricultural cooperative societies across Yewa North, Remo North, and Ijebu East have been onboarded to receive subsidized inputs and mechanization support.',
      status: 'PUBLISHED' as const,
      publishedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      stateId: ogunState.id,
      createdById: adminUserId,
    },
  ];

  for (const n of SEED_NEWS) {
    const existing = await prisma.news.findUnique({ where: { slug: n.slug } });
    if (!existing) {
      await prisma.news.create({ data: n });
    }
  }
  console.log(`✅ ${SEED_NEWS.length} News & Press releases seeded`);

  console.log('🎉 Seeding complete! Database structure, admin account, events, empowerments, and media releases are ready.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
