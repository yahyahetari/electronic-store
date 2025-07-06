import { useState, useEffect, useContext } from "react";
import { CartContext } from "@/components/CartContext";
import Gallery from "@/components/Gallery";
import { connectToDB } from "@/lib/mongoose";
import { Product } from "@/models/Products";
import { Category } from "@/models/Category";
import { MinusCircle, PlusCircle, Star } from "lucide-react";
import Loader from "@/components/Loader";
import ProductsList from "@/components/ProductsList";
import RatingsAndReviews from "@/components/RatingsAndReviews";
import { NextSeo } from 'next-seo';
import toast from "react-hot-toast";

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

const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};

export default function ProductPage({ product, sameSubcategoryProducts, otherSubcategoryProducts }) {
    const { addToCart, cart } = useContext(CartContext);
    const [selectedVariant, setSelectedVariant] = useState(product.variants[0]);
    const [selectedProperties, setSelectedProperties] = useState({});
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(true);
    const [visibleProducts, setVisibleProducts] = useState([]);
    const [showMoreButton, setShowMoreButton] = useState(true);
    const [activeTab, setActiveTab] = useState('description');

    useEffect(() => {
        if (product.variants[0]?.properties) {
            const initialSelected = {};
            Object.entries(product.variants[0].properties).forEach(([key, values]) => {
                if (Array.isArray(values) && values.length > 0) {
                    initialSelected[key] = values[0];
                }
            });
            setSelectedProperties(initialSelected);
            setSelectedVariant(findMatchingVariant(initialSelected));
        }
        setQuantity(1);
        setLoading(false);

        const initialProducts = [...sameSubcategoryProducts];
        if (initialProducts.length < 5) {
            initialProducts.push(...otherSubcategoryProducts.slice(0, 5 - initialProducts.length));
        }
        setVisibleProducts(initialProducts.slice(0, 5));
        setShowMoreButton(sameSubcategoryProducts.length + otherSubcategoryProducts.length > 5);
    }, [product._id, product.variants, sameSubcategoryProducts, otherSubcategoryProducts]);

    const findMatchingVariant = (properties) => {
        return product.variants.find(variant =>
            Object.entries(properties).every(([key, value]) =>
                variant.properties[key]?.includes(value)
            )
        );
    };

    const isPropertyAvailable = (name, value) => {
        if (name === 'اللون') return true;
        
        return product.variants.some(variant =>
            variant.properties[name]?.includes(value) &&
            Object.entries(selectedProperties)
                .filter(([k]) => k !== name)
                .every(([k, v]) => variant.properties[k]?.includes(v))
        );
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
            setSelectedVariant(matchingVariant);
            setSelectedProperties(newProperties);
        } else {
            const newProperties = {
                ...selectedProperties,
                [name]: value
            };
            const matchingVariant = findMatchingVariant(newProperties);
            if (matchingVariant) {
                setSelectedVariant(matchingVariant);
                setSelectedProperties(newProperties);
            }
        }
    };

    const handleAddToCart = () => {
        if (selectedVariant) {
            const cartItems = cart.filter(item => 
                item.variantId === selectedVariant._id && 
                JSON.stringify(item.properties) === JSON.stringify(selectedProperties)
            );
            
            const currentQuantityInCart = cartItems.length;
            
            if (currentQuantityInCart + quantity > selectedVariant.stock) {
                toast.error(`عذراً، المتبقي في المخزون ${selectedVariant.stock - currentQuantityInCart} قطع فقط`);
                return;
            }
    
            addToCart({
                productId: product._id,
                variantId: selectedVariant._id,
                properties: selectedProperties,
                quantity,
                price: selectedVariant.price,
                stock: selectedVariant.stock
            });
        }
    };

    const loadMoreProducts = () => {
        const currentLength = visibleProducts.length;
        const remainingSameCategory = sameSubcategoryProducts.slice(currentLength);
        const remainingOtherCategory = otherSubcategoryProducts.slice(
            Math.max(0, currentLength - sameSubcategoryProducts.length)
        );
        const newProducts = [...remainingSameCategory, ...remainingOtherCategory].slice(0, 5);
        setVisibleProducts(prev => [...prev, ...newProducts]);
        if (currentLength + 5 >= sameSubcategoryProducts.length + otherSubcategoryProducts.length) {
            setShowMoreButton(false);
        }
    };

    const ratings = product.ratings || [];
    const averageRating = ratings.length > 0
        ? ratings.reduce((sum, rating) => sum + rating.rating, 0) / ratings.length
        : 0;

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader />
            </div>
        );
    }

    return (
        <>
            <NextSeo
                title={product.title}
                description={product.description}
                openGraph={{
                    title: product.title,
                    description: product.description,
                    images: product.images.map(img => ({
                        url: img,
                        alt: product.title
                    })),
                    site_name: 'هتاري',
                }}
            />
            
            <div className="max-w-6xl mx-auto p-4 flex flex-col gap-6">
                <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-shrink-0 w-full md:w-1/2">
                        <Gallery images={product.images} key={product._id} />
                    </div>
                    <div className="flex-grow md:w-1/2 flex flex-col gap-4">
                        <div>
                            <h1 className="text-2xl font-bold">{product.title}</h1>
                            <div className="flex items-center mt-2">
                                <span className="text-xl font-bold ml-2">{averageRating.toFixed(1)}</span>
                                <div className="flex">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                            key={star}
                                            className={`w-4 h-4 ${star <= Math.round(averageRating) ? 'text-yellow-400' : 'text-gray-300'}`}
                                            fill={star <= Math.round(averageRating) ? 'currentColor' : 'none'}
                                        />
                                    ))}
                                </div>
                            </div>
                            {selectedVariant && (
                                <div className="mt-4">
                                    <p className="text-xl font-semibold">{selectedVariant.price} درهم</p>
                                    {selectedVariant.stock < 5 && (
                                        <p className="text-sm text-red-600">
                                            باقي {selectedVariant.stock} قطع فقط
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        {product.variants[0]?.properties && (
                            <div className="space-y-4">
                                {Object.entries(product.variants[0].properties).map(([name, values]) => (
                                    <div key={name}>
                                        <p className="font-medium mb-2">{name}:</p>
                                        <div className="flex gap-2 flex-wrap">
                                            {Array.from(new Set(product.variants.flatMap(v => v.properties[name] || []))).map((value, idx) => {
                                                const available = isPropertyAvailable(name, value);
                                                return name.toLowerCase() === "اللون" ? (
                                                    <button
                                                        key={idx}
                                                        className={`w-8 h-8 rounded-full border relative ${!available
                                                            ? 'opacity-60 cursor-not-allowed border-red-500'
                                                            : selectedProperties[name] === value
                                                                ? 'ring-2 ring-offset-2 ring-black'
                                                                : 'border-black'
                                                            }`}
                                                        style={{
                                                            backgroundColor: getColorHex(value),
                                                        }}
                                                        onClick={() => available && toggleProperty(name, value)}
                                                        title={value}
                                                        disabled={!available}
                                                    >
                                                        {!available && (
                                                            <div className=" border-t-2 border-red-500 transform rotate-45 items-center"></div>
                                                        )}
                                                    </button>
                                                ) : (
                                                    <button
                                                        key={idx}
                                                        className={`px-3 py-1 border rounded-lg relative ${!available
                                                            ? 'opacity-90 cursor-not-allowed border-red-500 text-gray-700'
                                                            : selectedProperties[name] === value
                                                                ? 'bg-black text-white'
                                                                : 'border-black'
                                                            }`}
                                                        onClick={() => available && toggleProperty(name, value)}
                                                        disabled={!available}
                                                    >
                                                        {value}
                                                        {!available && (
                                                            <div className="absolute inset-3.5 border-solid border-red-500 transform rotate-12"></div>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex items-center mt-4">
                            <MinusCircle
                                className="hover:text-red-700 cursor-pointer"
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            />
                            <span className="text-lg font-medium mx-3">{quantity}</span>
                            <PlusCircle
                                className="hover:text-red-700 cursor-pointer"
                                onClick={() => quantity < selectedVariant?.stock && setQuantity(quantity + 1)}
                            />
                        </div>

                        <button
                        onClick={handleAddToCart}
                        disabled={!selectedVariant || selectedVariant.stock < 1}
                        className={`w-full py-2 rounded-lg mt-4 text-lg flex items-center justify-center ${!selectedVariant || selectedVariant.stock < 1
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-black text-white'
                            }`}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-6 h-6 icon-white ml-3"
                            viewBox="0 0 576 512"
                        >
                            <path d="M0 24C0 10.7 10.7 0 24 0L69.5 0c22 0 41.5 12.8 50.6 32l411 0c26.3 0 45.5 25 38.6 50.4l-41 152.3c-8.5 31.4-37 53.3-69.5 53.3l-288.5 0 5.4 28.5c2.2 11.3 12.1 19.5 23.6 19.5L488 336c13.3 0 24 10.7 24 24s-10.7 24-24 24l-288.3 0c-34.6 0-64.3-24.6-70.7-58.5L77.4 54.5c-.7-3.8-4-6.5-7.9-6.5L24 48C10.7 48 0 37.3 0 24zM128 464a48 48 0 1 1 96 0 48 48 0 1 1 -96 0zm336-48a48 48 0 1 1 0 96 48 48 0 1 1 0-96zM252 160c0 11 9 20 20 20l44 0 0 44c0 11 9 20 20 20s20-9 20-20l0-44 44 0c11 0 20-9 20-20s-9-20-20-20l-44 0 0-44c0-11-9-20-20-20s-20 9-20 20l0 44-44 0c-11 0-20 9-20 20z" />
                        </svg>
                        إضافة الى السلة
                        
                    </button>
                    </div>
                </div>

                <div className="border-b border-gray-200">
                    <ul className="flex gap-8">
                        <li>
                            <button
                                onClick={() => setActiveTab('description')}
                                className={`py-4 px-6 font-semibold relative ${
                                    activeTab === 'description'
                                        ? 'text-black after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-black'
                                        : 'text-gray-500 hover:text-black'
                                }`}
                            >
                                وصف المنتج
                            </button>
                        </li>
                        <li>
                            <button
                                onClick={() => setActiveTab('reviews')}
                                className={`py-4 px-6 font-semibold relative ${
                                    activeTab === 'reviews'
                                        ? 'text-black after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-black'
                                        : 'text-gray-500 hover:text-black'
                                }`}
                            >
                                التقييمات والمراجعات
                            </button>
                        </li>
                    </ul>
                </div>

                <div className="-mt-6">
                    {activeTab === 'description' && (
                        <div className="animate-fade-in">
                            <p className="text-base sm:text-lg">{product.description}</p>
                        </div>
                    )}
                    {activeTab === 'reviews' && (
                        <div className="animate-fade-in">
                            <RatingsAndReviews
                                key={product._id}
                                productId={product._id}
                                initialRatings={ratings}
                            />
                        </div>
                    )}
                </div>

                <div>
                    <h2 className="text-2xl font-bold mb-4">المنتجات ذات الصلة</h2>
                    {visibleProducts.length > 0 && (
                        <div className="text-center">
                            <ProductsList products={visibleProducts} />
                            {showMoreButton && (
                                <button
                                    onClick={loadMoreProducts}
                                    className="mt-4 bg-black text-white px-4 py-2 rounded-lg"
                                >
                                    تحميل المزيد
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

export async function getServerSideProps({ params }) {
    await connectToDB();
    const { slug } = params;
    const product = await Product.findOne({ slug }).lean();

    if (!product) {
        return { notFound: true };
    }

    const subcategory = await Category.findById(product.category).lean();
    if (!subcategory) {
        return { notFound: true };
    }

    const mainCategory = await Category.findById(subcategory.parent).lean();
    if (!mainCategory) {
        return { notFound: true };
    }

    const allSubcategories = await Category.find({ parent: mainCategory._id }).lean();
    const allSubcategoryIds = allSubcategories.map(sub => sub._id);

    let sameSubcategoryProducts = await Product.find({
        _id: { $ne: product._id },
        category: subcategory._id
    }).lean();

    let otherSubcategoryProducts = await Product.find({
        _id: { $ne: product._id },
        category: { $in: allSubcategoryIds, $ne: subcategory._id }
    }).lean();

    sameSubcategoryProducts = shuffleArray(sameSubcategoryProducts);
    otherSubcategoryProducts = shuffleArray(otherSubcategoryProducts);

    return {
        props: {
            product: JSON.parse(JSON.stringify(product)),
            sameSubcategoryProducts: JSON.parse(JSON.stringify(sameSubcategoryProducts)),
            otherSubcategoryProducts: JSON.parse(JSON.stringify(otherSubcategoryProducts)),
        },
    };
}

