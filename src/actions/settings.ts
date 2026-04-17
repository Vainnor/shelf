"use server"

import { and, eq, ne, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"

import { auth } from "@/src/lib/auth"
import { db } from "@/src/db"
import { booksTable } from "@/src/db/schema/book"
import { reminderChannels, usersTable } from "@/src/db/schema/user"
import { requireAuthenticatedUser } from "@/src/lib/admin"

export type SettingsActionState = {
  ok: boolean
  message: string
  dataJson?: string
  deleted?: boolean
}

type ExportBookInput = {
  title?: unknown
  author?: unknown
  totalPages?: unknown
  currentPage?: unknown
  status?: unknown
  isbn?: unknown
  coverUrl?: unknown
  notes?: unknown
  rating?: unknown
  review?: unknown
  isFavorite?: unknown
  dailyPageGoal?: unknown
  targetFinishDate?: unknown
  startedAt?: unknown
  finishedAt?: unknown
  createdAt?: unknown
  updatedAt?: unknown
}

function parseNumber(value: unknown, fallback: number | null = null) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) {
      return parsed
    }
  }
  return fallback
}

function parseDate(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    return null
  }
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function parseBookStatus(value: unknown): "to_read" | "reading" | "read" {
  if (value === "to_read" || value === "reading" || value === "read") {
    return value
  }
  return "to_read"
}

function normalizeImportedBooks(rawBooks: unknown) {
  if (!Array.isArray(rawBooks)) {
    return []
  }

  return rawBooks
    .map((entry): ExportBookInput | null => (entry && typeof entry === "object" ? (entry as ExportBookInput) : null))
    .filter((entry): entry is ExportBookInput => Boolean(entry))
    .map((book) => {
      const title = typeof book.title === "string" ? book.title.trim() : ""
      const author = typeof book.author === "string" ? book.author.trim() : ""

      if (!title || !author) {
        return null
      }

      const totalPages = parseNumber(book.totalPages)
      const currentPage = parseNumber(book.currentPage, 0) ?? 0
      const rating = parseNumber(book.rating)

      return {
        id: crypto.randomUUID(),
        title,
        author,
        totalPages,
        currentPage: Math.max(0, currentPage),
        status: parseBookStatus(book.status),
        isbn: typeof book.isbn === "string" && book.isbn.trim() ? book.isbn.trim() : null,
        coverUrl: typeof book.coverUrl === "string" && book.coverUrl.trim() ? book.coverUrl.trim() : null,
        notes: typeof book.notes === "string" && book.notes.trim() ? book.notes.trim() : null,
        rating: rating !== null ? Math.min(5, Math.max(1, Math.round(rating))) : null,
        review: typeof book.review === "string" && book.review.trim() ? book.review.trim() : null,
        isFavorite: Boolean(book.isFavorite),
        dailyPageGoal: parseNumber(book.dailyPageGoal),
        targetFinishDate: parseDate(book.targetFinishDate),
        startedAt: parseDate(book.startedAt),
        finishedAt: parseDate(book.finishedAt),
        createdAt: parseDate(book.createdAt) ?? new Date(),
        updatedAt: parseDate(book.updatedAt) ?? new Date(),
      }
    })
    .filter((book): book is NonNullable<typeof book> => Boolean(book))
}

export async function updateCurrentUserSettings(
  _prevState: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  try {
    void _prevState
    const { user } = await requireAuthenticatedUser()
    const name = String(formData.get("name") ?? "").trim() || null
    const email = String(formData.get("email") ?? "").trim().toLowerCase()

    if (!email || !email.includes("@")) {
      return { ok: false, message: "Please provide a valid email address." }
    }

    const existing = await db.query.user.findFirst({
      where: and(eq(usersTable.email, email), ne(usersTable.id, user.id)),
    })

    if (existing) {
      return { ok: false, message: "That email is already in use by another account." }
    }

    await db
      .update(usersTable)
      .set({
        name,
        email,
        updatedAt: new Date(),
      })
      .where(eq(usersTable.id, user.id))

    revalidatePath("/settings")
    revalidatePath("/profile")
    revalidatePath("/dashboard")

    return { ok: true, message: "Account details updated." }
  } catch (error) {
    console.error("Error updating current user settings:", error)
    return { ok: false, message: "Failed to update account details." }
  }
}

export async function sendCurrentUserPasswordReset(
  _prevState: SettingsActionState
): Promise<SettingsActionState> {
  try {
    void _prevState
    const { user } = await requireAuthenticatedUser()

    await auth.api.requestPasswordReset({
      body: {
        email: user.email,
        redirectTo: "/reset-password",
      },
    })

    return {
      ok: true,
      message: "If your email is configured correctly, a password reset link will arrive shortly.",
    }
  } catch (error) {
    console.error("Error sending current user password reset:", error)
    return { ok: false, message: "Failed to send password reset email." }
  }
}

