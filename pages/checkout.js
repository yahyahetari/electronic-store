import { CartContext } from "@/components/CartContext";
import axios from "axios";
import { useContext, useEffect, useState } from "react";
import Loader from "@/components/Loader";
import { useSession } from "next-auth/react";
import Auth from "@/components/Auth";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import Link from "next/link";

export default function Checkout() {
    const { cart } = useContext(CartContext);
    const router = useRouter();
    const [products, setProducts] = useState([]);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [address2, setAddress2] = useState('');
    const [state, setState] = useState('');
    const [city, setCity] = useState('');
    const [country, setCountry] = useState('');
    const [postalCode, setPostalCode] = useState('');
    const [notes, setNotes] = useState('');
    const [processingOrder, setProcessingOrder] = useState(false);
    const SHIPPING_COST = 20;
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState({});
    const { data: session } = useSession();

    useEffect(() => {
        const fetchShippingInfo = async () => {
            if (session) {
                try {
                    const shippingResponse = await axios.get('/api/shipping');

                    const updatedShippingInfo = {
                        ...shippingResponse.data,
                        email: session.user.email || shippingResponse.data.email,
                    };

                    if (session.user.name) {
                        const nameParts = session.user.name.split(' ');
                        updatedShippingInfo.firstName = nameParts[0] || shippingResponse.data.firstName;
                        updatedShippingInfo.lastName = nameParts.slice(1).join(' ') || shippingResponse.data.lastName;
                    }

                    setFirstName(updatedShippingInfo.firstName || '');
                    setLastName(updatedShippingInfo.lastName || '');
                    setEmail(updatedShippingInfo.email || '');
                    setPhone(updatedShippingInfo.phone || '');
                    setAddress(updatedShippingInfo.address || '');
                    setAddress2(updatedShippingInfo.address2 || '');
                    setState(updatedShippingInfo.state || '');
                    setCity(updatedShippingInfo.city || '');
                    setCountry(updatedShippingInfo.country || '');
                    setPostalCode(updatedShippingInfo.postalCode || '');

                    setLoading(false);
                } catch (error) {
                    console.error("Error fetching shipping data:", error);
                    setLoading(false);
                }
            }
        };

        fetchShippingInfo();

        if (cart.length > 0) {
            const cartItems = cart.map(item => ({
                id: item.id,
                properties: item.properties,
                price: item.price
            }));
            axios.post('/api/cart', { items: cartItems })
                .then(response => {
                    const groupedProducts = groupProductsByProperties(response.data, cart);
                    setProducts(groupedProducts);
                    setLoading(false);
                })
                .catch(error => {
                    console.error("Error fetching cart data:", error.response?.data || error.message);
                    setLoading(false);
                });
        } else {
            setProducts([]);
            setLoading(false);
        }
    }, [cart, session]);

    function groupProductsByProperties(products, cart) {
        const groupedProducts = {};
        cart.forEach(cartItem => {
            const product = products.find(p => p._id === cartItem.id);
            if (product) {
                const key = `${product._id}-${JSON.stringify(cartItem.properties)}`;
                if (groupedProducts[key]) {
                    groupedProducts[key].quantity += 1;
                } else {
                    groupedProducts[key] = {
                        ...product,
                        properties: cartItem.properties,
                        price: cartItem.price,
                        quantity: 1
                    };
                }
            }
        });
        return Object.values(groupedProducts);
    }

    function validateFields() {
        const newErrors = {};
        if (!firstName) newErrors.firstName = "الاسم الأول مطلوب";
        if (!lastName) newErrors.lastName = "اسم العائلة مطلوب";
        if (!email) newErrors.email = "البريد الإلكتروني مطلوب";
        if (!phone) newErrors.phone = "رقم الهاتف مطلوب";
        if (!address) newErrors.address = "العنوان مطلوب";
        if (!city) newErrors.city = "المدينة مطلوبة";
        if (!country) newErrors.country = "البلد مطلوب";
        if (!postalCode) newErrors.postalCode = "الرمز البريدي مطلوب";
        return newErrors;
    }
    
    async function goToPayment() {
    const validationErrors = validateFields();
    if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        return;
    }

    try {
        setProcessingOrder(true);
        
        // التحقق من المخزون أولاً
        const stockResponse = await axios.post('/api/verify-stock', {
            items: products.map(item => ({
                productId: item._id,
                properties: item.properties || {},
                quantity: parseInt(item.quantity)
            }))
        });

        if (!stockResponse.data.success) {
            toast.error(stockResponse.data.message);
            router.push('/cart');
            return;
        }

        // المتابعة إلى الدفع
        const checkoutResponse = await axios.post('/api/checkout', {
            firstName,
            lastName,
            email,
            phone,
            address,
            address2,
            state,
            city,
            country,
            postalCode,
            notes,
            cartItems: JSON.stringify(products.map(item => ({
                id: item._id,
                title: item.title,
                price: item.price,
                quantity: parseInt(item.quantity),
                properties: item.properties || {},
                image: item.images?.[0] || ''
            })))
        });

        if (checkoutResponse.data.url) {
            window.location = checkoutResponse.data.url;
        }

    } catch (error) {
        console.error('Checkout Error:', error);
        toast.error('حدث خطأ في النظام، يرجى المحاولة مرة أخرى');
    } finally {
        setProcessingOrder(false);
    }
}
    
    
    const total = products.reduce((acc, product) => {
        return acc + (Number(product.price) * product.quantity);
    }, 0);

    const totalRounded = Number(total).toFixed(2);

    if (!session) {
        return <Auth />;
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader />
            </div>
        );
    }

    return (
        <div>
            {!cart?.length ? (
                <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                    <h2 className="text-2xl font-bold">السلة فارغة</h2>
                    <Link 
                        href="/shop" 
                        className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
                    >
                        الذهاب إلى المتجر
                    </Link>
                </div>
            ) : (
                <div className="flex flex-col lg:flex-row justify-between lg:-space-x-2 mt-6 px-3 mb-5">
                    <div className="lg:w-2/3 flex flex-col h-fit items-center border-2 border-black p-5 rounded-lg">
                        <h1 className="text-xl font-semibold">معلومات الشحن</h1>
                        <div className="flex flex-col md:flex-row mt-4 gap-4 w-full">
                            <div className="flex-1">
                                <input
                                    type="text"
                                    name="firstName"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    className={`p-2 border w-full rounded text-right ${errors.firstName ? 'border-red-500' : 'border-gray-400'}`}
                                    placeholder="الاسم الأول"
                                />
                                {errors.firstName && <p className="text-red-500 text-sm">{errors.firstName}</p>}
                            </div>
                            <div className="flex-1">
                                <input
                                    type="text"
                                    name="lastName"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    className={`p-2 border w-full rounded text-right ${errors.lastName ? 'border-red-500' : 'border-gray-400'}`}
                                    placeholder="اسم العائلة"
                                />
                                {errors.lastName && <p className="text-red-500 text-sm">{errors.lastName}</p>}
                            </div>
                        </div>
                        <div className="flex flex-col md:flex-row mt-4 gap-4 w-full">
                            <div className="flex-1">
                                <input
                                    type="text"
                                    name="email"
                                    value={email}
                                    readOnly
                                    className={`p-2 border w-full rounded text-right ${errors.email ? 'border-red-500' : 'border-gray-400'}`}
                                    placeholder="البريد الإلكتروني"
                                />
                                {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
                            </div>
                            <div className="flex-1">
                                <input
                                    type="text"
                                    name="phone"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className={`p-2 border w-full rounded text-right ${errors.phone ? 'border-red-500' : 'border-gray-400'}`}
                                    placeholder="رقم الهاتف"
                                />
                                {errors.phone && <p className="text-red-500 text-sm">{errors.phone}</p>}
                            </div>
                        </div>
                        <div className="flex flex-col md:flex-row mt-4 gap-4 w-full">
                            <div className="flex-1">
                                <input
                                    type="text"
                                    name="address"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    className={`p-2 border w-full rounded text-right ${errors.address ? 'border-red-500' : 'border-gray-400'}`}
                                    placeholder="العنوان"
                                />
                                {errors.address && <p className="text-red-500 text-sm">{errors.address}</p>}
                            </div>
                            <div className="flex-1">
                                <input
                                    type="text"
                                    name="address2"
                                    value={address2}
                                    onChange={(e) => setAddress2(e.target.value)}
                                    className="p-2 border w-full border-gray-400 rounded"
                                    placeholder="العنوان 2"
                                />
                            </div>
                        </div>
                        <div className="flex flex-col md:flex-row mt-4 gap-4 w-full">
                            <div className="flex-1">
                                <input
                                    type="text"
                                    name="state"
                                    value={state}
                                    onChange={(e) => setState(e.target.value)}
                                    className="p-2 mt-1 border w-full border-gray-400 rounded"
                                    placeholder="المحافظة"
                                />
                            </div>
                            <div className="flex-1">
                                <input
                                    type="text"
                                    name="city"
                                    value={city}
                                    onChange={(e) => setCity(e.target.value)}
                                    className={`p-2 mt-1 border w-full rounded text-right ${errors.city ? 'border-red-500' : 'border-gray-400'}`}
                                    placeholder="المدينة"
                                />
                                {errors.city && <p className="text-red-500 text-sm">{errors.city}</p>}
                            </div>
                        </div>
                        <div className="flex flex-col md:flex-row mt-4 gap-4 w-full">
                            <div className="flex-1">
                                <input
                                    type="text"
                                    name="country"
                                    value={country}
                                    onChange={(e) => setCountry(e.target.value)}
                                    className={`p-2 mt-1 border w-full rounded text-right ${errors.country ? 'border-red-500' : 'border-gray-400'}`}
                                    placeholder="البلد"
                                />
                                {errors.country && <p className="text-red-500 text-sm">{errors.country}</p>}
                            </div>
                            <div className="flex-1">
                                <input
                                    type="text"
                                    name="postalCode"
                                    value={postalCode}
                                    onChange={(e) => setPostalCode(e.target.value)}
                                    className={`p-2 mt-1 border w-full rounded text-right ${errors.postalCode ? 'border-red-500' : 'border-gray-400'}`}
                                    placeholder="الرمز البريدي"
                                />
                                {errors.postalCode && <p className="text-red-500 text-sm">{errors.postalCode}</p>}
                            </div>
                        </div>
                        <div className="flex-1 mt-2">
                            <label>ملاحظات على الطلب</label>
                            <textarea
                                name="notes"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="p-2 mt-3 border w-full border-gray-400 rounded text-right"
                                placeholder="ملاحظات على الطلب"
                                rows="4"
                                cols={100}
                            />
                        </div>
                    </div>
    
                    <div className="lg:w-1/3 w-full mb-5 text-center border-2 border-black mt-7 lg:mt-0 flex flex-col gap-8 bg-grey-2 rounded-lg px-4 py-5">
                        <h2 className="text-xl font-semibold">معلومات الطلب</h2>
                        {products?.length > 0 && (() => {
                            const allProperties = products.reduce((acc, product) => {
                                Object.keys(product.properties || {}).forEach(key => {
                                    if (!acc.includes(key)) {
                                        acc.push(key);
                                    }
                                });
                                return acc;
                            }, []);
    
                            return (
                                <table className="w-full">
                                    <thead>
                                        <tr>
                                            <th className="border border-gray-200 p-2">المنتج</th>
                                            <th className="border border-gray-200 p-2">السعر</th>
                                            {allProperties.map(prop => (
                                                <th key={prop} className="border border-gray-200 p-2">{prop}</th>
                                            ))}
                                            <th className="border border-gray-200 p-2">الكمية</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {products.map(product => {
                                            const totalPrice = (Number(product.price) * product.quantity).toFixed(2);
    
                                            return (
                                                <tr key={product._id} className="border border-gray-200">
                                                    <td className="border border-gray-200 p-2">{product.title}</td>
                                                    <td className="border border-gray-200 p-2">{totalPrice} <span className="text-lg">ريال</span></td>
                                                    {allProperties.map(prop => (
                                                        <td key={prop} className="border border-gray-200 p-2">
                                                            {product.properties?.[prop] || ''}
                                                        </td>
                                                    ))}
                                                    <td className="border border-gray-200 p-2">{product.quantity}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            );
                        })()}
    
                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between items-center">
                                <span className="font-bold">سعر المنتجات</span>
                                <span className="font-bold">{totalRounded} ريال</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="font-bold">سعر التوصيل</span>
                                <span className="font-bold">{SHIPPING_COST} ريال</span>
                            </div>
                            <div className="flex justify-between items-center border-t pt-2">
                                <span className="font-bold">المجموع الكلي</span>
                                <span className="font-bold text-xl">{(Number(totalRounded) + SHIPPING_COST).toFixed(2)} ريال</span>
                            </div>
                        </div>
                        <button
                            onClick={goToPayment}
                            className="bg-black font-medium text-xl text-white rounded-lg mt-3 py-2 px-4"
                        >
                            متابعة إلى الدفع
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}    