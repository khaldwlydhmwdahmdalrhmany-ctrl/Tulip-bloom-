import React from "react";
import ProductForm from "../../../../components/ProductForm.jsx";

const C = { navy: "#0C1C77" };

export default function NewProductPage() {
  return (
    <div>
      <h1 className="font-display text-xl mb-6" style={{ color: C.navy, fontWeight: 800 }}>إضافة منتج جديد</h1>
      <ProductForm />
    </div>
  );
}
