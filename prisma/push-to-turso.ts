/**
 * Push schema and seed data to Turso database.
 * Run: npx tsx prisma/push-to-turso.ts
 */
import { createClient } from '@libsql/client'
import { readFileSync } from 'fs'
import { join } from 'path'

const tursoUrl = process.env.TURSO_DATABASE_URL
const tursoToken = process.env.TURSO_AUTH_TOKEN

if (!tursoUrl || !tursoToken) {
  console.error('❌ TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set')
  process.exit(1)
}

const client = createClient({ url: tursoUrl, authToken: tursoToken })

// SQL to create all tables (matching Prisma schema)
const createTablesSql = `
-- Auth tables
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  type TEXT NOT NULL,
  provider TEXT NOT NULL,
  providerAccountId TEXT NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at INTEGER,
  token_type TEXT,
  scope TEXT,
  id_token TEXT,
  session_state TEXT,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(provider, providerAccountId)
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  sessionToken TEXT NOT NULL UNIQUE,
  userId TEXT NOT NULL,
  expires DATETIME NOT NULL,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS verification_tokens (
  identifier TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires DATETIME NOT NULL,
  UNIQUE(identifier, token)
);

-- Users
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  emailVerified DATETIME,
  name TEXT,
  password TEXT,
  image TEXT,
  role TEXT NOT NULL DEFAULT 'user',
  plan TEXT NOT NULL DEFAULT 'free',
  wordsUsed INTEGER NOT NULL DEFAULT 0,
  imagesUsed INTEGER NOT NULL DEFAULT 0,
  chatMessages INTEGER NOT NULL DEFAULT 0,
  codeGenerated INTEGER NOT NULL DEFAULT 0,
  audioMinutes REAL NOT NULL DEFAULT 0,
  balance REAL NOT NULL DEFAULT 0,
  affiliateCode TEXT UNIQUE,
  referredBy TEXT,
  isActive INTEGER NOT NULL DEFAULT 1,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Template categories
CREATE TABLE IF NOT EXISTS template_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT,
  description TEXT,
  sortOrder INTEGER NOT NULL DEFAULT 0,
  isActive INTEGER NOT NULL DEFAULT 1,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Templates
CREATE TABLE IF NOT EXISTS templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  icon TEXT,
  prompt TEXT NOT NULL,
  fields TEXT NOT NULL,
  categoryId TEXT NOT NULL,
  outputType TEXT NOT NULL DEFAULT 'text',
  toneOptions TEXT,
  languageOptions TEXT,
  isPremium INTEGER NOT NULL DEFAULT 0,
  isFeatured INTEGER NOT NULL DEFAULT 0,
  sortOrder INTEGER NOT NULL DEFAULT 0,
  isActive INTEGER NOT NULL DEFAULT 1,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (categoryId) REFERENCES template_categories(id)
);

-- Conversations
CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  title TEXT NOT NULL,
  assistantType TEXT,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id)
);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  conversationId TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  model TEXT,
  tokens INTEGER,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversationId) REFERENCES conversations(id) ON DELETE CASCADE
);

-- Generated docs
CREATE TABLE IF NOT EXISTS generated_docs (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  templateId TEXT,
  title TEXT NOT NULL,
  input TEXT NOT NULL,
  output TEXT NOT NULL,
  wordsCount INTEGER,
  model TEXT,
  language TEXT,
  tone TEXT,
  isFavorite INTEGER NOT NULL DEFAULT 0,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id),
  FOREIGN KEY (templateId) REFERENCES templates(id)
);

-- Image generations
CREATE TABLE IF NOT EXISTS image_generations (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  prompt TEXT NOT NULL,
  negativePrompt TEXT,
  size TEXT NOT NULL DEFAULT '1024x1024',
  quality TEXT NOT NULL DEFAULT 'standard',
  style TEXT,
  model TEXT NOT NULL DEFAULT 'dall-e-3',
  imageUrl TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id)
);

-- Code generations
CREATE TABLE IF NOT EXISTS code_generations (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  prompt TEXT NOT NULL,
  language TEXT,
  code TEXT NOT NULL,
  explanation TEXT,
  model TEXT,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id)
);

-- Transcriptions
CREATE TABLE IF NOT EXISTS transcriptions (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  fileName TEXT NOT NULL,
  fileSize INTEGER,
  duration REAL,
  language TEXT,
  transcript TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id)
);

-- TTS generations
CREATE TABLE IF NOT EXISTS tts_generations (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  text TEXT NOT NULL,
  voice TEXT,
  language TEXT,
  speed REAL NOT NULL DEFAULT 1.0,
  audioUrl TEXT,
  duration REAL,
  status TEXT NOT NULL DEFAULT 'pending',
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id)
);

-- Favorites
CREATE TABLE IF NOT EXISTS favorites (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  itemType TEXT NOT NULL,
  itemId TEXT NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id),
  UNIQUE(userId, itemType, itemId)
);

-- Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  planType TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  wordsLimit INTEGER,
  imagesLimit INTEGER,
  chatMessagesLimit INTEGER,
  codeLimit INTEGER,
  audioMinutesLimit REAL,
  startDate DATETIME NOT NULL,
  endDate DATETIME,
  amount REAL,
  currency TEXT DEFAULT 'USD',
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id)
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  isRead INTEGER NOT NULL DEFAULT 0,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id)
);

-- Pricing plans
CREATE TABLE IF NOT EXISTS pricing_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  price REAL NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  interval TEXT NOT NULL DEFAULT 'monthly',
  wordsLimit INTEGER NOT NULL DEFAULT 0,
  imagesLimit INTEGER NOT NULL DEFAULT 0,
  chatMessagesLimit INTEGER NOT NULL DEFAULT 0,
  codeLimit INTEGER NOT NULL DEFAULT 0,
  audioMinutesLimit REAL NOT NULL DEFAULT 0,
  features TEXT NOT NULL,
  isPopular INTEGER NOT NULL DEFAULT 0,
  isActive INTEGER NOT NULL DEFAULT 1,
  sortOrder INTEGER NOT NULL DEFAULT 0,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Settings
CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL
);
`;

