import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { FaSearch, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import Loader from "@/components/Loader";
import Auth from '@/components/Auth';
import { useSession } from 'next-auth/react';

export default function Orders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const ordersPerPage = 10;
    const router = useRouter();
    const { data: session } = useSession();

    useEffect(() => {
        const fetchOrders = async () => {
            if (session) {
                try {
                    const ordersResponse = await axios.get('/api/orders');
                    setOrders(ordersResponse.data);
                    setLoading(false);
                } catch (error) {
                    console.error("Error fetching orders:", error);
                    setError("Failed to load orders. Please try again later.");
                    setLoading(false);
                }
            }
        };

        fetchOrders();
        const interval = setInterval(fetchOrders, 5000);
        return () => clearInterval(interval);
    }, [session]);

    useEffect(() => {
        const savedPage = parseInt(localStorage.getItem('currentPage'), 10);
        if (savedPage) {
            setCurrentPage(savedPage);
        }
    }, []);

    const handleOrderClick = (orderId) => {
        localStorage.setItem('currentPage', currentPage);
        router.push(`/order/${orderId}`);
    };

    const calculateTotal = (items) => {
        return items.reduce((total, item) => {
            return total + (item.price * item.quantity);
        }, 0);
    };

    const filteredOrders = orders.filter(order =>
        order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${order.firstName} ${order.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).includes(searchTerm)
    );

    const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
    const indexOfLastOrder = currentPage * ordersPerPage;
    const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
    const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(prevPage => prevPage + 1);
        }
    };

    const handlePreviousPage = () => {
        if (currentPage > 1) {
            setCurrentPage(prevPage => prevPage - 1);
        }
    };

    if (!session) {
        return <Auth />;
    }

    if (loading) {
        return (
            <div className="text-center py-4">
                <Loader />
            </div>
        );
    }

    if (error) {
        return <div className="text-red-500 text-center">{error}</div>;
    }

    return (
        <div className="bg-white h-screen rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-4">طلباتك</h2>
            <div className="mb-4 flex items-center space-x-4">
                <div className="relative flex-grow">
                    <input
                        type="text"
                        placeholder="البحث في الطلبات..."
                        className="w-full p-2 pl-10 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
            </div>
            <div className="overflow-x-auto">
                {currentOrders.length > 0 ? (
                    <table className="w-full table-auto">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-right text-lg font-medium text-gray-500 uppercase tracking-wider">رقم الطلب</th>
                                <th className="px-6 py-3 text-center text-lg font-medium text-gray-500 uppercase tracking-wider">المنتجات</th>
                                <th className="px-6 py-3 text-right text-lg font-medium text-gray-500 uppercase tracking-wider">الإجمالي </th>
                                <th className="px-6 py-3 text-right text-lg font-medium text-gray-500 uppercase tracking-wider">تاريخ الطلب</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {currentOrders.map(order => (
                                <tr key={order._id} className="hover:bg-gray-50 transition duration-150 ease-in-out">
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <a
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handleOrderClick(order._id);
                                            }}
                                            className="text-blue-600 hover:text-blue-900"
                                        >
                                            {order._id}
                                        </a>
                                    </td>
                                    <td className="px-6 py-4 text-center whitespace-nowrap">
                                        {order.items.reduce((total, item) => total + item.quantity, 0)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        {order.totalAmount} درهم
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        {new Date(order.createdAt).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' })}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p className="text-center py-4">لم يتم العثور على طلبات.</p>
                )}
            </div>
            {currentOrders.length > 0 && (
                <div className="flex justify-between items-center mt-4">
                    <button
                        onClick={handlePreviousPage}
                        disabled={currentPage === 1}
                        className="flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                    >
                        <FaChevronRight className="ml-2" />
                        <span className="hidden sm:inline">الصفحة السابقة</span>
                    </button>
                    <div className="flex items-center space-x-2">
                        {[...Array(totalPages).keys()].map(number => (
                            <button
                                key={number}
                                onClick={() => setCurrentPage(number + 1)}
                                className={`px-3 py-1 rounded-md ${currentPage === number + 1 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                            >
                                {number + 1}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={handleNextPage}
                        disabled={currentPage === totalPages}
                        className="flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                    >
                        <span className="hidden sm:inline"> الصفحة التالية</span>
                        <FaChevronLeft className="mr-2" />
                    </button>
                </div>
            )}
        </div>
    );
}
