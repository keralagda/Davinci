import 'dotenv/config'
import { createClient } from '@libsql/client'

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
})

async function main() {
  console.log('Seeding users and subscriptions to Turso...')

  await client.execute(
    `INSERT OR IGNORE INTO users (id, email, name, password, role, plan, wordsUsed, imagesUsed, chatMessages, codeGenerated, audioMinutes, isActive)
     VALUES ('demo-user-001', 'demo@davinci.ai', 'Demo User', 'demo123', 'user', 'professional', 5400, 8, 45, 12, 3.0, 1)`
  )
  console.log('  ✓ demo user')

  await client.execute(
    `INSERT OR IGNORE INTO users (id, email, name, password, role, plan, wordsUsed, imagesUsed, chatMessages, codeGenerated, audioMinutes, isActive)
     VALUES ('admin-001', 'admin@davinci.ai', 'Admin User', 'admin123', 'admin', 'enterprise', 12450, 23, 156, 45, 12.5, 1)`
  )
  console.log('  ✓ admin user')

  await client.execute(
    `INSERT OR IGNORE INTO subscriptions (id, userId, planType, status, wordsLimit, imagesLimit, chatMessagesLimit, codeLimit, audioMinutesLimit, startDate, amount, currency)
     VALUES ('sub-demo', 'demo-user-001', 'professional', 'active', 100000, 200, 0, 0, 120, datetime('now'), 29.99, 'USD')`
  )
  console.log('  ✓ demo subscription')

  await client.execute(
    `INSERT OR IGNORE INTO subscriptions (id, userId, planType, status, wordsLimit, imagesLimit, chatMessagesLimit, codeLimit, audioMinutesLimit, startDate, amount, currency)
     VALUES ('sub-admin', 'admin-001', 'enterprise', 'active', 0, 0, 0, 0, 0, datetime('now'), 99.99, 'USD')`
  )
  console.log('  ✓ admin subscription')

  // Verify
  const users = await client.execute('SELECT id, email, role, plan FROM users')
  console.log('\nUsers in Turso:', users.rows)

  const plans = await client.execute('SELECT id, name, price FROM pricing_plans')
  console.log('Plans in Turso:', plans.rows)

  console.log('\n✅ Turso seeding complete!')
}

main().catch(console.error)
