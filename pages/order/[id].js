import axios from "axios";
import { useEffect, useState } from "react";
import { useRouter } from 'next/router';
import { Box, Package, Calendar, ArrowLeft } from "lucide-react";
import Loader from "@/components/Loader";

export default function Order() {
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const router = useRouter();
    const { id } = router.query;

    useEffect(() => {
        const fetchOrder = async () => {
            if (id) {
                try {
                    const response = await axios.get(`/api/orders/${id}`);
                    setOrder(response.data);
                } catch (error) {
                    setError(error.message || "حدث خطأ أثناء جلب الطلب.");
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchOrder();
    }, [id]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-100">
                <Loader />
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-8 bg-gray-100">
                <div className="bg-red-100 border-r-4 border-red-500 text-red-700 p-4 rounded" role="alert">
                    <p className="font-bold">خطأ</p>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="container mx-auto px-4 py-8 bg-gray-100">
                <div className="bg-yellow-100 border-r-4 border-yellow-500 text-yellow-700 p-4 rounded" role="alert">
                    <p className="font-bold">لم يتم العثور على الطلب</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-extrabold mb-2 -mt-6 text-center text-gray-800">تفاصيل الطلب</h1>

                <div className="bg-white shadow-lg rounded-xl overflow-hidden">
                    <div className="bg-gradient-to-l from-blue-500 to-purple-600 text-white px-6 py-4">
                        <div className="flex justify-between items-center">
                            <span className="text-lg flex items-center">
                                <Calendar className="ml-2" size={20} />
                                {new Date(order.createdAt).toLocaleString('ar-SA', { 
                                    year: 'numeric', 
                                    month: 'short', 
                                    day: 'numeric', 
                                    hour: 'numeric', 
                                    minute: 'numeric', 
                                    second: 'numeric' 
                                })}
                            </span>
                        </div>
                    </div>

                    <div className="p-2">
                        <table className="w-full text-center">
                            <thead>
                                <tr>
                                    <th className="border border-gray-200 p-2">المنتج</th>
                                    <th className="border border-gray-200 p-2">الخصائص</th>
                                    <th className="border border-gray-200 p-2">الكمية</th>
                                    <th className="border border-gray-200 p-2">السعر</th>
                                </tr>
                            </thead>
                            <tbody>
                                {order.items && order.items.map((item, index) => (
                                    <tr key={index} className="border border-gray-200">
                                        <td className="border border-gray-200 p-1">
                                            <div className="flex items-center">
                                                <p className="font-semibold text-gray-800 text-base">{item.title}</p>
                                            </div>
                                        </td>
                                        <td className="border border-gray-200 p-2">
                                            <p className="text-gray-600">
                                                {Object.entries(item.properties).map(([key, value]) => (
                                                    `${key}: ${value}`
                                                )).join(' | ')}
                                            </p>
                                        </td>
                                        <td className="border border-gray-200 p-2">
                                            <p className="text-gray-600">{item.quantity}</p>
                                        </td>
                                        <td className="border border-gray-200 p-2">
                                            <p className="font-semibold text-gray-800">{item.price * item.quantity} درهم</p>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div className=" m-2">
                            {order.notes && (
                                <div className="bg-gray-100 p-2 rounded-lg">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-2">ملاحظات الطلب:</h3>
                                    <p className="text-gray-600 text-lg">{order.notes}</p>
                                </div>
                            )}
                        </div>

                        <div className="mt-6 text-right">
                            <p className="text-2xl font-bold text-gray-800">الإجمالي: {order.totalAmount} درهم</p>
                        </div>
                    </div>

                    <div className="mt-6 bg-blue-100 border-r-4 border-blue-500 text-blue-700 p-4 rounded">
                        <p className="font-bold text-xl">وقت التسليم المتوقع</p>
                        <p className="text-lg">من المتوقع وصول طلبك خلال 1-3 أيام من تاريخ الطلب.</p>
                    </div>
                </div>

                <button
                    onClick={() => router.push('/orders')}
                    className="mt-8 w-full bg-gradient-to-l from-blue-500 to-purple-600 text-white px-6 py-3 rounded-full hover:from-blue-600 hover:to-purple-700 transition duration-300 ease-in-out flex items-center justify-center text-lg font-semibold"
                >
                    <ArrowLeft className="ml-2" size={20} />
                    العودة إلى الطلبات
                </button>
            </div>
        </div>
    );
}
