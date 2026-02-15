import { NextRequest, NextResponse } from 'next/server'

/**
 * Cloud Save API Route - Encrypted Game State via Notion
 *
 * GET /api/saves?playerId=X&saveType=adventure_save[&metadataOnly=true]
 *   Retrieves the latest save for a player + save type
 *   With metadataOnly=true, returns existence check without save data
 *
 * POST /api/saves
 *   Creates or updates an encrypted save (dedup by PlayerId + SaveType)
 *
 * Save data is stored as Notion page content blocks (not properties)
 * to avoid the 2000-char rich_text limit. Metadata stays in properties.
 */

const NOTION_API_KEY = process.env.NOTION_API_KEY || ''
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID || ''
const NOTION_API_VERSION = '2022-06-28'
const NOTION_BASE = 'https://api.notion.com/v1'
const FETCH_TIMEOUT = 10000

function notionHeaders() {
  return {
    'Authorization': `Bearer ${NOTION_API_KEY}`,
    'Notion-Version': NOTION_API_VERSION,
    'Content-Type': 'application/json',
  }
}

async function notionFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT)
  try {
    return await fetch(url, {
      ...options,
      headers: { ...notionHeaders(), ...(options.headers || {}) },
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timeout)
  }
}

/**
 * Split a long string into chunks for Notion rich_text blocks (max 2000 chars each)
 */
function chunkString(str: string, size: number = 2000): string[] {
  const chunks: string[] = []
  for (let i = 0; i < str.length; i += size) {
    chunks.push(str.slice(i, i + size))
  }
  return chunks
}

