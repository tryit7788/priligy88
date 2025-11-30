import React, { useEffect } from "react";
import { cartOperations } from "@/cartStore";

const SuccessContent = () => {
  useEffect(() => {
    // Clear the cart
    if (typeof window !== "undefined") {
      cartOperations.clearCart();
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 dark:from-primary/10 dark:via-transparent dark:to-secondary/10 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-card border border-border rounded-xl p-8 shadow-lg">
            <div className="mb-6">
              <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-green-600 dark:text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
              </div>
            </div>

            <h1 className="text-3xl font-bold mb-4">感謝訂購!</h1>
            <p className="text-lg text-muted-foreground mb-8">
              你已經成功下單. 我們會儘快發送訂單確認郵件.
            </p>

            <div className="space-y-4">
              <a
                href="/products"
                className="inline-block bg-primary text-primary-foreground rounded-md py-3 px-6 text-base font-medium hover:bg-primary/90 transition-colors"
              >
                繼續購物
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuccessContent;
