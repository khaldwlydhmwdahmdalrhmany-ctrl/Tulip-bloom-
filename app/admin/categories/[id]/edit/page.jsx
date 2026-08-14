"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import CategoryForm from "../../../../../components/CategoryForm.jsx";

const C = { navy: "#0C1C77", slate: "#5C6B72" };

export default function EditCategoryPage() {
  const { id } = useParams();
  const [categories, setCategories] = useState(null);

  useEffect(() => {
    fetch("/api/categories").then((r) => r.json()).then(setCategories);
  }, []);

  if (!categories) return <p style={{ color: C.slate }}>جاري التحميل...</p>;
  const category = categories.find((c) => c.id === id);
  if (!category) return <p style={{ color: "#c05050" }}>التصنيف غير موجود</p>;

  return (
    <div>
      <h1 className="font-display text-xl mb-6" style={{ color: C.navy, fontWeight: 800 }}>تعديل: {category.name}</h1>
      <CategoryForm
        categoryId={id}
        initial={{
          name: category.name,
          tagline: category.tagline || "",
          color: category.color || "#0C1C77",
          icon: category.icon || "Package",
          bannerUrl: category.bannerUrl || "",
          sortOrder: category.sortOrder ?? 0,
        }}
      />
    </div>
  );
}
