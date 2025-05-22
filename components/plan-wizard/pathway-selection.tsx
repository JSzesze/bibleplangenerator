"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import ReadingPlanPreview from "./reading-plan-preview"
import TimelineVisualization from "./timeline-visualization"

interface PathwaySelectionProps {
  section: string
  value: string
  onChange: (value: string) => void
  selectedBooks: number[] // Add this prop
}

export default function PathwaySelection({ section, value, onChange, selectedBooks }: PathwaySelectionProps) {
  const sectionName = getSectionName(section)

  // Determine stream type based on section
  const streamType =
    section === "old-testament"
      ? "ot"
      : section === "new-testament" || section === "gospels"
        ? "nt"
        : section === "psalms"
          ? "wisdom"
          : "custom"

  // Create timeline streams (single stream)
  const streams = [
    {
      type: streamType as "ot" | "nt" | "wisdom" | "custom",
      label:
        section === "old-testament"
          ? "Old Testament"
          : section === "new-testament"
            ? "New Testament"
            : section === "gospels"
              ? "Gospels"
              : section === "psalms"
                ? "Psalms"
                : "Custom Selection",
    },
  ]

  return (
    <div className="flex-1 flex flex-col">
      <h1 className="text-3xl font-bold text-center mb-8">
        Choose a pathway
        <br />
        through {sectionName}
      </h1>

      <TimelineVisualization streams={streams} />

      <div className="space-y-6 mt-4">
        <PathwayButton
          title="Follow Storyline"
          description="Books and chapters are arranged in the chronological order that events happened."
          isSelected={value === "storyline"}
          onClick={() => onChange("storyline")}
        />

        <PathwayButton
          title="Straight Through"
          description="The order of your Bible's table of contents."
          isSelected={value === "straight"}
          onClick={() => onChange("straight")}
        />

        <PathwayButton
          title="Hebrew Tradition"
          description="The traditional Hebrew (aka Tanakh) ordering of the Old Testament books."
          isSelected={value === "hebrew"}
          onClick={() => onChange("hebrew")}
        />
      </div>

      <div className="mt-6">
        <ReadingPlanPreview
          config={{
            readingType: "section",
            duration: { type: "months", value: 12 },
            wholeBibleConfig: {
              newTestamentPlacement: "alongside",
              wisdomBooksPlacement: "alongside",
              includedWisdomBooks: [],
            },
            sectionConfig: {
              section,
              pathway: value,
              selectedBooks,
            },
          }}
          showOnlyOnFinal={true}
        />
      </div>
    </div>
  )
}

interface PathwayButtonProps {
  title: string
  description: string
  isSelected: boolean
  onClick: () => void
}

function PathwayButton({ title, description, isSelected, onClick }: PathwayButtonProps) {
  return (
    <Button
      variant="outline"
      className={cn(
        "w-full h-auto py-6 px-4 flex items-start justify-between border-gray-700 hover:bg-gray-800",
        isSelected && "border-white bg-gray-800",
      )}
      onClick={onClick}
      aria-checked={isSelected}
      role="radio"
    >
      <div className="text-left flex-1 pr-4 min-w-0">
        <div className="text-xl font-medium">{title}</div>
        <div className="text-sm text-gray-400 whitespace-normal break-words">{description}</div>
      </div>
      <div className="rounded-full w-6 h-6 border border-gray-500 flex-shrink-0 flex items-center justify-center">
        {isSelected && <div className="w-3 h-3 rounded-full bg-white"></div>}
      </div>
    </Button>
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
      return "your selection"
    default:
      return "the Bible"
  }
}
