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

/*
 * Extract the Amazon ASIN from common Amazon product URLs.
 *
 * Examples:
 * /dp/B0GTVZT5X1
 * /gp/product/B0GTVZT5X1
 * /gp/aw/d/B0GTVZT5X1
 */
function extractAsin(url: string): string | undefined {
  const match = url.match(
    /(?:\/dp\/|\/gp\/product\/|\/gp\/aw\/d\/)([A-Z0-9]{10})(?:[/?]|$)/i
  );

  return match?.[1]?.toUpperCase();
}

/*
 * Remove tracking/query parameters from an Amazon product URL.
 *
 * We only keep the actual product path because Amazon's long tracking
 * parameters are unnecessary for scraping.
 */
function cleanAmazonUrl(url: string): string {
  try {
    const parsed = new URL(url);

    const asin = extractAsin(url);

    if (asin) {
      return `https://www.amazon.in/dp/${asin}`;
    }

    parsed.search = "";

    return parsed.toString();
  } catch {
    return url;
  }
}

/*
 * Build several Amazon URL variants.
 *
 * Amazon sometimes responds differently depending on the product
 * endpoint being requested.
 */
function getAmazonUrlCandidates(
  originalUrl: string
): string[] {
  const asin = extractAsin(originalUrl);

  if (!asin) {
    return [cleanAmazonUrl(originalUrl)];
  }

  return [
    `https://www.amazon.in/dp/${asin}`,
    `https://www.amazon.in/gp/product/${asin}`,
    `https://www.amazon.in/gp/aw/d/${asin}`,
  ];
}

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36",

  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",

  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:142.0) Gecko/20100101 Firefox/142.0",
];

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/*
 * Try to retrieve the Amazon page.
 *
 * We retry temporary server responses because Amazon can occasionally
 * return 503/500/429 responses even when the product itself is valid.
 */
async function fetchAmazonPage(
  url: string
): Promise<{ html: string; finalUrl: string } | undefined> {
  const candidates = getAmazonUrlCandidates(url);

  console.log("Amazon URL candidates:");

  for (const candidate of candidates) {
    console.log(candidate);
  }

  for (let candidateIndex = 0; candidateIndex < candidates.length; candidateIndex++) {
    const candidateUrl = candidates[candidateIndex];

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(
          `Trying Amazon URL ${candidateIndex + 1}/${candidates.length}, attempt ${attempt}/3`
        );

        const userAgent =
          USER_AGENTS[(attempt - 1) % USER_AGENTS.length];

        const response = await axios.get(candidateUrl, {
          timeout: 20000,

          /*
           * Don't let Axios immediately throw on 429/500/503.
           * We want to inspect the response and retry it ourselves.
           */
          validateStatus: () => true,

          headers: {
            "User-Agent": userAgent,

            Accept:
              "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",

            "Accept-Language":
              "en-IN,en-US;q=0.9,en;q=0.8",

            "Accept-Encoding":
              "gzip, deflate, br",

            Referer:
              "https://www.amazon.in/",

            Connection:
              "keep-alive",

            "Upgrade-Insecure-Requests":
              "1",

            "Cache-Control":
              "max-age=0",

            Pragma:
              "no-cache",

            "Sec-Fetch-Dest":
              "document",

            "Sec-Fetch-Mode":
              "navigate",

            "Sec-Fetch-Site":
              "same-origin",

            "Sec-Fetch-User":
              "?1",

            "sec-ch-ua":
              '"Chromium";v="142", "Google Chrome";v="142", "Not_A Brand";v="99"',

            "sec-ch-ua-mobile":
              "?0",

            "sec-ch-ua-platform":
              '"Windows"',
          },
        });

        console.log(
          `Amazon response status: ${response.status}`
        );

        console.log(
          `Amazon final URL: ${response.request?.res?.responseUrl || candidateUrl}`
        );

        const contentType =
          response.headers?.["content-type"] || "unknown";

        console.log(
          `Amazon content type: ${contentType}`
        );

        const responseData =
          typeof response.data === "string"
            ? response.data
            : "";

        console.log(
          `Amazon response length: ${responseData.length}`
        );

        /*
         * Successful HTML response.
         */
        if (
          response.status >= 200 &&
          response.status < 300 &&
          responseData.length > 1000
        ) {
          console.log(
            `Amazon request succeeded on attempt ${attempt}.`
          );

          return {
            html: responseData,
            finalUrl:
              response.request?.res?.responseUrl ||
              candidateUrl,
          };
        }

        /*
         * Amazon sometimes returns a 503 page.
         */
        if (
          response.status === 429 ||
          response.status === 500 ||
          response.status === 502 ||
          response.status === 503 ||
          response.status === 504
        ) {
          console.log(
            `Amazon returned temporary/server status ${response.status}.`
          );

          if (attempt < 3) {
            const delay = attempt * 1500;

            console.log(
              `Waiting ${delay}ms before retry...`
            );

            await sleep(delay);

            continue;
          }

          console.log(
            `All retries exhausted for ${candidateUrl}.`
          );

          continue;
        }

        /*
         * Amazon may return HTTP 200 but still give us a block/error page.
         */
        if (responseData) {
          const lowerData = responseData.toLowerCase();

          const looksBlocked =
            lowerData.includes("robot check") ||
            lowerData.includes("captcha") ||
            lowerData.includes("enter the characters") ||
            lowerData.includes("sorry, we just need to make sure you're not a robot") ||
            lowerData.includes("automated access") ||
            lowerData.includes("request was rejected");

          if (looksBlocked) {
            console.log(
              "Amazon returned a bot/block page instead of the product page."
            );
          } else {
            console.log(
              `Amazon returned unexpected HTTP status ${response.status}.`
            );
          }
        }

        /*
         * This candidate did not work.
         * Move to the next Amazon endpoint.
         */
        break;
      } catch (error: any) {
        console.log(
          `Amazon request error on attempt ${attempt}:`,
          error?.message || error
        );

        if (attempt < 3) {
          const delay = attempt * 1500;

          console.log(
            `Waiting ${delay}ms before retry...`
          );

          await sleep(delay);
        }
      }
    }
  }

  return undefined;
}

