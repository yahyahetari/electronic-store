import { useState, useEffect, useContext } from "react";
import { useRouter } from "next/router";
import { CartContext } from "@/components/CartContext";
import gsap from 'gsap';

const SuccessfulPayment = () => {
    const { clearCart } = useContext(CartContext);
    const router = useRouter();
    const [showContent, setShowContent] = useState(false);

    useEffect(() => {
        clearCart();
        sessionStorage.setItem('paymentSuccessful', 'true');

        const button = document.querySelector('.truck-button');

        setTimeout(() => {
            if (button && !button.classList.contains('animation')) {
                const animateButton = () => {
                    button.classList.add('animation');

                    gsap.to(button, {
                        '--box-s': 1,
                        '--box-o': 1,
                        duration: .3,
                        delay: .5
                    });

                    gsap.to(box, {
                        x: 0,
                        duration: .4,
                        delay: .7
                    });

                    gsap.to(button, {
                        '--hx': -5,
                        '--bx': 50,
                        duration: .18,
                        delay: .92
                    });

                    gsap.to(box, {
                        y: 0,
                        duration: .1,
                        delay: 1.15
                    });

                    gsap.set(button, {
                        '--truck-y': 0,
                        '--truck-y-n': -52
                    });

                    gsap.to(button, {
                        '--truck-y': 0,
                        '--truck-y-n': -52,
                        duration: .2,
                        delay: 1.25,
                        onComplete() {
                            gsap.timeline({
                                onComplete() {
                                    button.classList.add('done');
                                    setShowContent(true);
                                    button.style.display = 'none';
                                }
                            }).to(truck, {
                                x: 0,
                                duration: .2
                            }).to(truck, {
                                x: -80,
                                duration: .6
                            }).to(truck, {
                                x: -40,
                                duration: .3
                            }).to(truck, {
                                x: -192,
                                duration: .6
                            });
                            gsap.to(button, {
                                '--progress': 1,
                                duration: 1.4,
                                ease: "power2.in"
                            });
                        }
                    });
                };

                const box = button.querySelector('.box');
                const truck = button.querySelector('.truck');
                animateButton();
            }
        }, 500);
    }, []);

    return (
        <div className="h-screen flex flex-col justify-center items-center gap-5 -mt-20">
            <button className="truck-button">
                <div className="truck">
                    <div className="wheel"></div>
                    <div className="back"></div>
                    <div className="front"></div>
                    <div className="box"></div>
                </div>
            </button>

            {showContent && (
                <>
                    <h1 className='font-semibold text-xl text-green-1 bg-green-600 p-3 mt-9 rounded-lg'>
                        دفع ناجح
                    </h1>
                    <p className='font-extrabold text-5xl text-black'>فلسطين حرة</p>
                    <p className='font-extrabold text-5xl text-red-700'>فلسطين حرة</p>
                    <p className='font-extrabold text-5xl text-green-700'>فلسطين حرة</p>
                    <p className='text-lg text-center font-semibold text-black'>
                        سنتواصل بك عند ارسال الطلب
                    </p>
                    <button
                        onClick={() => router.push('/')}
                        className="p-4 border bg-black text-white text-xl hover:bg-white hover:text-black rounded-lg"
                    >
                        العودة الى الصفحة الرئيسية
                    </button>
                    <button
                        onClick={() => router.push('/orders')}
                        className="p-4 border bg-emerald-600 text-white text-xl hover:bg-white hover:text-black rounded-lg"
                    >
                        الذهاب الى صفحة الطلبات
                    </button>
                </>
            )}

            <style jsx>{`
                .truck-button {
                    --color: #000;
                    --background: #00fffc;
                    --tick: black;
                    --base: #0D0F18;
                    --wheel: #2B3044;
                    --wheel-inner: #2549ff;
                    --wheel-dot: #fff;
                    --back: #ff8800;
                    --back-inner: rgb(97, 72, 255);
                    --back-inner-shadow: rgb(87, 61, 255);
                    --front: #516bff;
                    --front-shadow: #1f48ff;
                    --front-light: #ffc400;
                    --window: #2B3044;
                    --window-shadow: #404660;
                    --street: #333;
                    --street-fill: #2549ff;
                    --box: #ffc400;
                    --box-shadow: #ffc400;
                    padding: 20px 0;
                    width: 300px;
                    cursor: pointer;
                    text-align: center;
                    position: relative;
                    border: none;
                    outline: none;
                    color: var(--color);
                    background: var(--background);
                    border-radius: var(--br, 5px);
                    transform-style: preserve-3d;
                    transform: rotateX(var(--rx, 0deg)) translateZ(0);
                    transition: transform 0.5s, border-radius 0.3s linear var(--br-d, 0s);
                }

                .truck-button:before,
                .truck-button:after {
                    content: "";
                    position: absolute;
                    right: 0;
                    top: 0;
                    width: 100%;
                    height: 12px;
                    background: var(--b, var(--street));
                    transform-origin: 100% 100%;
                    transform: rotateX(90deg) scaleX(var(--sy, 1));
                }

                .truck-button:after {
                    --sy: var(--progress, 0);
                    --b: var(--street-fill);
                }

                .truck-button .default,
                .truck-button .success {
                    display: block;
                    font-weight: 600;
                    font-size: 14px;
                    line-height: 24px;
                    opacity: var(--o, 1);
                    transition: opacity 0.3s;
                }

                .truck-button .success {
                    --o: 0;
                    position: absolute;
                    top: 20px;
                    left: 0;
                    right: 0;
                }

                .truck-button .success svg {
                    width: 12px;
                    height: 10px;
                    display: inline-block;
                    vertical-align: top;
                    fill: none;
                    margin: 7px 0 0 4px;
                    stroke: var(--tick);
                    stroke-width: 2;
                    stroke-linecap: round;
                    stroke-linejoin: round;
                    stroke-dasharray: 16px;
                    stroke-dashoffset: var(--offset, 16px);
                    transition: stroke-dashoffset 0.4s ease 0.45s;
                }

                .truck-button .truck {
                    position: absolute;
                    width: 144px;
                    height: 56px;
                    transform: rotateX(90deg) translate3d(var(--truck-x, 4px), calc(var(--truck-y-n, -52) * 1px), 24px);
                }

                .truck-button .truck .wheel,
                .truck-button .truck .wheel:before {
                    position: absolute;
                    bottom: var(--b, -12px);
                    left: var(--l, 12px);
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background: var(--wheel);
                    transform: translateZ(0);
                }

                .truck-button .truck .wheel {
                    transform: translateY(calc(var(--truck-y) * -1px)) translateZ(0);
                }

                .truck-button .truck .wheel:before {
                    --l: 70px;
                    --b: 0;
                    content: "";
                }

                .truck-button .truck .front,
                .truck-button .truck .back,
                .truck-button .truck .box {
                    position: absolute;
                }

                .truck-button .truck .front {
                    right: 94px;
                    bottom: -1px;
                    height: 44px;
                    width: 48px;
                    clip-path: polygon(45% 0, 28% 44%, 0% 58%, 0% 100%, 100% 100%, 100% 0);
                    background: linear-gradient(-84deg, var(--front-shadow) 0%, var(--front-shadow) 10%, var(--front) 12%, var(--front) 100%);
                }

                .truck-button .truck .back {
                    right: 0;
                    bottom: 0;
                    z-index: 1;
                    width: 94px;
                    height: 56px;
                    border-radius: 1px 1px 0 0;
                    background: linear-gradient(-68deg, var(--back-inner) 0%, var(--back-inner) 22%, var(--back-inner-shadow) 22.1%, var(--back-inner-shadow) 100%);
                }

                .truck-button .truck .box {
                    width: 26px;
                    height: 26px;
                    left: 112px;
                    bottom: 0;
                    z-index: 1;
                    border-radius: 1px;
                    overflow: hidden;
                    transform: translate(calc(var(--box-x, 48) * 1px), calc(var(--box-y, -12) * 1px)) scale(var(--box-s, 0.5));
                    opacity: var(--box-o, 0);
                    background: linear-gradient(-68deg, var(--box) 0%, var(--box) 50%, var(--box-shadow) 50.2%, var(--box-shadow) 100%);
                }

                .truck-button.animation {
                    --rx: -90deg;
                    --br: 0;
                }

                .truck-button.animation .default {
                    --o: 0;
                }

                .truck-button.animation.done {
                    --rx: 0deg;
                    --br: 5px;
                    --br-d: .2s;
                }

                .truck-button.animation.done .success {
                    --o: 1;
                    --offset: 0;
                }
            `}</style>
        </div>
    );
};

export default SuccessfulPayment;