export async function updateReadingReminderSettings(
  _prevState: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  try {
    void _prevState
    const { user } = await requireAuthenticatedUser()
    const enabled = String(formData.get("readingReminderEnabled") ?? "false") === "true"
    const channel = String(formData.get("readingReminderChannel") ?? "email").trim().toLowerCase()
    const days = Number(formData.get("readingReminderDays") ?? 7)

    if (!reminderChannels.includes(channel as (typeof reminderChannels)[number])) {
      return { ok: false, message: "Reminder channel must be email or push." }
    }

    if (!Number.isInteger(days) || days < 1 || days > 60) {
      return { ok: false, message: "Reminder days must be a whole number between 1 and 60." }
    }

    await db
      .update(usersTable)
      .set({
        readingReminderEnabled: enabled,
        readingReminderChannel: channel,
        readingReminderDays: days,
        updatedAt: new Date(),
      })
      .where(eq(usersTable.id, user.id))

    revalidatePath("/settings")
    revalidatePath("/dashboard")

    return {
      ok: true,
      message: enabled
        ? `Reading reminders enabled (${channel}) after ${days} day(s) inactive.`
        : "Reading reminders disabled.",
    }
  } catch (error) {
    console.error("Error updating reading reminder settings:", error)
    return { ok: false, message: "Failed to update reading reminders." }
  }
}

export async function exportCurrentUserData(
  _prevState: SettingsActionState
): Promise<SettingsActionState> {
  try {
    void _prevState
    const { user } = await requireAuthenticatedUser()

    const books = await db.query.books.findMany({
      where: eq(booksTable.userId, user.id),
      orderBy: (table, { desc }) => [desc(table.updatedAt)],
    })

    const payload = {
      exportedAt: new Date().toISOString(),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        readingReminderEnabled: user.readingReminderEnabled,
        readingReminderChannel: user.readingReminderChannel,
        readingReminderDays: user.readingReminderDays,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      books,
      stats: {
        totalBooks: books.length,
        toRead: books.filter((book) => book.status === "to_read").length,
        reading: books.filter((book) => book.status === "reading").length,
        read: books.filter((book) => book.status === "read").length,
      },
    }

    return {
      ok: true,
      message: "Data export generated.",
      dataJson: JSON.stringify(payload, null, 2),
    }
  } catch (error) {
    console.error("Error exporting current user data:", error)
    return { ok: false, message: "Failed to export account data." }
  }
}

export async function importCurrentUserData(
  _prevState: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  try {
    void _prevState
    const { user } = await requireAuthenticatedUser()
    const replaceExisting = String(formData.get("replaceExisting") ?? "false") === "true"
    const importJson = String(formData.get("importJson") ?? "").trim()
    const importFile = formData.get("importFile")

    let payloadText = importJson
    if (!payloadText && importFile instanceof File) {
      payloadText = (await importFile.text()).trim()
    }

    if (!payloadText) {
      return { ok: false, message: "Provide export JSON text or upload a JSON file." }
    }

    let parsed: unknown
    try {
      parsed = JSON.parse(payloadText)
    } catch {
      return { ok: false, message: "Invalid JSON format." }
    }

    if (!parsed || typeof parsed !== "object") {
      return { ok: false, message: "Import payload must be a JSON object." }
    }

    const payload = parsed as { books?: unknown }
    const normalizedBooks = normalizeImportedBooks(payload.books)

    if (normalizedBooks.length === 0) {
      return { ok: false, message: "No valid books found in import payload." }
    }

    if (replaceExisting) {
      await db.delete(booksTable).where(eq(booksTable.userId, user.id))
    }

    await db.insert(booksTable).values(
      normalizedBooks.map((book) => ({
        ...book,
        userId: user.id,
      }))
    )

    revalidatePath("/dashboard")
    revalidatePath("/library")
    revalidatePath("/books")
    revalidatePath("/settings")

    return {
      ok: true,
      message: replaceExisting
        ? `Import complete. Replaced your library with ${normalizedBooks.length} book(s).`
        : `Import complete. Added ${normalizedBooks.length} book(s) to your library.`,
    }
  } catch (error) {
    console.error("Error importing current user data:", error)
    return { ok: false, message: "Failed to import account data." }
  }
}

export async function deleteCurrentUserAccount(
  _prevState: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  try {
    void _prevState
    const { user } = await requireAuthenticatedUser()
    const confirmText = String(formData.get("confirmText") ?? "").trim()

    if (confirmText !== "DELETE") {
      return { ok: false, message: "Type DELETE to confirm account deletion." }
    }

    if (user.role === "admin") {
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(usersTable)
        .where(eq(usersTable.role, "admin"))

      if (count <= 1) {
        return {
          ok: false,
          message: "You cannot delete the last admin account.",
        }
      }
    }

    await db.delete(usersTable).where(eq(usersTable.id, user.id))

    revalidatePath("/")
    revalidatePath("/login")
    revalidatePath("/signup")

    return {
      ok: true,
      message: "Your account has been deleted.",
      deleted: true,
    }
  } catch (error) {
    console.error("Error deleting current user account:", error)
    return { ok: false, message: "Failed to delete account." }
  }
}

