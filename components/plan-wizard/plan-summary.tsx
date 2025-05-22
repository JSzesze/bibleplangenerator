"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Calendar, BookOpen, Share2, Download } from "lucide-react"
import { useEffect, useState } from "react"
import bibleBooks from "@/constants/books.json"
import { generateSequentialPlan, generateMultiStreamPlan, calculatePlanStatistics } from "@/lib/plan-generator"
import { createWholeBibleConfig } from "@/lib/plan-presets"
import type { WholeBibleConfig } from "./whole-bible-flow"
import VersesPerDayGraph from "./verses-per-day-graph"
import BookReadingStats from "./book-reading-stats"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

interface PlanSummaryProps {
  config: {
    readingType: string
    section: string
    pathway: string
    duration: {
      type: string
      value: number
    }
    selectedBooks: number[]
    wholeBibleConfig: WholeBibleConfig
    presetConfig: any
  }
}

export default function PlanSummary({ config }: PlanSummaryProps) {
  const [plan, setPlan] = useState<any>(null)
  const [planStats, setPlanStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function generatePlan() {
      try {
        let planData

        if (config.readingType === "preset" && config.presetConfig) {
          // Generate plan using the preset config
          const { presetConfig, presetName, totalPlanDays } = config.presetConfig

          planData = await generateMultiStreamPlan({
            id: `plan-${Date.now()}`,
            name: presetName || "Preset Bible Reading Plan",
            description: `A ${config.duration.value} ${config.duration.type} reading plan using the ${presetName} format.`,
            streams: presetConfig.streams,
            totalPlanDays: totalPlanDays,
            tags: ["preset", presetName?.toLowerCase() || "", `${config.duration.value}-${config.duration.type}`],
            author: "Bible Plan Generator",
            version: "1.0",
          })
        } else if (config.readingType === "whole") {
          // Use the createWholeBibleConfig function to generate the configuration
          const wholeBibleConfig = createWholeBibleConfig({
            newTestamentPlacement: config.wholeBibleConfig.newTestamentPlacement,
            wisdomBooksPlacement: config.wholeBibleConfig.wisdomBooksPlacement,
            includedWisdomBooks: config.wholeBibleConfig.includedWisdomBooks,
            totalPlanDays: config.duration.type === "months" ? config.duration.value * 30 : config.duration.value * 7,
          })

          // Use the original generateMultiStreamPlan function with the configuration
          planData = await generateMultiStreamPlan({
            id: `plan-${Date.now()}`,
            name: "Whole Bible Reading Plan",
            description: `A ${config.duration.value} ${config.duration.type} reading plan through the entire Bible.`,
            streams: wholeBibleConfig.streams,
            totalPlanDays: wholeBibleConfig.totalPlanDays,
            tags: ["whole-bible", `${config.duration.value}-${config.duration.type}`],
            author: "Bible Plan Generator",
            version: "1.0",
          })
        } else {
          // Generate a sequential plan for a section
          planData = await generateSequentialPlan({
            id: `plan-${Date.now()}`,
            name: getPlanName(config),
            description: `A ${config.duration.value} ${config.duration.type} reading plan through ${getSectionName(config.section)}.`,
            booksToInclude: config.selectedBooks.map((bookCode) => ({ bookCode })),
            chaptersPerDay: 1,
            totalPlanDays: config.duration.type === "months" ? config.duration.value * 30 : config.duration.value * 7,
            tags: [config.section, config.pathway, `${config.duration.value}-${config.duration.type}`],
            author: "Bible Plan Generator",
            version: "1.0",
          })
        }

        // Calculate plan statistics
        const stats = calculatePlanStatistics(planData)
        setPlanStats(stats)
        setPlan(planData)
      } catch (error) {
        console.error("Error generating plan:", error)
      } finally {
        setLoading(false)
      }
    }

    generatePlan()
  }, [config])

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="text-xl">Generating your plan...</div>
      </div>
    )
  }

  const handleDownloadJson = () => {
    if (plan) {
      // Create a copy of the plan to modify for export
      const exportPlan = { ...plan }

      // Remove bookReadingCounts from the export
      delete exportPlan.bookReadingCounts

      // First, stringify the entire plan with pretty formatting
      const jsonString = JSON.stringify(exportPlan, null, 2)

      // Find the dailyReadings section and replace it with a compact version
      const dailyReadingsRegex = /"dailyReadings": \[\s+\[[\s\S]*?\]\s+\]/g

      // Create a compact version of the dailyReadings array
      const compactDailyReadings = JSON.stringify(exportPlan.dailyReadings)
        // Remove all whitespace between elements
        .replace(/\s+/g, "")

      // Replace the dailyReadings section with the compact version
      const compactJson = jsonString.replace(dailyReadingsRegex, `"dailyReadings": ${compactDailyReadings}`)

      const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(compactJson)
      const exportFileDefaultName = `${plan.name.toLowerCase().replace(/\s+/g, "-")}.json`

      const linkElement = document.createElement("a")
      linkElement.setAttribute("href", dataUri)
      linkElement.setAttribute("download", exportFileDefaultName)
      linkElement.click()
    }
  }

  return (
    <div className="flex-1 flex flex-col">
      <h1 className="text-3xl font-bold text-center mb-4">Your Reading Plan</h1>

      <p className="text-center text-gray-400 mb-8">
        {plan?.description || "Your personalized Bible reading plan is ready."}
      </p>

      <Card className="bg-gray-900 border-gray-800 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">{plan?.name || "Bible Reading Plan"}</h2>
          <Calendar className="h-5 w-5 text-gray-400" />
        </div>

        <div className="flex items-center text-gray-400 mb-6">
          <BookOpen className="h-4 w-4 mr-2" />
          <span>
            {plan?.totalPlanDays || 0} days •{" "}
            {plan?.dailyReadings.reduce((sum: number, day: any[]) => sum + day.length, 0) || 0} readings
          </span>
        </div>

        {planStats && (
          <div className="mb-6 text-sm">
            <div className="text-gray-400 mb-2">Reading Distribution:</div>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-gray-800 p-2 rounded text-center">
                <div className="flex items-center justify-center mb-1">
                  <span className="inline-block w-2 h-2 rounded-full mr-1 bg-brown-600"></span>
                  <span>Old Testament</span>
                </div>
                <div className="text-lg font-bold">{planStats.oldTestament.repetition}x</div>
              </div>
              <div className="bg-gray-800 p-2 rounded text-center">
                <div className="flex items-center justify-center mb-1">
                  <span className="inline-block w-2 h-2 rounded-full mr-1 bg-purple-800"></span>
                  <span>New Testament</span>
                </div>
                <div className="text-lg font-bold">{planStats.newTestament.repetition}x</div>
              </div>
              <div className="bg-gray-800 p-2 rounded text-center">
                <div className="flex items-center justify-center mb-1">
                  <span className="inline-block w-2 h-2 rounded-full mr-1 bg-olive-700"></span>
                  <span>Wisdom Books</span>
                </div>
                <div className="text-lg font-bold">{planStats.wisdomBooks.repetition}x</div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <div className="text-sm text-gray-400">First 3 days:</div>
          {plan?.dailyReadings.slice(0, 3).map((day: any[], index: number) => (
            <div key={index} className="bg-gray-800 rounded-md p-3">
              <div className="text-sm font-medium mb-2">Day {index + 1}</div>
              <div className="text-sm text-gray-300">
                {day.map((reading, readingIndex) => {
                  const book = bibleBooks.find((b: any) => b.bookCode === reading.bookCode)
                  return (
                    <span key={readingIndex}>
                      {readingIndex > 0 && " • "}
                      {book?.name || `Book ${reading.bookCode}`} {reading.chapter}
                    </span>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="space-y-6 mt-6">
        <Tabs defaultValue="verses">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="verses">Verses Per Day</TabsTrigger>
            <TabsTrigger value="books">Book Statistics</TabsTrigger>
          </TabsList>
          <TabsContent value="verses">
            <VersesPerDayGraph plan={plan} showDays={30} />
          </TabsContent>
          <TabsContent value="books">
            <BookReadingStats plan={plan} />
          </TabsContent>
        </Tabs>

        <div className="grid grid-cols-2 gap-4">
          <Button variant="outline" className="border-gray-700">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button variant="outline" className="border-gray-700" onClick={handleDownloadJson}>
            <Download className="h-4 w-4 mr-2" />
            Download JSON
          </Button>
        </div>
      </div>
    </div>
  )
}

function getSectionName(section: string): string {
  switch (section) {
    case "old-testament":
      return "the Old Testament"
    case "new-testament":
      return "the New Testament"
    case "psalms":
      return "Psalms"
    case "gospels":
      return "the Gospels"
    case "custom":
      return "selected books"
    default:
      return "the Bible"
  }
}

function getPlanName(config: any): string {
  const sectionName = {
    "old-testament": "Old Testament",
    "new-testament": "New Testament",
    psalms: "Psalms",
    gospels: "Gospels",
    custom: "Custom",
    "": "Bible",
  }[config.section]

  const pathwayName = {
    storyline: "Chronological",
    straight: "",
    hebrew: "Hebrew Tradition",
    "": "",
  }[config.pathway]

  const duration = `${config.duration.value} ${config.duration.type}`

  return `${pathwayName} ${sectionName} in ${duration}`.replace(/\s+/g, " ").trim()
}
