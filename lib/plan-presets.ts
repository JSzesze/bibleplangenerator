import { getBookCodesByTestament, getBookCodesByDivision, getBookByCode } from "@/lib/book-utils"
import type { BookData } from "@/lib/plan-generator"

/**
 * Configuration options for whole Bible reading plans
 */
export interface WholeBibleOptions {
  newTestamentPlacement: "alongside" | "after"
  wisdomBooksPlacement: "alongside" | "within"
  includedWisdomBooks: string[]
  totalPlanDays: number
}

/**
 * Get book codes for wisdom books based on selected book names
 */
export function getWisdomBookCodes(includedWisdomBooks: string[]): number[] {
  const wisdomBookMap: Record<string, number> = {
    Psalms: 19,
    Proverbs: 20,
    Ecclesiastes: 21,
    "Song of Solomon": 22,
    Job: 18,
  }

  return includedWisdomBooks
    .map((bookName) => wisdomBookMap[bookName])
    .filter((code): code is number => code !== undefined)
}

/**
 * Create a configuration for a whole Bible reading plan
 * This generates the appropriate streams configuration for the multi-stream generator
 */
export function createWholeBibleConfig(options: WholeBibleOptions) {
  const { newTestamentPlacement, wisdomBooksPlacement, includedWisdomBooks, totalPlanDays } = options

  // Wisdom book codes (by division or by included names)
  const allWisdomBookCodes = getBookCodesByDivision("Poetry-Wisdom")
  // If includedWisdomBooks is a list of names, map to codes
  const wisdomBookCodes = includedWisdomBooks.length > 0
    ? allWisdomBookCodes.filter((code) => {
        const book = getBookByCode(code)
        return book && includedWisdomBooks.includes(book.name)
      })
    : []

  // Define streams based on configuration
  const streams = []

  // OT book codes (optionally excluding wisdom books)
  let otBookCodes = getBookCodesByTestament('OT')
  if (wisdomBooksPlacement !== "within" && wisdomBookCodes.length > 0) {
    otBookCodes = otBookCodes.filter((code) => !wisdomBookCodes.includes(code))
  }

  const ntBookCodes = getBookCodesByTestament('NT')

  if (newTestamentPlacement === "after") {
    // For "after" placement, combine OT and NT into a single stream
    streams.push({
      bookCodes: [...otBookCodes, ...ntBookCodes],
      chaptersPerDay: 1, // Will be adjusted based on total days
    })
  } else {
    // Add OT as a separate stream
    streams.push({
      bookCodes: otBookCodes,
      chaptersPerDay: 1,
    })

    // Add NT stream
    streams.push({
      bookCodes: ntBookCodes,
      chaptersPerDay: 1,
    })
  }

  // Add wisdom books stream if needed
  if (wisdomBooksPlacement === "alongside" && wisdomBookCodes.length > 0) {
    streams.push({
      bookCodes: wisdomBookCodes,
      chaptersPerDay: 1,
    })
  }

  // Calculate optimal chapters per day for each stream
  calculateOptimalChaptersPerDay(streams, totalPlanDays)

  return {
    streams,
    totalPlanDays,
  }
}

/**
 * Calculate optimal chapters per day for each stream based on total plan days
 */
function calculateOptimalChaptersPerDay(
  streams: { bookCodes: number[]; chaptersPerDay: number }[],
  totalPlanDays: number,
): void {
  streams.forEach((stream) => {
    // Calculate total chapters in this stream
    const totalChapters = stream.bookCodes.reduce((sum, bookCode) => {
      const book = getBookByCode(bookCode)
      return sum + (book?.chapters || 0)
    }, 0)

    // Calculate chapters per day needed to complete this stream in the given days
    stream.chaptersPerDay = Math.max(1, Math.ceil(totalChapters / totalPlanDays))
  })
}

/**
 * Create a configuration for a New Testament reading plan
 */
export function createNewTestamentConfig(options: { totalPlanDays: number }) {
  const { totalPlanDays } = options

  return {
    streams: [
      {
        bookCodes: Array.from({ length: 27 }, (_, i) => i + 40), // Books 40-66 (NT)
        chaptersPerDay: 1, // Will be adjusted based on total days
      },
    ],
    totalPlanDays,
  }
}

/**
 * Create a configuration for an M'Cheyne family worship plan
 * This plan takes you through the OT once and the NT and Psalms twice in a year
 */
export function createMCheyneConfig() {
  return {
    streams: [
      { bookCodes: Array.from({ length: 39 }, (_, i) => i + 1).filter((code) => code !== 19) }, // OT stream 1 (excluding Psalms)
      { bookCodes: Array.from({ length: 39 }, (_, i) => i + 1).filter((code) => code !== 19) }, // OT stream 2 (excluding Psalms)
      { bookCodes: [19, ...Array.from({ length: 27 }, (_, i) => i + 40)] }, // Psalms + NT
      { bookCodes: [19, ...Array.from({ length: 27 }, (_, i) => i + 40)] }, // Psalms + NT again
    ],
    totalPlanDays: 365,
  }
}

/**
 * Create a configuration for a 5-day workweek plan
 */
export function createWorkweekConfig() {
  return {
    streams: [
      { bookCodes: [1, 2, 3, 4, 5] }, // Pentateuch
      { bookCodes: [19, 20, 21, 22] }, // Wisdom Literature
    ],
    totalPlanDays: 260, // 52 weeks × 5 days
  }
}

/**
 * Create a configuration for Professor Horner's Bible Reading System
 * A 10-stream Bible reading plan
 */
export function createHornerConfig() {
  return {
    streams: [
      { bookCodes: [1, 2, 3, 4, 5], label: "Pentateuch" }, // Genesis-Deuteronomy
      { bookCodes: [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17], label: "OT History 1" }, // Joshua-2 Kings
      { bookCodes: [18, 19, 20, 21, 22], label: "Poetry" }, // Job-Song of Solomon
      { bookCodes: [23, 24, 25, 26, 27], label: "Major Prophets" }, // Isaiah-Daniel
      { bookCodes: [28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39], label: "Minor Prophets" }, // Hosea-Malachi
      { bookCodes: [40, 41, 42, 43], label: "Gospels" }, // Matthew-John
      { bookCodes: [44], label: "Acts" }, // Acts
      { bookCodes: [45, 46, 47, 48, 49, 50, 51, 52, 53], label: "Pauline Epistles" }, // Romans-2 Thessalonians
      { bookCodes: [54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65], label: "General Epistles" }, // 1 Timothy-Jude
      { bookCodes: [66], label: "Revelation" }, // Revelation
    ],
    totalPlanDays: 365,
  }
}

/**
 * Create a configuration for a plan: Genesis, Exodus, then New Testament
 */
export function createGenesisExodusThenNTConfig() {
  return {
    streams: [
      {
        bookCodes: [
          1, 2, // Genesis & Exodus
          ...Array.from({ length: 27 }, (_, i) => i + 40) // NT books 40-66
        ]
      }
    ],
    totalPlanDays: 365,
  }
}
