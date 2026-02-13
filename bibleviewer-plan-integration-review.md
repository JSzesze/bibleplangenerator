# Bible viewer ↔ Plan integration review

## How the plan populates the Chapter screen

1. **Plan screen** (`app/plan/[id].tsx`)  
   Renders `PlanContent` with plan data and selected day.

2. **PlanContent** → **DaySection**  
   For the selected day, `readings` is that day’s array of `{ bookCode, chapter }`.

3. **DaySection** → **ReadingItemCard**  
   Each card’s **Read** action calls:
   ```ts
   openPlanChapter(router, {
     bookCode, chapterNumber, bookName,
     planId, planDayIndex: dayIndex, planReadings: readings  // that day only
   });
   ```

4. **openPlanChapter** (`helpers/bibleNavigation.ts`)  
   Pushes `/bibleviewer` with params:  
   `bookCode`, `chapterNumber`, `bookName`, `planId`, `planDayIndex`, `planReadings: JSON.stringify(planReadings)`.

5. **BibleViewerRoute** (`app/bibleviewer/index.tsx`)  
   If `chapterNumber` is set, renders `ChapterScreenContent`. Plan params stay in the URL; the route doesn’t read them.

6. **ChapterScreenContent**  
   - Reads `planId`, `planDayIndex`, `planReadings` from `useLocalSearchParams()`.
   - Parses `planReadings` from JSON and finds `currentReadingIndex` (index of current book+chapter in that array).
   - Builds `planContext`: `planId`, `dayIndex`, `readings`, `currentReadingIndex`, `onNavigateToReading`, `onMarkReadingComplete`.
   - Passes `planContext` into `ChapterView`.

7. **ChapterView**  
   Forwards `planContext` to `ChapterPillNavigation`.

8. **ChapterPillNavigation**  
   When `planContext` is set it uses **plan-scoped** prev/next:  
   `planNav.onPrev` / `planNav.onNext` call `onNavigateToReading(readings[index ± 1])`, and the label is “X of Y”.  
   The checkmark calls both `onMarkChapterComplete` and `planContext.onMarkReadingComplete`.

So the **current reading items** that populate the Chapter screen are the **day’s readings** passed once via URL and then kept in route params when moving between readings (prev/next only updates `bookCode` / `chapterNumber` / `bookName`).

---

## Efficiency

- **One-time cost:** The day’s readings are JSON-serialized into the URL when opening from the plan. One `JSON.parse` in `ChapterScreenContent` is cheap.
- **URL size:** For a day with many readings the query string can get long; if you ever support 20+ readings per day, consider storing plan context in memory/context and only putting `planId` + `dayIndex` (+ optional `readingIndex`) in the URL for deep links.
- **No redundant fetches:** Plan list isn’t re-fetched when opening the chapter; we only use params. Plan progress wasn’t used for the pill’s “complete” state (see below).

Overall the approach is efficient; the main improvement is making the pill reflect plan completion state.

---

## Why the pill feels disconnected

1. **Complete state not tied to plan progress**  
   The pill’s checkmark used only `isChapterComplete` (from `ChapterView`’s `chapterMarkedComplete`). It did **not** use whether this reading is already completed in the plan. So opening an already-completed reading from the plan showed an unchecked pill until the user tapped again.  
   **Fix:** Use plan progress to derive “reading complete” and pass it into the pill when in plan context (see implementation below).

2. **No “Day X” or “Back to plan”**  
   In plan context the pill shows “1 of 5” but not which day. There’s no explicit “Day 3” or “Back to plan” in the chapter UI. The system back button goes back to the plan; adding a “Day X” or “Back to plan” in the header could make the connection clearer.

3. **Single source of readings**  
   The list of readings is built in the plan (DaySection) and passed through the URL. The pill only receives that list via `planContext.readings` and doesn’t know book names for each item (it could show “Genesis 1”, “Genesis 2” in a picker later if desired).

---

## Changes made

1. **ChapterScreenContent**  
   When `planId` and `planDayIndex` are present, we now load plan progress (`planProgressService.getPlanProgress`) via React Query and compute whether the **current** reading is in `completedReadingsByDay` for that day. We pass `isReadingComplete` in `planContext` (true if already completed in plan **or** just marked in this session).

2. **ChapterPillNavigation**  
   When `planContext` is set, the pill uses `planContext.isReadingComplete` for the checkmark state and disabled state of the “mark complete” button, so the pill stays in sync with plan completion and no longer feels disconnected.
