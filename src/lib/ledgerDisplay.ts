export type LedgerDisplayTone = 'green' | 'red' | 'amber' | 'grey'

export interface LedgerDisplay {
  tone: LedgerDisplayTone
  label: string
  description: string
  status: 'intact' | 'broken' | 'empty' | 'unmeasured'
}

const UNMEASURED_DISPLAY: LedgerDisplay = {
  tone: 'grey',
  label: 'Karma Ledger',
  description: 'ledger unmeasured',
  status: 'unmeasured',
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function displayRows(rows: number): string {
  return `${rows} ${rows === 1 ? 'row' : 'rows'}`
}

export function ledgerDisplayFromVerdict(value: unknown): LedgerDisplay {
  if (!isRecord(value)) return UNMEASURED_DISPLAY

  if (value.status === 'intact') {
    if (value.ok === true && typeof value.rows === 'number' && Number.isFinite(value.rows) && typeof value.head === 'string') {
      return {
        tone: 'green',
        label: 'Karma Ledger',
        description: `ledger intact · ${displayRows(value.rows)} · ${value.head.slice(0, 12)}`,
        status: 'intact',
      }
    }
    return UNMEASURED_DISPLAY
  }

  if (value.status === 'broken') {
    return {
      tone: 'red',
      label: 'Karma Ledger',
      description: 'ledger broken',
      status: 'broken',
    }
  }

  if (value.status === 'empty') {
    return {
      tone: 'amber',
      label: 'Karma Ledger',
      description: 'ledger empty',
      status: 'empty',
    }
  }

  return UNMEASURED_DISPLAY
}

export function ledgerDisplayFromJson(text: string): LedgerDisplay {
  try {
    return ledgerDisplayFromVerdict(JSON.parse(text))
  } catch {
    return UNMEASURED_DISPLAY
  }
}