export async function scrapeAmazonProduct(url: string) {
  if (!url) return;

  try {
    console.log("========================================");
    console.log("Amazon scraper started");
    console.log("Original URL:", url);

    const cleanedUrl = cleanAmazonUrl(url);

    console.log("Clean URL:", cleanedUrl);

    const asin = extractAsin(url);

    console.log("ASIN:", asin || "not detected");

    console.log("========================================");

    /*
     * Fetch Amazon page using retries and multiple endpoint formats.
     */
    const page = await fetchAmazonPage(cleanedUrl);

    if (!page) {
      console.log(
        "Amazon did not provide a usable product page."
      );

      return;
    }

    const $ = cheerio.load(page.html);

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
        "Amazon returned HTML, but no recognizable product title was found."
      );

      console.log(
        "Page title:",
        $("title").first().text().trim()
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
      ".priceToPay .a-offscreen",

      "#corePriceDisplay_desktop_feature_div .a-price .a-offscreen",
      "#corePriceDisplay_desktop_feature_div .a-price-whole",

      "#corePrice_feature_div .a-price .a-offscreen",

      "#apex_desktop .a-price .a-offscreen",
      "#apex_desktop .a-price-whole",

      "#newBuyBoxPrice",
      "#priceblock_ourprice",
      "#priceblock_dealprice",

      "#price_inside_buybox",
    ]);

    const currentPrice =
      jsonLdCurrentPrice ?? selectorCurrentPrice;

    if (!currentPrice) {
      console.log(
        "Could not find a valid current Amazon price."
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

      ".priceBlockStrikePriceString",
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
      (page.html.includes("₹") ? "₹" : "$");

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
     *
     * Kept in scraped data for compatibility with the existing model.
     * Your UI does not need to display it.
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
      ? Number(reviewMatch[0].replace(/,/g, ""))
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
      /*
       * Store the cleaned product URL rather than Amazon's huge
       * tracking URL.
       */
      url: cleanedUrl,

      currency,

      image: image || "",

      title,

      currentPrice,

      originalPrice,

      /*
       * Start history with the real current price.
       */
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

      /*
       * Initial statistics are based on the actual current price.
       */
      lowestPrice: currentPrice,

      highestPrice: currentPrice,

      averagePrice: currentPrice,
    };

    console.log("========================================");
    console.log("Amazon product scraped successfully");
    console.log({
      asin,
      title,
      currentPrice,
      originalPrice,
      currency,
      imageFound: Boolean(image),
      outOfStock,
    });
    console.log("========================================");

    return data;
  } catch (error: any) {
    console.log(
      "Amazon scraping error:",
      error?.message || error
    );

    return;
  }
}