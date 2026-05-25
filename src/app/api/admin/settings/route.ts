import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const settings = await db.setting.findMany({
      orderBy: { key: 'asc' },
    })

    const settingsMap: Record<string, string> = {}
    settings.forEach((s) => {
      settingsMap[s.key] = s.value
    })

    return NextResponse.json({ settings: settingsMap })
  } catch (error) {
    console.error('Admin settings GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { settings } = body as { settings: Record<string, string> }

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json({ error: 'Invalid settings data' }, { status: 400 })
    }

    // Upsert each setting
    for (const [key, value] of Object.entries(settings)) {
      await db.setting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin settings PUT error:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
