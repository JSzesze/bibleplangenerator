"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Users, Check } from "lucide-react"
import { Badge } from "@/components/ui/badge"

import { createHornerConfig, createMCheyneConfig, createWorkweekConfig } from "@/lib/plan-presets"
import { generateMultiStreamPlan } from "@/lib/plan-generator"
import ReadingPlanPreview from "./reading-plan-preview"
import bibleBooks from "@/constants/books.json"
import TimelineVisualization from "./timeline-visualization"

interface PresetPlanFlowProps {
  onComplete: (presetConfig: any) => void
  onBack: () => void
  duration: {
    type: string
    value: number
  }
}

export default function PresetPlanFlow({ onComplete, onBack, duration }: PresetPlanFlowProps) {
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null)
  const [previewPlan, setPreviewPlan] = useState<any>(null)
  const [streamVisualization, setStreamVisualization] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const presets = [
    {
      id: "horner",
      title: "Professor Horner's System",
      description: "A 10-stream plan that takes you through different sections of the Bible each day.",
      icon: <Calendar className="h-8 w-8 text-blue-500" />,
      tags: ["Thorough", "10 readings daily", "Classic"],
      getConfig: () => createHornerConfig(),
      color: "bg-blue-600",
    },
    {
      id: "mcheyne",
      title: "M'Cheyne Family Worship",
      description: "Read the NT and Psalms twice, OT once in a year. Great for family reading.",
      icon: <Users className="h-8 w-8 text-purple-600" />,
      tags: ["Family", "4 readings daily", "Classic"],
      getConfig: () => createMCheyneConfig(),
      color: "bg-purple-600",
    },
    {
      id: "workweek",
      title: "5-Day Workweek Plan",
      description: "Read through the Bible in one year, with readings only on weekdays.",
      icon: <Calendar className="h-8 w-8 text-green-600" />,
      tags: ["Weekdays only", "Work-friendly", "Balanced"],
      getConfig: () => createWorkweekConfig(),
      color: "bg-green-600",
    },
  ]

  // Generate stream visualization and preview when a preset is selected
  useEffect(() => {
    if (!selectedPreset) return

    const generatePreview = async () => {
      setLoading(true)
      const preset = presets.find((p) => p.id === selectedPreset)
      if (!preset) {
        setLoading(false)
        return
      }

      // Generate visualization
      const config = preset.getConfig()
      const visualization = generateStreamVisualization(config.streams)
      setStreamVisualization(visualization)

      // Generate plan preview
      const totalDays = duration.type === "months" ? duration.value * 30 : duration.value * 7

      try {
        const planData = await generateMultiStreamPlan({
          id: `${selectedPreset}-${Date.now()}`,
          name: preset.title,
          description: preset.description,
          streams: config.streams,
          totalPlanDays: totalDays,
          tags: preset.tags,
          author: "Bible Plan Generator",
          version: "1.0",
        })

        setPreviewPlan(planData)
      } catch (error) {
        console.error("Error generating plan preview:", error)
      } finally {
        setLoading(false)
      }
    }

    generatePreview()
  }, [selectedPreset, duration])

  // Function to generate stream visualization data
  const generateStreamVisualization = (streams: any[]) => {
    return streams.map((stream) => {
      // Determine stream type based on book codes
      const firstBookCode = stream.bookCodes[0]
      const lastBookCode = stream.bookCodes[stream.bookCodes.length - 1]

      let streamType = "custom"
      let label = ""

      // Check if stream is OT
      if (
        firstBookCode >= 1 &&
        lastBookCode <= 39 &&
        !stream.bookCodes.some((code) => [18, 19, 20, 21, 22].includes(code))
      ) {
        streamType = "ot"
        label = "Old Testament"
      }
      // Check if stream is NT
      else if (firstBookCode >= 40 && lastBookCode <= 66) {
        streamType = "nt"
        label = "New Testament"
      }
      // Check if stream is Wisdom Books
      else if (stream.bookCodes.every((code) => [18, 19, 20, 21, 22].includes(code))) {
        streamType = "wisdom"
        label = "Wisdom Books"
      }
      // Check if stream is Psalms
      else if (stream.bookCodes.length === 1 && stream.bookCodes[0] === 19) {
        streamType = "wisdom"
        label = "Psalms"
      }
      // Check if stream is Pentateuch
      else if (stream.bookCodes.every((code) => code >= 1 && code <= 5)) {
        streamType = "ot"
        label = "Pentateuch"
      }
      // Check if stream is Gospels
      else if (stream.bookCodes.every((code) => code >= 40 && code <= 43)) {
        streamType = "nt"
        label = "Gospels"
      }
      // Mixed stream or other
      else {
        // Try to create a descriptive label
        const bookNames = stream.bookCodes.map((code) => {
          const book = bibleBooks.find((b) => b.bookCode === code)
          return book ? book.name : `Book ${code}`
        })

        if (bookNames.length <= 3) {
          label = bookNames.join(", ")
        } else {
          label = `${bookNames[0]}, ${bookNames[1]}, ...`
        }
      }

      return {
        type: streamType,
        label,
        repetitions: stream.bookCodes.length > 5 ? 2 : 1, // Simulate repetitions for visualization
      }
    })
  }

  const handleSelectPreset = (presetId: string) => {
    setSelectedPreset(presetId)
  }

  const handleConfirmPreset = () => {
    const preset = presets.find((p) => p.id === selectedPreset)
    if (preset) {
      const config = preset.getConfig()

      // Pass the selected preset configuration back to the parent
      onComplete({
        presetId: selectedPreset,
        presetName: preset.title,
        presetConfig: config,
        totalPlanDays: duration.type === "months" ? duration.value * 30 : duration.value * 7,
      })
    }
  }

  return (
    <div className="flex-1 flex flex-col">
      <h1 className="text-3xl font-bold text-center mb-8">
        Choose a proven
        <br />
        reading plan
      </h1>

      <div className="grid grid-cols-1 gap-6 mb-6">
        {presets.map((preset) => (
          <Card
            key={preset.id}
            className={`border transition-all cursor-pointer ${
              selectedPreset === preset.id ? "border-white bg-gray-900" : "border-gray-700 hover:border-gray-500"
            }`}
            onClick={() => handleSelectPreset(preset.id)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center">
                <div className="mr-4">{preset.icon}</div>
                <div>
                  <CardTitle className="text-xl">{preset.title}</CardTitle>
                </div>
                {selectedPreset === preset.id && (
                  <div className="ml-auto">
                    <Check className="h-5 w-5 text-blue-500" />
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm text-gray-400 mb-3">{preset.description}</CardDescription>
              <div className="flex flex-wrap gap-2">
                {preset.tags.map((tag, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedPreset && (
        <>
          <div className="mb-6">
            <h2 className="text-lg font-medium mb-3 text-left">Plan Structure</h2>
            {loading ? (
              <div className="h-32 flex items-center justify-center">
                <p className="text-gray-400">Loading visualization...</p>
              </div>
            ) : streamVisualization.length > 0 ? (
              <TimelineVisualization
                streams={streamVisualization.map((stream) => ({
                  type: stream.type as "ot" | "nt" | "wisdom" | "custom",
                  label: stream.label,
                  repetitions: stream.repetitions,
                  color: presets.find((p) => p.id === selectedPreset)?.color,
                }))}
              />
            ) : null}
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-medium mb-3 text-left">Plan Preview</h2>
            {loading ? (
              <div className="h-32 flex items-center justify-center">
                <p className="text-gray-400">Generating preview...</p>
              </div>
            ) : previewPlan ? (
              <ReadingPlanPreview
                config={{
                  readingType: "preset",
                  duration,
                  presetPlan: previewPlan,
                  wholeBibleConfig: {
                    newTestamentPlacement: "alongside",
                    wisdomBooksPlacement: "alongside",
                    includedWisdomBooks: [],
                  },
                }}
              />
            ) : null}
          </div>

          <Button
            onClick={handleConfirmPreset}
            className="w-full bg-white text-black hover:bg-gray-200 mt-auto"
            disabled={loading}
          >
            {loading ? "Generating Plan..." : "Use This Plan"}
          </Button>
        </>
      )}

      <Button variant="ghost" onClick={onBack} className="w-full mt-4">
        Back
      </Button>
    </div>
  )
}
