import TimelineVisualization from "@/components/plan-wizard/timeline-visualization"
import { createHornerConfig } from "@/lib/plan-presets"
import bibleBooks from "@/constants/books.json"

function generateHornerTimelineStreams() {
  const config = createHornerConfig()
  const totalPlanDays = config.totalPlanDays

  return config.streams.map((stream) => {
    const totalChapters = stream.bookCodes.reduce((sum, code) => {
      const book = bibleBooks.find((b) => b.bookCode === code)
      return sum + (book ? book.chapters : 0)
    }, 0)
    const repetitions = totalChapters > 0 ? Number((totalPlanDays / totalChapters).toFixed(2)) : 1
    const fullRepeats = Math.floor(repetitions)
    let partialRepeat = Math.round((repetitions - fullRepeats) * 100) / 100
    const segments = [
      ...Array(fullRepeats).fill({ type: "custom" as const, size: 1 }),
      ...(partialRepeat > 0.05 ? [{ type: "custom" as const, size: partialRepeat }] : []),
    ]
    return {
      type: "custom" as const,
      label: stream.label,
      repetitions,
      segments,
      color: undefined,
    }
  })
}

export default function TimelinePage() {
  const streams = generateHornerTimelineStreams()
  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-8 text-center">Professor Horner's Bible Reading System Timeline</h1>
      <TimelineVisualization streams={streams} />
    </div>
  )
} 