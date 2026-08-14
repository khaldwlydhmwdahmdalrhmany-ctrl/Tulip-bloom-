import React from "react";
import BannerForm from "../../../../components/BannerForm.jsx";

const C = { navy: "#0C1C77" };

export default function NewBannerPage() {
  return (
    <div>
      <h1 className="font-display text-xl mb-6" style={{ color: C.navy, fontWeight: 800 }}>إضافة بنر جديد</h1>
      <BannerForm />
    </div>
  );
}
