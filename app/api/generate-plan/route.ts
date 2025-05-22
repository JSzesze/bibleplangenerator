import { type NextRequest, NextResponse } from "next/server"
import {
  generateSequentialPlan,
  generateMultiStreamPlan,
  generateTopicalPlan,
  generateChronologicalPlan,
  type PrecalculatedDailyPlanSchema,
} from "@/lib/plan-generator"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { planType, ...params } = body

    let plan: PrecalculatedDailyPlanSchema

    switch (planType) {
      case "sequential":
        plan = await generateSequentialPlan(params)
        break
      case "multi-stream":
        plan = await generateMultiStreamPlan(params)
        break
      case "topical":
        plan = await generateTopicalPlan(params)
        break
      case "chronological":
        plan = await generateChronologicalPlan(params)
        break
      default:
        return NextResponse.json(
          { error: "Invalid plan type. Must be one of: sequential, multi-stream, topical, chronological" },
          { status: 400 },
        )
    }

    return NextResponse.json(plan)
  } catch (error) {
    console.error("Error generating plan:", error)
    return NextResponse.json({ error: "Failed to generate reading plan" }, { status: 500 })
  }
}
