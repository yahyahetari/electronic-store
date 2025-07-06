import { useState, useEffect } from "react";
import { connectToDB } from "@/lib/mongoose";
import { Product } from "@/models/Products";
import { Category } from "@/models/Category";
import Loader from "@/components/Loader";
import ProductsList from "@/components/ProductsList";
import Image from 'next/image';
import { useSwipeable } from 'react-swipeable';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from "next/link";
import StoreFeatures from "@/components/StoreFeatures";

export default function Home({ categories, allProducts, error }) {
    const [loading, setLoading] = useState(true);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [displayedProducts, setDisplayedProducts] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [bannersLoaded, setBannersLoaded] = useState(false);

    const productsPerPage = 8;

    const banners = [
        "/banner2.png",
        "/banner3.jpg",
        "/banner4.jpg",
        "/banner5.jpg",
        "/banner6.jpg",
    ];

    useEffect(() => {
        const preloadImage = (src) => {
            return new Promise((resolve, reject) => {
                const img = new window.Image();
                img.onload = resolve;
                img.onerror = reject;
                img.src = src;
            });
        };

        const loadBanners = async () => {
            try {
                // Load the first banner
                await preloadImage(banners[0]);

                // Set loading to false after the first banner is loaded
                setLoading(false);

                // Load the rest of the banners
                await Promise.all(banners.slice(1).map(preloadImage));

                // All banners are loaded
                setBannersLoaded(true);
            } catch (error) {
                console.error("Error loading banners:", error);
                setLoading(false);
            }
        };

        loadBanners();

        // Start banner rotation only after all banners are loaded
        let bannerInterval;
        if (bannersLoaded) {
            bannerInterval = setInterval(() => {
                setCurrentImageIndex((prevIndex) => (prevIndex + 1) % banners.length);
            }, 5000);
        }

        return () => {
            if (bannerInterval) clearInterval(bannerInterval);
        };
    }, [bannersLoaded]);

    const loadMoreProducts = () => {
        setLoadingMore(true);
        const startIndex = displayedProducts.length;
        const endIndex = startIndex + productsPerPage;
        const newProducts = allProducts.slice(startIndex, endIndex);

        setDisplayedProducts(prevProducts => [...prevProducts, ...newProducts]);
        setPage(prevPage => prevPage + 1);
        setHasMore(endIndex < allProducts.length);
        setLoadingMore(false);
    };

    useEffect(() => {
        // Load initial products
        setDisplayedProducts(allProducts.slice(0, productsPerPage));
        setPage(2); // Set to 2 because we've already loaded the first page
        setHasMore(allProducts.length > productsPerPage);
    }, [allProducts]);

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
        setCurrentImageIndex((prevIndex) =>
            (prevIndex + direction + banners.length) % banners.length
        );
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Banner section */}
            <div className="relative w-full h-[60vh] md:h-[70vh] lg:h-[85vh] ">
                <div {...handlers} className="relative w-full h-full">
                    {banners.map((banner, index) => (
                        <Image
                            key={index}
                            src={banner}
                            layout="fill"
                            objectFit="cover"
                            alt={`Banner image ${index + 1}`}
                            className={`object-top transition-opacity duration-500 ${index === currentImageIndex ? 'opacity-100' : 'opacity-0'}`}
                            priority={index === 0}
                        />
                    ))}
                    <button
                        onClick={() => changeImage(-1)}
                        className="absolute top-1/2 left-4 transform -translate-y-1/2 text-white bg-black bg-opacity-50 p-2 rounded-full z-10"
                        aria-label="Previous Image"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <button
                        onClick={() => changeImage(1)}
                        className="absolute top-1/2 right-4 transform -translate-y-1/2 text-white bg-black bg-opacity-50 p-2 rounded-full z-10"
                        aria-label="Next Image"
                    >
                        <ChevronRight size={24} />
                    </button>
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 space-x-reverse">
                        {banners.map((_, index) => (
                            <div
                                key={index}
                                className={`w-2 h-2 rounded-full ${index === currentImageIndex ? 'bg-white' : 'bg-gray-400'}`}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Categories Section */}
            {categories && categories.length > 0 && (
                <div className="bg-white">
                    <h2 className="text-xl sm:text-3xl font-bold text-gray-800 bg-gray-100 p-6 uppercase text-center">الفئات</h2>
                    <div className="container mx-auto px-4">
                        <div className="grid grid-cols-3 gap-4">
                            {categories.map((category) => (
                                <Link href={`/category/${category.slug}`} key={category._id}>
                                    <div className="flex flex-col items-center cursor-pointer">
                                        <div className="w-20 h-20 sm:h-24 sm:w-24 border-gray-500 border bg-gray-200 rounded-full overflow-hidden mb-2">
                                            {category.image ? (
                                                <img
                                                    src={category.image}
                                                    alt={category.name}
                                                    className="h-full w-full object-cover object-top"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-500">
                                                    No Image
                                                </div>
                                            )}
                                        </div>
                                        <h3 className="text-center font-semibold">{category.name}</h3>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Products Section */}
            <div className="py-8">
                <h2 className="text-xl sm:text-3xl font-bold text-gray-800 mb-6 uppercase text-center">جديد المتجر</h2>
                <div className="container mx-auto px-4">
                    <ProductsList products={displayedProducts} />
                    {loadingMore && (
                        <div className="flex justify-center mt-4">
                            <Loader />
                        </div>
                    )}
                    {!loadingMore && hasMore && (
                        <div className="flex justify-center mt-4">
                            <button
                                onClick={loadMoreProducts}
                                className="mt-4 bg-black text-white px-4 py-2 rounded-lg"
                            >
                                تحميل المزيد
                            </button>
                        </div>
                    )}
                    {!hasMore && (
                        <p className="text-center mt-4 text-gray-600">
                            لا يوجد المزيد من المنتجات لتحميلها.
                        </p>
                    )}
                </div>
            </div>
            <StoreFeatures />
        </div>
    );
}

export async function getServerSideProps() {
    try {
        await connectToDB();

        const categories = await Category.find({ parent: null }).lean();

        const subcategories = await Category.find({ parent: { $ne: null } }).lean();

        const allProducts = await Product.find({}).sort({ '_id': -1 }).lean();

        return {
            props: {
                categories: JSON.parse(JSON.stringify(categories)),
                allProducts: JSON.parse(JSON.stringify(allProducts)),
            }
        };
    } catch (error) {
        console.error("Error in getServerSideProps:", error);
        return {
            props: {
                categories: [],
                allProducts: [],
                error: error.message
            }
        };
    }
}
