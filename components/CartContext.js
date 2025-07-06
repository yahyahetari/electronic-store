import { createContext, useEffect, useState } from "react";
import toast from "react-hot-toast";

export const CartContext = createContext({});

export function CartContextProvider({ children }) {
    const [cart, setCart] = useState([]);
    const ls = typeof window !== 'undefined' ? window.localStorage : null;

    useEffect(() => {
        if (ls && ls.getItem('cart')) {
            const savedCart = JSON.parse(ls.getItem('cart'));
            setCart(savedCart);
        }
    }, []);

    useEffect(() => {
        if (cart?.length > 0) {
            ls?.setItem('cart', JSON.stringify(cart));
        } else {
            ls?.removeItem('cart');
        }
    }, [cart]);

    function addToCart(item) {
        const { productId, variantId, properties, quantity, price, stock } = item;
        
        // تجميع كل المنتجات المتطابقة في السلة
        const matchingItems = cart.filter(cartItem => 
            cartItem.variantId === variantId && 
            JSON.stringify(cartItem.properties) === JSON.stringify(properties)
        );

        const totalQuantityInCart = matchingItems.length;
        const totalRequestedQuantity = totalQuantityInCart + quantity;

        // فحص المخزون المتاح
        if (totalRequestedQuantity > stock) {
            const remainingStock = stock - totalQuantityInCart;
            
            if (remainingStock <= 0) {
                toast.error('نفذت الكمية من المخزون');
                return;
            }
            
            toast.error(`الكمية المتوفرة في المخزون ${remainingStock} ${remainingStock === 1 ? 'قطعة' : 'قطع'} فقط`);
            return;
        }

        // إضافة المنتجات الجديدة
        const newItems = Array(quantity).fill({
            id: productId,
            variantId,
            properties,
            price,
            stock
        });

        const updatedCart = [...cart, ...newItems];
        setCart(updatedCart);
        ls?.setItem('cart', JSON.stringify(updatedCart));
        
        toast.success(`تمت إضافة ${quantity} ${quantity > 1 ? 'منتجات' : 'منتج'} إلى السلة`);
    }

    function clearCart() {
        setCart([]);
        ls?.removeItem('cart');
    }

    return (
        <CartContext.Provider value={{ 
            cart, 
            setCart, 
            addToCart, 
            clearCart 
        }}>
            {children}
        </CartContext.Provider>
    );
}
