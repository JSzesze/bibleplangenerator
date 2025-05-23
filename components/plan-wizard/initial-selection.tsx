"use client"

import { Button } from "@/components/ui/button"
import { BookOpen, BookText, Bookmark, Settings, Layers } from "lucide-react"
import { cn } from "@/lib/utils"

interface InitialSelectionProps {
  value: string
  onChange: (value: string) => void
  showPresetOption?: boolean
  showCustomOption?: boolean
}

export default function InitialSelection({
  value,
  onChange,
  showPresetOption = true,
  showCustomOption = true,
}: InitialSelectionProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center space-y-12">
      <h1 className="text-3xl font-bold text-center">
        What would you like
        <br />
        to read through?
      </h1>

      <div className="w-full space-y-4">
        <Button
          variant="outline"
          className={cn(
            "w-full h-auto py-6 px-4 flex items-center justify-between text-xl border-gray-700 hover:bg-gray-800",
            value === "whole" && "border-white bg-gray-800",
          )}
          onClick={() => onChange("whole")}
        >
          <div className="flex items-center">
            <BookOpen className="h-6 w-6 mr-4 text-blue-500" />
            <span>The whole Bible</span>
          </div>
          <div className="rounded-full w-6 h-6 border border-gray-500 flex items-center justify-center">
            {value === "whole" && <div className="w-3 h-3 rounded-full bg-white"></div>}
          </div>
        </Button>

        <Button
          variant="outline"
          className={cn(
            "w-full h-auto py-6 px-4 flex items-center justify-between text-xl border-gray-700 hover:bg-gray-800",
            value === "section" && "border-white bg-gray-800",
          )}
          onClick={() => onChange("section")}
        >
          <div className="flex items-center">
            <BookText className="h-6 w-6 mr-4 text-blue-500" />
            <span>Just a section</span>
          </div>
          <div className="rounded-full w-6 h-6 border border-gray-500 flex items-center justify-center">
            {value === "section" && <div className="w-3 h-3 rounded-full bg-white"></div>}
          </div>
        </Button>

        {showPresetOption && (
          <Button
            variant="outline"
            className={cn(
              "w-full h-auto py-6 px-4 flex items-center justify-between text-xl border-gray-700 hover:bg-gray-800",
              value === "preset" && "border-white bg-gray-800",
            )}
            onClick={() => onChange("preset")}
          >
            <div className="flex items-center">
              <Bookmark className="h-6 w-6 mr-4 text-blue-500" />
              <span>Use a preset plan</span>
            </div>
            <div className="rounded-full w-6 h-6 border border-gray-500 flex items-center justify-center">
              {value === "preset" && <div className="w-3 h-3 rounded-full bg-white"></div>}
            </div>
          </Button>
        )}

        {showCustomOption && (
          <Button
            variant="outline"
            className={cn(
              "w-full h-auto py-6 px-4 flex items-center justify-between text-xl border-gray-700 hover:bg-gray-800",
              value === "stream-by-stream" && "border-white bg-gray-800",
            )}
            onClick={() => onChange("stream-by-stream")}
          >
            <div className="flex items-center">
              <Layers className="h-6 w-6 mr-4 text-blue-500" />
              <span>Build stream by stream</span>
            </div>
            <div className="rounded-full w-6 h-6 border border-gray-500 flex items-center justify-center">
              {value === "stream-by-stream" && <div className="w-3 h-3 rounded-full bg-white"></div>}
            </div>
          </Button>
        )}
      </div>
    </div>
  )
}
