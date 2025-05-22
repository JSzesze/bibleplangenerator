"use client"

import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getBookByCode, getBookName, getTestament } from "@/lib/book-utils"
import type { PrecalculatedDailyPlanSchema } from "@/lib/plan-generator"

interface BookReadingStatsProps {
  plan: PrecalculatedDailyPlanSchema
  filter?: "all" | "ot" | "nt" | "wisdom"
}

export default function BookReadingStats({ plan, filter = "all" }: BookReadingStatsProps) {
  // Count readings per book
  const bookCounts: Record<number, number> = {}

  // Use the pre-calculated counts if available
  if (plan.bookReadingCounts) {
    Object.entries(plan.bookReadingCounts).forEach(([bookCode, count]) => {
      const code = Number(bookCode)
      if (getBookByCode(code)) {
        bookCounts[code] = count as number
      }
    })
  } else {
    // Otherwise calculate from the daily readings
    plan.dailyReadings.forEach((day) => {
      day.forEach((reading) => {
        const code = reading.bookCode
        if (!bookCounts[code]) {
          bookCounts[code] = 0
        }
        bookCounts[code]++
      })
    })
  }

  // Filter books based on the filter prop
  const filteredBooks = Object.entries(bookCounts).filter(([bookCodeStr]) => {
    const bookCode = Number(bookCodeStr)
    const testament = getTestament(bookCode)
    if (!testament) return false

    if (filter === "ot") return testament === "OT" && ![18, 19, 20, 21, 22].includes(bookCode)
    if (filter === "nt") return testament === "NT"
    if (filter === "wisdom") return [18, 19, 20, 21, 22].includes(bookCode)
    return true
  })

  // Sort books by biblical order
  const sortedBooks = filteredBooks.sort((a, b) => {
    return Number(a[0]) - Number(b[0])
  })

  // Find max count for scaling
  const maxCount = Math.max(...sortedBooks.map(([_, count]) => count))

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">
          {filter === "ot" && "Old Testament"}
          {filter === "nt" && "New Testament"}
          {filter === "wisdom" && "Wisdom Books"}
          {filter === "all" && "All Books"}
          {" Reading Counts"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-64 pr-4">
          <div className="space-y-2">
            {sortedBooks.map(([bookCodeStr, count], index) => {
              const bookCode = Number(bookCodeStr)
              const bookName = getBookName(bookCode)
              const testament = getTestament(bookCode) || "OT"
              const isWisdom = [18, 19, 20, 21, 22].includes(bookCode)

              return (
                <div key={index} className="flex items-center">
                  <div className="w-24 text-sm truncate mr-2">{bookName}</div>
                  <div className="flex-1 flex items-center">
                    <div
                      className={`h-3 rounded-full mr-2 ${
                        testament === "NT" ? "bg-purple-800" : isWisdom ? "bg-olive-700" : "bg-brown-600"
                      }`}
                      style={{ width: `${Math.max(5, (count / maxCount) * 100)}%` }}
                    ></div>
                    <span className="text-xs text-gray-400 min-w-[40px]">{count}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
