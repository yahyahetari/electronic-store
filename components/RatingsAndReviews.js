import { useState } from 'react';
import { Star, ChevronDown, ChevronUp } from 'lucide-react';
import { useSession } from "next-auth/react";
import Image from 'next/image';

const RatingsAndReviews = ({ productId, initialRatings = [] }) => {
    const [ratings, setRatings] = useState(initialRatings);
    const [newRating, setNewRating] = useState(0);
    const [newReview, setNewReview] = useState('');
    const [isExpanded, setIsExpanded] = useState(false);
    const [error, setError] = useState('');
    const [editingRatingId, setEditingRatingId] = useState(null);
    const [editRating, setEditRating] = useState(0);
    const [editReview, setEditReview] = useState('');
    const { data: session } = useSession();

    const averageRating = ratings.length > 0
        ? ratings.reduce((sum, item) => sum + item.rating, 0) / ratings.length
        : 0;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (newRating > 0 && session) {
            const newRatingObject = {
                rating: newRating,
                review: newReview,
                user: {
                    name: session.user.name,
                    email: session.user.email,
                    image: session.user.image
                },
            };

            try {
                const response = await fetch('/api/rate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        productId,
                        rating: newRatingObject
                    }),
                });

                if (response.ok) {
                    const data = await response.json();
                    setRatings(data.updatedRatings);
                    setNewRating(0);
                    setNewReview('');
                } else {
                    const errorData = await response.json();
                    setError(errorData.message);
                }
            } catch (error) {
                setError('حدث خطأ أثناء إرسال التقييم');
            }
        }
    };

    const handleEdit = async (ratingId) => {
        if (!ratingId) return;
        try {
            const response = await fetch('/api/rate', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    productId,
                    ratingId,
                    newRating: editRating,
                    newReview: editReview
                }),
            });

            if (response.ok) {
                const data = await response.json();
                setRatings(data.updatedRatings);
                setEditingRatingId(null);
            } else {
                const errorData = await response.json();
                setError(errorData.message);
            }
        } catch (error) {
            setError('حدث خطأ أثناء تحديث التعليق');
        }
    };

    const handleDelete = async (ratingId) => {
        if (window.confirm('هل أنت متأكد من حذف هذا التعليق؟')) {
            try {
                const response = await fetch('/api/rate', {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        productId,
                        ratingId
                    }),
                });

                if (response.ok) {
                    const data = await response.json();
                    setRatings(data.updatedRatings);
                } else {
                    const errorData = await response.json();
                    setError(errorData.message);
                }
            } catch (error) {
                setError('حدث خطأ أثناء حذف التعليق');
            }
        }
    };

    const RatingStars = ({ rating, size = 'w-5 h-5' }) => (
        <>
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    className={`${size} ${star <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                    fill={star <= Math.round(rating) ? 'currentColor' : 'none'}
                />
            ))}
        </>
    );

    return (
        <div className="mt-8 bg-slate-200 p-3">
            <div
                className="flex justify-between items-center cursor-pointer"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center">
                    <h2 className="text-base sm:text-2xl font-semibold mr-4">التعليقات و التقييمات</h2>
                    {!isExpanded && (
                        <div className="flex items-center">
                            <span className="text-xl font-bold m-2">{averageRating.toFixed(1)}</span>
                            <RatingStars rating={averageRating} size="w-4 h-4" />
                        </div>
                    )}
                </div>
                {isExpanded ? <ChevronUp /> : <ChevronDown />}
            </div>

            {isExpanded && (
                <>
                    <div className="flex items-center my-4">
                        <span className="text-xl font-bold m-2">{averageRating.toFixed(1)}</span>
                        <RatingStars rating={averageRating} />
                    </div>
                    <div className="mb-4">
                        {ratings.map((item, index) => (
                            <div 
                                key={item._id || index} 
                                className={`mb-4 p-3 rounded-lg ${
                                    session?.user.email === item.user.email 
                                        ? 'bg-teal-50 border border-black' 
                                        : 'bg-white'
                                }`}
                            >
                                {editingRatingId === (item._id?.toString() || index) ? (
                                    <div className="space-y-4">
                                        <div className="flex">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <Star
                                                    key={star}
                                                    className={`w-6 h-6 cursor-pointer ${star <= editRating ? 'text-yellow-400' : 'text-gray-800'}`}
                                                    fill={star <= editRating ? 'currentColor' : 'none'}
                                                    onClick={() => setEditRating(star)}
                                                />
                                            ))}
                                        </div>
                                        <textarea
                                            value={editReview}
                                            onChange={(e) => setEditReview(e.target.value)}
                                            className="w-full p-2 border border-gray-700 rounded"
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleEdit(item._id)}
                                                className="bg-green-600 text-white px-4 py-2 rounded"
                                            >
                                                حفظ
                                            </button>
                                            <button
                                                onClick={() => setEditingRatingId(null)}
                                                className="bg-gray-600 text-white px-4 py-2 rounded"
                                            >
                                                إلغاء
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex items-center mb-2">
                                            {item.user && item.user.image && (
                                                <Image
                                                    src={item.user.image}
                                                    alt={item.user.name}
                                                    width={20}
                                                    height={20}
                                                    className="rounded-full h-8 w-8 object-cover object-top ml-2"
                                                />
                                            )}
                                            <span className={`font-normal text-sm ${
                                                session?.user.email === item.user.email 
                                                    ? 'text-blue-700' 
                                                    : 'text-gray-700'
                                            }`}>
                                                {item.user?.name ? `${item.user.name.charAt(0)}******${item.user.name.charAt(item.user.name.length - 1)}` : 'Anonymous'}
                                            </span>
                                            {session?.user.email === item.user.email && (
                                                <>
                                                    <span className="mx-2 px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                                                        تعليقي
                                                    </span>
                                                    <div className="flex gap-2 mr-auto">
                                                        <button
                                                            onClick={() => {
                                                                setEditingRatingId(item._id);
                                                                setEditRating(item.rating);
                                                                setEditReview(item.review);
                                                            }}
                                                            className="text-blue-600 hover:text-blue-800"
                                                        >
                                                            تعديل
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(item._id)}
                                                            className="text-red-600 hover:text-red-800"
                                                        >
                                                            حذف
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                        <div className="flex items-center mb-2">
                                            <RatingStars rating={item.rating} size="w-4 h-4" />
                                        </div>
                                        <p>{item.review}</p>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                    {session ? (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block mb-2">قيم المنتج:</label>
                                <div className="flex">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                            key={star}
                                            className={`w-6 h-6 cursor-pointer ${star <= newRating ? 'text-yellow-400' : 'text-gray-800'}`}
                                            fill={star <= newRating ? 'currentColor' : 'none'}
                                            onClick={() => setNewRating(star)}
                                        />
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block mb-2">اضف تعليق:</label>
                                <textarea
                                    value={newReview}
                                    onChange={(e) => setNewReview(e.target.value)}
                                    className="w-full p-2 border border-gray-700 rounded"
                                ></textarea>
                            </div>
                            {error && (
                                <div className="text-red-500 mb-2 text-xl">{error}</div>
                            )}
                            <button type="submit" className="bg-black text-white text-lg px-4 py-2 rounded">
                                إرسال التعليق
                            </button>
                        </form>
                    ) : (
                        <p>يرجى تسجيل الدخول لترك تعليق.</p>
                    )}
                </>
            )}
        </div>
    );
};

export default RatingsAndReviews;
