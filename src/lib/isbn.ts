// Strip dashes/spaces and validate length. Accepts ISBN-10 and ISBN-13.
export function normalizeIsbn(input: string): string {
  return input.replace(/[\s-]/g, '').toUpperCase()
}

export function isValidIsbn(input: string): boolean {
  const isbn = normalizeIsbn(input)
  return /^(?:\d{9}[\dX]|\d{13})$/.test(isbn)
}
