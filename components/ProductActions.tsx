"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import {
  addProductToBookmarks,
  removeProductFromBookmarks,
} from "@/lib/actions";


type ProductActionsProps = {
  productId: string;
  productTitle: string;
  initialBookmarked?: boolean;
};


const ProductActions = ({
  productId,
  productTitle,
  initialBookmarked = false,
}: ProductActionsProps) => {
  const router = useRouter();

  const [bookmarked, setBookmarked] =
    useState(initialBookmarked);

  const [isBookmarking, setIsBookmarking] =
    useState(false);

  const [copied, setCopied] =
    useState(false);


  /* ============================================================
     HANDLE BOOKMARK
     ============================================================ */

  const handleBookmark = async () => {
    if (isBookmarking) return;

    setIsBookmarking(true);

    try {
      const result = bookmarked
        ? await removeProductFromBookmarks(
            productId
          )
        : await addProductToBookmarks(
            productId
          );

      if (result?.success) {
        setBookmarked(!bookmarked);

        router.refresh();
      } else {
        console.log(
          result?.message ||
            "Unable to update bookmark."
        );
      }
    } catch (error) {
      console.error(
        "Bookmark error:",
        error
      );
    } finally {
      setIsBookmarking(false);
    }
  };


  /* ============================================================
     HANDLE SHARE
     ============================================================ */

  const handleShare = async () => {
    const shareData = {
      title: productTitle,
      text: `Check out ${productTitle} on SmartBuy!`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(
          shareData
        );
      } else {
        await navigator.clipboard.writeText(
          window.location.href
        );

        setCopied(true);

        setTimeout(() => {
          setCopied(false);
        }, 2000);
      }
    } catch {
      console.log(
        "Share cancelled."
      );
    }
  };


  return (
    <div className="flex items-center gap-3">

      {/* ==================================================
          BOOKMARK
          ================================================== */}

      <button
        type="button"
        onClick={handleBookmark}
        disabled={isBookmarking}
        aria-label={
          bookmarked
            ? "Remove bookmark"
            : "Bookmark product"
        }
        className={`
          rounded-10
          p-2
          cursor-pointer
          disabled:cursor-not-allowed
          disabled:opacity-60
          ${
            bookmarked
              ? "bg-primary"
              : "bg-white-200"
          }
        `}
      >
        <Image
          src="/assets/icons/bookmark.svg"
          alt="bookmark"
          width={20}
          height={20}
        />
      </button>


      {/* ==================================================
          SHARE
          ================================================== */}

      <button
        type="button"
        onClick={handleShare}
        aria-label="Share product"
        className="
          rounded-10
          bg-white-200
          p-2
          cursor-pointer
        "
      >
        <Image
          src="/assets/icons/share.svg"
          alt="share"
          width={20}
          height={20}
        />
      </button>


      {/* ==================================================
          COPIED MESSAGE
          ================================================== */}

      {copied && (
        <span className="text-sm font-semibold text-primary-green">
          Link copied!
        </span>
      )}

    </div>
  );
};


export default ProductActions;