"use server"

import { and, eq, inArray } from "drizzle-orm"
import { revalidatePath } from "next/cache"

import { db } from "@/src/db"
import {
  bookClubActivityTable,
  bookClubBooksTable,
  bookClubInvitesTable,
  bookClubMembersTable,
  bookClubPostsTable,
  bookClubsTable,
} from "@/src/db/schema/reading"
import { usersTable } from "@/src/db/schema/user"
import { writeAuditLog } from "@/src/lib/audit"
import { getActiveSession } from "@/src/lib/session"
import { canManageRole, requireClubMembership, requireClubRole } from "@/src/lib/clubs"
import { createNotification } from "@/src/lib/notifications"

type ClubRole = "owner" | "moderator" | "member"

async function requireActiveSession() {
  const activeSession = await getActiveSession()
  if (!activeSession) {
    throw new Error("Unauthorized")
  }

  return activeSession.session
}

async function logClubActivity(input: {
  clubId: string
  actorUserId: string
  activityType:
    | "club_created"
    | "member_joined"
    | "member_left"
    | "invite_sent"
    | "invite_accepted"
    | "invite_declined"
    | "invite_revoked"
    | "member_role_changed"
    | "member_removed"
    | "book_added"
    | "book_removed"
    | "discussion_posted"
  details?: string
}) {
  await db.insert(bookClubActivityTable).values({
    id: crypto.randomUUID(),
    clubId: input.clubId,
    actorUserId: input.actorUserId,
    activityType: input.activityType,
    details: input.details ?? null,
  })
}

export async function getClubPageData(clubId: string) {
  const session = await requireActiveSession()
  const { club, membership } = await requireClubMembership(clubId, session.user.id)

  const [memberships, books, posts, activity, invites] = await Promise.all([
    db.query.bookClubMembers.findMany({
      where: eq(bookClubMembersTable.clubId, clubId),
      orderBy: (table, { asc }) => [asc(table.createdAt)],
    }),
    db.query.bookClubBooks.findMany({
      where: eq(bookClubBooksTable.clubId, clubId),
      orderBy: (table, { desc }) => [desc(table.updatedAt)],
    }),
    db.query.bookClubPosts.findMany({
      where: eq(bookClubPostsTable.clubId, clubId),
      orderBy: (table, { desc }) => [desc(table.createdAt)],
      limit: 50,
    }),
    db.query.bookClubActivity.findMany({
      where: eq(bookClubActivityTable.clubId, clubId),
      orderBy: (table, { desc }) => [desc(table.createdAt)],
      limit: 50,
    }),
    membership.role === "owner" || membership.role === "moderator"
      ? db.query.bookClubInvites.findMany({
          where: and(eq(bookClubInvitesTable.clubId, clubId), eq(bookClubInvitesTable.status, "pending")),
          orderBy: (table, { desc }) => [desc(table.createdAt)],
        })
      : Promise.resolve([]),
  ])

  const userIds = Array.from(
    new Set([
      ...memberships.map((member) => member.userId),
      ...books.map((book) => book.addedByUserId),
      ...posts.map((post) => post.authorUserId),
      ...activity.map((item) => item.actorUserId),
      ...invites.map((invite) => invite.inviterUserId),
      ...invites.map((invite) => invite.invitedUserId),
    ])
  )

  const users = userIds.length
    ? await db.query.user.findMany({
        where: inArray(usersTable.id, userIds),
      })
    : []

  const userById = new Map(users.map((user) => [user.id, user]))

  return {
    club,
    viewerUserId: session.user.id,
    viewerMembership: membership,
    members: memberships.map((member) => ({
      ...member,
      user: userById.get(member.userId) ?? null,
    })),
    books: books.map((book) => ({
      ...book,
      addedBy: userById.get(book.addedByUserId) ?? null,
    })),
    posts: posts.map((post) => ({
      ...post,
      author: userById.get(post.authorUserId) ?? null,
    })),
    activity: activity.map((item) => ({
      ...item,
      actor: userById.get(item.actorUserId) ?? null,
    })),
    invites: invites.map((invite) => ({
      ...invite,
      inviter: userById.get(invite.inviterUserId) ?? null,
      invitedUser: userById.get(invite.invitedUserId) ?? null,
    })),
  }
}

