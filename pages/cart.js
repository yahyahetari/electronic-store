import { CartContext } from "@/components/CartContext";
import axios from "axios";
import { useContext, useEffect, useState, useCallback, useMemo } from "react";
import { MinusCircle, PlusCircle, Trash2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/router";
import Loader from "@/components/Loader";
import Link from "next/link";
import TransparentLoader from '@/components/TransparentLoader';
import CountUp from 'react-countup';
import toast from 'react-hot-toast';

export default function Cart() {
    const router = useRouter();
    const { cart, setCart } = useContext(CartContext);
    const [products, setProducts] = useState([]);
    const [productToDelete, setProductToDelete] = useState(null);
    const [loading, setLoading] = useState(true); // حالة الـ Loader
    const [loadingProducts, setLoadingProducts] = useState({});
    const [prevTotals, setPrevTotals] = useState({});

    const total = useMemo(() => products.reduce(
        (acc, product) => acc + product.price * product.quantity,
        0
    ), [products]);

    const totalRounded = useMemo(() => parseFloat(total.toFixed(2)), [total]);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const storedCart = localStorage.getItem("cart");
            if (storedCart) {
                setCart(JSON.parse(storedCart));
            }
        }
    }, [setCart]);

    useEffect(() => {
        if (cart.length > 0) {
            axios.post('/api/cart', { items: cart }).then((response) => {
                const groupedProducts = groupProductsByProperties(response.data);
                setProducts(groupedProducts);

                // تأخير إخفاء الـ Loader لمدة 3 ثوانٍ
                setTimeout(() => {
                    setLoading(false);
                }, 3000);
            });
        } else {
            setProducts([]);

            // تأخير إخفاء الـ Loader لمدة 3 ثوانٍ حتى لو كانت السلة فارغة
            setTimeout(() => {
                setLoading(false);
            }, 3000);
        }
    }, [cart]);

    const groupProductsByProperties = useCallback((products) => {
        const groupedProducts = [];

        cart.forEach(cartItem => {
            const product = products.find(p => p._id === cartItem.id);
            if (product) {
                const existingProduct = groupedProducts.find(p =>
                    p._id === product._id &&
                    p.variantId === cartItem.variantId &&
                    JSON.stringify(p.properties) === JSON.stringify(cartItem.properties)
                );

                if (existingProduct) {
                    existingProduct.quantity += 1;
                } else {
                    groupedProducts.push({
                        ...product,
                        variantId: cartItem.variantId,
                        properties: cartItem.properties,
                        price: cartItem.price,
                        quantity: 1
                    });
                }
            }
        });

        return groupedProducts;
    }, [cart]);

    const increaseQuantity = useCallback((id, properties) => {
        const targetProduct = products.find(p => 
            p._id === id && 
            JSON.stringify(p.properties) === JSON.stringify(properties)
        );
        
        if (targetProduct) {
            const variant = targetProduct.variants.find(v => v._id === targetProduct.variantId);
            
            if (!variant || typeof variant.stock !== 'number') {
                toast.error('عذراً، حدث خطأ في التحقق من المخزون');
                return;
            }
    
            if (targetProduct.quantity >= variant.stock) {
                toast.error('عذراً، لا يمكن إضافة المزيد من هذا المنتج');
                return;
            }
    
            const updatedCart = [...cart];
            updatedCart.push({ 
                id, 
                properties,
                price: targetProduct.price,
                variantId: targetProduct.variantId
            });
            
            const newTotal = targetProduct.price * (targetProduct.quantity + 1);
            setPrevTotals(prev => ({
                ...prev,
                [`${id}-${JSON.stringify(properties)}`]: newTotal
            }));
            
            setCart(updatedCart);
            updateLocalStorage(updatedCart);
        }
    }, [cart, products, setCart]);

    const decreaseQuantity = useCallback((id, properties) => {
        const productKey = `${id}-${JSON.stringify(properties)}`;
        setLoadingProducts(prev => ({ ...prev, [productKey]: true }));
    
        const targetProduct = products.find(p => 
            p._id === id && 
            JSON.stringify(p.properties) === JSON.stringify(properties)
        );
        
        if (targetProduct) {
            const productCount = cart.filter(item => 
                item.id === id && 
                JSON.stringify(item.properties) === JSON.stringify(properties)
            ).length;
            
            if (productCount > 1) {
                const productIndices = cart.reduce((indices, item, index) => {
                    if (item.id === id && JSON.stringify(item.properties) === JSON.stringify(properties)) {
                        indices.push(index);
                    }
                    return indices;
                }, []);
                
                const updatedCart = [...cart];
                updatedCart.splice(productIndices[productIndices.length - 1], 1);
                
                const newTotal = targetProduct.price * (productCount - 1);
                setPrevTotals(prev => ({
                    ...prev,
                    [productKey]: newTotal
                }));
                
                setCart(updatedCart);
                updateLocalStorage(updatedCart);
            } else {
                setProductToDelete(targetProduct);  // Now passing the full product object
            }
        }
    
        setTimeout(() => {
            setLoadingProducts(prev => ({ ...prev, [productKey]: false }));
        }, 1000);
    }, [cart, products, setCart]);

    const confirmDeleteProduct = useCallback(() => {
        if (productToDelete) {
            const updatedCart = cart.filter(item => !(item.id === productToDelete._id && JSON.stringify(item.properties) === JSON.stringify(productToDelete.properties)));
            setCart(updatedCart);
            updateLocalStorage(updatedCart);
            setProductToDelete(null);
        }
    }, [cart, productToDelete, setCart]);

    const cancelDelete = useCallback(() => {
        setProductToDelete(null);
    }, []);

    const updateLocalStorage = useCallback((newCart) => {
        if (typeof window !== "undefined") {
            localStorage.setItem("cart", JSON.stringify(newCart));
        }
    }, []);

    const handleCheckout = useCallback(() => {
        router.push('/checkout');
    }, [router]);

    // إظهار الـ Loader لمدة 3 ثوانٍ
    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader />
            </div>
        );
    }

    return (
        <div className="flex gap-20 py-16 px-10 max-lg:flex-col max-sm:px-3">
            <div className="w-2/3 max-lg:w-full">
                <p className="mb-4 text-xl font-semibold">سلة التسوق</p>
                <hr className="my-6" />
                {!products.length ? (
                    <div className="text-center">
                        <p className="mb-4 text-xl font-semibold">سلة التسوق فارغة</p>
                        <Link href="/shop" className="inline-block mt-4 px-6 py-2 bg-black text-white font-bold rounded-lg hover:bg-gray-800 transition-colors duration-300">
                            الذهاب للتسوق
                        </Link>
                    </div>
                ) : (
                    <div>
                        {products.map((product, index) => (
                            <div key={`${product._id}-${index}`} className="relative w-full flex max-sm:flex-col border border-gray-400 rounded-lg max-sm:gap-3 hover:bg-grey-2 px-4 py-3 mt-2 items-center max-sm:items-start justify-between">
                                {loadingProducts[`${product._id}-${JSON.stringify(product.properties)}`] && <TransparentLoader />}

                                <div className="flex items-center">
                                    <Link href={`/product/${product.slug}`}>
                                        <Image
                                            src={product.images[0]}
                                            width={100}
                                            height={100}
                                            className="rounded-lg ml-3 -mr-1.5 w-32 h-40 object-cover object-top cursor-pointer"
                                            alt={product.title}
                                            loading="lazy"
                                        />
                                    </Link>
                                    <div className="flex flex-col gap-4 mr-4">
                                        <Link href={`/product/${product.slug}`}>
                                            <p className="font-bold cursor-pointer hover:underline">{product.title}</p>
                                        </Link>
                                        {product.properties && Object.entries(product.properties).map(([key, value]) => (
                                            <p key={key} className="text-sm">
                                                <span className="font-semibold">{key} :</span> {Array.isArray(value) ? value.join(', ') : value}
                                            </p>
                                        ))}
                                        <p className="font-medium">
                                            <CountUp
                                                start={prevTotals[product._id] || 0}
                                                end={product.price * product.quantity}
                                                decimals={2}
                                                duration={1}
                                            /> ريال
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <MinusCircle
                                        className={`hover:text-red-700 ml-3 cursor-pointer ${loadingProducts[product._id] ? 'opacity-50' : ''}`}
                                        onClick={() => !loadingProducts[product._id] && decreaseQuantity(product._id, product.properties)}
                                    />
                                    <span className="text-lg font-medium">{product.quantity}</span>
                                    <PlusCircle
                                        className="hover:text-red-700 mr-3 cursor-pointer"
                                        onClick={() => increaseQuantity(product._id, product.properties)}
                                    />
                                    <Trash2
                                        className="text-red-700 ml-9 mr-4 cursor-pointer max-sm:absolute max-sm:left-3"
                                        onClick={() => setProductToDelete(product)}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <div className="w-1/3 max-lg:w-full h-fit flex flex-col gap-8 bg rounded-lg px-4 py-5">
                <p className="font-bold text-xl pb-4">
                    {" "}
                    <span>
                        {`( ${products.length} ${products.length > 1 ? "منتجات" : "منتج"} )`}
                    </span>
                </p>
                <div className="flex justify-between items-center">
                    <span className="font-bold">المبلغ الإجمالي </span>
                    <span className="font-bold text-xl">
                        <CountUp
                            start={prevTotals.total || 0}
                            end={totalRounded}
                            decimals={2}
                            duration={1}
                            onEnd={() => setPrevTotals(prev => ({ ...prev, total: totalRounded }))}
                        /> ريال  
                    </span>
                </div>
                <button
                    className="w-full bg-white font-bold text-xl hover:text-white hover:bg-black text-heading3-bold py-4 rounded-lg hover:bg-red-2 transition-all duration-300"
                    onClick={handleCheckout}
                >
                    إتمام الشراء
                </button>
            </div>
            {productToDelete && (
                <div className="fixed inset-0 flex items-center justify-center bg-gray-700 bg-opacity-75">
                    <div className="max-w-sm p-6 bg-slate-600 bg-opacity-30 backdrop-blur-md border border-gray-200 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 dark:bg-gray-800 dark:border-gray-700">
                        <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-950 dark:text-white">حذف المنتج</h5>
                        <p className="mb-4 text-xl text-gray-200">
                            هل أنت متأكد أنك تريد حذف <span className="text-gray-950 font-semibold text-xl">({productToDelete.title})</span>؟ لا يمكن التراجع عن هذا الإجراء.
                        </p>
                        <div className="flex justify-between">
                            <button className="btn-red text-xl" onClick={confirmDeleteProduct}>حذف</button>
                            <button className="btn-default text-xl" onClick={cancelDelete}>إلغاء</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}