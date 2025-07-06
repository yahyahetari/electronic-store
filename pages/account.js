import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import axios from "axios";
import Loader from "@/components/Loader";
import Auth from "@/components/Auth";
import ShippingInfoForm from "@/components/ShippingInfoForm";

export default function Account() {
  const [shippingInfo, setShippingInfo] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { data: session } = useSession();
  const [hasOrder, setHasOrder] = useState(false);

  const handleSignOut = () => {
    signOut({ callbackUrl: "http://localhost:3001/shop" });
  };

  useEffect(() => {
    const fetchShippingInfo = async () => {
      if (session) {
        try {
          const shippingResponse = await axios.get('/api/shipping');
          console.log("Received shipping info:", shippingResponse.data);
          
          const updatedShippingInfo = {
            ...shippingResponse.data,
            email: session.user.email,
            firstName: shippingResponse.data.firstName || (session.user.name ? session.user.name.split(' ')[0] : ''),
            lastName: shippingResponse.data.lastName || (session.user.name ? session.user.name.split(' ').slice(1).join(' ') : ''),
          };
          
          setShippingInfo(updatedShippingInfo);
          setHasOrder(shippingResponse.data.hasOrder);
        } catch (error) {
          console.error("Error fetching shipping data:", error);
          setError("فشل تحميل بيانات الشحن. يرجى المحاولة مرة أخرى لاحقًا.");
        } finally {
          setLoading(false);
        }
      }
    };
    fetchShippingInfo();
  }, [session]);

  const handleUpdateShippingInfo = async (updatedInfo) => {
    if (!hasOrder) {
      setError("لا يمكنك تعديل المعلومات حتى تقوم بإجراء طلب أولاً.");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.put('/api/shipping', updatedInfo);
      setShippingInfo(prevInfo => ({ ...prevInfo, ...response.data.updatedOrder }));
    } catch (error) {
      console.error("Error updating shipping data:", error);
      setError("فشل تحديث بيانات الشحن. يرجى المحاولة مرة أخرى لاحقًا.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader />
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  if (error) {
    return <div className="text-red-500 text-center p-4">{error}</div>;
  }

  return (
    <div className="bg-gray-100 min-h-screen">
      <nav className="bg-white shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">حسابي</h1>
          <button 
            onClick={handleSignOut} 
            className="text-sm sm:text-base bg-red-500 text-white rounded-full px-4 py-2 hover:bg-red-600 transition duration-300"
          >
            تسجيل الخروج
          </button>
        </div>
      </nav>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            {shippingInfo ? (
              <ShippingInfoForm
                shippingInfo={shippingInfo}
                onUpdate={handleUpdateShippingInfo}
                hasOrder={hasOrder}
              />
            ) : (
              <p className="text-gray-500">لا توجد معلومات شحن متاحة.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
