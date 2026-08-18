import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Heart } from "lucide-react";
import { getCurrentCustomer } from "../../../../lib/customerSession.js";
import { listFavoriteIds } from "../../../../lib/customerDb.js";
import { getProducts } from "../../../../lib/queries.js";
import ProductCard from "../../../../components/site/ProductCard.jsx";
import { C } from "../../../../lib/colors.js";

export const dynamic = "force-dynamic";
export const metadata = { title: "المفضّلة" };

export default async function FavoritesPage() {
  const me = await getCurrentCustomer();
  if (!me) redirect("/account/login");

  const [ids, products] = await Promise.all([listFavoriteIds(me.id), getProducts()]);
  // الترتيب يتبع ترتيب الإضافة لا ترتيب الكتالوج
  const items = ids.map((id) => products.find((p) => p.id === id)).filter(Boolean);

  const gone = ids.length - items.length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <span className="eyebrow mb-2">محفوظاتك</span>
        <h1 className="h-section font-display mb-1" style={{ color: C.navy }}>المفضّلة</h1>
        <p className="text-sm" style={{ color: C.slate }}>
          ما أعجبك واحتفظت به — نستخدمه أيضًا لترشيح ما يناسب ذوقك.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="p-10 rounded-2xl text-center" style={{ background: "#fff", border: `1px solid ${C.line}` }}>
          <span className="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center"
                style={{ background: C.mintTint, color: C.teal }}>
            <Heart size={20} />
          </span>
          <p className="text-sm font-bold mb-1" style={{ color: C.navy }}>لا مفضّلة بعد</p>
          <p className="text-xs mb-5 leading-relaxed" style={{ color: C.slate }}>
            اضغط القلب على أي منتج ليظهر هنا.
          </p>
          <Link href="/shop" className="btn px-6 py-3 text-sm" style={{ background: C.navy, color: "#fff" }}>
            تصفّح التشكيلة
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {items.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
          {gone > 0 && (
            <p className="text-[11px] text-center" style={{ color: C.slateLight }}>
              {gone} من محفوظاتك لم تعد متاحة في المتجر.
            </p>
          )}
        </>
      )}
    </div>
  );
}
