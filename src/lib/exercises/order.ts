// kolejność opcji w zadaniu wyboru: w plikach poprawna odpowiedź często stoi pierwsza,
// więc na ekranie mieszamy. Ziarno z id zadania, żeby przy każdym renderze było tak samo.
export function optionOrder(seed: string, count: number): number[] {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  const order = Array.from({ length: count }, (_, i) => i)
  for (let i = count - 1; i > 0; i--) {
    h ^= h >>> 13
    h = Math.imul(h, 1597334677) >>> 0
    const j = h % (i + 1)
    ;[order[i], order[j]] = [order[j]!, order[i]!]
  }
  return order
}