// GET /api/saves
export async function GET(request: NextRequest) {
  if (!NOTION_API_KEY || !NOTION_DATABASE_ID) {
    return NextResponse.json({ error: 'Cloud saves not configured' }, { status: 503 })
  }

  const { searchParams } = new URL(request.url)
  const playerId = searchParams.get('playerId')
  const saveType = searchParams.get('saveType')
  const metadataOnly = searchParams.get('metadataOnly') === 'true'

  if (!playerId) {
    return NextResponse.json({ error: 'playerId required' }, { status: 400 })
  }

  try {
    // Query for matching saves
    const filters: Record<string, unknown>[] = [
      { property: 'PlayerId', rich_text: { equals: playerId } },
    ]

    if (saveType) {
      filters.push({ property: 'SaveType', select: { equals: saveType } })
    }

    // Exclude leaderboard entries
    filters.push({
      property: 'SaveType',
      select: { does_not_equal: 'leaderboard' },
    })

    const queryResp = await notionFetch(`${NOTION_BASE}/databases/${NOTION_DATABASE_ID}/query`, {
      method: 'POST',
      body: JSON.stringify({
        filter: filters.length === 1 ? filters[0] : { and: filters },
        sorts: [{ property: 'LastSaved', direction: 'descending' }],
        page_size: 1,
      }),
    })

    if (!queryResp.ok) {
      console.error('Notion save query failed:', queryResp.status)
      return NextResponse.json({ error: 'Query failed' }, { status: 502 })
    }

    const queryData = await queryResp.json()
    const pages = queryData.results as Array<{ id: string; properties: Record<string, unknown> }>

    if (pages.length === 0) {
      return NextResponse.json(null, { status: 404 })
    }

    const page = pages[0]
    const props = page.properties

    // Extract metadata
    const lastSavedProp = props.LastSaved as { date?: { start?: string } } | undefined
    const saveTypeProp = props.SaveType as { select?: { name?: string } } | undefined

    if (metadataOnly) {
      return NextResponse.json({
        exists: true,
        lastSaved: lastSavedProp?.date?.start || null,
        saveType: saveTypeProp?.select?.name || null,
      })
    }

    // Fetch page content blocks (where encrypted save data lives)
    const blocksResp = await notionFetch(`${NOTION_BASE}/blocks/${page.id}/children?page_size=100`)
    if (!blocksResp.ok) {
      console.error('Notion blocks fetch failed:', blocksResp.status)
      return NextResponse.json({ error: 'Failed to read save data' }, { status: 502 })
    }

    const blocksData = await blocksResp.json()
    const blocks = blocksData.results as Array<{
      type: string
      paragraph?: { rich_text: Array<{ plain_text: string }> }
    }>

    // Reassemble save data from paragraph blocks
    let saveData = ''
    for (const block of blocks) {
      if (block.type === 'paragraph' && block.paragraph?.rich_text) {
        for (const rt of block.paragraph.rich_text) {
          saveData += rt.plain_text
        }
      }
    }

    if (!saveData) {
      return NextResponse.json({ error: 'Save data empty' }, { status: 404 })
    }

    return NextResponse.json({
      saveData,
      lastSaved: lastSavedProp?.date?.start || null,
      saveType: saveTypeProp?.select?.name || null,
    })
  } catch (err) {
    console.error('Save GET error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// POST /api/saves
export async function POST(request: NextRequest) {
  if (!NOTION_API_KEY || !NOTION_DATABASE_ID) {
    return NextResponse.json({ error: 'Cloud saves not configured' }, { status: 503 })
  }

  try {
    const body = await request.json()
    const { playerId, saveType, saveData, saveVersion, deviceId } = body

    if (!playerId || !saveType || !saveData) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check for existing save (dedup by PlayerId + SaveType)
    const existingResp = await notionFetch(`${NOTION_BASE}/databases/${NOTION_DATABASE_ID}/query`, {
      method: 'POST',
      body: JSON.stringify({
        filter: {
          and: [
            { property: 'PlayerId', rich_text: { equals: playerId } },
            { property: 'SaveType', select: { equals: saveType } },
          ],
        },
        page_size: 1,
      }),
    })

    if (!existingResp.ok) {
      return NextResponse.json({ error: 'Notion query failed' }, { status: 502 })
    }

    const existingData = await existingResp.json()
    const existingPages = existingData.results as Array<{ id: string }>

    const now = new Date().toISOString()

    // Build properties
    const properties: Record<string, unknown> = {
      Name: { title: [{ text: { content: `${playerId}:${saveType}` } }] },
      PlayerId: { rich_text: [{ text: { content: playerId } }] },
      SaveType: { select: { name: saveType } },
      LastSaved: { date: { start: now } },
      IsNPC: { checkbox: false },
    }
    if (saveVersion) {
      properties.SaveVersion = { rich_text: [{ text: { content: saveVersion } }] }
    }
    if (deviceId) {
      properties.DeviceId = { rich_text: [{ text: { content: deviceId } }] }
    }

    // Build content blocks — split save data into 2000-char chunks
    const chunks = chunkString(saveData, 2000)
    const children = chunks.map(chunk => ({
      object: 'block' as const,
      type: 'paragraph' as const,
      paragraph: {
        rich_text: [{ type: 'text' as const, text: { content: chunk } }],
      },
    }))

    if (existingPages.length > 0) {
      const pageId = existingPages[0].id

      // Update properties
      await notionFetch(`${NOTION_BASE}/pages/${pageId}`, {
        method: 'PATCH',
        body: JSON.stringify({ properties }),
      })

      // Delete old content blocks
      const oldBlocksResp = await notionFetch(`${NOTION_BASE}/blocks/${pageId}/children?page_size=100`)
      if (oldBlocksResp.ok) {
        const oldBlocks = (await oldBlocksResp.json()).results as Array<{ id: string }>
        for (const block of oldBlocks) {
          await notionFetch(`${NOTION_BASE}/blocks/${block.id}`, { method: 'DELETE' })
        }
      }

      // Append new content blocks
      await notionFetch(`${NOTION_BASE}/blocks/${pageId}/children`, {
        method: 'PATCH',
        body: JSON.stringify({ children }),
      })

      return NextResponse.json({ action: 'saved' })
    }

    // Create new page with content
    await notionFetch(`${NOTION_BASE}/pages`, {
      method: 'POST',
      body: JSON.stringify({
        parent: { database_id: NOTION_DATABASE_ID },
        properties,
        children,
      }),
    })

    return NextResponse.json({ action: 'created' })
  } catch (err) {
    console.error('Save POST error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
