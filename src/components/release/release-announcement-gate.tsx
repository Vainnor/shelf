import { getActiveReleaseAnnouncementForViewer } from "@/src/actions/release-announcements"

import ReleaseAnnouncementModal from "./release-announcement-modal"

export default async function ReleaseAnnouncementGate() {
  let release: Awaited<ReturnType<typeof getActiveReleaseAnnouncementForViewer>> | null = null

  try {
    release = await getActiveReleaseAnnouncementForViewer()
  } catch {
    return null
  }

  if (!release) {
    return null
  }

  return (
    <ReleaseAnnouncementModal
      release={{
        id: release.id,
        versionKey: release.versionKey,
        title: release.title,
        body: release.body,
        releaseLink: release.releaseLink,
        imageUrls: release.imageUrls,
      }}
    />
  )
}

