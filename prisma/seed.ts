import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // 1. Create Default Tenant
  const tenant = await prisma.tenant.upsert({
    where: { name: 'Default Tenant' },
    update: {},
    create: {
      name: 'Default Tenant',
      subdomain: 'default',
    },
  })
  console.log(`Created/Updated Tenant: ${tenant.name} (${tenant.id})`)

  // 2. Create System Admin User
  const hashedPassword = await bcrypt.hash('admin123', 10)
  const user = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {
      tenantId: tenant.id,
      role: 'SYSTEM_ADMIN',
    },
    create: {
      email: 'admin@example.com',
      name: 'System Admin',
      password: hashedPassword,
      role: 'SYSTEM_ADMIN',
      tenantId: tenant.id,
    },
  })
  console.log(`Created/Updated User: ${user.email} (${user.id})`)

  // 3. Create Default Sequences
  await prisma.invoiceSequence.upsert({
    where: { 
      tenantId_id: {
        id: 'default',
        tenantId: tenant.id
      }
    },
    update: {},
    create: {
      id: 'default',
      tenantId: tenant.id,
      prefix: 'INV-',
      current: 1
    }
  })
  
  await prisma.invoiceSequence.upsert({
    where: { 
      tenantId_id: {
        id: 'quotation',
        tenantId: tenant.id
      }
    },
    update: {},
    create: {
      id: 'quotation',
      tenantId: tenant.id,
      prefix: 'EST-',
      current: 1
    }
  })

  console.log('Seeding completed.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
export {}
