"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Users, Check } from "lucide-react"
import { Badge } from "@/components/ui/badge"

import { createHornerConfig, createMCheyneConfig, createWorkweekConfig, createGenesisExodusThenNTConfig } from "@/lib/plan-presets"
import { generateMultiStreamPlan } from "@/lib/plan-generator"
import ReadingPlanPreview from "./reading-plan-preview"
import bibleBooks from "@/constants/books.json"
import TimelineVisualization from "./timeline-visualization"

interface PresetPlanFlowProps {
  onComplete: (presetConfig: any) => void
  onBack: () => void
  duration?: {
    type: string
    value: number
  }
}

export default function PresetPlanFlow({ onComplete, onBack }: PresetPlanFlowProps) {
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null)
  const [previewPlan, setPreviewPlan] = useState<any>(null)
  const [streamVisualization, setStreamVisualization] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  
  // Preset plans have their own natural durations
  const getPresetDuration = (presetId: string) => {
    switch (presetId) {
      case "horner":
        return { type: "days", value: 365 } // Professor Horner's is designed for 1 year
      case "mcheyne":
        return { type: "days", value: 365 } // M'Cheyne is designed for 1 year
      case "workweek":
        return { type: "days", value: 260 } // 5 days/week for 52 weeks
      case "gen-ex-nt":
        return { type: "days", value: 365 } // Genesis, Exodus, then New Testament is designed for 1 year
      default:
        return { type: "days", value: 365 }
    }
  }

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
    {
      id: "gen-ex-nt",
      title: "Genesis, Exodus, then New Testament",
      description: "Read Genesis and Exodus, then the entire New Testament in a single stream.",
      icon: <Calendar className="h-8 w-8 text-orange-500" />,
      tags: ["Single stream", "Genesis", "Exodus", "New Testament"],
      getConfig: () => createGenesisExodusThenNTConfig(),
      color: "bg-orange-500",
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
      const presetDuration = getPresetDuration(selectedPreset)
      const visualization = generateStreamVisualization(config.streams)
      setStreamVisualization(visualization)

      // Generate plan preview using preset's natural duration
      const totalDays = presetDuration.value

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
  }, [selectedPreset])

  // Function to generate stream visualization data
  const generateStreamVisualization = (streams: any[]) => {
    console.log("[DEBUG] Input streams:", streams)
    // If all streams have a 'label' property (Horner), just map them directly
    if (streams.every((s) => s.label)) {
      // Calculate repetitions for each list using preset's natural duration
      const presetDuration = selectedPreset ? getPresetDuration(selectedPreset) : { type: "days", value: 365 }
      const totalPlanDays = presetDuration.value
      const result = streams.map((stream) => {
        // Sum chapters for this list
        const totalChapters = stream.bookCodes.reduce((sum: number, code: number) => {
          const book = bibleBooks.find((b: any) => b.bookCode === code)
          return sum + (book ? book.chapters : 0)
        }, 0)
        // Calculate repetitions (rounded to 1 decimal)
        const repetitions = totalChapters > 0 ? Number((totalPlanDays / totalChapters).toFixed(2)) : 1
        const fullRepeats = Math.floor(repetitions)
        let partialRepeat = Math.round((repetitions - fullRepeats) * 100) / 100
        // Only add partial if it's visually meaningful
        const segments = [
          ...Array(fullRepeats).fill({ type: "custom", size: 1 }),
          ...(partialRepeat > 0.05 ? [{ type: "custom", size: partialRepeat }] : []),
        ]
        return {
          type: "custom",
          label: stream.label,
          repetitions,
          segments,
          color: undefined,
        }
      })
      console.log("[DEBUG] Horner visualization output:", result)
      if (result.length !== 10) {
        console.warn("[DEBUG] Horner plan should have 10 streams, got:", result.length)
      }
      return result
    }
    // Otherwise, fall back to previous logic
    const fallback = streams.map((stream) => {
      // Otherwise, fall back to previous logic
      const firstBookCode = stream.bookCodes[0]
      const lastBookCode = stream.bookCodes[stream.bookCodes.length - 1]

      let streamType = "custom"
      let label = ""

      // Check if stream is OT
      if (
        firstBookCode >= 1 &&
        lastBookCode <= 39 &&
        !stream.bookCodes.some((code: number) => [18, 19, 20, 21, 22].includes(code))
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
      else if (stream.bookCodes.every((code: number) => [18, 19, 20, 21, 22].includes(code))) {
        streamType = "wisdom"
        label = "Wisdom Books"
      }
      // Check if stream is Psalms
      else if (stream.bookCodes.length === 1 && stream.bookCodes[0] === 19) {
        streamType = "wisdom"
        label = "Psalms"
      }
      // Check if stream is Pentateuch
      else if (stream.bookCodes.every((code: number) => code >= 1 && code <= 5)) {
        streamType = "ot"
        label = "Pentateuch"
      }
      // Check if stream is Gospels
      else if (stream.bookCodes.every((code: number) => code >= 40 && code <= 43)) {
        streamType = "nt"
        label = "Gospels"
      }
      // Mixed stream or other
      else {
        // Try to create a descriptive label
        const bookNames = stream.bookCodes.map((code: number) => {
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
        repetitions: stream.bookCodes.length > 5 ? 2 : 1,
      }
    })
    console.log("[DEBUG] Fallback visualization output:", fallback)
    return fallback
  }

  const handleSelectPreset = (presetId: string) => {
    setSelectedPreset(presetId)
  }

  const handleConfirmPreset = () => {
    const preset = presets.find((p) => p.id === selectedPreset)
    if (preset && selectedPreset) {
      const config = preset.getConfig()
      const presetDuration = getPresetDuration(selectedPreset)

      // Pass the selected preset configuration back to the parent
      onComplete({
        presetId: selectedPreset,
        presetName: preset.title,
        presetConfig: config,
        totalPlanDays: presetDuration.value,
        duration: presetDuration, // Include the preset's natural duration
      })
    }
  }

  if (streamVisualization.length > 0) {
    console.log("TimelineVisualization props:", streamVisualization)
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
                  segments: stream.segments,
                  color: presets.find((p) => p.id === selectedPreset)?.color,
                }))}
                proportional={true}
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
                  duration: selectedPreset ? getPresetDuration(selectedPreset) : { type: "days", value: 365 },
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
