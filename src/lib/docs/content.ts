export type DocAudience = "hosted" | "self-host"

export type DocCalloutTone = "info" | "warning" | "danger" | "tip"

export type DocSectionBlock =
  | {
      type: "paragraph"
      text: string
    }
  | {
      type: "list"
      style?: "unordered" | "ordered"
      items: string[]
    }
  | {
      type: "callout"
      tone: DocCalloutTone
      title: string
      body: string
      items?: string[]
    }
  | {
      type: "code"
      language: string
      title?: string
      code: string
    }
  | {
      type: "checklist"
      items: Array<{
        label: string
        checked?: boolean
      }>
    }
  | {
      type: "table"
      columns: string[]
      rows: string[][]
    }

export type DocSection = {
  id: string
  title: string
  summary?: string
  blocks: DocSectionBlock[]
}

export const DOC_SLUGS = [
  "hosted/getting-started",
  "hosted/books-and-reading-workflow",
  "hosted/book-detail-sessions-highlights",
  "hosted/library-board-and-discovery",
  "hosted/timer-notifications-reminders",
  "hosted/account-security-and-data",
  "hosted/admin-operations",
  "hosted/faq-and-troubleshooting",
  "self-host/overview-and-prerequisites",
  "self-host/local-development",
  "self-host/docker-development-and-production",
  "self-host/configuration-reference",
  "self-host/bootstrap-auth-and-access",
  "self-host/operations-health-audit-backups",
  "self-host/reminder-worker-and-jobs",
  "self-host/migrations-upgrades-and-release-ops",
  "self-host/security-and-hardening",
  "self-host/disaster-recovery-runbook",
] as const

export type DocSlug = (typeof DOC_SLUGS)[number]

export type DocRoleTag = "users" | "hosted-admin" | "self-host-admin" | "operator"

export type DocPage = {
  slug: DocSlug
  title: string
  summary: string
  audience: DocAudience
  roleTags: DocRoleTag[]
  sections: DocSection[]
  related: DocSlug[]
}

type DocPageDefinition = Omit<DocPage, "slug">

