import { useState } from 'react';
import { FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaGlobe, FaCamera } from 'react-icons/fa';
import Image from 'next/image';
import { useSession } from 'next-auth/react';

export default function ShippingInfoForm({ shippingInfo, onUpdate, hasOrder }) {
    const [formData, setFormData] = useState(shippingInfo);
    const [isEditing, setIsEditing] = useState(false);
    const { data: session, update } = useSession();
    const [uploading, setUploading] = useState(false);

    const handleImageUpload = async (e) => {
        const files = e.target.files;
        if (files?.length > 0) {
            setUploading(true);
            const data = new FormData();
            for (const file of files) {
                data.append('file', file);
            }

            try {
                const uploadResponse = await fetch('/api/upload', {
                    method: 'POST',
                    body: data,
                });
                const { Links } = await uploadResponse.json();

                if (Links?.length > 0) {
                    const updateResponse = await fetch('/api/update-user-image', {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ imageUrl: Links[0] }),
                    });

                    if (updateResponse.ok) {
                        await update({
                            ...session,
                            user: {
                                ...session?.user,
                                image: Links[0]
                            }
                        });
                    }
                }
            } catch (error) {
                console.error('Error:', error);
            } finally {
                setUploading(false);
            }
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onUpdate(formData);
        setIsEditing(false);
    };

    if (!isEditing) {
        return (
            <div className="space-y-4">
                <div className="relative w-40 h-40 mx-auto mb-4">
                    <Image
                        src={session?.user?.image || '/user.jpg'}
                        alt="Profile"
                        layout="fill"
                        objectFit="cover"
                        className="rounded-full object-cover object-top"
                    />
                    <label htmlFor="profileImage" className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-2 cursor-pointer">
                        <FaCamera className="text-white" />
                        {uploading && <span className="loading-spinner" />}
                    </label>
                    <input
                        type="file"
                        id="profileImage"
                        className="hidden"
                        onChange={handleImageUpload}
                        accept="image/*"
                        disabled={uploading}
                    />
                </div>
                {[
                    { icon: FaUser, label: "الاسم", value: `${formData.firstName} ${formData.lastName}` },
                    { icon: FaEnvelope, label: "البريد الإلكتروني", value: formData.email },
                    { icon: FaPhone, label: "رقم الهاتف", value: formData.phone },
                    { icon: FaMapMarkerAlt, label: "العنوان", value: `${formData.address}، ${formData.city}، ${formData.state} ${formData.postalCode}` },
                    { icon: FaGlobe, label: "الدولة", value: formData.country },
                ].map((item, index) => (
                    <div key={index} className="flex items-center bg-slate-100 rounded-lg shadow-md">
                        <item.icon className="text-blue-500 m-3 text-xl" />
                        <div>
                            <p className="text-sm text-gray-500">{item.label}</p>
                            <p className="font-medium">{item.value}</p>
                        </div>
                    </div>
                ))}
                <button
                    onClick={() => setIsEditing(true)}
                    className={`w-full mt-4 ${hasOrder ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-400 cursor-not-allowed'} text-white px-4 py-2 rounded-lg transition duration-300`}
                    disabled={!hasOrder}
                >
                    {hasOrder ? 'تعديل المعلومات' : 'لا يمكن التعديل حتى إجراء أول طلب'}
                </button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="الاسم الأول"
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="اسم العائلة"
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
            </div>
            {["phone", "address", "city", "state", "country", "postalCode"].map((field) => (
                <input
                    key={field}
                    type="text"
                    name={field}
                    value={formData[field]}
                    onChange={handleChange}
                    placeholder={
                        field === "phone" ? "رقم الهاتف" :
                        field === "address" ? "العنوان" :
                        field === "city" ? "المدينة" :
                        field === "state" ? "المحافظة/الولاية" :
                        field === "country" ? "الدولة" :
                        "الرمز البريدي"
                    }
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
            ))}
            <div className="flex space-x-4">
                <button
                    type="submit"
                    className="flex-1 bg-green-500 ml-2 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition duration-300"
                >
                    حفظ التغييرات
                </button>
                <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="flex-1 bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400 transition duration-300"
                >
                    إلغاء
                </button>
            </div>
        </form>
    );
}
