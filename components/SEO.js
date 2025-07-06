import { NextSeo } from 'next-seo';

export default function SEO({ title = 'هتاري - متجر الهواتف المحمولة', description = 'هتاري - وجهتك الأولى للحصول على أحدث الهواتف المحمولة والإكسسوارات التقنية بجودة عالية وأسعار تنافسية.', image }) {
  return (
    <NextSeo
      title={title}
      description={description}
      openGraph={{
        title,
        description,
        images: image ? [{ url: image }] : undefined,
        site_name: 'هتاري',
        url: process.env.PUBLIC_STORE_URL,
      }}
      languageAlternates={[
        {
          hrefLang: 'ar',
          href: process.env.PUBLIC_STORE_URL,
        },
      ]}
      additionalMetaTags={[
        {
          name: 'keywords',
          content: 'هواتف محمولة, إكسسوارات تقنية, متجر هتاري, أحدث الهواتف, أسعار تنافسية',
        },
      ]}
    />
  );
}