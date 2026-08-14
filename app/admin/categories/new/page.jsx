import React from "react";
import CategoryForm from "../../../../components/CategoryForm.jsx";

const C = { navy: "#0C1C77" };

export default function NewCategoryPage() {
  return (
    <div>
      <h1 className="font-display text-xl mb-6" style={{ color: C.navy, fontWeight: 800 }}>إضافة تصنيف جديد</h1>
      <CategoryForm />
    </div>
  );
}
