"use server";

import axios from "axios";
import * as cheerio from "cheerio";
import { extractCurrency, extractDescription } from "../utils";

function parsePrice(text: string): number | undefined {
  if (!text) return undefined;

  const cleaned = text
    .replace(/[^\d.,]/g, " ")
    .trim();

  const match = cleaned.match(/\d[\d,]*(?:\.\d+)?/);

  if (!match) return undefined;

  const value = Number(match[0].replace(/,/g, ""));

  if (!Number.isFinite(value) || value <= 0) {
    return undefined;
  }

  return value;
}

function getFirstPrice(
  $: cheerio.CheerioAPI,
  selectors: string[]
): number | undefined {
  for (const selector of selectors) {
    const element = $(selector).first();

    if (!element.length) continue;

    const price = parsePrice(element.text());

    if (price !== undefined) {
      return price;
    }
  }

  return undefined;
}

function getCurrencySymbol(currencyCode?: string): string {
  switch (currencyCode) {
    case "INR":
      return "₹";
    case "USD":
      return "$";
    case "GBP":
      return "£";
    case "EUR":
      return "€";
    case "JPY":
      return "¥";
    case "CAD":
      return "C$";
    case "AUD":
      return "A$";
    default:
      return "";
  }
}

function getJsonLdProduct($: cheerio.CheerioAPI) {
  let productData: any = null;

  $("script[type='application/ld+json']").each((_, element) => {
    if (productData) return;

    try {
      const rawText = $(element).contents().text();

      if (!rawText) return;

      const parsed = JSON.parse(rawText);

      const items = Array.isArray(parsed) ? parsed : [parsed];

      for (const item of items) {
        if (item?.["@type"] === "Product") {
          productData = item;
          return;
        }

        if (Array.isArray(item?.["@graph"])) {
          const product = item["@graph"].find(
            (graphItem: any) => graphItem?.["@type"] === "Product"
          );

          if (product) {
            productData = product;
            return;
          }
        }
      }
    } catch {
      // Ignore invalid JSON-LD blocks.
    }
  });

  return productData;
}

function cleanAmazonUrl(url: string): string {
  try {
    const parsedUrl = new URL(url);

    // Keep only the important Amazon product path.
    // This removes tracking/query parameters such as pd_rd_*,
    // ref_*, encoding, etc.
    const match = parsedUrl.pathname.match(
      /\/(?:dp|gp\/product)\/([A-Z0-9]{10})/i
    );

    if (match) {
      return `https://${parsedUrl.hostname}/dp/${match[1]}`;
    }

    return url;
  } catch {
    return url;
  }
}

