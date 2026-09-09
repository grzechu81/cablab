import { describe, expect, it } from 'vitest'
import { en } from './en'
import { getStrings, t, type StringKey } from './index'
import type { EdgeBanding, PanelRole } from '../domain/types'

describe('t', () => {
  it('resolves a dot-path to its string', () => {
    expect(t('cabinet.defaultName')).toBe('New cabinet')
    expect(t('cutList.columns.part')).toBe('Part')
  })

  it('interpolates {param} placeholders', () => {
    const msg = t('persistence.validationFailed', { details: 'width: expected number' })
    expect(msg).toContain('width: expected number')
    expect(msg).not.toContain('{details}')
  })

  it('leaves an unfilled placeholder visible rather than blank', () => {
    expect(t('persistence.validationFailed')).toContain('{details}')
  })

  it('throws for a missing key', () => {
    expect(() => t('cabinet.nope' as StringKey)).toThrow(/Missing i18n string/)
  })

  it('getStrings returns the active locale object', () => {
    expect(getStrings()).toBe(en)
  })
})

describe('string coverage (drift guards)', () => {
  const roles: PanelRole[] = [
    'top',
    'bottom',
    'left-side',
    'right-side',
    'shelf',
    'back',
    'door',
  ]

  it.each(roles)('has a label for panel role %s', (role) => {
    expect(t(`cabinet.roles.${role}` as StringKey)).toBeTruthy()
  })

  const edges: (keyof EdgeBanding)[] = ['top', 'left', 'right', 'bottom']

  it.each(edges)('has a label for edge %s', (edge) => {
    expect(t(`edges.${edge}` as StringKey)).toBeTruthy()
  })
})
