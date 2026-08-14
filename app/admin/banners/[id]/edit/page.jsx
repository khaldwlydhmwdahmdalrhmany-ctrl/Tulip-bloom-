"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import BannerForm from "../../../../../components/BannerForm.jsx";

const C = { navy: "#0C1C77", slate: "#5C6B72" };

export default function EditBannerPage() {
  const { id } = useParams();
  const [banner, setBanner] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/banners").then((r) => r.json()).then((all) => {
      setBanner(all.find((b) => b.id === id) || null);
      setLoaded(true);
    });
  }, [id]);

  if (!loaded) return <p style={{ color: C.slate }}>جاري التحميل...</p>;
  if (!banner) return <p style={{ color: "#c05050" }}>البنر غير موجود</p>;

  return (
    <div>
      <h1 className="font-display text-xl mb-6" style={{ color: C.navy, fontWeight: 800 }}>تعديل: {banner.title}</h1>
      <BannerForm
        bannerId={id}
        initial={{
          title: banner.title,
          subtitle: banner.subtitle || "",
          placement: banner.placement,
          categoryId: banner.categoryId || "",
          imageUrl: banner.imageUrl || "",
          sortOrder: banner.sortOrder ?? 0,
          active: banner.active !== false,
        }}
      />
    </div>
  );
}
