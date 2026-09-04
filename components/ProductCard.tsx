import { Product } from "@/types";
import Image from "next/image";
import Link from "next/link";
import React from "react";

interface Props {
  product: Product;
}

const ProductCard = ({ product }: Props) => {
  const hasDiscount =
    product.originalPrice > product.currentPrice;

  const discountPercentage = hasDiscount
    ? Math.round(
        ((product.originalPrice - product.currentPrice) /
          product.originalPrice) *
          100
      )
    : 0;

  const hasPriceDrop =
    product.priceHistory &&
    product.priceHistory.length > 1 &&
    product.currentPrice <
      product.priceHistory[
        product.priceHistory.length - 2
      ].price;

  return (
    <Link
      href={`/products/${product._id}`}
      className="product-card"
    >
      {/* PRODUCT IMAGE */}
      <div className="product-card_img-container relative">
        <Image
          src={product.image}
          alt={product.title}
          width={200}
          height={200}
          className="product-card_img"
        />

        {hasPriceDrop && (
          <span className="absolute left-3 top-3 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-primary">
            Price Drop
          </span>
        )}
      </div>

      {/* PRODUCT DETAILS */}
      <div className="flex flex-col gap-3">
        <h3 className="product-title">
          {product.title}
        </h3>

        {/* PRICE */}
        <div className="flex items-end justify-between gap-3">
          <div className="flex flex-col">
            <p className="text-xl font-bold text-black">
              {product.currency}{" "}
              {product.currentPrice.toLocaleString()}
            </p>

            {hasDiscount && (
              <p className="text-sm text-gray-400 line-through">
                {product.currency}{" "}
                {product.originalPrice.toLocaleString()}
              </p>
            )}
          </div>

          {hasDiscount && (
            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">
              {discountPercentage}% OFF
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;