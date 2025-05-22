"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import bibleBooks from "@/constants/books.json"
import ReadingPlanPreview from "./reading-plan-preview"

interface DurationSelectionProps {
  duration: {
    type: string
    value: number
  }
  onChange: (duration: { type: string; value: number }) => void
  section: string
  pathway: string
  readingType: string
  presetName?: string
  selectedBooks: number[] // Add this prop
}

export default function DurationSelection({
  duration,
  onChange,
  section,
  pathway,
  readingType,
  presetName,
  selectedBooks,
}: DurationSelectionProps) {
  const [durationType, setDurationType] = useState(duration.type)
  const [durationValue, setDurationValue] = useState(duration.value)
  const [weeklyStats, setWeeklyStats] = useState({ minutes: 0, chapters: 0 })
  const [endDate, setEndDate] = useState("")

  // Calculate weekly stats based on section and duration
  useEffect(() => {
    // This is a simplified calculation
    let totalChapters = 0

    if (readingType === "preset") {
      // For preset plans, use a reasonable default based on the name
      if (presetName?.includes("Horner")) {
        totalChapters = 10 * 52 // 10 chapters per day
      } else if (presetName?.includes("M'Cheyne")) {
        totalChapters = 4 * 52 // 4 chapters per day
      } else {
        totalChapters = 5 * 52 // 5 chapters per day
      }
    } else if (section === "old-testament") {
      totalChapters = bibleBooks
        .filter((book: any) => book.testament === "OT")
        .reduce((sum: number, book: any) => sum + book.chapters, 0)
    } else if (section === "new-testament") {
      totalChapters = bibleBooks
        .filter((book: any) => book.testament === "NT")
        .reduce((sum: number, book: any) => sum + book.chapters, 0)
    } else if (section === "psalms") {
      totalChapters = 150 // Psalms has 150 chapters
    } else if (section === "gospels") {
      totalChapters = bibleBooks
        .filter((book: any) => book.bookCode >= 40 && book.bookCode <= 43)
        .reduce((sum: number, book: any) => sum + book.chapters, 0)
    } else {
      // Default to whole Bible
      totalChapters = bibleBooks.reduce((sum: number, book: any) => sum + book.chapters, 0)
    }

    // Calculate weeks
    const weeks = durationType === "months" ? durationValue * 4.33 : durationValue

    // Calculate chapters per week
    const chaptersPerWeek = Math.ceil(totalChapters / weeks)

    // Estimate reading time (average 2.5 minutes per chapter)
    const minutesPerWeek = chaptersPerWeek * 2.5

    setWeeklyStats({
      minutes: Math.round(minutesPerWeek),
      chapters: chaptersPerWeek,
    })

    // Calculate end date
    const today = new Date()
    const endDateValue = new Date(today)

    if (durationType === "months") {
      endDateValue.setMonth(today.getMonth() + durationValue)
    } else {
      endDateValue.setDate(today.getDate() + durationValue * 7)
    }

    setEndDate(
      `${endDateValue.getDate()} ${endDateValue.toLocaleString("default", { month: "long" })} ${endDateValue.getFullYear()}`,
    )
  }, [section, durationType, durationValue, readingType, presetName, selectedBooks])

  const handleDurationTypeChange = (type: string) => {
    setDurationType(type)
    onChange({ type, value: durationValue })
  }

  const handleDurationValueChange = (value: number) => {
    setDurationValue(value)
    onChange({ type: durationType, value })
  }

  // Get page title based on reading type
  const getPageTitle = () => {
    if (readingType === "preset") {
      return `How long do you want\nthe ${presetName || "preset plan"} to go for?`
    }
    return "How long do you want\nthe plan to go for?"
  }

  return (
    <div className="flex-1 flex flex-col">
      <h1 className="text-3xl font-bold text-center mb-8">{getPageTitle()}</h1>

      <div className="flex justify-center mb-8">
        <div className="inline-flex bg-gray-800 rounded-full p-1">
          <Button
            variant="ghost"
            className={cn("rounded-full px-6", durationType === "months" && "bg-gray-700")}
            onClick={() => handleDurationTypeChange("months")}
          >
            Months
          </Button>
          <Button
            variant="ghost"
            className={cn("rounded-full px-6", durationType === "weeks" && "bg-gray-700")}
            onClick={() => handleDurationTypeChange("weeks")}
          >
            Weeks
          </Button>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="w-full space-y-2">
          {[6, 8, 10, 12, 14].map((value) => (
            <Button
              key={value}
              variant="ghost"
              className={cn(
                "w-full py-4 text-2xl",
                durationValue === value ? "bg-gray-800 text-white" : "text-gray-500",
              )}
              onClick={() => handleDurationValueChange(value)}
            >
              {value} {durationType}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-8">
        <div className="bg-gray-900 rounded-lg p-4 text-center">
          <div className="text-sm text-gray-400">Weekly Averages</div>
          <div className="flex justify-center space-x-8 mt-2">
            <div>
              <div className="text-3xl font-bold">{weeklyStats.minutes}</div>
              <div className="text-sm text-gray-400">minutes</div>
            </div>
            <div>
              <div className="text-3xl font-bold">{weeklyStats.chapters}</div>
              <div className="text-sm text-gray-400">chapters</div>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 rounded-lg p-4 text-center">
          <div className="text-sm text-gray-400">Ends</div>
          <div className="text-3xl font-bold mt-2">
            {endDate.split(" ")[0]} {endDate.split(" ")[1]}
          </div>
          <div className="text-sm text-gray-400">{endDate.split(" ")[2]}</div>
        </div>
      </div>

      {/* Add preview at the bottom */}
      <div className="mt-6">
        <ReadingPlanPreview
          config={{
            readingType: readingType,
            duration: { type: durationType, value: durationValue },
            wholeBibleConfig: {
              newTestamentPlacement: "alongside",
              wisdomBooksPlacement: "alongside",
              includedWisdomBooks: [],
            },
            sectionConfig:
              readingType === "section"
                ? {
                    section,
                    pathway,
                    selectedBooks,
                  }
                : undefined,
          }}
          showOnlyOnFinal={true}
        />
      </div>
    </div>
  )
}
