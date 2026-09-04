import Modal from "@/components/Modal";
import PriceInfoCard from "@/components/PriceInfoCard";
import ProductActions from "@/components/ProductActions";

import {
  getProductById,
  getCurrentUserBookmarks,
} from "@/lib/actions";

import { formatNumber } from "@/lib/utils";
import { Product } from "@/types";

import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";


type Props = {
  params: {
    id: string;
  };
};


const ProductDetails = async ({
  params: { id },
}: Props) => {
  const product: Product = await getProductById(id);

  if (!product) {
    redirect("/");
  }


  const bookmarkedProducts =
    await getCurrentUserBookmarks();

  const initialBookmarked =
    bookmarkedProducts.some(
      (bookmarkedProduct: any) =>
        bookmarkedProduct._id?.toString() === id
    );


  return (
    <div className="product-container !pt-5 !pb-5">

      <div className="flex flex-col gap-8 xl:flex-row xl:items-start xl:gap-10">

        {/* ======================================================
            PRODUCT IMAGE
            ====================================================== */}

        <div className="product-image flex items-center justify-center xl:w-[45%]">

          <Image
            src={product.image}
            alt={product.title}
            width={400}
            height={400}
            className="mx-auto max-h-[360px] w-auto object-contain"
          />

        </div>


        {/* ======================================================
            PRODUCT DETAILS
            ====================================================== */}

        <div className="flex flex-1 flex-col xl:py-0">

          {/* TITLE + ACTIONS */}

          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-200 pb-4">

            <div className="flex max-w-[850px] flex-col gap-1">

              <p className="text-[22px] font-semibold leading-7 text-secondary">
                {product.title}
              </p>

              <Link
                href={product.url}
                target="_blank"
                className="text-sm text-black opacity-50 hover:opacity-80"
              >
                Visit Product
              </Link>

            </div>


            <ProductActions
              productId={id}
              productTitle={product.title}
              initialBookmarked={initialBookmarked}
            />

          </div>


          {/* ====================================================
              CURRENT PRICE
              ==================================================== */}

          <div className="flex flex-col gap-1 py-4">

            <p className="text-[32px] font-bold text-secondary">
              {product.currency}{" "}
              {formatNumber(product.currentPrice)}
            </p>

            <p className="text-[18px] text-black opacity-50 line-through">
              {product.currency}{" "}
              {formatNumber(product.originalPrice)}
            </p>

          </div>


          {/* ====================================================
              PRICE STATISTICS
              ==================================================== */}

          <div className="border-t border-gray-200 pt-4">

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

              <PriceInfoCard
                title="Current Price"
                iconSrc="/assets/icons/price-tag.svg"
                value={`${product.currency} ${formatNumber(
                  product.currentPrice
                )}`}
              />


              <PriceInfoCard
                title="Average Price"
                iconSrc="/assets/icons/chart.svg"
                value={`${product.currency} ${formatNumber(
                  product.averagePrice
                )}`}
              />


              <PriceInfoCard
                title="Highest Recorded Price"
                iconSrc="/assets/icons/arrow-up.svg"
                value={`${product.currency} ${formatNumber(
                  product.highestPrice
                )}`}
              />


              <PriceInfoCard
                title="Lowest Recorded Price"
                iconSrc="/assets/icons/arrow-down.svg"
                value={`${product.currency} ${formatNumber(
                  product.lowestPrice
                )}`}
              />

            </div>


            <p className="mt-2 text-xs text-gray-400">
              Price insights are based on SmartBuy&apos;s price
              tracking data for this product.
            </p>

          </div>


          {/* ====================================================
              TRACK PRODUCT
              ==================================================== */}

          <div className="mt-4">

            <Modal productId={id} />

          </div>


          {/* ====================================================
              BUY NOW
              ==================================================== */}

          <div className="mt-3 flex">

            <Link
              href={product.url}
              target="_blank"
              className="btn flex min-w-[180px] w-fit items-center justify-center gap-3"
            >

              <Image
                src="/assets/icons/bag.svg"
                alt="Buy"
                width={20}
                height={20}
              />

              <span className="text-base text-white">
                Buy Now
              </span>

            </Link>

          </div>

        </div>

      </div>

    </div>
  );
};


export default ProductDetails;