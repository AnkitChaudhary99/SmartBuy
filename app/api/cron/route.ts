import { NextResponse } from "next/server";

import { connectToDB } from "@/lib/mongoose";
import Product from "@/lib/models/product.model";
import { scrapeAmazonProduct } from "@/lib/scraper";

import {
  getLowestPrice,
  getHighestPrice,
  getAveragePrice,
} from "@/lib/utils";

import { sendEmail } from "@/lib/nodemailer";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 300;

export async function GET(request: Request) {
  try {
    /* ================================
       CRON SECURITY
    ================================= */

    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error("CRON_SECRET is not configured.");

      return NextResponse.json(
        {
          success: false,
          message: "Cron secret is not configured.",
        },
        {
          status: 500,
        }
      );
    }

    const authorization =
      request.headers.get("authorization");

    const expectedAuthorization =
      `Bearer ${cronSecret}`;

    if (authorization !== expectedAuthorization) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        {
          status: 401,
        }
      );
    }

    /* ================================
       DATABASE
    ================================= */

    await connectToDB();

    const products = await Product.find({});

    if (!products || products.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No products found.",
        updated: 0,
        priceDrops: 0,
      });
    }

    let updatedCount = 0;
    let priceDropCount = 0;

    /* ================================
       UPDATE PRODUCTS
    ================================= */

    for (const currentProduct of products) {
      try {
        const scrapedProduct =
          await scrapeAmazonProduct(
            currentProduct.url
          );

        if (!scrapedProduct) {
          console.log(
            `Could not scrape: ${currentProduct.title}`
          );

          continue;
        }

        const previousPrice =
          Number(currentProduct.currentPrice);

        const newPrice =
          Number(scrapedProduct.currentPrice);

        if (
          !Number.isFinite(previousPrice) ||
          !Number.isFinite(newPrice) ||
          newPrice <= 0
        ) {
          console.log(
            `Invalid price for: ${currentProduct.title}`
          );

          continue;
        }

        const priceDropped =
          newPrice < previousPrice;

        if (priceDropped) {
          priceDropCount++;

          console.log(
            `PRICE DROP: ${currentProduct.title}`
          );

          console.log(
            `Previous: ${previousPrice}`
          );

          console.log(
            `New: ${newPrice}`
          );
        }

        /* ================================
           PRICE HISTORY
        ================================= */

        const existingHistory =
          Array.isArray(
            currentProduct.priceHistory
          )
            ? currentProduct.priceHistory
            : [];

        const updatedPriceHistory = [
          ...existingHistory,
        ];

        const lastHistoryEntry =
          updatedPriceHistory[
            updatedPriceHistory.length - 1
          ];

        const lastRecordedPrice =
          lastHistoryEntry
            ? Number(lastHistoryEntry.price)
            : null;

        /*
         * Make sure the previous current price
         * exists in the history before recording
         * the newly scraped price.
         */
        if (
          Number.isFinite(previousPrice) &&
          previousPrice > 0 &&
          lastRecordedPrice !== previousPrice
        ) {
          updatedPriceHistory.push({
            price: previousPrice,
            date: new Date(),
          });
        }

        /*
         * Only add a new history entry when the
         * scraped price is different from the
         * last recorded price.
         */
        const latestEntry =
          updatedPriceHistory[
            updatedPriceHistory.length - 1
          ];

        const latestRecordedPrice =
          latestEntry
            ? Number(latestEntry.price)
            : null;

        if (
          latestRecordedPrice !== newPrice
        ) {
          updatedPriceHistory.push({
            price: newPrice,
            date: new Date(),
          });
        }

        /* ================================
           UPDATE PRODUCT
        ================================= */

        currentProduct.title =
          scrapedProduct.title;

        currentProduct.currentPrice =
          newPrice;

        currentProduct.originalPrice =
          scrapedProduct.originalPrice;

        currentProduct.currency =
          scrapedProduct.currency;

        currentProduct.image =
          scrapedProduct.image;

        currentProduct.discountRate =
          scrapedProduct.discountRate;

        currentProduct.category =
          scrapedProduct.category;

        currentProduct.reviewsCount =
          scrapedProduct.reviewsCount;

        currentProduct.isOutOfStock =
          scrapedProduct.isOutOfStock;

        currentProduct.description =
          scrapedProduct.description;

        currentProduct.priceHistory =
          updatedPriceHistory;

        currentProduct.lowestPrice =
          getLowestPrice(
            updatedPriceHistory
          );

        currentProduct.highestPrice =
          getHighestPrice(
            updatedPriceHistory
          );

        currentProduct.averagePrice =
          getAveragePrice(
            updatedPriceHistory
          );

        await currentProduct.save();

        updatedCount++;

        /* ================================
           PRICE DROP EMAIL
        ================================= */

        if (
          priceDropped &&
          currentProduct.users &&
          currentProduct.users.length > 0
        ) {
          const savedEmails =
            currentProduct.users
              .map(
                (user: any) =>
                  user.email
              )
              .filter(
                (email: string) =>
                  Boolean(email)
              );

          if (savedEmails.length > 0) {
            const priceDropPercentage =
              (
                ((previousPrice - newPrice) /
                  previousPrice) *
                100
              ).toFixed(1);

            const emailContent = {
              subject:
                `Price Drop Alert: ${currentProduct.title.substring(
                  0,
                  50
                )}`,

              body: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
                  
                  <h2 style="color: #E43030;">
                    Price Drop Alert! 📉
                  </h2>

                  <p>
                    Good news! The price of
                    <strong>${currentProduct.title}</strong>
                    has dropped.
                  </p>

                  <div style="padding: 20px; margin: 20px 0; background: #f5f5f5; border-radius: 10px;">
                    
                    <p>
                      <strong>Previous Price:</strong>
                      ${currentProduct.currency}
                      ${previousPrice.toLocaleString()}
                    </p>

                    <p>
                      <strong>New Price:</strong>
                      <span style="color: #3E9242; font-size: 20px;">
                        ${currentProduct.currency}
                        ${newPrice.toLocaleString()}
                      </span>
                    </p>

                    <p>
                      <strong>You save:</strong>
                      ${currentProduct.currency}
                      ${(previousPrice - newPrice).toLocaleString()}
                      (${priceDropPercentage}%)
                    </p>

                  </div>

                  <p>
                    This might be a good time to buy it.
                  </p>

                  <p>
                    <a
                      href="${currentProduct.url}"
                      target="_blank"
                      rel="noopener noreferrer"
                      style="
                        display:inline-block;
                        padding:12px 20px;
                        background:#E43030;
                        color:white;
                        text-decoration:none;
                        border-radius:6px;
                        font-weight:bold;
                      "
                    >
                      View Product
                    </a>
                  </p>

                  <p style="color:#777;font-size:13px;">
                    You received this email because you are
                    tracking this product on SmartBuy.
                  </p>

                </div>
              `,
            };

            await sendEmail(
              emailContent,
              savedEmails
            );

            console.log(
              `Price drop email sent for: ${currentProduct.title}`
            );
          }
        }
      } catch (productError) {
        console.log(
          `Failed to update product: ${currentProduct.title}`,
          productError
        );

        continue;
      }
    }

    /* ================================
       RESPONSE
    ================================= */

    return NextResponse.json({
      success: true,
      message:
        "Price tracking completed successfully.",
      updated: updatedCount,
      priceDrops: priceDropCount,
    });
  } catch (error: any) {
    console.error(
      "Cron error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error?.message ||
          "Failed to update product prices.",
      },
      {
        status: 500,
      }
    );
  }
}