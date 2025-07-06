import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useSwipeable } from 'react-swipeable';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Gallery({ images }) {
  const [mainImage, setMainImage] = useState(() => images[0]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setMainImage(images[0]);
    // Simulate loading time
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [images]);

  const handlers = useSwipeable({
    onSwipedLeft: () => {
      changeImage(1);
    },
    onSwipedRight: () => {
      changeImage(-1);
    },
    preventDefaultTouchmoveEvent: true,
    trackMouse: true
  });

  const changeImage = (direction) => {
    const currentIndex = images.indexOf(mainImage);
    const newIndex = (currentIndex + direction + images.length) % images.length;
    setMainImage(images[newIndex]);
  };

  const currentIndex = images.indexOf(mainImage) + 1;

  const shimmerEffect = {
    hidden: { x: '-100%' },
    visible: { x: '100%' },
  };

  return (
    <div className="relative flex flex-col gap-3 max-w-[500px] mx-auto">
      <div {...handlers} className="relative w-full">
        {isLoading ? (
          <div className="w-96 h-[500px] bg-gray-300 rounded-lg relative overflow-hidden">
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent"
              initial="hidden"
              animate="visible"
              variants={shimmerEffect}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              style={{ width: '50%', opacity: 0.2 }}
            />
          </div>
        ) : (
          <Image
            src={mainImage}
            width={500}
            height={400}
            alt="Main product image"
            className="rounded-lg shadow-2xl object-cover w-full h-full"
          />
        )}
        <button
          onClick={() => changeImage(-1)}
          className="absolute top-1/2 left-1 transform -translate-y-1/2 text-white bg-glass p-2 rounded-full"
          aria-label="Previous Image"
        >
          <ChevronLeft size={24} color='black' />
        </button>
        <button
          onClick={() => changeImage(1)}
          className="absolute top-1/2 right-1 transform -translate-y-1/2 text-white bg-glass p-2 rounded-full"
          aria-label="Next Image"
        >
          <ChevronRight size={24} color='black' />
        </button>
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white bg-black bg-opacity-50 pr-2 pl-2 rounded-3xl">
          {images.length} / {currentIndex}
        </div>
      </div>

      <div className="hidden md:flex gap-2 overflow-auto">
        {images.map((image, index) => (
          <div key={index} className="relative w-20 h-20">
            {isLoading ? (
              <div className="w-20 h-20 bg-gray-300 rounded-lg relative overflow-hidden">
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent"
                  initial="hidden"
                  animate="visible"
                  variants={shimmerEffect}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  style={{ width: '50%', opacity: 0.2 }}
                />
              </div>
            ) : (
              <Image
                src={image}
                width={100}
                height={100}
                alt={`Thumbnail ${index}`}
                className={`w-20 h-20 rounded-lg shadow-2xl object-cover cursor-pointer ${mainImage === image ? 'border-2 border-black' : 'border border-gray-500'}`}
                onClick={() => setMainImage(image)}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