const DOC_PAGE_DEFINITIONS: Record<DocSlug, DocPageDefinition> = {
  "hosted/getting-started": {
    title: "Getting Started on Hosted Shelf",
    summary:
      "Sign in, understand bootstrap and signup behavior, and learn where each core route lives after your first login.",
    audience: "hosted",
    roleTags: ["users", "hosted-admin"],
    related: [
      "hosted/books-and-reading-workflow",
      "hosted/timer-notifications-reminders",
      "hosted/account-security-and-data",
    ],
    sections: [
      {
        id: "entry-points",
        title: "Entry Points and Access",
        summary: "How people enter your hosted Shelf environment.",
        blocks: [
          {
            type: "paragraph",
            text: "Hosted users typically enter through `/login` or `/signup`. If your instance has not been bootstrapped yet, login and signup automatically redirect to `/setup/admin` until the first admin account is created.",
          },
          {
            type: "list",
            items: [
              "`/` public marketing page with links into auth and dashboard.",
              "`/signup` only works when signups are enabled in system settings.",
              "`/login` is always available after bootstrap is complete.",
              "`/setup/admin` appears only once for initial admin creation.",
            ],
          },
          {
            type: "callout",
            tone: "warning",
            title: "Signup policy is dynamic",
            body: "Hosted admins can toggle signups from `/admin`. If disabled, users can still log in but new account creation through `/signup` is blocked.",
          },
        ],
      },
      {
        id: "first-session",
        title: "What Happens After Login",
        blocks: [
          {
            type: "paragraph",
            text: "Successful email/password or OAuth authentication lands users on `/dashboard`. Dashboard is the central hub for shelf status columns, filters, recommendations, goals, and quick navigation.",
          },
          {
            type: "checklist",
            items: [
              { label: "Open `/dashboard` and confirm your profile menu appears", checked: true },
              { label: "Use `+`/book actions to add your first title", checked: true },
              { label: "Visit `/library` for cover-based browsing", checked: true },
              { label: "Open `/board` for drag-and-drop workflow", checked: true },
            ],
          },
          {
            type: "paragraph",
            text: "Command palette (`Cmd/Ctrl+K`) is available globally to jump between books, settings, and admin/docs routes without manual navigation.",
          },
        ],
      },
      {
        id: "auth-providers",
        title: "Auth Paths and Provider Behavior",
        blocks: [
          {
            type: "paragraph",
            text: "Users can authenticate with email/password and any social or custom OAuth providers enabled by environment variables. Provider buttons only appear when provider credentials are valid in deployment config.",
          },
          {
            type: "table",
            columns: ["Flow", "Route", "Result"],
            rows: [
              ["Email signup", "`/signup`", "Creates user then redirects to `/dashboard`"],
              ["Email login", "`/login`", "Session issued and dashboard access"],
              ["Password reset", "`/forgot-password` + `/reset-password`", "Email link then password change"],
              ["Provider login", "`/login` or `/signup`", "OAuth redirect then callback to `/dashboard`"],
            ],
          },
          {
            type: "callout",
            tone: "tip",
            title: "User-facing trust signal",
            body: "Keep `/privacy` and `/terms` accessible and current. They are linked directly from auth screens and footer, which reduces login friction for new users.",
          },
        ],
      },
    ],
  },
  "hosted/books-and-reading-workflow": {
    title: "Books and Reading Workflow",
    summary:
      "Detailed guidance for creating, editing, organizing, and moving books through the three shelf states.",
    audience: "hosted",
    roleTags: ["users"],
    related: [
      "hosted/book-detail-sessions-highlights",
      "hosted/library-board-and-discovery",
      "hosted/timer-notifications-reminders",
    ],
    sections: [
      {
        id: "book-lifecycle",
        title: "The Three-State Lifecycle",
        blocks: [
          {
            type: "paragraph",
            text: "Every book in Shelf belongs to one status: `to_read`, `reading`, or `read`. This status is the backbone for dashboard grouping, board columns, recommendations, and progress insights.",
          },
          {
            type: "list",
            style: "ordered",
            items: [
              "Add a title from `/books/new` or dashboard create action.",
              "Start reading by moving to `reading` from dashboard, board, or book detail page.",
              "Finish by setting status to `read`; ratings and reviews become especially valuable here.",
            ],
          },
          {
            type: "callout",
            tone: "info",
            title: "Manual ordering",
            body: "Shelf stores `manualRank` and allows status-aware ordering, especially from `/board`, so your personal queue order remains stable between sessions.",
          },
        ],
      },
      {
        id: "metadata-quality",
        title: "Metadata That Improves Your Library",
        blocks: [
          {
            type: "paragraph",
            text: "Useful metadata fields include title, author, total pages, ISBN, cover URL, notes, rating, and review. Better metadata improves filtering, reading goals, and visual browsing in library and dashboard views.",
          },
          {
            type: "code",
            language: "text",
            title: "Recommended minimum metadata per new book",
            code: "Title\nAuthor\nStatus (`to_read` default)\nTotal pages (if known)\nCover URL or ISBN for lookup",
          },
          {
            type: "paragraph",
            text: "ISBN lookup uses OpenLibrary. If lookup fails, you can still continue with manual entry and update details later from `/books/[id]/edit`.",
          },
        ],
      },
      {
        id: "editing-and-deletion",
        title: "Editing, Status Changes, and Deletion",
        blocks: [
          {
            type: "paragraph",
            text: "Book edits are available from detail and edit routes. Status transitions and session logs generate timeline events used by progress history and reporting surfaces.",
          },
          {
            type: "list",
            items: [
              "Edit route: `/books/[id]/edit` for full metadata updates.",
              "Detail route: `/books/[id]` for status buttons, quick updates, and reading logs.",
              "Deletion: confirmation-based and permanent for that book's owned records.",
            ],
          },
          {
            type: "callout",
            tone: "warning",
            title: "Deletion impact",
            body: "Deleting a book removes it from shelf views and can orphan the reading context users rely on. Prefer status changes or notes cleanup before deleting unless the entry is incorrect.",
          },
        ],
      },
    ],
  },
  "hosted/book-detail-sessions-highlights": {
    title: "Book Detail, Sessions, and Highlights",
    summary:
      "How to use `/books/[id]` effectively: status changes, session logging modes, timeline interpretation, and quote management.",
    audience: "hosted",
    roleTags: ["users"],
    related: [
      "hosted/books-and-reading-workflow",
      "hosted/timer-notifications-reminders",
      "hosted/faq-and-troubleshooting",
    ],
    sections: [
      {
        id: "detail-layout",
        title: "Detail Page Structure",
        blocks: [
          {
            type: "paragraph",
            text: "The detail page (`/books/[id]`) combines a visual summary hero, status actions, edit/delete controls, session logging, highlights, notes, and a progress timeline. It is the highest-fidelity single-book workspace.",
          },
          {
            type: "checklist",
            items: [
              { label: "Set/verify current status" },
              { label: "Confirm page counts before logging sessions" },
              { label: "Capture notable highlights with page/date" },
              { label: "Review timeline to detect bad entries early" },
            ],
          },
        ],
      },
      {
        id: "session-logging-modes",
        title: "Session Logging Modes",
        blocks: [
          {
            type: "paragraph",
            text: "Session logging supports two time modes (`duration` or `range`) and two page modes (`pages` or `end_page`). Inputs are validated server-side to prevent impossible timelines.",
          },
          {
            type: "table",
            columns: ["Mode", "Required Input", "Validation Rule"],
            rows: [
              ["Time: duration", "Minutes or hours+minutes", "Total must be > 0"],
              ["Time: range", "Start and end datetime", "End must be after start"],
              ["Pages: pages", "Pages read", "Value must be >= 0"],
              ["Pages: end_page", "Final page number", "Cannot be less than current page"],
            ],
          },
          {
            type: "callout",
            tone: "tip",
            title: "Persistent mode preferences",
            body: "The page remembers time and page mode selectors via local storage. Users who prefer one logging style can keep it as their default.",
          },
        ],
      },
      {
        id: "highlights-and-timeline",
        title: "Highlights and Progress Timeline",
        blocks: [
          {
            type: "paragraph",
            text: "Highlights are quote-focused records with optional page and highlight date. Timeline entries capture status changes, page updates, rating changes, and logged sessions.",
          },
          {
            type: "list",
            items: [
              "Use highlights for memorable text, not full notes dumps.",
              "Edit or delete highlights inline if OCR/import text is noisy.",
              "When timelines look wrong, check end-page logs and status changes first.",
            ],
          },
          {
            type: "callout",
            tone: "warning",
            title: "Data consistency",
            body: "A session with incorrect end page can distort progress velocity and reminder relevance. Correct it immediately by editing book state and logging a compensating entry.",
          },
        ],
      },
    ],
  },
  "hosted/library-board-and-discovery": {
    title: "Library, Board, and Discovery",
    summary:
      "Use grid library, kanban board, and command palette together for fast retrieval and reprioritization.",
    audience: "hosted",
    roleTags: ["users"],
    related: [
      "hosted/books-and-reading-workflow",
      "hosted/book-detail-sessions-highlights",
      "hosted/timer-notifications-reminders",
    ],
    sections: [
      {
        id: "library-filters",
        title: "Library and Filter Strategy",
        blocks: [
          {
            type: "paragraph",
            text: "`/library` provides status filters and advanced controls (search, page ranges, rating threshold, date range, favorites-only). It is optimized for retrieval and curation.",
          },
          {
            type: "list",
            items: [
              "Search by title, author, or ISBN for fast narrowing.",
              "Use `createdFrom`/`createdTo` to isolate recent imports.",
              "Combine minimum rating + favorites-only for shortlist building.",
              "Open individual books directly by clicking cover cards.",
            ],
          },
        ],
      },
      {
        id: "kanban-board",
        title: "Kanban Moves and Manual Rank",
        blocks: [
          {
            type: "paragraph",
            text: "`/board` is a drag-and-drop kanban across `To Read`, `Reading`, and `Finished`. Moves are optimistic in UI and persisted as ordered ids per status column.",
          },
          {
            type: "callout",
            tone: "info",
            title: "Touch-device fallback",
            body: "On coarse pointer devices, Shelf uses a fallback interaction path because native drag semantics differ across mobile browsers.",
          },
          {
            type: "paragraph",
            text: "If a move fails server persistence, Shelf reverts to previous state and shows a failure toast. This protects ordering integrity under transient network or backend issues.",
          },
        ],
      },
      {
        id: "command-palette-discovery",
        title: "Command Palette and Discovery",
        blocks: [
          {
            type: "paragraph",
            text: "`Cmd/Ctrl+K` opens a fuzzy-search command bar with grouped targets. It supports recent items, books, settings, and docs routes for quick context switches.",
          },
          {
            type: "list",
            style: "ordered",
            items: [
              "Open palette with keyboard shortcut.",
              "Type partial title/route intent, not exact strings.",
              "Use arrow keys + Enter to navigate instantly.",
            ],
          },
          {
            type: "callout",
            tone: "tip",
            title: "Workflow combo",
            body: "Use `/library` for heavy filtering, `/board` for prioritization, and command palette for route jumping. This reduces navigation friction during weekly planning.",
          },
        ],
      },
    ],
  },
  "hosted/timer-notifications-reminders": {
    title: "Timer, Notifications, and Reminders",
    summary:
      "Set up time tracking and reminder behavior so Shelf nudges reading progress without creating noise.",
    audience: "hosted",
    roleTags: ["users"],
    related: [
      "hosted/book-detail-sessions-highlights",
      "hosted/account-security-and-data",
      "self-host/reminder-worker-and-jobs",
    ],
    sections: [
      {
        id: "timer-basics",
        title: "Reading Timer Workspace",
        blocks: [
          {
            type: "paragraph",
            text: "`/timer` supports stopwatch and countdown modes. Timer state is persisted in local storage, including selected book and quick-log draft metadata.",
          },
          {
            type: "table",
            columns: ["Mode", "Best For", "Output"],
            rows: [
              ["Stopwatch", "Open-ended reading blocks", "Elapsed time log"],
              ["Countdown", "Fixed sessions (15/30/45/60 custom)", "Remaining time + auto-stop behavior"],
            ],
          },
          {
            type: "callout",
            tone: "warning",
            title: "Leaving page while timer runs",
            body: "Shelf warns on unload while timing is active. Stop and quick-log before closing to avoid losing session intent.",
          },
        ],
      },
      {
        id: "notification-center",
        title: "Notification Center",
        blocks: [
          {
            type: "paragraph",
            text: "`/notifications` aggregates reading, admin, and general events. Filters include family type and unread-only mode, with bulk mark-read and cleanup actions.",
          },
          {
            type: "list",
            items: [
              "Use unread-only to process backlog quickly.",
              "Mark all as read after triage windows.",
              "Delete read notifications to keep feed signal-heavy.",
            ],
          },
        ],
      },
      {
        id: "reminder-controls",
        title: "Reminder Preferences",
        blocks: [
          {
            type: "paragraph",
            text: "Reminder settings live in `/settings` and include enabled toggle, channel, and inactivity threshold days. Current validation requires days to be an integer from 1 to 60.",
          },
          {
            type: "callout",
            tone: "info",
            title: "Delivery dependency",
            body: "Email reminders require a configured transport on the hosted instance. If transport is missing, reminder generation may occur but delivery will fail upstream.",
          },
          {
            type: "paragraph",
            text: "Users can snooze or dismiss reminders from reading-related actions; these controls affect reminder dispatch eligibility and are respected by worker cycles.",
          },
        ],
      },
    ],
  },
  "hosted/account-security-and-data": {
    title: "Account Security and Data Controls",
    summary:
      "Manage profile, linked providers, password resets, exports/imports, and account deletion safely.",
    audience: "hosted",
    roleTags: ["users", "hosted-admin"],
    related: [
      "hosted/getting-started",
      "hosted/timer-notifications-reminders",
      "hosted/faq-and-troubleshooting",
    ],
    sections: [
      {
        id: "profile-and-auth",
        title: "Profile and Authentication",
        blocks: [
          {
            type: "paragraph",
            text: "`/settings` lets users update name/email, trigger password reset, and connect social/custom OAuth providers. Linked providers appear based on currently enabled auth configuration.",
          },
          {
            type: "list",
            items: [
              "Email updates are blocked if another account already uses the same address.",
              "Provider linking starts from settings and redirects back after auth.",
              "Password reset emails route through configured transport and `/reset-password`.",
            ],
          },
        ],
      },
      {
        id: "personal-data-export-import",
        title: "Personal Data Export and Import",
        blocks: [
          {
            type: "paragraph",
            text: "Users can export account/library data JSON and import compatible payloads back into their own account. Import supports additive mode or replace-existing mode.",
          },
          {
            type: "table",
            columns: ["Action", "Route", "Behavior"],
            rows: [
              ["Export user data", "`/settings`", "Generates JSON payload with profile + books + stats"],
              ["Import add", "`/settings`", "Adds valid imported books to current library"],
              ["Import replace", "`/settings`", "Deletes existing books then inserts imported books"],
            ],
          },
          {
            type: "callout",
            tone: "warning",
            title: "Import quality",
            body: "Invalid or incomplete book records are discarded during normalization. Always preview import data and keep an export backup before replace mode.",
          },
        ],
      },
      {
        id: "account-deletion-safeguards",
        title: "Account Deletion Safeguards",
        blocks: [
          {
            type: "paragraph",
            text: "Account deletion requires confirmation text `DELETE`. Users with admin role cannot remove themselves if they are the last admin on the instance.",
          },
          {
            type: "checklist",
            items: [
              { label: "Export data before deletion", checked: true },
              { label: "Confirm at least one other admin exists (if admin account)", checked: true },
              { label: "Type exact confirmation phrase `DELETE`", checked: true },
            ],
          },
        ],
      },
    ],
  },
  "hosted/admin-operations": {
    title: "Hosted Admin Operations",
    summary:
      "Day-to-day administration for hosted Shelf: users, roles, signups, release messages, audit, health, backup, and seed controls.",
    audience: "hosted",
    roleTags: ["hosted-admin"],
    related: [
      "self-host/operations-health-audit-backups",
      "self-host/disaster-recovery-runbook",
      "hosted/faq-and-troubleshooting",
    ],
    sections: [
      {
        id: "admin-dashboard-controls",
        title: "Core Admin Dashboard Controls",
        blocks: [
          {
            type: "paragraph",
            text: "`/admin` is the primary control plane. You can manage signups, edit users, disable accounts, trigger password reset emails, and configure release announcement modals.",
          },
          {
            type: "list",
            items: [
              "Toggle signups without redeploying.",
              "Promote/demote roles (respecting last-admin protections).",
              "Disable users to revoke active sessions immediately.",
              "Publish a release popup keyed by version.",
            ],
          },
          {
            type: "callout",
            tone: "info",
            title: "Audit logging",
            body: "Sensitive admin actions emit audit entries (`scope=admin`) with actor and target metadata where possible.",
          },
        ],
      },
      {
        id: "seed-and-demo-data",
        title: "Seeder and Demo Data",
        blocks: [
          {
            type: "paragraph",
            text: "Seeder controls are exposed through `/admin` and `/api/admin/seed` with explicit confirmation phrases for destructive or stateful operations.",
          },
          {
            type: "code",
            language: "text",
            title: "Required confirmation phrases",
            code: "SEED DEMO DATA\nCLEANUP SEED DATA",
          },
          {
            type: "callout",
            tone: "warning",
            title: "Seeder scope",
            body: "Seed actions insert or clean rows with `seed-` id prefixes. Dry-run should always be executed first before apply/cleanup in shared environments.",
          },
        ],
      },
      {
        id: "health-audit-backup-links",
        title: "Health, Audit, and Backup Routes",
        blocks: [
          {
            type: "table",
            columns: ["Route", "Use", "Typical Frequency"],
            rows: [
              ["`/admin/health`", "DB/migration/email diagnostics", "Daily or after deploy"],
              ["`/admin/audit`", "Investigate actor/action history", "As needed"],
              ["`/admin/backup`", "Backup export/import workflows", "Scheduled + before major changes"],
            ],
          },
          {
            type: "paragraph",
            text: "Combine these routes with external infrastructure monitoring. App-level health confirms schema and transport readiness but is not a replacement for host, DB, and network telemetry.",
          },
        ],
      },
    ],
  },
  "hosted/faq-and-troubleshooting": {
    title: "Hosted FAQ and Troubleshooting",
    summary:
      "Quick diagnosis paths for common hosted-user and hosted-admin issues.",
    audience: "hosted",
    roleTags: ["users", "hosted-admin"],
    related: [
      "hosted/getting-started",
      "hosted/admin-operations",
      "self-host/operations-health-audit-backups",
    ],
    sections: [
      {
        id: "auth-and-access-issues",
        title: "Authentication and Access Issues",
        blocks: [
          {
            type: "table",
            columns: ["Symptom", "Likely Cause", "Action"],
            rows: [
              ["Signup blocked", "Signups disabled", "Admin toggles signups in `/admin`"],
              ["Forgot password email not received", "Email transport misconfigured", "Admin validates `/admin/health` email diagnostics"],
              ["OAuth button missing", "Provider env vars absent", "Operator sets client id/secret and redeploys"],
            ],
          },
          {
            type: "paragraph",
            text: "If users are unexpectedly sent to `/setup/admin`, bootstrap is not complete on that environment or deployment points at a fresh database.",
          },
        ],
      },
      {
        id: "reading-data-problems",
        title: "Reading Data Problems",
        blocks: [
          {
            type: "list",
            items: [
              "Timeline looks wrong: verify session end-page values and status transitions.",
              "Board move reverts: persistence call failed; retry and inspect server logs.",
              "Reminder spam/noise: increase inactivity days and disable if not needed.",
            ],
          },
          {
            type: "callout",
            tone: "tip",
            title: "Safe correction pattern",
            body: "For bad progress data, correct the current page/status on the book, then log a new accurate session. Avoid manual DB edits unless absolutely necessary.",
          },
        ],
      },
      {
        id: "admin-safeguard-errors",
        title: "Admin Safeguard Errors",
        blocks: [
          {
            type: "paragraph",
            text: "Errors like ‘Cannot delete the last admin account’ or ‘Cannot remove admin role from the last admin account’ are intentional safeguards. Promote another user to admin first.",
          },
          {
            type: "checklist",
            items: [
              { label: "Create or promote a second admin" },
              { label: "Verify admin login with second account" },
              { label: "Retry role removal/deletion on original account" },
            ],
          },
        ],
      },
    ],
  },
  "self-host/overview-and-prerequisites": {
    title: "Self-Host Overview and Prerequisites",
    summary:
      "Architecture, stack expectations, and baseline prerequisites before running Shelf on your own infrastructure.",
    audience: "self-host",
    roleTags: ["self-host-admin", "operator"],
    related: [
      "self-host/local-development",
      "self-host/docker-development-and-production",
      "self-host/configuration-reference",
    ],
    sections: [
      {
        id: "stack-overview",
        title: "Technology and Runtime Profile",
        blocks: [
          {
            type: "table",
            columns: ["Layer", "Current Choice"],
            rows: [
              ["Web framework", "Next.js 16 (App Router)"],
              ["Language", "TypeScript"],
              ["Database", "PostgreSQL + Drizzle ORM"],
              ["Auth", "Better Auth"],
              ["Package manager", "pnpm 10"],
              ["Node runtime", "Node.js 22+"],
            ],
          },
          {
            type: "paragraph",
            text: "Shelf is designed for self-host operation with first-class admin pages for health, audit, backup, and seed controls. Containerized and non-containerized flows are both supported.",
          },
        ],
      },
      {
        id: "minimum-prereqs",
        title: "Minimum Prerequisites",
        blocks: [
          {
            type: "checklist",
            items: [
              { label: "Node.js 22+ and pnpm 10+" },
              { label: "PostgreSQL 17+ reachable from app runtime" },
              { label: "Strong `BETTER_AUTH_SECRET` configured" },
              { label: "Correct `BETTER_AUTH_URL` and `NEXT_PUBLIC_BETTER_AUTH_URL`" },
              { label: "Operational backup policy before production use" },
            ],
          },
          {
            type: "callout",
            tone: "warning",
            title: "Do not use development defaults in production",
            body: "Default compose secrets are convenience values only. Replace all secrets and URLs before exposing an instance publicly.",
          },
        ],
      },
      {
        id: "project-shape",
        title: "Project Shape and Key Paths",
        blocks: [
          {
            type: "code",
            language: "text",
            code: "src/app/                 # routes (dashboard, admin, auth, docs)\nsrc/actions/             # server actions\nsrc/lib/                 # domain and infrastructure logic\nsrc/db/                  # database setup and schema\ndrizzle/                 # SQL migrations + snapshots\nscripts/run-migrations.mjs\nscripts/reminder-worker.ts",
          },
          {
            type: "paragraph",
            text: "Treat `README.md` and `.env.example` as baseline references, then use these docs for deeper operational guidance and route-specific procedures.",
          },
        ],
      },
    ],
  },
  "self-host/local-development": {
    title: "Local Development (Non-Docker)",
    summary:
      "Run Shelf directly with local Node and Postgres for fast iteration and debugging.",
    audience: "self-host",
    roleTags: ["self-host-admin", "operator"],
    related: [
      "self-host/configuration-reference",
      "self-host/bootstrap-auth-and-access",
      "self-host/migrations-upgrades-and-release-ops",
    ],
    sections: [
      {
        id: "local-setup-steps",
        title: "Setup Steps",
        blocks: [
          {
            type: "code",
            language: "bash",
            code: "pnpm install\ncp .env.example .env.local",
          },
          {
            type: "paragraph",
            text: "Set at least these environment variables in `.env.local`: `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `NEXT_PUBLIC_BETTER_AUTH_URL`, and `DATABASE_URL`.",
          },
          {
            type: "code",
            language: "bash",
            code: "node scripts/run-migrations.mjs\npnpm dev",
          },
        ],
      },
      {
        id: "first-run-bootstrap",
        title: "First Run and Admin Bootstrap",
        blocks: [
          {
            type: "paragraph",
            text: "On a fresh database, first web access redirects to `/setup/admin`. Create the first admin there; once done, the bootstrap page becomes inaccessible and auth flow returns to normal login/signup behavior.",
          },
          {
            type: "callout",
            tone: "tip",
            title: "Keep bootstrap deterministic",
            body: "Use a clean local database per feature branch when testing bootstrap, migrations, and auth provider setup changes.",
          },
        ],
      },
      {
        id: "local-debug-patterns",
        title: "Local Debug Patterns",
        blocks: [
          {
            type: "list",
            items: [
              "Schema errors on boot: rerun migration script and inspect `drizzle/meta` alignment.",
              "Auth callback issues: verify both auth URL variables match your local origin.",
              "Missing provider buttons: ensure both client id and secret are set for each provider.",
            ],
          },
          {
            type: "paragraph",
            text: "For local reminder testing, run one cycle with `pnpm worker:reminders:once` and inspect output before enabling a loop.",
          },
        ],
      },
    ],
  },
  "self-host/docker-development-and-production": {
    title: "Docker Development and Production",
    summary:
      "Use compose stacks for local parity and production-style deployment, including migration service behavior.",
    audience: "self-host",
    roleTags: ["self-host-admin", "operator"],
    related: [
      "self-host/migrations-upgrades-and-release-ops",
      "self-host/security-and-hardening",
      "self-host/disaster-recovery-runbook",
    ],
    sections: [
      {
        id: "dev-compose",
        title: "Development Compose Stack",
        blocks: [
          {
            type: "paragraph",
            text: "`compose.dev.yml` includes Postgres, a migration job, app in dev mode, and Caddy reverse proxy. The stack is exposed at `http://localhost:8080`.",
          },
          {
            type: "code",
            language: "bash",
            code: "docker compose -f compose.dev.yml up --build",
          },
          {
            type: "callout",
            tone: "info",
            title: "Service ordering",
            body: "`migrate` waits for healthy database, and app waits for migration success. This reduces race conditions during startup.",
          },
        ],
      },
      {
        id: "prod-compose",
        title: "Production-Style Compose Stack",
        blocks: [
          {
            type: "paragraph",
            text: "`compose.prod.yml` uses prebuilt images (`ghcr.io/vainnor/shelf:latest`) for app and migrate services. App container exposes port `8888` by default.",
          },
          {
            type: "code",
            language: "bash",
            code: "docker compose -f compose.prod.yml up --build",
          },
          {
            type: "callout",
            tone: "warning",
            title: "Production compose caveat",
            body: "Replace defaults like `BETTER_AUTH_SECRET` and host URLs, and pin image tags to a known version instead of floating `latest` for controlled rollouts.",
          },
        ],
      },
      {
        id: "image-and-build-flow",
        title: "Image Build Behavior",
        blocks: [
          {
            type: "paragraph",
            text: "The Dockerfile uses multistage builds: deps, dev, migrator, builder, runner. Runtime image is standalone Next output plus migration assets and schema metadata.",
          },
          {
            type: "list",
            items: [
              "`dev` target: local development in container.",
              "`migrator` target: executes `scripts/run-migrations.mjs`.",
              "`runner` target: production server entrypoint (`node server.js`).",
            ],
          },
        ],
      },
    ],
  },
  "self-host/configuration-reference": {
    title: "Configuration Reference",
    summary:
      "Environment variable reference for auth, database, provider login, email transport, and worker tuning.",
    audience: "self-host",
    roleTags: ["self-host-admin", "operator"],
    related: [
      "self-host/bootstrap-auth-and-access",
      "self-host/reminder-worker-and-jobs",
      "self-host/security-and-hardening",
    ],
    sections: [
      {
        id: "required-env",
        title: "Required Variables",
        blocks: [
          {
            type: "code",
            language: "bash",
            code: "BETTER_AUTH_SECRET=replace-with-long-random-secret\nBETTER_AUTH_URL=https://your-host\nNEXT_PUBLIC_BETTER_AUTH_URL=https://your-host\nDATABASE_URL=postgres://user:pass@host:5432/shelf",
          },
          {
            type: "callout",
            tone: "danger",
            title: "Auth URL correctness",
            body: "Mismatched auth URLs cause callback/session issues. Keep server and public URL values aligned to the same canonical origin.",
          },
        ],
      },
      {
        id: "provider-matrix",
        title: "Provider and Identity Configuration",
        blocks: [
          {
            type: "paragraph",
            text: "Social providers are enabled only when both client id and client secret are present. Custom OAuth providers are read from `CUSTOM_OAUTH_PROVIDERS_JSON`.",
          },
          {
            type: "code",
            language: "bash",
            code: `CUSTOM_OAUTH_PROVIDERS_JSON='[
  {
    "providerId": "my-idp",
    "label": "My IDP",
    "discoveryUrl": "https://id.example.com/.well-known/openid-configuration",
    "clientId": "...",
    "clientSecret": "...",
    "scopes": ["openid", "profile", "email"]
  }
]'`,
          },
          {
            type: "paragraph",
            text: "Malformed custom provider JSON is ignored; keep this value valid JSON and include required fields (`providerId`, `clientId` at minimum).",
          },
        ],
      },
      {
        id: "email-and-worker-env",
        title: "Email and Reminder Worker Variables",
        blocks: [
          {
            type: "table",
            columns: ["Area", "Variables"],
            rows: [
              ["SES", "`AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `SES_FROM_EMAIL`"],
              ["SMTP", "`EMAIL_TRANSPORT=smtp`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_FROM_EMAIL`"],
              ["Worker tuning", "`REMINDER_WORKER_INTERVAL_MS`, `REMINDER_WORKER_MAX_USERS`"],
            ],
          },
          {
            type: "callout",
            tone: "tip",
            title: "Transport selection behavior",
            body: "If `EMAIL_TRANSPORT` is unset, Shelf prefers SMTP when `SMTP_HOST` exists; otherwise it attempts SES mode.",
          },
        ],
      },
    ],
  },
  "self-host/bootstrap-auth-and-access": {
    title: "Bootstrap, Auth, and Access Policy",
    summary:
      "Securely initialize the first admin account and define account creation/access behavior for your instance.",
    audience: "self-host",
    roleTags: ["self-host-admin", "operator"],
    related: [
      "self-host/local-development",
      "self-host/configuration-reference",
      "hosted/admin-operations",
    ],
    sections: [
      {
        id: "bootstrap-flow",
        title: "One-Time Bootstrap Flow",
        blocks: [
          {
            type: "paragraph",
            text: "Before bootstrap completes, auth routes redirect to `/setup/admin`. This page creates the first admin and then becomes unavailable by design.",
          },
          {
            type: "checklist",
            items: [
              { label: "Use a strong password for initial admin" },
              { label: "Store admin credentials in your secret manager" },
              { label: "Validate login immediately after bootstrap" },
            ],
          },
        ],
      },
      {
        id: "signup-policy",
        title: "Signup and Access Policy",
        blocks: [
          {
            type: "paragraph",
            text: "`/admin` exposes a global signups toggle (`signupsEnabled`). Disabling signups blocks new registrations but keeps existing user login functional.",
          },
          {
            type: "callout",
            tone: "info",
            title: "Recommended production default",
            body: "Private deployments often start with signups disabled. Add users manually as needed, then enable signups only if open registration is desired.",
          },
        ],
      },
      {
        id: "role-controls",
        title: "Role and Session Controls",
        blocks: [
          {
            type: "list",
            items: [
              "Admin edits user role from `/admin/users/[id]`.",
              "Disabling a user revokes active sessions by deleting their session rows.",
              "Last-admin safeguards block destructive self-lockout scenarios.",
            ],
          },
          {
            type: "paragraph",
            text: "These safeguards prevent permanent control loss. If you need to demote/delete an admin, first promote another admin account and test access.",
          },
        ],
      },
    ],
  },
  "self-host/operations-health-audit-backups": {
    title: "Operations: Health, Audit, and Backups",
    summary:
      "Operational runbook for routine checks, audit review, and full database backup workflows.",
    audience: "self-host",
    roleTags: ["self-host-admin", "operator"],
    related: [
      "self-host/disaster-recovery-runbook",
      "self-host/migrations-upgrades-and-release-ops",
      "hosted/admin-operations",
    ],
    sections: [
      {
        id: "health-checks",
        title: "System Health Checks",
        blocks: [
          {
            type: "paragraph",
            text: "`/admin/health` checks DB connectivity, migration alignment, and email diagnostics. Treat it as app-level readiness, not full infrastructure observability.",
          },
          {
            type: "list",
            items: [
              "Run after each deploy.",
              "Run before and after migration operations.",
              "Run when password reset delivery is questioned.",
            ],
          },
        ],
      },
      {
        id: "audit-ops",
        title: "Audit Log Review",
        blocks: [
          {
            type: "paragraph",
            text: "`/admin/audit` supports filters by scope, actor id, action query, and date window. Use it for post-incident reconstruction and admin change verification.",
          },
          {
            type: "callout",
            tone: "tip",
            title: "Operational baseline",
            body: "Regularly export and archive critical audit slices for long-term retention if your compliance policy exceeds database retention windows.",
          },
        ],
      },
      {
        id: "backup-flows",
        title: "Backup Flows",
        blocks: [
          {
            type: "code",
            language: "bash",
            title: "Recommended external Postgres backup",
            code: "pg_dump --format=custom --no-owner --no-privileges --file=shelf.backup \"$DATABASE_URL\"",
          },
          {
            type: "code",
            language: "text",
            title: "In-app full JSON transfer",
            code: "Export endpoint: /api/admin/backup/export\nImport endpoint: /api/admin/backup/import\nApply mode confirmation: IMPORT ALL DATA",
          },
          {
            type: "callout",
            tone: "warning",
            title: "Import is destructive",
            body: "Full JSON import truncates and reloads tables. Always run dry-run mode first and test restore in a non-production environment.",
          },
        ],
      },
    ],
  },
  "self-host/reminder-worker-and-jobs": {
    title: "Reminder Worker and Job Operations",
    summary:
      "Run, tune, and supervise the reminder worker for reliable inactivity nudges.",
    audience: "self-host",
    roleTags: ["self-host-admin", "operator"],
    related: [
      "self-host/configuration-reference",
      "hosted/timer-notifications-reminders",
      "self-host/operations-health-audit-backups",
    ],
    sections: [
      {
        id: "worker-modes",
        title: "Worker Modes",
        blocks: [
          {
            type: "code",
            language: "bash",
            code: "pnpm worker:reminders\npnpm worker:reminders:once",
          },
          {
            type: "paragraph",
            text: "Loop mode runs one cycle immediately, then repeats at configured interval. `--once` mode is ideal for validation and manual operations.",
          },
          {
            type: "code",
            language: "bash",
            title: "CLI tuning",
            code: "tsx scripts/reminder-worker.ts --once --max-users=50\ntsx scripts/reminder-worker.ts --interval-ms=600000",
          },
        ],
      },
      {
        id: "dispatch-behavior",
        title: "Dispatch Behavior",
        blocks: [
          {
            type: "paragraph",
            text: "Worker cycles inspect eligible users and queue reminder notifications/emails according to inactivity thresholds, snoozes, dismissals, and max-user cap.",
          },
          {
            type: "list",
            items: [
              "`REMINDER_WORKER_MAX_USERS` limits per-cycle load.",
              "`REMINDER_WORKER_INTERVAL_MS` sets repeat interval in loop mode.",
              "Worker logs summary counts for checked/skipped/queued results.",
            ],
          },
        ],
      },
      {
        id: "operational-supervision",
        title: "Operational Supervision",
        blocks: [
          {
            type: "callout",
            tone: "warning",
            title: "Run under a supervisor",
            body: "In production, run the worker under systemd, container orchestrator, or process manager with restart policy and centralized logs.",
          },
          {
            type: "checklist",
            items: [
              { label: "Alert on repeated worker failures" },
              { label: "Track cycle latency and queued count trends" },
              { label: "Validate email transport before enabling broad reminder schedules" },
            ],
          },
        ],
      },
    ],
  },
  "self-host/migrations-upgrades-and-release-ops": {
    title: "Migrations, Upgrades, and Release Operations",
    summary:
      "How migration selection works, how to execute upgrades safely, and how to recover from migration drift.",
    audience: "self-host",
    roleTags: ["self-host-admin", "operator"],
    related: [
      "self-host/disaster-recovery-runbook",
      "self-host/docker-development-and-production",
      "self-host/operations-health-audit-backups",
    ],
    sections: [
      {
        id: "migration-script-behavior",
        title: "Migration Script Behavior",
        blocks: [
          {
            type: "paragraph",
            text: "`scripts/run-migrations.mjs` inspects schema/migration state to choose `drizzle-kit migrate` or `drizzle-kit push`. It also performs schema readiness checks and may retry with forced push fallback.",
          },
          {
            type: "table",
            columns: ["Condition", "Mode"],
            rows: [
              ["No `users` table", "`migrate`"],
              ["Users table exists + migrations table exists", "`migrate`"],
              ["Users table exists + no migrations table", "`push`"],
            ],
          },
          {
            type: "callout",
            tone: "info",
            title: "Non-TTY behavior",
            body: "When running in CI/docker without a TTY, forced flags may be applied automatically for push operations.",
          },
        ],
      },
      {
        id: "upgrade-procedure",
        title: "Recommended Upgrade Procedure",
        blocks: [
          {
            type: "checklist",
            items: [
              { label: "Take and verify a backup before deployment" },
              { label: "Deploy app + migration job together" },
              { label: "Confirm `/admin/health` shows migration alignment" },
              { label: "Run smoke tests: login, dashboard, book CRUD, admin routes" },
              { label: "Monitor logs for migration fallback messages" },
            ],
          },
          {
            type: "paragraph",
            text: "Never skip backup/testing when migration history is uncertain. Drift between applied schema and migration journal is the highest-risk upgrade scenario.",
          },
        ],
      },
      {
        id: "release-ops",
        title: "Release Announcement Operations",
        blocks: [
          {
            type: "paragraph",
            text: "Admins can stage in-app release popups from `/admin` with version key, title, body, optional image URLs, and release link. This supports user communication during upgrades.",
          },
          {
            type: "list",
            items: [
              "Set unique version keys per release.",
              "Include rollback caveats when relevant.",
              "Deactivate old announcements after uptake window.",
            ],
          },
        ],
      },
    ],
  },
  "self-host/security-and-hardening": {
    title: "Security and Hardening",
    summary:
      "Production hardening controls for secrets, transport, role governance, and operational exposure.",
    audience: "self-host",
    roleTags: ["self-host-admin", "operator"],
    related: [
      "self-host/configuration-reference",
      "self-host/bootstrap-auth-and-access",
      "self-host/disaster-recovery-runbook",
    ],
    sections: [
      {
        id: "secret-management",
        title: "Secrets and Credential Handling",
        blocks: [
          {
            type: "list",
            items: [
              "Store `BETTER_AUTH_SECRET` in a proper secret manager.",
              "Rotate database and SMTP/SES credentials periodically.",
              "Avoid shipping secrets in compose files committed to VCS.",
            ],
          },
          {
            type: "callout",
            tone: "danger",
            title: "Credential reuse risk",
            body: "Do not reuse auth/database secrets across staging and production. Environment isolation limits blast radius during accidental exposure.",
          },
        ],
      },
      {
        id: "network-and-app-hardening",
        title: "Network and App Hardening",
        blocks: [
          {
            type: "paragraph",
            text: "Terminate TLS at a trusted edge, restrict database network access, and expose only required ports. Keep admin routes protected behind strong account hygiene and MFA at the identity layer where possible.",
          },
          {
            type: "checklist",
            items: [
              { label: "HTTPS enforced at edge/proxy" },
              { label: "Database not publicly exposed" },
              { label: "Least-privilege DB user for app runtime" },
              { label: "Dependency and base image patch cadence" },
            ],
          },
        ],
      },
      {
        id: "data-protection",
        title: "Data Protection and Retention",
        blocks: [
          {
            type: "paragraph",
            text: "Treat backups and exports as sensitive data artifacts. Encrypt at rest, limit access scope, and apply explicit retention windows aligned with your policy.",
          },
          {
            type: "list",
            items: [
              "Encrypt `pg_dump` outputs and JSON backups.",
              "Track backup access in your infrastructure audit logs.",
              "Test restore regularly to avoid false confidence.",
            ],
          },
        ],
      },
    ],
  },
  "self-host/disaster-recovery-runbook": {
    title: "Disaster Recovery Runbook",
    summary:
      "Step-by-step recovery procedure for full-service restore, validation, and safe re-entry to production traffic.",
    audience: "self-host",
    roleTags: ["self-host-admin", "operator"],
    related: [
      "self-host/operations-health-audit-backups",
      "self-host/migrations-upgrades-and-release-ops",
      "self-host/security-and-hardening",
    ],
    sections: [
      {
        id: "incident-classification",
        title: "Classify the Incident",
        blocks: [
          {
            type: "table",
            columns: ["Scenario", "Primary Recovery Path"],
            rows: [
              ["Single bad deploy", "Rollback app image + rerun health checks"],
              ["Schema/data corruption", "Restore from known-good DB backup"],
              ["Host/node loss", "Provision new infra and restore DB + app"],
            ],
          },
          {
            type: "paragraph",
            text: "Choose the smallest recovery blast radius that restores correctness. Avoid full restore when rollback alone resolves the incident.",
          },
        ],
      },
      {
        id: "restore-execution",
        title: "Restore Execution",
        blocks: [
          {
            type: "code",
            language: "bash",
            code: "createdb shelf_restore_test\npg_restore --clean --if-exists --no-owner --dbname=shelf_restore_test shelf.backup",
          },
          {
            type: "paragraph",
            text: "Validate restore in staging/test first. For in-app JSON transfer, run import in dry-run mode before apply and confirm table/row expectations.",
          },
          {
            type: "code",
            language: "text",
            title: "Destructive import confirmation",
            code: "IMPORT ALL DATA",
          },
        ],
      },
      {
        id: "post-restore-validation",
        title: "Post-Restore Validation Checklist",
        blocks: [
          {
            type: "checklist",
            items: [
              { label: "`/admin/health` shows DB and migration alignment" },
              { label: "Admin login, user login, and password reset flow work" },
              { label: "Book CRUD and status changes operate normally" },
              { label: "Notification and reminder paths are healthy" },
              { label: "Audit logs are writable after restore" },
            ],
          },
          {
            type: "callout",
            tone: "tip",
            title: "After-action review",
            body: "Document root cause, recovery timeline, and follow-up controls. Feed those updates into this runbook and your incident response process.",
          },
        ],
      },
    ],
  },
}

