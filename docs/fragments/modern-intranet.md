# Modern Intranet Fragment Set Analysis & Plan

## Overview

Based on the Figma screenshots provided in the `temp/` directory, this document outlines the requirements for a new high-fidelity fragment collection: **Modern Intranet**. The goal is to provide a comprehensive set of components for building employee portals, knowledge bases, and learning centers.

## Screenshot Analysis

### 1. Homepage & Dashboard

- **Welcome Banner**: Personalized greeting ("Welcome back, [Name]") with quick action buttons (Book Room, Submit Expense, Request). Needs to handle user context and dynamic linking.
- **Events (Tabbed)**: A component displaying My Events and Company Events in a tabbed list.
- **Announcements**: A clean, text-based list for corporate updates.
- **Quick Links**: A grid-based link list with support for various icons (Liferay/Clay icons or custom SVGs).
- **My Applications**: A specialized icon grid for launching external tools (Slack, Figma, etc.).
- **Onboarding Progress**: A dedicated component with a progress bar and step-based instruction cards.
- **Metric Cards (Stats)**: Simple cards for displaying numeric data (e.g., Pending PTO, Open Positions).

### 2. Social & Communication

- **Intranet Feed**: A complex component allowing users to start a post (text/media) and interact with existing posts (reactions, comments).
- **Trending Topics**: A tag cloud or list of popular hashtags.
- **Newsletter Signup**: A sidebar form component for email subscriptions.

### 3. Knowledge & Learning

- **Repository / File List**: A structured table or list view for files, supporting metadata like Status, Title, and Size.
- **Pinned Items**: A visual grid for favorited/pinned folders and documents.
- **Course & Workshop Cards**: Specialized cards with progress bars for ongoing learning and date-based displays for upcoming workshops.
- **Category Grid**: A clean grid of icon-labeled categories for browsing content areas.

---

## Existing Fragment Audit

Before developing new fragments, the following existing components should be evaluated for adaptation:

| Existing Fragment                                    | Potential Use / Adaptation                                                                 |
| :--------------------------------------------------- | :----------------------------------------------------------------------------------------- |
| `content/fragments/service-card`                     | Can be adapted for **Action Items**, **Browse by Area**, and **Learning Recommendations**. |
| `user-account/fragments/who-am-i`                    | Provides user context logic for the **Welcome Banner**.                                    |
| `dashboard-components/fragments/dashboard-container` | Provides the layout foundation for the various homepage blocks.                            |
| `profile/fragments/profile-summary`                  | Useful for user details in the header and feed.                                            |
| `pulse/fragments/pulse-button`                       | Standardized button interaction.                                                           |

---

## Proposed New Fragments

1.  **`modern-intranet/fragments/welcome-banner`**: Personalized greeting with configurable action buttons.
2.  **`modern-intranet/fragments/intranet-feed`**: Social interaction component (AJAX-based).
3.  **`modern-intranet/fragments/event-tabs`**: Tabbed list display for corporate and personal events.
4.  **`modern-intranet/fragments/app-launcher`**: Grid of external application links with icons.
5.  **`modern-intranet/fragments/news-hero`**: Large featured article display.
6.  **`modern-intranet/fragments/news-card-list`**: List of smaller news articles with "View All" support.
7.  **`modern-intranet/fragments/onboarding-stepper`**: Progress tracker with task cards.
8.  **`modern-intranet/fragments/stat-card`**: Numeric metric card with support for trend indicators.
9.  **`modern-intranet/fragments/file-repository-list`**: Table-based file listing with status badges.
10. **`modern-intranet/fragments/course-progress-card`**: Card with progress bar and "Continue" button.

---

## Development Strategy

### Phase 1: Scaffolding (Current Task)

- [x] Create collection structure (`modern-intranet/`).
- [x] Document requirements and audit existing fragments.

### Phase 2: Core Homepage Components

- Implement the `welcome-banner`, `app-launcher`, and `stat-card`.
- Focus on theme-fidelity and standard Liferay CSS tokens.

### Phase 3: Social & Content

- Implement the `intranet-feed` and `news-hero` fragments.
- Ensure proper use of `shared-resources/` for data fetching and validation.

### Phase 4: Learning & Repository

- Implement `file-repository-list` and `course-progress-card`.
- Integrate with Liferay Objects where applicable using the **Discovery Pattern**.

---

## Showcase Data & Integration

To provide a high-fidelity "out-of-the-box" experience, a **Showcase Batch Client Extension** is provided in `other-resources/showcase-data/modern-intranet/`.

### 1. Provisioned Objects

The batch job creates the following site-scoped Objects:

- **`IntranetPost`**: Powers the `intranet-feed`. Includes fields for content, author details, and engagement metrics.
- **`IntranetAsset`**: Powers the `file-repository-list`. Includes status badges and file metadata.
- **`UserCourseProgress`**: Powers the `course-progress-card`. Stores course details and completion percentages.

### 2. Deployment Instructions

1.  Deploy the Batch Client Extension: `client-extensions/modern-intranet/`.
2.  In the Liferay Page Editor, map the fragments to the corresponding Object collections.
3.  The fragments will automatically render the sample data provided in the batch entries.
