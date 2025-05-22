import bibleBooks from '@/constants/books.json'
import bookMetadata from '@/constants/bookMetadata.json'

// Get a book object by its bookCode
export function getBookByCode(bookCode: number) {
  return bibleBooks.find((b: any) => b.bookCode === bookCode)
}

// Get the number of chapters in a book
export function getChapterCount(bookCode: number): number {
  const book = getBookByCode(bookCode)
  return book ? book.chapters : 0
}

// Get the number of verses in a chapter of a book
export function getVerseCount(bookCode: number, chapter: number): number {
  const book = getBookByCode(bookCode)
  // chapter is 1-based
  return book && book.versesIn && book.versesIn[chapter - 1] ? book.versesIn[chapter - 1] : 0
}

// Get all bookCodes for a given testament ("OT" or "NT")
export function getBookCodesByTestament(testament: 'OT' | 'NT'): number[] {
  return bibleBooks.filter((b: any) => b.testament === testament).map((b: any) => b.bookCode)
}

// Get all bookCodes for a given division (e.g., "Pentateuch")
export function getBookCodesByDivision(division: string): number[] {
  return bookMetadata.filter((b: any) => b.division === division).map((b: any) => b.bookCode)
}

// Get all bookCodes for a given division within a testament
export function getBookCodesByTestamentAndDivision(testament: 'OT' | 'NT', division: string): number[] {
  return bookMetadata.filter((b: any) => b.testament === testament && b.division === division).map((b: any) => b.bookCode)
}

// Get total chapters in a division
export function getTotalChaptersInDivision(division: string): number {
  return getBookCodesByDivision(division).reduce((sum, code) => sum + getChapterCount(code), 0)
}

// Get total chapters in a testament
export function getTotalChaptersInTestament(testament: 'OT' | 'NT'): number {
  return getBookCodesByTestament(testament).reduce((sum, code) => sum + getChapterCount(code), 0)
}

// Get all book objects for a division
export function getBooksInDivision(division: string) {
  return getBookCodesByDivision(division).map(getBookByCode).filter(Boolean)
}

// Get all book objects for a testament
export function getBooksInTestament(testament: 'OT' | 'NT') {
  return getBookCodesByTestament(testament).map(getBookByCode).filter(Boolean)
}

// Get the name of a book by its bookCode
export function getBookName(bookCode: number): string {
  const book = getBookByCode(bookCode)
  return book ? book.name : `Book ${bookCode}`
}

// Get the division of a book by its bookCode
export function getDivisionName(bookCode: number): string | undefined {
  const meta = bookMetadata.find((b: any) => b.bookCode === bookCode)
  return meta ? meta.division : undefined
}

// Get the testament of a book by its bookCode
export function getTestament(bookCode: number): 'OT' | 'NT' | undefined {
  const book = getBookByCode(bookCode)
  if (!book) return undefined
  if (book.testament === 'OT' || book.testament === 'NT') return book.testament
  return undefined
}

// Get canonical wisdom book codes (Job, Psalms, Proverbs, Ecclesiastes, Song of Solomon)
export function getWisdomBookCodes(): number[] {
  return [18, 19, 20, 21, 22]
}

// Get all unique divisions (optionally filtered by testament)
export function getAllDivisions(testament?: 'OT' | 'NT'): string[] {
  const divisions = new Set<string>()
  bookMetadata.forEach((b: any) => {
    if (!testament || b.testament === testament) {
      divisions.add(b.division)
    }
  })
  return Array.from(divisions)
} 