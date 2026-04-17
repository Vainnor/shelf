import { ImageResponse } from "next/og"

import { getPublicProfileByUsername } from "@/src/actions/social"

export const size = {
  width: 1200,
  height: 630,
}

export const contentType = "image/png"

export default async function OpenGraphImage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  const profile = await getPublicProfileByUsername(username)

  if (!profile) {
    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #0f172a, #1e293b)",
            color: "white",
            fontSize: 54,
            fontWeight: 700,
          }}
        >
          Shelf
        </div>
      ),
      size
    )
  }

  const name = profile.user.name || profile.user.username

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #0f172a, #1e293b)",
          color: "#f8fafc",
          padding: "56px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ fontSize: 28, opacity: 0.9 }}>Shelf Public Profile</div>
          <div style={{ fontSize: 72, fontWeight: 800, lineHeight: 1.05 }}>{name}</div>
          <div style={{ fontSize: 40, opacity: 0.8 }}>@{profile.user.username}</div>
        </div>

        <div style={{ display: "flex", gap: "28px", fontSize: 36 }}>
          <span>{profile.stats.read} read</span>
          <span>{profile.stats.reading} reading</span>
          <span>{profile.stats.followers} followers</span>
        </div>
      </div>
    ),
    size
  )
}

