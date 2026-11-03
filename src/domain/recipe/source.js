// Stable, non-cryptographic content identities. These are not security hashes.
export function contentHash(text) {
  let hash = 2166136261
  for (const character of text) hash = Math.imul(hash ^ character.codePointAt(0), 16777619)
  return (hash >>> 0).toString(16).padStart(8, '0')
}

export function sourceFragments(parts) {
  return parts.map((part, index) => {
    const rawText = typeof part === 'string' ? part : part.rawText
    return { fragmentId: `source-${index + 1}-${contentHash(rawText)}`, rawText, originalOrder: index, pasteSequence: index + 1, sourceType: 'clipboard', contentHash: contentHash(rawText) }
  })
}

export function tokens(text) {
  return [...String(text).matchAll(/[\p{L}\p{N}¼½¾⅓⅔⅛⅜⅝⅞]+/gu)].map((match) => ({ text: match[0].toLowerCase(), start: match.index, end: match.index + match[0].length }))
}

// Match a complete token sequence, never a fuzzy invented approximation. Offsets
// are UTF-16 offsets into the untouched clipboard fragment, including line wraps.
export function findEvidence(text, fragments) {
  const wanted = tokens(text).map((token) => token.text)
  if (!wanted.length) return []
  const refs = []
  for (const fragment of fragments) {
    const available = tokens(fragment.rawText)
    for (let start = 0; start <= available.length - wanted.length; start += 1) {
      if (wanted.every((word, offset) => available[start + offset].text === word)) {
        refs.push({ fragmentId: fragment.fragmentId, start: available[start].start, end: available[start + wanted.length - 1].end })
        break
      }
    }
  }
  return refs
}

export function evidenceText(ref, fragments) {
  const source = fragments.find((fragment) => fragment.fragmentId === ref.fragmentId)
  return source?.rawText.slice(ref.start, ref.end) || ''
}