const DOC_PAGES: DocPage[] = DOC_SLUGS.map((slug) => ({
  slug,
  ...DOC_PAGE_DEFINITIONS[slug],
}))

const DOC_PAGE_BY_SLUG = new Map<DocSlug, DocPage>(DOC_PAGES.map((page) => [page.slug, page]))

function assertDocsGraph() {
  for (const page of DOC_PAGES) {
    const seenSectionIds = new Set<string>()

    for (const section of page.sections) {
      if (seenSectionIds.has(section.id)) {
        throw new Error(`Duplicate section id \"${section.id}\" in ${page.slug}`)
      }
      seenSectionIds.add(section.id)
    }

    for (const relatedSlug of page.related) {
      if (!DOC_PAGE_BY_SLUG.has(relatedSlug)) {
        throw new Error(`Unknown related slug \"${relatedSlug}\" referenced by ${page.slug}`)
      }
    }
  }
}

assertDocsGraph()

export type DocSidebarGroup = {
  audience: DocAudience
  title: string
  description: string
  items: DocPage[]
}

export function getAllDocsPages() {
  return DOC_PAGES
}

export function getDocBySlug(slugParts: string[]) {
  const normalized = slugParts.join("/") as DocSlug
  return DOC_PAGE_BY_SLUG.get(normalized) ?? null
}

