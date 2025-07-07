import { useState, useContext, useEffect } from 'react';
import { CartContext } from './CartContext';
import { motion } from 'framer-motion';
import { MinusCircle, PlusCircle, X, Star } from 'lucide-react';
import Image from 'next/image';
import { useSwipeable } from 'react-swipeable';

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
        "تركواز": "#40E0D0"
    };
    return colors[colorName] || colorName;
};

const QuickAddToCart = ({ product, onClose, ratings }) => {
    const { addToCart } = useContext(CartContext);
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [selectedProperties, setSelectedProperties] = useState({});
    const [quantity, setQuantity] = useState(1);
    const [mainImage, setMainImage] = useState(product.images[0]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (product.variants[0]?.properties) {
            const initialSelected = {};
            Object.entries(product.variants[0].properties).forEach(([key, values]) => {
                if (Array.isArray(values) && values.length > 0) {
                    initialSelected[key] = values[0];
                }
            });
            const firstValidVariant = findMatchingVariant(initialSelected);
            if (firstValidVariant) {
                setSelectedProperties(initialSelected);
                setSelectedVariant(firstValidVariant);
            }
        }
        setMainImage(product.images[0]);

        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 1000);
        return () => clearTimeout(timer);
    }, [product]);

    const findMatchingVariant = (properties) => {
        return product.variants.find(variant => {
            return Object.entries(properties).every(([key, value]) => {
                return variant.properties[key]?.includes(value);
            });
        }) || null;
    };

    const isValidCombination = (properties) => {
        if (Object.keys(properties).length === 1 && 'اللون' in properties) {
            return true;
        }

        return product.variants.some(variant => {
            return Object.entries(properties).every(([key, value]) => {
                if (key === 'اللون') return true;
                return variant.properties[key]?.includes(value);
            });
        });
    };

    const toggleProperty = (name, value) => {
        if (name === 'اللون') {
            const otherPropertyName = Object.keys(product.variants[0].properties)
                .find(key => key !== 'اللون');

            const availableOptions = product.variants
                .filter(variant => variant.properties.اللون.includes(value))
                .map(variant => variant.properties[otherPropertyName][0]);

            const newProperties = {
                اللون: value,
                [otherPropertyName]: availableOptions[0]
            };

            const matchingVariant = findMatchingVariant(newProperties);
            setSelectedProperties(newProperties);
            setSelectedVariant(matchingVariant);
        } else {
            const newProperties = {
                ...selectedProperties,
                [name]: value
            };

            const matchingVariant = findMatchingVariant(newProperties);
            setSelectedProperties(newProperties);
            setSelectedVariant(matchingVariant);
        }
    };

    const handlers = useSwipeable({
        onSwipedLeft: () => changeImage(1),
        onSwipedRight: () => changeImage(-1),
        preventDefaultTouchmoveEvent: true,
        trackMouse: true
    });

    const changeImage = (direction) => {
        const currentIndex = product.images.indexOf(mainImage);
        const newIndex = (currentIndex + direction + product.images.length) % product.images.length;
        setMainImage(product.images[newIndex]);
    };

    const increaseQuantity = () => {
        if (selectedVariant && quantity < selectedVariant.stock) {
            setQuantity(prev => prev + 1);
        }
    };

    const decreaseQuantity = () => {
        setQuantity(prev => (prev > 1 ? prev - 1 : 1));
    };

    const handleAddToCart = () => {
        if (selectedVariant) {
            addToCart({
                productId: product._id,
                variantId: selectedVariant._id,
                properties: selectedProperties,
                quantity,
                price: selectedVariant.price
            });

        }
    };

    const currentIndex = product.images.indexOf(mainImage) + 1;
    const averageRating = ratings && ratings.length > 0
        ? ratings.reduce((sum, item) => sum + item.rating, 0) / ratings.length
        : 0;
    const showRating = averageRating >= 3.5;

    const RatingStars = ({ rating }) => {
        if (!showRating) return null;
        return (
            <div className="flex items-center justify-center mb-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        className={`w-4 h-4 ${star <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                        fill={star <= Math.round(rating) ? 'currentColor' : 'none'}
                    />
                ))}
            </div>
        );
    };

    const closeModalHandlers = useSwipeable({
        onSwipedDown: () => onClose(),
        delta: 10,
        preventDefaultTouchmoveEvent: true,
    });

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50"
            onClick={onClose}
        >
            <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                className="bg-white p-4 rounded-t-3xl w-full sm:max-w-xl sm:rounded-lg sm:mt-10 sm:mb-10 sm:mx-auto relative"
                onClick={e => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute -top-3 -right-3 rounded-full bg-black text-gray-200 hover:text-red-600 hidden sm:block"
                >
                    <X />
                </button>

                <div
                    {...closeModalHandlers}
                    onClick={onClose}
                    className="w-28 h-2 bg-gray-300 rounded-full mx-auto mb-2 sm:hidden cursor-grab active:cursor-grabbing"
                />
                <div className="flex flex-col sm:flex-row">
                    <div className="w-full sm:w-1/2">
                        {/* Main image section for larger screens */}
                        <div className="hidden sm:block">
                            <div {...handlers} className="relative w-full justify-center">
                                <Image
                                    src={mainImage}
                                    width={500}
                                    height={400}
                                    alt="Main product image"
                                    className="rounded-lg shadow-xl object-cover w-64 h-full"
                                />
                                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white bg-black bg-opacity-50 px-3 py-1 rounded-3xl text-sm">
                                    {currentIndex} / {product.images.length}
                                </div>
                            </div>

                            {/* Thumbnails for larger screens */}
                            <div className="flex gap-2 overflow-x-auto py-2 scrollbar-none">
                                {product.images.map((image, index) => (
                                    <div
                                        key={index}
                                        className="relative w-16 h-16 flex-shrink-0"
                                        onClick={() => setMainImage(image)}
                                    >
                                        <Image
                                            src={image}
                                            width={64}
                                            height={64}
                                            alt={`Thumbnail ${index}`}
                                            className={`w-16 h-16 rounded-lg object-cover ${mainImage === image ? 'border-2 border-black' : ''
                                                }`}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* All images side by side for mobile screens */}
                        <div className="flex sm:hidden gap-2 overflow-x-auto py-2">
                            {product.images.map((image, index) => (
                                <div key={index} className="relative flex-shrink-0">
                                    <Image
                                        src={image}
                                        width={200}
                                        height={200}
                                        alt={`Product image ${index + 1}`}
                                        className="rounded-lg shadow-xl object-cover w-28 h-full"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>


                    <div className="w-full sm:w-1/2 mt-4 sm:mt-0 sm:pr-4">
                        <h2 className="text-xl text-center font-bold">{product.title}</h2>
                        <RatingStars rating={averageRating} />
                        <p className={`text-lg text-center font-semibold ${!selectedVariant ? 'text-red-600' : ''}`}>
                            {selectedVariant ? `${selectedVariant.price} ريال` : 'اختر مواصفات متاحة'}
                        </p>
                        {product.variants[0]?.properties &&
                            Object.entries(product.variants[0].properties).map(([name, values]) => (
                                <div key={name} className="mb-4">
                                    <p className="text-base text-center font-semibold mb-2">{name}:</p>
                                    <div className="flex flex-wrap justify-center gap-2">
                                        {[...new Set(product.variants.flatMap(v => v.properties[name] || []))].map((value, idx) => {
                                            const wouldBeValid = isValidCombination({
                                                ...selectedProperties,
                                                [name]: value
                                            });

                                            return (
                                                <button
                                                    key={idx}
                                                    className={`${name === 'اللون'
                                                        ? 'w-8 h-8 rounded-full border border-black'
                                                        : 'py-1 px-3 rounded-lg border border-black'
                                                        } ${selectedProperties[name] === value
                                                            ? name === 'اللون'
                                                                ? 'ring-2 ring-offset-2 ring-black'
                                                                : 'bg-black text-white'
                                                            : 'text-black'
                                                        } ${!wouldBeValid ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                    style={name === 'اللون' ? { backgroundColor: getColorHex(value) } : {}}
                                                    onClick={() => wouldBeValid && toggleProperty(name, value)}
                                                    disabled={!wouldBeValid}
                                                    title={value}
                                                >
                                                    {name !== 'اللون' && value}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))
                        }

                        <div className="flex items-center justify-center mt-6">
                            <MinusCircle
                                className="hover:text-red-700 cursor-pointer"
                                onClick={decreaseQuantity}
                            />
                            <span className="text-lg font-medium mx-3">{quantity}</span>
                            <PlusCircle
                                className="hover:text-red-700 cursor-pointer"
                                onClick={increaseQuantity}
                            />
                        </div>

                        <div className="flex justify-center w-full mt-4">
                            <button
                                onClick={handleAddToCart}
                                disabled={!selectedVariant || selectedVariant.stock < 1}
                                className={`font-medium text-xl text-white rounded-lg py-2 w-3/4 flex items-center justify-center ${!selectedVariant || selectedVariant.stock < 1 ? 'bg-gray-400 cursor-not-allowed' : 'bg-black'}`}
                            >
                                <span className="hidden sm:inline">
                                    {!selectedVariant ? 'اختر مواصفات متاحة' : selectedVariant.stock < 1 ? 'نفذت الكمية' : 'إضافة إلى السلة'}
                                </span>
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="w-6 h-6 icon-white sm:mr-3"
                                    viewBox="0 0 576 512"
                                >
                                    <path d="M0 24C0 10.7 10.7 0 24 0L69.5 0c22 0 41.5 12.8 50.6 32l411 0c26.3 0 45.5 25 38.6 50.4l-41 152.3c-8.5 31.4-37 53.3-69.5 53.3l-288.5 0 5.4 28.5c2.2 11.3 12.1 19.5 23.6 19.5L488 336c13.3 0 24 10.7 24 24s-10.7 24-24 24l-288.3 0c-34.6 0-64.3-24.6-70.7-58.5L77.4 54.5c-.7-3.8-4-6.5-7.9-6.5L24 48C10.7 48 0 37.3 0 24zM128 464a48 48 0 1 1 96 0 48 48 0 1 1 -96 0zm336-48a48 48 0 1 1 0 96 48 48 0 1 1 0-96zM252 160c0 11 9 20 20 20l44 0 0 44c0 11 9 20 20 20s20-9 20-20l0-44 44 0c11 0 20-9 20-20s-9-20-20-20l-44 0 0-44c0-11-9-20-20-20s-20 9-20 20l0 44-44 0c-11 0-20 9-20 20z" />
                                </svg>
                            </button>
                        </div>

                        {selectedVariant && selectedVariant.stock > 0 && selectedVariant.stock <= 5 && (
                            <p className="text-red-600 text-center mt-2">
                                باقي {selectedVariant.stock} قطع فقط
                            </p>
                        )}

                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default QuickAddToCart;