// Seed data
const seedSql = `
-- Demo user
INSERT OR IGNORE INTO users (id, email, name, password, role, plan, wordsUsed, imagesUsed, chatMessages, codeGenerated, audioMinutes, isActive)
VALUES ('demo-user-001', 'demo@davinci.ai', 'Demo User', 'demo123', 'user', 'professional', 5400, 8, 45, 12, 3.0, 1);

-- Admin user
INSERT OR IGNORE INTO users (id, email, name, password, role, plan, wordsUsed, imagesUsed, chatMessages, codeGenerated, audioMinutes, isActive)
VALUES ('admin-001', 'admin@davinci.ai', 'Admin User', 'admin123', 'admin', 'enterprise', 12450, 23, 156, 45, 12.5, 1);

-- Settings
INSERT OR IGNORE INTO settings (id, key, value) VALUES ('s1', 'site_name', 'Davinci AI');
INSERT OR IGNORE INTO settings (id, key, value) VALUES ('s2', 'site_description', 'AI-Powered Content Generation Platform');
INSERT OR IGNORE INTO settings (id, key, value) VALUES ('s3', 'default_model', 'nvidia/llama-3.3-nemotron-super-49b-v1');
INSERT OR IGNORE INTO settings (id, key, value) VALUES ('s4', 'max_free_words', '5000');
INSERT OR IGNORE INTO settings (id, key, value) VALUES ('s5', 'max_free_images', '10');

-- Pricing plans
INSERT OR IGNORE INTO pricing_plans (id, name, slug, description, price, interval, wordsLimit, imagesLimit, chatMessagesLimit, codeLimit, audioMinutesLimit, features, isPopular, sortOrder)
VALUES ('plan-free', 'Free', 'free', 'Get started with AI content generation', 0, 'monthly', 5000, 10, 50, 20, 5, '["5,000 words/month","10 images/month","50 chat messages","20 code generations","Basic templates","Community support"]', 0, 1);

INSERT OR IGNORE INTO pricing_plans (id, name, slug, description, price, interval, wordsLimit, imagesLimit, chatMessagesLimit, codeLimit, audioMinutesLimit, features, isPopular, sortOrder)
VALUES ('plan-starter', 'Starter', 'starter', 'Perfect for individuals and freelancers', 9.99, 'monthly', 25000, 50, 200, 100, 30, '["25,000 words/month","50 images/month","200 chat messages","100 code generations","All templates","Email support","API access"]', 0, 2);

INSERT OR IGNORE INTO pricing_plans (id, name, slug, description, price, interval, wordsLimit, imagesLimit, chatMessagesLimit, codeLimit, audioMinutesLimit, features, isPopular, sortOrder)
VALUES ('plan-pro', 'Professional', 'professional', 'For teams and growing businesses', 29.99, 'monthly', 100000, 200, 0, 0, 120, '["100,000 words/month","200 images/month","Unlimited chat","Unlimited code gen","All templates","Priority support","API access","Custom models"]', 1, 3);

INSERT OR IGNORE INTO pricing_plans (id, name, slug, description, price, interval, wordsLimit, imagesLimit, chatMessagesLimit, codeLimit, audioMinutesLimit, features, isPopular, sortOrder)
VALUES ('plan-enterprise', 'Enterprise', 'enterprise', 'For large organizations with custom needs', 99.99, 'monthly', 0, 0, 0, 0, 0, '["Unlimited words","Unlimited images","Unlimited chat","Unlimited code gen","All templates","Dedicated support","Custom API","White-label option","SSO integration"]', 0, 4);

-- Subscriptions
INSERT OR IGNORE INTO subscriptions (id, userId, planType, status, wordsLimit, imagesLimit, chatMessagesLimit, codeLimit, audioMinutesLimit, startDate, amount, currency)
VALUES ('sub-demo', 'demo-user-001', 'professional', 'active', 100000, 200, 0, 0, 120, datetime('now'), 29.99, 'USD');

INSERT OR IGNORE INTO subscriptions (id, userId, planType, status, wordsLimit, imagesLimit, chatMessagesLimit, codeLimit, audioMinutesLimit, startDate, amount, currency)
VALUES ('sub-admin', 'admin-001', 'enterprise', 'active', 0, 0, 0, 0, 0, datetime('now'), 99.99, 'USD');
`;

async function main() {
  console.log('🚀 Pushing schema to Turso...\n')

  // Execute CREATE TABLE statements one by one
  const statements = createTablesSql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0)

  for (const stmt of statements) {
    try {
      await client.execute(stmt)
      const tableName = stmt.match(/CREATE TABLE IF NOT EXISTS (\w+)/)?.[1]
      if (tableName) console.log(`  ✓ ${tableName}`)
    } catch (e: any) {
      console.error(`  ✗ Error: ${e.message}`)
    }
  }

  console.log('\n📦 Seeding data...\n')

  const seedStatements = seedSql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))

  for (const stmt of seedStatements) {
    try {
      await client.execute(stmt)
      const match = stmt.match(/INTO (\w+)/)
      if (match) console.log(`  ✓ ${match[1]}`)
    } catch (e: any) {
      console.error(`  ✗ Error: ${e.message}`)
    }
  }

  console.log('\n✅ Done! Turso database is ready.')
  console.log('\n📌 Login credentials:')
  console.log('  Admin: admin@davinci.ai / admin123')
  console.log('  Demo:  demo@davinci.ai / demo123')
}

main().catch(console.error)
