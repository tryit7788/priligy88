import { cartTotal, cartCount, cartItems, cartOperations } from "@/cartStore";
import { useStore } from "@nanostores/react";
import React, { useEffect, useState } from "react";
import { FaShoppingCart } from "react-icons/fa";
import LoadingDots from "../loadings/LoadingDots";
import CloseCart from "./CloseCart";
import DeleteItemButton from "./DeleteItemButton";
import EditItemQuantityButton from "./EditItemQuantityButton";
import OpenCart from "./OpenCart";
import { generatPayloadImageUrl } from "@/lib/utils";

const CartModal: React.FC = () => {
  const items = useStore(cartItems);
  const quantity = useStore(cartCount);
  const total = useStore(cartTotal);
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Avoid SSR/CSR mismatch by deferring cart content until client mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Handlers for opening and closing the cart
  const openCart = () => {
    setIsOpen(true);
    document.body.style.overflow = "hidden";
  };

  const closeCart = () => {
    setIsOpen(false);
    document.body.style.overflow = "";
  };

  // Before client mount, render only the trigger to keep SSR/CSR markup stable
  if (!isMounted) {
    return (
      <div className="cursor-pointer" aria-label="Open cart" onClick={openCart}>
        <OpenCart quantity={quantity} />
      </div>
    );
  }

  return (
    <>
      <div className="cursor-pointer" aria-label="Open cart" onClick={openCart}>
        <OpenCart quantity={quantity} />
      </div>

      <div
        className={`fixed inset-0 bg-black opacity-50 z-40 transition-opacity ${isOpen ? "block" : "hidden"}`}
        onClick={closeCart}
      />

      <div
        className={`fixed inset-y-0 right-0 z-50 w-full md:w-[390px] transform transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="h-fit flex flex-col border-l border-b drop-shadow-lg rounded-bl-md border-neutral-200 bg-body p-6 text-black dark:border-neutral-700 dark:bg-darkmode-body dark:text-white">
          <div className="flex items-center justify-between">
            <p className="text-lg font-semibold">購物車</p>
            <button aria-label="Close cart" onClick={closeCart}>
              <CloseCart />
            </button>
          </div>

          <div className="w-full h-px absolute bg-dark dark:bg-light left-0 top-16" />

          {/* Cart Content (client-only to avoid SSR mismatch) */}
          {!items || items.length === 0 ? (
            <div className="flex flex-col justify-center items-center space-y-6 my-auto">
              <div className="md:mt-16">
                <FaShoppingCart size={76} />
              </div>
              <p>Oops. 購物車是空的.</p>
              <a href="/products" className="btn btn-primary w-full">
                不要忘記: 加入商品
              </a>
            </div>
          ) : (
            <div className="flex h-full flex-col justify-between overflow-hidden p-1">
              <ul className="flex-grow overflow-auto py-4">
                {items.map((item) => (
                  <li
                    key={`${item.id}-${item.variant?.id || "no-variant"}`}
                    className="flex w-full flex-col border-b border-neutral-300 dark:border-neutral-700"
                  >
                    <div className="relative flex w-full flex-row justify-between px-1 py-4">
                      <div className="absolute z-40 -mt-2 ml-[55px]">
                        <DeleteItemButton
                          productId={item.id}
                          variantId={item.variant?.id}
                        />
                      </div>
                      <a
                        href={`/products/${item?.slug}`}
                        className="z-30 flex flex-row space-x-4"
                      >
                        <div className="relative h-16 w-16 overflow-hidden rounded-md border border-neutral-300 bg-neutral-300">
                          <img
                            className="h-full w-full object-cover"
                            src={generatPayloadImageUrl(item.image)}
                            alt={item.title}
                            width={64}
                            height={64}
                          />
                        </div>
                        <div className="flex flex-1 flex-col text-base">
                          <span>{item.title}</span>
                          {item.variant && (
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {item.variant.name}
                            </span>
                          )}
                        </div>
                      </a>
                      <div className="flex h-16 flex-col justify-between ml-1">
                        <p className="text-right">${item.price.toFixed(2)}</p>
                        <div className="flex items-center space-x-2">
                          <EditItemQuantityButton
                            productId={item.id}
                            variantId={item.variant?.id}
                            currentQuantity={item.quantity}
                            type="minus"
                          />
                          <p>{item.quantity}</p>
                          <EditItemQuantityButton
                            productId={item.id}
                            variantId={item.variant?.id}
                            currentQuantity={item.quantity}
                            type="plus"
                          />
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Cart Summary */}
              <div className="py-4 text-sm text-neutral-500 dark:text-neutral-400">
                <div className="mb-3 flex items-center justify-between border-b border-neutral-200 pb-1 pt-1 dark:border-neutral-700">
                  <p>小計</p>
                  <p className="text-right text-base text-black dark:text-white">
                    ${total.toFixed(2)}
                  </p>
                </div>
              </div>

              <a
                href="/checkout"
                className="block w-full rounded-md bg-dark dark:bg-light p-3 text-center text-sm font-medium text-white dark:text-text-dark opacity-100 hover:opacity-90"
              >
                結帳
              </a>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CartModal;
