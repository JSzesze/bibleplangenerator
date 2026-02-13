---
title: "\U0001F680 Release Notes — December 18, 2026"
---
## ✨ Features

### 📄 Document System

- Added **document completion status** to the entries page.
- Introduced visibility for **pending documents with upload support** in user profiles.
- Added **database migrations** to support the new document management system.
- Implemented a **visual timeline** for event registration phases.

### 🏫 Classes & Registration

- Display **registration counts** directly on class cards.
- Introduced a refined **icon-grid layout** for class browsing in admin event page.
- Enlarged class cards for improved readability.
- Added **class template linking**; classes now reference the snapshot it was created from to maintain a chain of ownership.

### 🗓️ Events

- Events now display dates using the **event’s configured timezone** instead of the browser timezone.
- Converted the event detail page to a **sidebar-based layout** for better information hierarchy.
- Consolidated event management actions into **modal dialogs**.

### 🏆 Series / Championships groundwork (UI + APIs)

Laid the foundation for Series/Championships by introducing initial UI scaffolding plus the API/data-layer building blocks needed to support upcoming season and championship functionality.

#### Goals

- Support multiple **series types** to enable future customization of event structure, ownership, and payouts.

#### Series models (TBD)

**Club Series**

- A single organization owns and operates the series.
- The organization owns the classes, events, and registrations.
- The organization receives all revenue.

**Regional Series**

- Multiple organizations participate in a shared series.
- Classes may be standardized across organizations or mapped per organization.
- Revenue may flow to host organizations, the series owner, or be split.

**Promoter Series**

- One organization operates the series.
- The promoter rents venues from host tracks.
- The promoter owns registrations and collects revenue.
- Host venues may receive payouts or per-event fees.

---

## 🐛 Fixes

### 📄 Documents & Registration

- Removed **document blocking** from the registration flow.
- Fixed document requirement saving by separating **insert vs. upsert logic**.
- Added targeted logging to diagnose document and date/time issues.

### 🗓️ Events

- Fixed incorrect **UTC conversion** for `datetime-local` inputs.
- Corrected venue display issues on event detail pages.
- Fixed inaccurate **registration counts**.
- Resolved navigation issues after updating events.

### 🧭 Navigation & Layout

- Fixed a NavMain **grouping prop error** in the app shell.

---

## 🔧 Improvements

### 🧭 UI & Layout Refinement

- Refactored event detail pages to be more concise and scannable.
- Improved sidebar organization, grouping, and alignment.
- Updated event images to a consistent **16:9 aspect ratio**.
- Consolidated class management buttons to reduce visual clutter.

### 🧹 Maintenance & Technical Cleanup

- Removed `pnpm-lock.yaml` to resolve dependency and environment conflicts.
- Applied miscellaneous **type updates** for improved consistency.
- General code formatting and component cleanup to align with newer patterns.
- Fixed **RLS** for org members to allow only owners to promote users to Owner role.

---

## ✅ Summary

This release focuses on **new document capabilities**, **cleaner and more informative class and event management**, and **significant UI simplification**, while also resolving several edge cases related to registration, navigation, and timezones.

```javascript
function initialize() {
  console.log("Sovereign Protocol Active");
}
```

