"use server"

import { revalidatePath } from "next/cache"

import { getActiveSession } from "@/src/lib/session"
import {
  deleteNotification,
  deleteReadNotifications,
  getUnreadNotificationsCount,
  listNotificationsForUser,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/src/lib/notifications"

async function requireActiveSession() {
  const activeSession = await getActiveSession()
  if (!activeSession) {
    throw new Error("Unauthorized")
  }

  return activeSession.session
}

function revalidateNotificationViews() {
  revalidatePath("/notifications")
  revalidatePath("/dashboard")
  revalidatePath("/library")
  revalidatePath("/social")
  revalidatePath("/books/[id]", "page")
}

export async function getNotifications(limit = 100) {
  const session = await requireActiveSession()
  return listNotificationsForUser(session.user.id, limit)
}

export async function getUnreadNotificationCount() {
  const session = await requireActiveSession()
  return getUnreadNotificationsCount(session.user.id)
}

export async function markNotificationAsReadAction(notificationId: string) {
  const session = await requireActiveSession()
  await markNotificationAsRead(session.user.id, notificationId)
  revalidateNotificationViews()
}

export async function deleteNotificationAction(notificationId: string) {
  const session = await requireActiveSession()
  await deleteNotification(session.user.id, notificationId)
  revalidateNotificationViews()
}

export async function markAllNotificationsAsReadAction(_formData?: FormData) {
  void _formData
  const session = await requireActiveSession()
  await markAllNotificationsAsRead(session.user.id)
  revalidateNotificationViews()
}

export async function deleteReadNotificationsAction(_formData?: FormData) {
  void _formData
  const session = await requireActiveSession()
  await deleteReadNotifications(session.user.id)
  revalidateNotificationViews()
}

export async function markNotificationAsReadFromForm(formData: FormData) {
  const id = String(formData.get("notificationId") ?? "").trim()
  if (!id) {
    throw new Error("Notification id is required")
  }

  await markNotificationAsReadAction(id)
}

export async function deleteNotificationFromForm(formData: FormData) {
  const id = String(formData.get("notificationId") ?? "").trim()
  if (!id) {
    throw new Error("Notification id is required")
  }

  await deleteNotificationAction(id)
}

export async function markAllNotificationsAsReadFromForm(_formData: FormData) {
  void _formData
  await markAllNotificationsAsReadAction()
}

export async function deleteReadNotificationsFromForm(_formData: FormData) {
  void _formData
  await deleteReadNotificationsAction()
}

