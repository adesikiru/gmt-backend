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
      console.log('✅ Super Admin created: admin@gmt.ng / Admin@GMT2026');
    } else {
      console.log('ℹ️  Super Admin already exists');
    }
  }

  console.log('🎉 Seeding complete!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
