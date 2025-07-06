import { getServerSideSitemap } from 'next-sitemap';

export async function getServerSideProps(ctx) {
  // جلب بيانات المنتجات من API الموقع
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products`);
  const products = await response.json();

  // إعداد الحقول الخاصة بـ Sitemap لكل منتج
  const fields = products.map(product => ({
    loc: `${process.env.NEXT_PUBLIC_SITE_URL}/product/${product.slug}`, // رابط المنتج
    lastmod: product.updatedAt || new Date().toISOString(), // تاريخ آخر تعديل للمنتج
    changefreq: 'daily', // تحديث يومي
    priority: 0.8, // أولوية مرتفعة نسبيًا للمنتجات
  }));

  // إنشاء Sitemap باستخدام الحقول
  return getServerSideSitemap(ctx, fields);
}

export default function Sitemap() {}