export async function scrapeAmazonProduct(url: string) {
  if (!url) return;

  const cleanUrl = cleanAmazonUrl(url);

  try {
    console.log("========================================");
    console.log("Amazon scraper started");
    console.log("Original URL:", url);
    console.log("Clean URL:", cleanUrl);
    console.log("========================================");

    const response = await axios.get(cleanUrl, {
      timeout: 15000,

      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36",

        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",

        "Accept-Language":
          "en-IN,en-US;q=0.9,en;q=0.8",

        "Accept-Encoding":
          "gzip, deflate, br",

        "Cache-Control":
          "no-cache",

        Pragma:
          "no-cache",

        "Upgrade-Insecure-Requests":
          "1",

        "Sec-Fetch-Dest":
          "document",

        "Sec-Fetch-Mode":
          "navigate",

        "Sec-Fetch-Site":
          "none",

        "Sec-Fetch-User":
          "?1",
      },

      maxRedirects: 5,

      validateStatus: () => true,
    });

    console.log("Amazon response status:", response.status);
    console.log(
      "Amazon final URL:",
      response.request?.res?.responseUrl || cleanUrl
    );

    console.log(
      "Amazon content type:",
      response.headers?.["content-type"] || "unknown"
    );

    const html =
      typeof response.data === "string"
        ? response.data
        : String(response.data || "");

    console.log(
      "Amazon response length:",
      html.length
    );

    /*
     * ------------------------------------------------------------
     * AMAZON RESPONSE DIAGNOSTICS
     * ------------------------------------------------------------
     */

    if (response.status !== 200) {
      console.log(
        "Amazon did not return HTTP 200."
      );

      console.log(
        "Amazon response preview:",
        html.slice(0, 500)
      );

      if (
        html.toLowerCase().includes("captcha") ||
        html.toLowerCase().includes("robot check") ||
        html.toLowerCase().includes("enter the characters you see below")
      ) {
        console.log(
          "AMAZON CAPTCHA / BOT CHECK DETECTED."
        );
      }

      if (
        response.status === 403 ||
        response.status === 503
      ) {
        console.log(
          "AMAZON IS LIKELY BLOCKING THIS SERVER REQUEST."
        );
      }

      return;
    }

    const lowerHtml = html.toLowerCase();

    if (
      lowerHtml.includes("captcha") ||
      lowerHtml.includes("robot check") ||
      lowerHtml.includes("enter the characters you see below")
    ) {
      console.log(
        "AMAZON CAPTCHA / BOT CHECK DETECTED."
      );

      console.log(
        "Response preview:",
        html.slice(0, 500)
      );

      return;
    }

    const $ = cheerio.load(html);

    /*
     * ------------------------------------------------------------
     * PRODUCT INFORMATION
     * ------------------------------------------------------------
     */

    const jsonLdProduct = getJsonLdProduct($);

    const title =
      $("#productTitle").text().trim() ||
      jsonLdProduct?.name?.toString().trim() ||
      $("h1").first().text().trim();

    if (!title) {
      console.log(
        "Amazon returned HTTP 200, but no recognizable product title was found."
      );

      console.log(
        "Response preview:",
        html.slice(0, 500)
      );

      return;
    }

    /*
     * ------------------------------------------------------------
     * CURRENT PRICE
     * ------------------------------------------------------------
     */

    let jsonLdCurrentPrice: number | undefined;

    const jsonLdOffers = Array.isArray(jsonLdProduct?.offers)
      ? jsonLdProduct.offers[0]
      : jsonLdProduct?.offers;

    if (jsonLdOffers?.price !== undefined) {
      const price = Number(
        String(jsonLdOffers.price).replace(/,/g, "")
      );

      if (Number.isFinite(price) && price > 0) {
        jsonLdCurrentPrice = price;
      }
    }

    const selectorCurrentPrice = getFirstPrice($, [
      ".priceToPay .a-price-whole",
      ".priceToPay span.a-price-whole",
      "#corePriceDisplay_desktop_feature_div .a-price .a-offscreen",
      "#corePriceDisplay_desktop_feature_div .a-price-whole",
      "#corePrice_feature_div .a-price .a-offscreen",
      "#apex_desktop .a-price .a-offscreen",
      "#apex_desktop .a-price-whole",
      "#newBuyBoxPrice",
      "#priceblock_ourprice",
      "#priceblock_dealprice",
    ]);

    const currentPrice =
      jsonLdCurrentPrice ?? selectorCurrentPrice;

    if (!currentPrice) {
      console.log(
        "Amazon page was received, but no valid current price was found."
      );

      console.log(
        "Title found:",
        title
      );

      return;
    }

    /*
     * ------------------------------------------------------------
     * ORIGINAL / MRP PRICE
     * ------------------------------------------------------------
     */

    const originalPriceCandidate = getFirstPrice($, [
      ".basisPrice .a-offscreen",
      ".a-price.a-text-price .a-offscreen",
      "#listPrice .a-offscreen",
      "#priceblock_listprice",
    ]);

    const originalPrice =
      originalPriceCandidate &&
      originalPriceCandidate >= currentPrice
        ? originalPriceCandidate
        : currentPrice;

    /*
     * ------------------------------------------------------------
     * CURRENCY
     * ------------------------------------------------------------
     */

    const pageCurrency = extractCurrency(
      $(".a-price-symbol").first()
    );

    const jsonLdCurrency =
      jsonLdOffers?.priceCurrency?.toString();

    const currency =
      pageCurrency ||
      getCurrencySymbol(jsonLdCurrency) ||
      (html.includes("₹") ? "₹" : "$");

    /*
     * ------------------------------------------------------------
     * IMAGE
     * ------------------------------------------------------------
     */

    let image: string | undefined;

    if (typeof jsonLdProduct?.image === "string") {
      image = jsonLdProduct.image;
    } else if (Array.isArray(jsonLdProduct?.image)) {
      image = jsonLdProduct.image[0];
    }

    if (!image) {
      const dynamicImageData =
        $("#landingImage").attr("data-a-dynamic-image") ||
        $("#imgBlkFront").attr("data-a-dynamic-image");

      if (dynamicImageData) {
        try {
          const imageUrls = Object.keys(
            JSON.parse(dynamicImageData)
          );

          image = imageUrls[0];
        } catch {
          // Ignore invalid image JSON.
        }
      }
    }

    if (!image) {
      image =
        $("#landingImage").attr("src") ||
        $("#imgBlkFront").attr("src");
    }

    /*
     * ------------------------------------------------------------
     * DISCOUNT
     * ------------------------------------------------------------
     */

    const discountText = $(".savingsPercentage")
      .first()
      .text()
      .trim();

    const discountRate =
      Number(discountText.replace(/[^\d.]/g, "")) || 0;

    /*
     * ------------------------------------------------------------
     * AVAILABILITY
     * ------------------------------------------------------------
     */

    const availabilityText = $("#availability")
      .text()
      .trim()
      .toLowerCase();

    const outOfStock =
      availabilityText.includes("currently unavailable") ||
      availabilityText.includes("out of stock");

    /*
     * ------------------------------------------------------------
     * RATING
     * ------------------------------------------------------------
     */

    const ratingText =
      $('[data-hook="rating-out-of-text"]')
        .first()
        .text()
        .trim() ||
      $("#acrPopover")
        .attr("title")
        ?.trim() ||
      "";

    const ratingMatch = ratingText.match(
      /(\d+(?:\.\d+)?)\s*out of/i
    );

    const stars = ratingMatch
      ? Number(ratingMatch[1])
      : Number(
          jsonLdProduct?.aggregateRating?.ratingValue
        ) || 0;

    /*
     * ------------------------------------------------------------
     * REVIEW COUNT
     * ------------------------------------------------------------
     */

    const reviewText =
      $("#acrCustomerReviewText")
        .first()
        .text()
        .trim();

    const reviewMatch = reviewText.match(/[\d,]+/);

    const reviewsCount = reviewMatch
      ? Number(
          reviewMatch[0].replace(/,/g, "")
        )
      : Number(
          jsonLdProduct?.aggregateRating?.reviewCount
        ) || 0;

    /*
     * ------------------------------------------------------------
     * DESCRIPTION
     * ------------------------------------------------------------
     */

    const description =
      extractDescription($) ||
      jsonLdProduct?.description?.toString() ||
      "";

    /*
     * ------------------------------------------------------------
     * FINAL PRODUCT DATA
     * ------------------------------------------------------------
     */

    const data = {
      url: cleanUrl,
      currency,
      image: image || "",
      title,

      currentPrice,
      originalPrice,

      priceHistory: [
        {
          price: currentPrice,
        },
      ],

      discountRate,

      category: "category",

      reviewsCount,
      stars,

      isOutOfStock: outOfStock,

      description,

      lowestPrice: currentPrice,
      highestPrice: currentPrice,
      averagePrice: currentPrice,
    };

    console.log("========================================");
    console.log("Amazon product scraped successfully:");
    console.log({
      title,
      currentPrice,
      originalPrice,
      currency,
    });
    console.log("========================================");

    return data;
  } catch (error: any) {
    console.log("========================================");
    console.log("AMAZON SCRAPING REQUEST FAILED");
    console.log("========================================");

    console.log(
      "Error message:",
      error?.message || error
    );

    console.log(
      "Error code:",
      error?.code || "unknown"
    );

    console.log(
      "HTTP status:",
      error?.response?.status || "unknown"
    );

    console.log(
      "Response content type:",
      error?.response?.headers?.["content-type"] ||
        "unknown"
    );

    if (error?.response?.data) {
      const responseData =
        typeof error.response.data === "string"
          ? error.response.data
          : JSON.stringify(error.response.data);

      console.log(
        "Amazon error response preview:",
        responseData.slice(0, 500)
      );
    }

    console.log(
      "========================================"
    );

    return;
  }
}