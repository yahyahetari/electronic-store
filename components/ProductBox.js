import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import QuickAddToCart from "./QuickAddToCart";
import { Star } from "lucide-react";

const getColorHex = (colorName) => {
  const colors = {
    "أحمر": "#FF0000",
    "أزرق": "#020e77",
    "أخضر": "#0a7900",
    "أصفر": "#FFFF00",
    "أسود": "#000000",
    "أبيض": "#FFFFFF",
    "بني": "#964B00",
    "رمادي": "#808080",
    "برتقالي": "#FFA500",
    "وردي": "#FFC0CB",
    "بنفسجي": "#800080",
    "ذهبي": "#FFD700",
    "فضي": "#C0C0C0",
    "بيج": "#F5F5DC",
    "كحلي": "#000080",
    "نيلي": "#1F305E",
    "زيتي": "#808000",
    "نحاسي": "#B87333",
    "عنابي": "#800000",
    "تركواز": "#40E0D0",
    "ليموني": "#c7d77a"
  };
  return colors[colorName] || colorName;
};

const shimmerEffect = {
  hidden: { x: '-100%' },
  visible: { x: '100%' },
};

const truncateText = (text, maxLength) => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
};

export default function ProductBox({ _id, title, images, variants, slug, ratings }) {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [hoveredColor, setHoveredColor] = useState(null);

  // استخراج جميع الألوان الفريدة من جميع المتغيرات
  const allColors = [...new Set(variants.flatMap(variant =>
    variant.properties?.اللون || []
  ))];

  const firstPrice = variants[0]?.price || 0;

  const handleAddToCart = () => {
    setShowQuickAdd(true);
  };

  return (
    <>
      <motion.div
        className="flex flex-col gap-1 border shadow-2xl border-slate-800 rounded-lg h-full"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {!isImageLoaded ? (
          <div className="relative overflow-hidden">
            <div className="flex flex-col gap-1">
              <div className="relative overflow-hidden group">
                <div className="w-[160px] h-[190px] sm:w-[170px] sm:h-[220px] md:w-[180px] md:h-[260px] lg:w-[170px] lg:h-[240px] xl:w-[180px] xl:h-[260px] rounded-md m-1.5 bg-gray-400">
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent"
                    initial="hidden"
                    animate="visible"
                    variants={shimmerEffect}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    style={{ width: '50%', opacity: 0.2 }}
                  />
                </div>
              </div>
              <div className="pl-2 text-right flex-grow flex flex-col">
                <div className="h-4 mr-1 bg-gray-400 rounded w-3/4 mb-1 ml-auto relative overflow-hidden">
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent"
                    initial="hidden"
                    animate="visible"
                    variants={shimmerEffect}
                    transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
                    style={{ width: '50%', opacity: 0.2 }}
                  />
                </div>
              </div>
              <div className="pl-2 flex justify-between items-center pb-2">
                <div className="h-5 mr-2 bg-gray-400 rounded w-1/4 relative overflow-hidden">
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent"
                    initial="hidden"
                    animate="visible"
                    variants={shimmerEffect}
                    transition={{ repeat: Infinity, duration: 0.7, ease: 'linear' }}
                    style={{ width: '50%', opacity: 0.2 }}
                  />
                </div>
                <div className="w-14 h-8 bg-gray-400 rounded-lg mr-2 relative overflow-hidden">
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent"
                    initial="hidden"
                    animate="visible"
                    variants={shimmerEffect}
                    transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                    style={{ width: '50%', opacity: 0.2 }}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <Link href={`/product/${slug}`}>
              <div className="relative overflow-hidden group">
                <img
                  src={images[0]}
                  alt={title}
                  className="w-[160px] h-full sm:w-[180px] sm:h-full rounded-md m-1.5 transition-transform duration-300 group-hover:scale-105 bg-white object-cover cursor-pointer"
                  onLoad={() => setIsImageLoaded(true)}
                />
                
                {/* Color selector overlay */}
                {allColors.length > 0 && (
                  <div className="absolute  right-2 bottom-3 bg-h-glass rounded-lg shadow-md p-.5 flex flex-col gap-1">
                    {allColors.slice(0, 5).map((color, index) => (
                      <div
                        key={index}
                        className={`w-4.5 h-4.5 rounded-full border-2 relative flex items-center  ${
                          hoveredColor === color
                            ? 'border-black shadow-md'
                            : 'border-gray-200'
                        }`}
                        onMouseEnter={() => setHoveredColor(color)}
                        onMouseLeave={() => setHoveredColor(null)}
                        title={color}
                      >
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{
                            backgroundColor: getColorHex(color),
                          }}
                        />
                        {hoveredColor === color && (
                          <svg 
                            className="absolute w-3.5 h-3.5 text-white drop-shadow-lg" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                            style={{
                              filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))'
                            }}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    ))}
                    {allColors.length > 5 && (
                      <div className="text-[10px] font-bold text-center text-gray-100">
                        +{allColors.length - 5}
                      </div>
                    )}
                  </div>
                )}
                
                <div className="absolute inset-0 rounded-t-md bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-95 transition-opacity duration-300">
                  <span className="text-white text-lg font-semibold">عرض التفاصيل</span>
                </div>
              </div>
            </Link>

            <div className="pr-2 pb-1 text-right flex-grow flex flex-col">
              <p className="text-sm sm:text-base font-semibold" title={title}>
                {truncateText(title, 17)}
              </p>
            </div>

            <div className="pr-2 flex justify-between items-center mt-auto pb-2">
              <p className="font-light text-sm sm:font-bold sm:text-base">{firstPrice} ريال</p>
              <svg
                onClick={handleAddToCart}
                xmlns="http://www.w3.org/2000/svg"
                className="w-14 py-1 rounded-lg cursor-pointer p-4 border border-black ml-2"
                viewBox="0 0 576 512"
              >
                <path d="M0 24C0 10.7 10.7 0 24 0L69.5 0c22 0 41.5 12.8 50.6 32l411 0c26.3 0 45.5 25 38.6 50.4l-41 182.3c-8.5 31.4-37 53.3-69.5 53.3l-288.5 0 5.4 28.5c2.2 11.3 12.1 19.5 23.6 19.5L488 336c13.3 0 24 10.7 24 24s-10.7 24-24 24l-288.3 0c-34.6 0-64.3-24.6-70.7-58.5L77.4 54.5c-.7-3.8-4-6.5-7.9-6.5L24 48C10.7 48 0 37.3 0 24zM128 464a48 48 0 1 1 96 0 48 48 0 1 1 -96 0zm336-48a48 48 0 1 1 0 96 48 48 0 1 1 0-96zM252 160c0 11 9 20 20 20l44 0 0 44c0 11 9 20 20 20s20-9 20-20l0-44 44 0c11 0 20-9 20-20s-9-20-20-20l-44 0 0-44c0-11-9-20-20-20s-20 9-20 20l0 44-44 0c-11 0-20 9-20 20z" />
              </svg>
            </div>
          </>
        )}

        {!isImageLoaded && (
          <img
            src={images[0]}
            alt="المنتج"
            className="hidden"
            onLoad={() => setIsImageLoaded(true)}
          />
        )}
      </motion.div>

      <AnimatePresence>
        {showQuickAdd && (
          <QuickAddToCart
            product={{ _id, title, images, variants }}
            onClose={() => setShowQuickAdd(false)}
            ratings={ratings}
          />
        )}
      </AnimatePresence>
    </>
  );
}