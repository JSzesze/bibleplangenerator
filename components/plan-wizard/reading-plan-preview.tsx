"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Calendar } from "lucide-react"
import { getBookByCode, getBookName, getTestament } from "@/lib/book-utils"
import type { WholeBibleConfig } from "./whole-bible-flow"
import { generateMultiStreamPlan, calculatePlanStatistics } from "@/lib/plan-generator"
import { createWholeBibleConfig } from "@/lib/plan-presets"
import VersesPerDayGraph from "./verses-per-day-graph"
import { generateSequentialPlan } from "@/lib/plan-generator"

interface ReadingPlanPreviewProps {
  config: {
    readingType: string
    duration: {
      type: string
      value: number
    }
    wholeBibleConfig: WholeBibleConfig
    presetPlan?: any
    sectionConfig?: {
      section: string
      pathway: string
      selectedBooks: number[]
    }
  }
  showOnlyOnFinal?: boolean
}

export default function ReadingPlanPreview({ config, showOnlyOnFinal = false }: ReadingPlanPreviewProps) {
  const [plan, setPlan] = useState<any>(null)
  const [planStats, setPlanStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("sample")

  useEffect(() => {
    async function generatePreview() {
      try {
        // If we already have a preset plan passed in, use that
        if (config.readingType === "preset" && config.presetPlan) {
          const stats = calculatePlanStatistics(config.presetPlan)
          setPlanStats(stats)
          setPlan(config.presetPlan)
          setLoading(false)
          return
        }

        if (config.readingType === "whole") {
          // Use the createWholeBibleConfig function to generate the configuration
          const wholeBibleConfig = createWholeBibleConfig({
            newTestamentPlacement: config.wholeBibleConfig.newTestamentPlacement,
            wisdomBooksPlacement: config.wholeBibleConfig.wisdomBooksPlacement,
            includedWisdomBooks: config.wholeBibleConfig.includedWisdomBooks,
            totalPlanDays: config.duration.type === "months" ? config.duration.value * 30 : config.duration.value * 7,
          })

          // Use the original generateMultiStreamPlan function with the configuration
          const planData = await generateMultiStreamPlan({
            id: `preview-${Date.now()}`,
            name: "Whole Bible Reading Plan",
            description: `A ${config.duration.value} ${config.duration.type} reading plan through the entire Bible.`,
            streams: wholeBibleConfig.streams,
            totalPlanDays: wholeBibleConfig.totalPlanDays,
            tags: ["whole-bible", `${config.duration.value}-${config.duration.type}`],
            author: "Bible Plan Generator",
            version: "1.0",
          })

          // Calculate plan statistics
          const stats = calculatePlanStatistics(planData)
          setPlanStats(stats)
          setPlan(planData)
        } else if (config.readingType === "section" && config.sectionConfig) {
          // Generate a sequential plan for a section
          const { section, pathway, selectedBooks } = config.sectionConfig

          // Skip if no books are selected
          if (!selectedBooks || selectedBooks.length === 0) {
            setLoading(false)
            return
          }

          const planData = await generateSequentialPlan({
            id: `preview-${Date.now()}`,
            name: getSectionName(section),
            description: `A preview of your ${section} reading plan.`,
            booksToInclude: selectedBooks.map((bookCode) => ({ bookCode })),
            chaptersPerDay: 1,
            totalPlanDays: config.duration.type === "months" ? config.duration.value * 30 : config.duration.value * 7,
            tags: [section, pathway],
            author: "Bible Plan Generator",
            version: "1.0",
          })

          // Calculate plan statistics
          const stats = calculatePlanStatistics(planData)
          setPlanStats(stats)
          setPlan(planData)
        }
      } catch (error) {
        console.error("Error generating plan preview:", error)
      } finally {
        setLoading(false)
      }
    }

    generatePreview()
  }, [config])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="text-lg text-gray-400">Generating preview...</div>
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="text-lg text-gray-400">Unable to generate preview</div>
      </div>
    )
  }

  // Use plan.bookReadingCounts for true counts
  const bookReadings: Record<number, { count: number; testament: string }> = {}
  if (plan.bookReadingCounts) {
    Object.entries(plan.bookReadingCounts).forEach(([bookCodeStr, count]) => {
      const bookCode = Number(bookCodeStr)
      const testament = getTestament(bookCode) || "OT"
      bookReadings[bookCode] = { count: count as number, testament }
    })
  }

  // Get sample days from different parts of the plan
  const sampleDays = [
    { day: 0, readings: plan.dailyReadings[0] || [] },
    { day: Math.floor(plan.totalPlanDays / 4), readings: plan.dailyReadings[Math.floor(plan.totalPlanDays / 4)] || [] },
    { day: Math.floor(plan.totalPlanDays / 2), readings: plan.dailyReadings[Math.floor(plan.totalPlanDays / 2)] || [] },
    {
      day: Math.floor((3 * plan.totalPlanDays) / 4),
      readings: plan.dailyReadings[Math.floor((3 * plan.totalPlanDays) / 4)] || [],
    },
    {
      day: plan.totalPlanDays - 1,
      readings: plan.dailyReadings[plan.totalPlanDays - 1] || [],
    },
  ].filter((item) => item.readings.length > 0)

  // Calculate max count for scaling
  const maxCount = Math.max(...Object.values(bookReadings).map((b) => b.count), 1)

  // Calculate repetition for each book (reads per chapter)
  const bookRepetitions: Record<string, number> = {}
  Object.entries(bookReadings).forEach(([bookCodeStr, { count }]) => {
    const bookCode = Number(bookCodeStr)
    const book = getBookByCode(bookCode)
    if (book && book.chapters > 0) {
      bookRepetitions[book.name] = count / book.chapters
    }
  })

  if (showOnlyOnFinal) {
    return null
  }

  return (
    <Card className="bg-gray-900 border-gray-800 p-4">
      <Tabs defaultValue="sample" onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="sample">Sample Days</TabsTrigger>
          <TabsTrigger value="structure">Plan Structure</TabsTrigger>
          <TabsTrigger value="verses">Verses Per Day</TabsTrigger>
        </TabsList>

        <TabsContent value="structure">
          <div className="space-y-3">
            <div className="text-sm text-gray-400 mb-2">Reading Distribution</div>
            {plan && (
              <div className="mb-3 text-xs text-gray-400">
                <div className="inline-block mr-4">
                  <span className="inline-block w-2 h-2 rounded-full mr-1 bg-brown-600"></span>
                  Old Testament: {planStats?.oldTestament.repetition}x
                </div>
                <div className="inline-block mr-4">
                  <span className="inline-block w-2 h-2 rounded-full mr-1 bg-purple-800"></span>
                  New Testament: {planStats?.newTestament.repetition}x
                </div>
                <div className="inline-block mr-4">
                  <span className="inline-block w-2 h-2 rounded-full mr-1 bg-olive-700"></span>
                  Wisdom Books: {planStats?.wisdomBooks.repetition}x
                </div>
              </div>
            )}
            <ScrollArea className="h-48 pr-4">
              <div className="space-y-3">
                {Object.entries(bookReadings)
                  .sort((a, b) => {
                    // First sort by testament (OT then NT)
                    if (a[1].testament !== b[1].testament) {
                      return a[1].testament === "OT" ? -1 : 1
                    }
                    // Then sort by book code (biblical order)
                    return Number(a[0]) - Number(b[0])
                  })
                  .map(([bookCodeStr, { count, testament }], index) => {
                    const bookCode = Number(bookCodeStr)
                    const bookName = getBookName(bookCode)
                    return (
                      <div key={index} className="flex items-center">
                        <div className="w-24 text-sm truncate mr-2">{bookName}</div>
                        <div className="flex-1 flex items-center">
                          <div
                            className={`h-3 rounded-full mr-2 ${testament === "NT" ? "bg-purple-800" : testament === "OT" ? "bg-brown-600" : "bg-olive-700"}`}
                            style={{ width: `${Math.max(5, (count / maxCount) * 100)}%` }}
                          ></div>
                          <span className="text-xs text-gray-400 min-w-[40px]">{count}</span>
                          {bookRepetitions[bookName] !== undefined && (
                            <span className="ml-2 text-xs bg-gray-800 px-1.5 py-0.5 rounded-full text-blue-400 border border-blue-700">
                              {bookRepetitions[bookName].toFixed(1)}x
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
              </div>
            </ScrollArea>
          </div>
        </TabsContent>

        <TabsContent value="sample">
          <ScrollArea className="h-48 pr-4">
            <div className="space-y-3">
              {sampleDays.map((item) => (
                <div key={item.day} className="bg-gray-800 rounded-md p-3">
                  <div className="text-sm font-medium mb-2 flex items-center">
                    <Calendar className="h-3 w-3 mr-1 text-gray-400" />
                    <span>Day {item.day + 1}</span>
                  </div>
                  <div className="text-xs text-gray-300">
                    {item.readings.map((reading: any, readingIndex: number) => {
                      const book = getBookByCode(reading.bookCode)
                      const testament = getTestament(reading.bookCode) || "OT"
                      return (
                        <span key={readingIndex} className="inline-flex items-center">
                          {readingIndex > 0 && " • "}
                          <span
                            className={`inline-block w-2 h-2 rounded-full mr-1 ${
                              testament === "NT"
                                ? "bg-purple-800"
                                : isWisdomBook(reading.bookCode)
                                ? "bg-olive-700"
                                : "bg-brown-600"
                            }`}
                          ></span>
                          {(book ? book.name : getBookName(reading.bookCode))} {reading.chapter}
                        </span>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
        <TabsContent value="verses">
          <VersesPerDayGraph plan={plan} showDays={15} />
        </TabsContent>
      </Tabs>
    </Card>
  )
}

function isWisdomBook(bookCode: number): boolean {
  // Psalms, Proverbs, Ecclesiastes, Song of Solomon, Job
  return [19, 20, 21, 22, 18].includes(bookCode)
}

// Helper function to get section name
function getSectionName(section: string): string {
  switch (section) {
    case "old-testament":
      return "Old Testament Reading Plan"
    case "new-testament":
      return "New Testament Reading Plan"
    case "psalms":
      return "Psalms Reading Plan"
    case "gospels":
      return "Gospels Reading Plan"
    case "custom":
      return "Custom Reading Plan"
    default:
      return "Bible Reading Plan"
  }
}

// Helper: Get book repetition (reads per chapter) for each book
function getBookRepetitions(plan: any): Record<string, number> {
  if (!plan || !plan.bookReadingCounts) return {}
  const repetitions: Record<string, number> = {}
  Object.entries(plan.bookReadingCounts).forEach(([bookCodeStr, count]) => {
    const bookCode = Number(bookCodeStr)
    const book = getBookByCode(bookCode)
    if (!book) return
    repetitions[book.name] = book.chapters > 0 ? (count as number) / book.chapters : 0
  })
  return repetitions
}
