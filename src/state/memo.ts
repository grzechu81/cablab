/**
 * Single-slot, reference-equality memo. Caches only the most recent call —
 * enough for React selectors, where the same slices are read repeatedly between
 * store changes and change identity when (and only when) their contents change.
 */
export function memoizeByRefs<A extends unknown[], R>(
  fn: (...args: A) => R,
): (...args: A) => R {
  let last: { args: A; value: R } | undefined

  return (...args: A): R => {
    if (
      last &&
      last.args.length === args.length &&
      last.args.every((arg, i) => arg === args[i])
    ) {
      return last.value
    }

    const value = fn(...args)
    last = { args, value }
    return value
  }
}
