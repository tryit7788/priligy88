import React, { useEffect, useRef, useState } from "react";
import {
  HiOutlineArrowNarrowLeft,
  HiOutlineArrowNarrowRight,
} from "react-icons/hi";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { Navigation, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import SkeletonCategory from "./loadings/skeleton/SkeletonCategory";
import type { ProductCategory } from "payload_app";
import { generatPayloadImageUrl } from "@/lib/utils";

const CollectionsSlider = ({
  collections,
}: {
  collections: {
    count: number;
    category: ProductCategory;
  }[];
}) => {
  const [_, setInit] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [collectionsData, setCollectionsData] = useState<typeof collections>(
    [],
  );
  const [loadingCollectionsData, setLoadingCollectionsData] = useState(true);

  const prevRef = useRef(null);
  const nextRef = useRef(null);

  useEffect(() => {
    setCollectionsData(collections);
    setLoadingCollectionsData(false);
  }, [collections]);

  if (loadingCollectionsData) {
    return <SkeletonCategory />;
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Swiper
        modules={[Pagination, Navigation]}
        // navigation={true}
        slidesPerView={2}
        spaceBetween={10}
        breakpoints={{
          640: {
            slidesPerView: 2,
            spaceBetween: 20,
          },
          768: {
            slidesPerView: 3,
            spaceBetween: 24,
          },
          1024: {
            slidesPerView: 3,
            spaceBetween: 24,
          },
        }}
        navigation={{
          prevEl: prevRef.current,
          nextEl: nextRef.current,
        }}
        //trigger a re-render by updating the state on swiper initialization
        onInit={() => setInit(true)}
      >
        {collectionsData?.map((item) => {
          const {
            category: { featuredImage, name, slug },
            count,
          } = item;
          if (typeof featuredImage == "number" || featuredImage == undefined) {
            return null;
          }
          return (
            <SwiperSlide key={slug}>
              <div className="text-center relative">
                <img
                  src={generatPayloadImageUrl(featuredImage?.url!)}
                  width={featuredImage.width ?? undefined}
                  height={featuredImage.height ?? undefined}
                  alt={featuredImage.alt}
                  className="h-[150px] md:h-[250px] lg:h-[306px] xl:h-[400px] object-cover object-center rounded-md"
                />
                <div className="py-6">
                  <h3 className="mb-2 font-medium h4">
                    <a
                      className="after:absolute after:inset-0"
                      href={`/products?c=${slug}`}
                    >
                      {name}
                    </a>
                  </h3>
                  <p className="text-text-light dark:text-darkmode-text-light text-xs md:text-xl">
                    {count} items
                  </p>
                </div>
              </div>
            </SwiperSlide>
          );
        })}

        <div
          className={`hidden md:block w-full absolute top-[33%] z-10 px-4 text-text-dark ${
            isHovered
              ? "opacity-100 transition-opacity duration-300 ease-in-out"
              : "opacity-0 transition-opacity duration-300 ease-in-out"
          }`}
        >
          <div
            ref={prevRef}
            className="p-2 lg:p-3 rounded-md bg-body cursor-pointer shadow-sm absolute left-4"
          >
            <HiOutlineArrowNarrowLeft size={24} />
          </div>
          <div
            ref={nextRef}
            className="p-2 lg:p-3 rounded-md bg-body cursor-pointer shadow-sm absolute right-4"
          >
            <HiOutlineArrowNarrowRight size={24} />
          </div>
        </div>
      </Swiper>
    </div>
  );
};

export default CollectionsSlider;
