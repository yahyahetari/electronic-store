import { Truck, MessageCircleMore, CircleDollarSign } from 'lucide-react';
import { FaRegCreditCard } from "react-icons/fa";

export default function StoreFeatures() {
    return (
        <div className="store-feature section bg-white py-8">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="flex flex-col items-center text-center">
                        <Truck className="w-12 h-12 mb-2 text-gray-400" />
                        <h5 className="font-semibold text-lg">الشحن والإرجاع مجاناً</h5>
                        <span className="text-base text-gray-600">الشحن المجاني لجميع الطلبات في دبي </span>
                    </div>
                    <div className="flex flex-col items-center text-center">
                        <CircleDollarSign className="w-12 h-12 mb-2 text-gray-400" />
                        <h5 className="font-semibold text-lg">ضمان استعادة المال</h5>
                        <span className="text-base text-gray-600">ضمان استعادة المال لمدة 30 يوماً</span>
                    </div>
                    <div className="flex flex-col items-center text-center">
                        <MessageCircleMore className="w-12 h-12 mb-2 text-gray-400" />
                        <h5 className="font-semibold text-lg">دعم فني على الإنترنت</h5>
                        <span className="text-base text-gray-600">نقدم الدعم عبر الإنترنت على مدار الساعة</span>
                    </div>
                    <div className="flex flex-col items-center text-center">
                        <FaRegCreditCard className="w-12 h-12 mb-2 text-gray-400" />
                        <h5 className="font-semibold text-lg">وسائل دفع آمنة</h5>
                        <span className="text-base text-gray-600">جميع وسائل الدفع آمنة وموثوقة</span>
                    </div>

                </div>
            </div>
        </div>
    );
}