export async function addBookToClubShelf(input: {
  clubId: string
  title: string
  author: string
  coverUrl?: string | null
  notes?: string | null
  status?: "to_read" | "reading" | "read"
}) {
  const session = await requireActiveSession()
  await requireClubMembership(input.clubId, session.user.id)

  const title = input.title.trim()
  const author = input.author.trim()

  if (!title || !author) {
    throw new Error("Title and author are required")
  }

  const [created] = await db
    .insert(bookClubBooksTable)
    .values({
      id: crypto.randomUUID(),
      clubId: input.clubId,
      addedByUserId: session.user.id,
      title,
      author,
      coverUrl: input.coverUrl?.trim() || null,
      notes: input.notes?.trim() || null,
      status: input.status ?? "to_read",
    })
    .returning()

  if (!created) {
    throw new Error("Failed to add club shelf book")
  }

  await logClubActivity({
    clubId: input.clubId,
    actorUserId: session.user.id,
    activityType: "book_added",
    details: `${title} by ${author}`,
  })

  await writeAuditLog({
    actorUserId: session.user.id,
    scope: "club",
    action: "club.book_added",
    targetType: "club",
    targetId: input.clubId,
    metadata: { title, author },
  })

  revalidatePath(`/clubs/${input.clubId}`)
  return created
}

export async function removeBookFromClubShelf(clubId: string, clubBookId: string) {
  const session = await requireActiveSession()
  const { membership } = await requireClubMembership(clubId, session.user.id)

  const book = await db.query.bookClubBooks.findFirst({
    where: and(eq(bookClubBooksTable.id, clubBookId), eq(bookClubBooksTable.clubId, clubId)),
  })

  if (!book) {
    throw new Error("Club book not found")
  }

  const canRemove =
    membership.role === "owner" || membership.role === "moderator" || book.addedByUserId === session.user.id
  if (!canRemove) {
    throw new Error("You do not have permission to remove this book")
  }

  await db
    .delete(bookClubBooksTable)
    .where(and(eq(bookClubBooksTable.id, clubBookId), eq(bookClubBooksTable.clubId, clubId)))

  await logClubActivity({
    clubId,
    actorUserId: session.user.id,
    activityType: "book_removed",
    details: `${book.title} by ${book.author}`,
  })

  await writeAuditLog({
    actorUserId: session.user.id,
    scope: "club",
    action: "club.book_removed",
    targetType: "club",
    targetId: clubId,
    metadata: { title: book.title, author: book.author },
  })

  revalidatePath(`/clubs/${clubId}`)
  return { ok: true }
}

export async function postClubDiscussion(
  clubId: string,
  input: { title: string; body: string; isAnnouncement?: boolean }
) {
  const session = await requireActiveSession()
  const { membership } = await requireClubMembership(clubId, session.user.id)

  const trimmedTitle = input.title.trim()
  const trimmedBody = input.body.trim()

  if (!trimmedTitle) {
    throw new Error("Post title is required")
  }

  if (!trimmedBody) {
    throw new Error("Discussion message cannot be empty")
  }

  if (input.isAnnouncement && membership.role === "member") {
    throw new Error("Only moderators can publish announcement posts")
  }

  const [post] = await db
    .insert(bookClubPostsTable)
    .values({
      id: crypto.randomUUID(),
      clubId,
      authorUserId: session.user.id,
      title: trimmedTitle,
      body: trimmedBody,
      isAnnouncement: Boolean(input.isAnnouncement),
    })
    .returning()

  await logClubActivity({
    clubId,
    actorUserId: session.user.id,
    activityType: "discussion_posted",
    details: trimmedTitle,
  })

  await writeAuditLog({
    actorUserId: session.user.id,
    scope: "club",
    action: "club.discussion_posted",
    targetType: "club",
    targetId: clubId,
    metadata: { title: trimmedTitle, isAnnouncement: Boolean(input.isAnnouncement) },
  })

  revalidatePath(`/clubs/${clubId}`)

  if (input.isAnnouncement) {
    const recipients = await db.query.bookClubMembers.findMany({
      where: eq(bookClubMembersTable.clubId, clubId),
      columns: { userId: true },
    })

    await Promise.all(
      recipients
        .filter((member) => member.userId !== session.user.id)
        .map((member) =>
          createNotification({
            userId: member.userId,
            type: "club.announcement",
            title: "New club announcement",
            body: trimmedTitle,
            href: `/clubs/${clubId}/posts`,
          })
        )
    )
  }

  return post
}

