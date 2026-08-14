"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ProductForm from "../../../../../components/ProductForm.jsx";

const C = { navy: "#0C1C77", slate: "#5C6B72" };

export default function EditProductPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);

  useEffect(() => {
    fetch(`/api/products/${id}`).then((r) => r.json()).then(setProduct);
  }, [id]);

  if (!product) return <p style={{ color: C.slate }}>جاري التحميل...</p>;
  if (product.error) return <p style={{ color: "#c05050" }}>المنتج غير موجود</p>;

  return (
    <div>
      <h1 className="font-display text-xl mb-6" style={{ color: C.navy, fontWeight: 800 }}>تعديل: {product.name}</h1>
      <ProductForm
        productId={id}
        initial={{
          name: product.name,
          description: product.description,
          fullDescription: product.fullDescription,
          price: product.price,
          oldPrice: product.oldPrice ?? "",
          badge: product.badge || "",
          imageUrl: product.imageUrl || "",
          freeShipping: product.freeShipping,
          freeInstall: product.freeInstall,
          categoryId: product.categoryId,
        }}
      />
    </div>
  );
}
