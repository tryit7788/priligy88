import type { HeroSlide, Product } from "payload_app";
import React from "react";
import "swiper/css";
import "swiper/css/pagination";
import { Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { generatPayloadImageUrl } from "@/lib/utils";

const HeroSlider = ({ products }: { products: HeroSlide[] }) => {
  return (
    <>
      <Swiper
        pagination={{
          clickable: true,
          bulletClass: "banner-pagination-bullet",
          bulletActiveClass: "banner-pagination-bullet-active",
        }}
        modules={[Pagination]}
      >
        {products?.map((item, i) => (
          <SwiperSlide key={item.id}>
            <div className="row items-center px-7 xl:px-16">
              <div className="sm:col-12 lg:col-6 order-2 lg:order-0">
                <div className="text-center py-10 lg:py-0">
                  {item?.caption && (
                    <p className="mb-2 lg:mb-3 text-text-light dark:text-darkmode-text-light font-medium md:text-xl">
                      {item?.caption}
                    </p>
                  )}
                  <div className="row">
                    <h1 className="mb-4 lg:mb-10 col-10 sm:col-8 lg:col-12 mx-auto">
                      {item.title}
                    </h1>
                  </div>
                  {typeof item?.product != "number" &&
                    item.product != undefined && (
                      <a
                        className="btn btn-sm md:btn-lg btn-primary font-medium"
                        href={`products/${item.product?.slug}`}
                      >
                        Shop Now
                      </a>
                    )}
                </div>
              </div>

              <div className="sm:col-12 lg:col-6">
                {typeof item?.image != "number" && item?.image != undefined && (
                  <img
                    src={generatPayloadImageUrl(item.image?.url!)}
                    fetchPriority={i == 0 ? "high" : "low"}
                    loading={i == 0 ? "eager" : "lazy"}
                    className="mx-auto w-[388px] lg:w-full"
                    width={item.image?.width ?? undefined}
                    height={item.image?.height ?? undefined}
                    alt={item.image.alt}
                  />
                )}
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </>
  );
};

export default HeroSlider;