export function getDocBySlugValue(slug: DocSlug) {
  return DOC_PAGE_BY_SLUG.get(slug) ?? null
}

export function getSidebarGroups(): DocSidebarGroup[] {
  const hosted = DOC_PAGES.filter((page) => page.audience === "hosted")
  const selfHost = DOC_PAGES.filter((page) => page.audience === "self-host")

  return [
    {
      audience: "hosted",
      title: "Hosted Shelf",
      description: "Guides for end-users and hosted admins.",
      items: hosted,
    },
    {
      audience: "self-host",
      title: "Self-Hosting",
      description: "Deployment and operations guides.",
      items: selfHost,
    },
  ]
}

export function getPreviousNext(slug: DocSlug) {
  const index = DOC_SLUGS.indexOf(slug)

  return {
    previous: index > 0 ? DOC_PAGE_BY_SLUG.get(DOC_SLUGS[index - 1]) ?? null : null,
    next: index >= 0 && index < DOC_SLUGS.length - 1 ? DOC_PAGE_BY_SLUG.get(DOC_SLUGS[index + 1]) ?? null : null,
  }
}

export function getFirstPageForAudience(audience: DocAudience) {
  return DOC_PAGES.find((page) => page.audience === audience) ?? null
}

export function getAudienceLabel(audience: DocAudience) {
  return audience === "hosted" ? "Hosted" : "Self-host"
}
