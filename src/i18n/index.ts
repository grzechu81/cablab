/**
 * Tiny dependency-free i18n layer.
 *
 * `t('cutoutList.columns.part')` resolves a dot-path into the active locale's
 * strings; `{param}` placeholders are filled from the second argument. Keys are
 * type-checked against the shape of `en`, so a typo or a renamed string is a
 * compile error, not a runtime surprise.
 */

import { en } from './en'

export type Strings = typeof en
export type Locale = 'en'

const locales: Record<Locale, Strings> = { en }

let currentLocale: Locale = 'en'

/** Every dot-path that resolves to a string in `T`. */
type DeepKeys<T> = {
  [K in keyof T & string]: T[K] extends string
    ? K
    : `${K}.${DeepKeys<T[K]>}`
}[keyof T & string]

export type StringKey = DeepKeys<Strings>

export function getStrings(): Strings {
  return locales[currentLocale]
}

export function setLocale(locale: Locale): void {
  currentLocale = locale
}

export function t(
  key: StringKey,
  params?: Record<string, string | number>,
): string {
  let node: unknown = getStrings()
  for (const segment of key.split('.')) {
    node =
      typeof node === 'object' && node !== null
        ? (node as Record<string, unknown>)[segment]
        : undefined
  }

  if (typeof node !== 'string') {
    throw new Error(`Missing i18n string: ${key}`)
  }

  return node.replace(/\{(\w+)\}/g, (_match, name: string) =>
    params && name in params ? String(params[name]) : `{${name}}`,
  )
}
