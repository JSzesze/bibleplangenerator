import { type PrecalculatedDailyPlanSchema, generateSequentialPlan, generateMultiStreamPlan } from "./plan-generator"
import { createHornerConfig } from "./plan-presets"

/**
 * Generate example Bible reading plans
 */
export async function generateExamplePlans(): Promise<PrecalculatedDailyPlanSchema[]> {
  const plans: PrecalculatedDailyPlanSchema[] = []

  // New Testament Sequential Plan
  const ntPlan = await generateSequentialPlan({
    id: "new-testament-sequential",
    name: "New Testament in 90 Days",
    description: "Read through the entire New Testament, one chapter per day.",
    booksToInclude: Array.from({ length: 27 }, (_, i) => ({ bookCode: i + 40 })), // Books 40-66 (NT)
    chaptersPerDay: 1,
    totalPlanDays: 90,
    tags: ["new testament", "sequential", "90 days"],
    author: "Bible Plan Generator",
    version: "1.0",
  })

  plans.push(ntPlan)

  // Horner-Style 10-Stream Plan using the preset
  const hornerConfig = createHornerConfig()
  const hornerPlan = await generateMultiStreamPlan({
    id: "horner-10-stream-365",
    name: "Professor Horner's Bible Reading System",
    description:
      "A 10-stream Bible reading plan that takes you through different sections of the Bible simultaneously.",
    streams: hornerConfig.streams,
    totalPlanDays: hornerConfig.totalPlanDays,
    tags: ["horner", "multi-stream", "yearly"],
    author: "Bible Plan Generator",
    version: "1.0",
  })

  plans.push(hornerPlan)

  return plans
}

/**
 * Generate and save example plans to JSON files
 */
export async function generateAndSaveExamplePlans(): Promise<void> {
  const plans = await generateExamplePlans()

  // In a real application, you would save these to files
  // For this example, we'll just log them
  plans.forEach((plan) => {
    console.log(`Generated plan: ${plan.name}`)
    console.log(`Total days: ${plan.totalPlanDays}`)
    console.log(`Total readings: ${plan.dailyReadings.reduce((sum, day) => sum + day.length, 0)}`)
    console.log("---")
  })
}