export async function updateClubPost(
  clubId: string,
  postId: string,
  input: { title: string; body: string }
) {
  const session = await requireActiveSession()
  await requireClubMembership(clubId, session.user.id)

  const post = await db.query.bookClubPosts.findFirst({
    where: and(eq(bookClubPostsTable.id, postId), eq(bookClubPostsTable.clubId, clubId)),
  })

  if (!post) {
    throw new Error("Post not found")
  }

  if (post.authorUserId !== session.user.id) {
    throw new Error("You can only edit your own posts")
  }

  const title = input.title.trim()
  const body = input.body.trim()

  if (!title || !body) {
    throw new Error("Post title and body are required")
  }

  const [updated] = await db
    .update(bookClubPostsTable)
    .set({
      title,
      body,
      editedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(and(eq(bookClubPostsTable.id, postId), eq(bookClubPostsTable.clubId, clubId)))
    .returning()

  if (!updated) {
    throw new Error("Failed to update post")
  }

  revalidatePath(`/clubs/${clubId}`)
  return updated
}

export async function deleteClubPost(clubId: string, postId: string) {
  const session = await requireActiveSession()
  const { membership } = await requireClubMembership(clubId, session.user.id)

  const post = await db.query.bookClubPosts.findFirst({
    where: and(eq(bookClubPostsTable.id, postId), eq(bookClubPostsTable.clubId, clubId)),
  })

  if (!post) {
    throw new Error("Post not found")
  }

  const canDelete =
    post.authorUserId === session.user.id || membership.role === "owner" || membership.role === "moderator"
  if (!canDelete) {
    throw new Error("You do not have permission to delete this post")
  }

  await db
    .delete(bookClubPostsTable)
    .where(and(eq(bookClubPostsTable.id, postId), eq(bookClubPostsTable.clubId, clubId)))

  revalidatePath(`/clubs/${clubId}`)
  return { ok: true }
}

export async function inviteUserToClub(input: { clubId: string; username: string; role?: ClubRole }) {
  const session = await requireActiveSession()
  const { membership } = await requireClubRole(input.clubId, session.user.id, "moderator")
  const username = input.username.trim().toLowerCase()

  if (!username) {
    throw new Error("Username is required")
  }

  const target = await db.query.user.findFirst({
    where: eq(usersTable.username, username),
  })

  if (!target) {
    throw new Error("User not found")
  }

  const existingMember = await db.query.bookClubMembers.findFirst({
    where: and(eq(bookClubMembersTable.clubId, input.clubId), eq(bookClubMembersTable.userId, target.id)),
  })
  if (existingMember) {
    throw new Error("User is already a club member")
  }

  const desiredRole = input.role ?? "member"
  if (membership.role === "moderator" && desiredRole !== "member") {
    throw new Error("Moderators can only invite as member")
  }

  const existingInvite = await db.query.bookClubInvites.findFirst({
    where: and(
      eq(bookClubInvitesTable.clubId, input.clubId),
      eq(bookClubInvitesTable.invitedUserId, target.id),
      eq(bookClubInvitesTable.status, "pending")
    ),
  })

  if (existingInvite) {
    throw new Error("User already has a pending invite")
  }

  const [invite] = await db
    .insert(bookClubInvitesTable)
    .values({
      id: crypto.randomUUID(),
      clubId: input.clubId,
      inviterUserId: session.user.id,
      invitedUserId: target.id,
      role: desiredRole,
      status: "pending",
    })
    .returning()

  await logClubActivity({
    clubId: input.clubId,
    actorUserId: session.user.id,
    activityType: "invite_sent",
    details: `Invited @${target.username ?? target.email} as ${desiredRole}`,
  })

  await writeAuditLog({
    actorUserId: session.user.id,
    scope: "club",
    action: "club.invite_sent",
    targetType: "club",
    targetId: input.clubId,
    metadata: { invitedUserId: target.id, invitedRole: desiredRole },
  })

  revalidatePath(`/clubs/${input.clubId}`)

  await createNotification({
    userId: target.id,
    type: "club.invite",
    title: "Book club invitation",
    body: `You were invited to join a book club as ${desiredRole}.`,
    href: "/social",
  })

  return invite
}

export async function revokeClubInvite(clubId: string, inviteId: string) {
  const session = await requireActiveSession()
  await requireClubRole(clubId, session.user.id, "moderator")

  const [invite] = await db
    .update(bookClubInvitesTable)
    .set({ status: "revoked", updatedAt: new Date() })
    .where(
      and(
        eq(bookClubInvitesTable.id, inviteId),
        eq(bookClubInvitesTable.clubId, clubId),
        eq(bookClubInvitesTable.status, "pending")
      )
    )
    .returning()

  if (!invite) {
    throw new Error("Invite not found")
  }

  await logClubActivity({
    clubId,
    actorUserId: session.user.id,
    activityType: "invite_revoked",
  })

  await writeAuditLog({
    actorUserId: session.user.id,
    scope: "club",
    action: "club.invite_revoked",
    targetType: "club",
    targetId: clubId,
    metadata: { inviteId },
  })

  revalidatePath(`/clubs/${clubId}`)
  return { ok: true }
}

export async function respondToClubInvite(inviteId: string, accept: boolean) {
  const session = await requireActiveSession()

  const invite = await db.query.bookClubInvites.findFirst({
    where: and(
      eq(bookClubInvitesTable.id, inviteId),
      eq(bookClubInvitesTable.invitedUserId, session.user.id),
      eq(bookClubInvitesTable.status, "pending")
    ),
  })

  if (!invite) {
    throw new Error("Invite not found")
  }

  await db
    .update(bookClubInvitesTable)
    .set({ status: accept ? "accepted" : "declined", updatedAt: new Date() })
    .where(eq(bookClubInvitesTable.id, inviteId))

  if (accept) {
    await db
      .insert(bookClubMembersTable)
      .values({
        id: crypto.randomUUID(),
        clubId: invite.clubId,
        userId: session.user.id,
        role: invite.role,
      })
      .onConflictDoNothing({ target: [bookClubMembersTable.clubId, bookClubMembersTable.userId] })

    await logClubActivity({
      clubId: invite.clubId,
      actorUserId: session.user.id,
      activityType: "invite_accepted",
    })

    await writeAuditLog({
      actorUserId: session.user.id,
      scope: "club",
      action: "club.invite_accepted",
      targetType: "club",
      targetId: invite.clubId,
      metadata: { inviteId, role: invite.role },
    })

    await createNotification({
      userId: invite.inviterUserId,
      type: "club.invite_response",
      title: "Invite accepted",
      body: "A user accepted your book club invite.",
      href: `/clubs/${invite.clubId}/members`,
    })
  } else {
    await logClubActivity({
      clubId: invite.clubId,
      actorUserId: session.user.id,
      activityType: "invite_declined",
    })

    await writeAuditLog({
      actorUserId: session.user.id,
      scope: "club",
      action: "club.invite_declined",
      targetType: "club",
      targetId: invite.clubId,
      metadata: { inviteId },
    })

    await createNotification({
      userId: invite.inviterUserId,
      type: "club.invite_response",
      title: "Invite declined",
      body: "A user declined your book club invite.",
      href: `/clubs/${invite.clubId}/members`,
    })
  }

  revalidatePath("/social")
  revalidatePath(`/clubs/${invite.clubId}`)
  return { ok: true, clubId: invite.clubId }
}

export async function updateClubMemberRole(clubId: string, targetUserId: string, role: ClubRole) {
  const session = await requireActiveSession()
  const { membership } = await requireClubRole(clubId, session.user.id, "moderator")

  const target = await db.query.bookClubMembers.findFirst({
    where: and(eq(bookClubMembersTable.clubId, clubId), eq(bookClubMembersTable.userId, targetUserId)),
  })

  if (!target) {
    throw new Error("Member not found")
  }

  if (!canManageRole(membership.role, target.role)) {
    throw new Error("You do not have permission to modify this member")
  }

  if (role === "owner") {
    throw new Error("Owner transfer is not supported yet")
  }

  await db
    .update(bookClubMembersTable)
    .set({ role })
    .where(and(eq(bookClubMembersTable.clubId, clubId), eq(bookClubMembersTable.userId, targetUserId)))

  await logClubActivity({
    clubId,
    actorUserId: session.user.id,
    activityType: "member_role_changed",
    details: `Changed member role to ${role}`,
  })

  await writeAuditLog({
    actorUserId: session.user.id,
    scope: "club",
    action: "club.member_role_changed",
    targetType: "club",
    targetId: clubId,
    metadata: { targetUserId, role },
  })

  revalidatePath(`/clubs/${clubId}`)
  return { ok: true }
}

export async function removeClubMember(clubId: string, targetUserId: string) {
  const session = await requireActiveSession()
  const { membership } = await requireClubRole(clubId, session.user.id, "moderator")

  const target = await db.query.bookClubMembers.findFirst({
    where: and(eq(bookClubMembersTable.clubId, clubId), eq(bookClubMembersTable.userId, targetUserId)),
  })

  if (!target) {
    throw new Error("Member not found")
  }

  if (!canManageRole(membership.role, target.role)) {
    throw new Error("You do not have permission to remove this member")
  }

  await db
    .delete(bookClubMembersTable)
    .where(and(eq(bookClubMembersTable.clubId, clubId), eq(bookClubMembersTable.userId, targetUserId)))

  await logClubActivity({
    clubId,
    actorUserId: session.user.id,
    activityType: "member_removed",
  })

  await writeAuditLog({
    actorUserId: session.user.id,
    scope: "club",
    action: "club.member_removed",
    targetType: "club",
    targetId: clubId,
    metadata: { targetUserId },
  })

  revalidatePath(`/clubs/${clubId}`)
  return { ok: true }
}

export async function getMyPendingClubInvites() {
  const session = await requireActiveSession()

  const invites = await db.query.bookClubInvites.findMany({
    where: and(eq(bookClubInvitesTable.invitedUserId, session.user.id), eq(bookClubInvitesTable.status, "pending")),
    orderBy: (table, { desc }) => [desc(table.createdAt)],
  })

  if (invites.length === 0) {
    return []
  }

  const clubIds = invites.map((invite) => invite.clubId)
  const inviterIds = invites.map((invite) => invite.inviterUserId)

  const [clubs, inviters] = await Promise.all([
    db.query.bookClubs.findMany({ where: inArray(bookClubsTable.id, clubIds) }),
    db.query.user.findMany({ where: inArray(usersTable.id, inviterIds) }),
  ])

  const clubById = new Map(clubs.map((club) => [club.id, club]))
  const inviterById = new Map(inviters.map((user) => [user.id, user]))

  return invites.map((invite) => ({
    ...invite,
    club: clubById.get(invite.clubId) ?? null,
    inviter: inviterById.get(invite.inviterUserId) ?? null,
  }))
}


