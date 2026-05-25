import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function seedUsers() {
  // Create admin user
  await prisma.user.upsert({
    where: { email: 'admin@davinci.ai' },
    update: {},
    create: {
      id: 'admin-001',
      email: 'admin@davinci.ai',
      name: 'Admin User',
      password: 'admin123',
      role: 'admin',
      plan: 'enterprise',
      wordsUsed: 12450,
      imagesUsed: 23,
      chatMessages: 156,
      codeGenerated: 45,
      audioMinutes: 12.5,
      isActive: true,
    }
  })
  
  // Create regular user
  await prisma.user.upsert({
    where: { email: 'user@davinci.ai' },
    update: {},
    create: {
      id: 'user-001',
      email: 'user@davinci.ai',
      name: 'Alex Johnson',
      password: 'user123',
      role: 'user',
      plan: 'professional',
      wordsUsed: 8920,
      imagesUsed: 15,
      chatMessages: 89,
      codeGenerated: 23,
      audioMinutes: 5.2,
      isActive: true,
    }
  })
  
  // Create demo user that APIs use
  await prisma.user.upsert({
    where: { email: 'demo@davinci.ai' },
    update: {},
    create: {
      id: 'demo-user-001',
      email: 'demo@davinci.ai',
      name: 'Demo User',
      password: 'demo123',
      role: 'user',
      plan: 'professional',
      wordsUsed: 5400,
      imagesUsed: 8,
      chatMessages: 45,
      codeGenerated: 12,
      audioMinutes: 3.0,
      isActive: true,
    }
  })
  
  // Create some extra users for admin panel
  const extras = [
    { id: 'user-002', email: 'sarah@example.com', name: 'Sarah Williams', role: 'user', plan: 'starter', wordsUsed: 3200, imagesUsed: 5, chatMessages: 20, codeGenerated: 3, audioMinutes: 0 },
    { id: 'user-003', email: 'mike@example.com', name: 'Mike Chen', role: 'user', plan: 'free', wordsUsed: 800, imagesUsed: 2, chatMessages: 5, codeGenerated: 0, audioMinutes: 0 },
    { id: 'user-004', email: 'emma@example.com', name: 'Emma Davis', role: 'user', plan: 'professional', wordsUsed: 15600, imagesUsed: 32, chatMessages: 120, codeGenerated: 67, audioMinutes: 8.5 },
    { id: 'user-005', email: 'james@example.com', name: 'James Wilson', role: 'user', plan: 'enterprise', wordsUsed: 45000, imagesUsed: 100, chatMessages: 300, codeGenerated: 150, audioMinutes: 25.0 },
    { id: 'user-006', email: 'lisa@example.com', name: 'Lisa Park', role: 'user', plan: 'starter', wordsUsed: 6800, imagesUsed: 12, chatMessages: 55, codeGenerated: 8, audioMinutes: 2.0 },
    { id: 'user-007', email: 'david@example.com', name: 'David Brown', role: 'user', plan: 'free', wordsUsed: 200, imagesUsed: 0, chatMessages: 3, codeGenerated: 0, audioMinutes: 0 },
  ]
  
  for (const extra of extras) {
    await prisma.user.upsert({
      where: { email: extra.email },
      update: {},
      create: { ...extra, password: 'password123', isActive: true }
    })
  }
  
  console.log('Seeded users:')
  console.log('  Admin: admin@davinci.ai / admin123')
  console.log('  User: user@davinci.ai / user123')
  console.log('  Demo: demo@davinci.ai / demo123')
  console.log('  6 additional test users')
  
  await prisma.$disconnect()
}

seedUsers()
