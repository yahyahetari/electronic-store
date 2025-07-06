import Head from 'next/head';

export default function ProductSchema({ product }) {
  const schema = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.title,
    "image": product.images, // استخدام جميع الصور المتاحة للمنتج
    "description": product.description,
    "brand": {
      "@type": "Brand",
      "name": "هتاري" // تضمين اسم العلامة التجارية
    },
    "sku": product.sku || product._id, // استخدام SKU أو معرف المنتج
    "offers": {
      "@type": "Offer",
      "priceCurrency": "AED", // العملة: الريال السعودي
      "price": product.price,
      "availability": "https://schema.org/InStock",
      "url": `${process.env.NEXT_PUBLIC_SITE_URL}/product/${product.slug}` // رابط المنتج
    }
  };

  return (
    <Head>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
    </Head>
  );
}
