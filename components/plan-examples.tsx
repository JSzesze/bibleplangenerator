"use client"

import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Calendar } from "lucide-react"
import { createMCheyneConfig, createWorkweekConfig } from "@/lib/plan-presets"

interface PlanExampleProps {
  onSelect: (planType: string, config: any) => void
}

export function PlanExamples({ onSelect }: PlanExampleProps) {
  const examplePlans = [
    {
      title: "New Testament in 90 Days",
      description: "Read through the entire New Testament in 90 days, one chapter per day.",
      type: "sequential",
      config: {
        booksToInclude: Array.from({ length: 27 }, (_, i) => ({ bookCode: i + 40 })),
        chaptersPerDay: 1,
        totalPlanDays: 90,
        tags: ["new testament", "90 days"],
      },
      icon: <BookOpen className="h-10 w-10 text-primary/60" />,
    },
    {
      title: "5-Day Workweek Plan",
      description: "Read through the Bible in one year, with readings only on weekdays.",
      type: "multi-stream",
      config: createWorkweekConfig(),
      icon: <Calendar className="h-10 w-10 text-primary/60" />,
    },
    {
      title: "M'Cheyne Family Worship",
      description:
        "Classic plan with 4 daily readings that takes you through the NT and Psalms twice, and the OT once in a year.",
      type: "multi-stream",
      config: createMCheyneConfig(),
      icon: <BookOpen className="h-10 w-10 text-primary/60" />,
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {examplePlans.map((plan, index) => (
        <Card key={index}>
          <CardHeader className="pb-2">
            <div className="mb-2">{plan.icon}</div>
            <CardTitle>{plan.title}</CardTitle>
            <CardDescription>{plan.description}</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button variant="outline" className="w-full" onClick={() => onSelect(plan.type, plan.config)}>
              Use This Template
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
