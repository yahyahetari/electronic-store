import Image from 'next/image';

export default function OptimizedImage({ src, alt, width, height, ...props }) {
  return (
    <Image
      src={src}
      alt={alt || 'صورة منتج من هتاري'} // إضافة نص بديل افتراضي يعكس هوية المتجر
      loading="lazy" // تحسين الأداء بتحميل الصور عند الحاجة
      placeholder="blur" // عرض تأثير التمويه أثناء التحميل
      blurDataURL={`data:image/svg+xml;base64,PHN2ZyB4bWxucz0i...`} // يمكن تخصيص تأثير التمويه هنا
      width={width || 500} // تحديد عرض افتراضي
      height={height || 500} // تحديد ارتفاع افتراضي
      style={{ objectFit: 'cover', borderRadius: '8px' }} // تحسين شكل الصورة
      {...props}
    />
  );
}
