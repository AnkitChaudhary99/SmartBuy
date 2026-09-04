"use client";

import { scrapeAndStoreProduct } from "@/lib/actions";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const isValidAmazonProductURL = (url: string) => {
  try {
    const parsedURL = new URL(url);
    const hostname = parsedURL.hostname.toLowerCase();

    return (
      hostname.includes("amazon.com") ||
      hostname.includes("amazon.") ||
      hostname.endsWith("amazon")
    );
  } catch {
    return false;
  }
};

const Searchbar = () => {
  const router = useRouter();

  const [searchPrompt, setSearchPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (isLoading) return;

    const trimmedURL = searchPrompt.trim();

    if (!trimmedURL) {
      alert("Please enter an Amazon product link.");
      return;
    }

    if (!isValidAmazonProductURL(trimmedURL)) {
      alert("Please provide a valid Amazon product link.");
      return;
    }

    try {
      setIsLoading(true);

      const product =
        await scrapeAndStoreProduct(trimmedURL);

      if (!product) {
        alert(
          "We couldn't fetch this product. Please check the Amazon link and try again."
        );
        return;
      }

      if (!product._id) {
        alert(
          "The product was found, but we couldn't open its product page."
        );
        return;
      }

      router.push(`/products/${product._id}`);
    } catch (error: any) {
      console.error("Product search error:", error);

      alert(
        error?.message ||
          "Something went wrong while fetching the product. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full flex-wrap gap-3"
    >
      <input
        type="text"
        value={searchPrompt}
        onChange={(event) =>
          setSearchPrompt(event.target.value)
        }
        placeholder="Paste an Amazon product link..."
        disabled={isLoading}
        className="searchbar-input flex-1 disabled:cursor-not-allowed disabled:opacity-60"
      />

      <button
        type="submit"
        disabled={
          !searchPrompt.trim() || isLoading
        }
        className="searchbar-btn min-w-[110px] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading ? "Fetching..." : "Search"}
      </button>
    </form>
  );
};

export default Searchbar;