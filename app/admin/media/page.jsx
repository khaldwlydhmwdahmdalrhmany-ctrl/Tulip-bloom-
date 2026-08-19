import React from "react";
import { listMedia, mediaStats } from "../../../lib/mediaDb.js";
import { themeColors, TYPOGRAPHY } from "../../../config/theme.config.js";
import MediaLibrary from "../../../components/MediaLibrary.jsx";

export const dynamic = "force-dynamic";
const T = themeColors();

export default async function AdminMediaPage() {
  const [media, stats] = await Promise.all([
    listMedia({ limit: 300 }).catch(() => []),
    mediaStats().catch(() => ({ count: 0, bytes: 0 })),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl mb-1" style={{ color: T.primary, fontFamily: TYPOGRAPHY.headingFontFamily, fontWeight: 600 }}>
          مكتبة الوسائط
        </h1>
        <p className="text-xs" style={{ color: T.muted }}>
          كل صورة رُفعت — تصفّحها، أعد استخدامها، واضبط نصها البديل.
        </p>
      </div>

      <MediaLibrary
        initial={media.map((m) => ({
          id: m.id, url: m.url, filename: m.filename || "", alt: m.alt || "",
          mime: m.mime || "", size: Number(m.size || 0),
          storage: m.storage || "blob", createdAt: m.createdAt,
        }))}
        stats={stats}
      />
    </div>
  );
}
