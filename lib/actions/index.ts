"use server";

import { revalidatePath } from "next/cache";

import { getServerSession } from "next-auth";

import Product from "../models/product.model";
import UserModel from "../models/user.model";

import { connectToDB } from "../mongoose";

import { scrapeAmazonProduct } from "../scraper";

import {
  getAveragePrice,
  getHighestPrice,
  getLowestPrice,
} from "../utils";

import {
  generateEmailBody,
  sendEmail,
} from "../nodemailer";

import { authOptions } from "../auth";


/* ============================================================
   SCRAPE AND STORE PRODUCT
   ============================================================ */

export async function scrapeAndStoreProduct(
  productUrl: string
) {
  if (!productUrl) {
    return null;
  }

  try {
    await connectToDB();

    const scrapedProduct =
      await scrapeAmazonProduct(productUrl);

    if (!scrapedProduct) {
      throw new Error(
        "Unable to scrape this Amazon product."
      );
    }

    console.log(
      "Amazon product scraped successfully:",
      {
        title: scrapedProduct.title,
        currentPrice: scrapedProduct.currentPrice,
        originalPrice: scrapedProduct.originalPrice,
        currency: scrapedProduct.currency,
      }
    );

    const existingProduct =
      await Product.findOne({
        url: scrapedProduct.url,
      });

    let priceHistory = [];

    if (existingProduct) {
      const existingHistory =
        Array.isArray(
          existingProduct.priceHistory
        )
          ? existingProduct.priceHistory.map(
              (entry: any) => ({
                price: entry.price,
                date: entry.date,
              })
            )
          : [];

      priceHistory = [
        ...existingHistory,
        {
          price: scrapedProduct.currentPrice,
          date: new Date(),
        },
      ];
    } else {
      priceHistory = [
        {
          price: scrapedProduct.currentPrice,
          date: new Date(),
        },
      ];
    }

    const productData = {
      url: scrapedProduct.url,
      currency: scrapedProduct.currency,
      image: scrapedProduct.image,
      title: scrapedProduct.title,
      currentPrice: scrapedProduct.currentPrice,
      originalPrice: scrapedProduct.originalPrice,

      priceHistory,

      lowestPrice:
        getLowestPrice(priceHistory),

      highestPrice:
        getHighestPrice(priceHistory),

      averagePrice:
        getAveragePrice(priceHistory),

      discountRate:
        scrapedProduct.discountRate,

      description:
        scrapedProduct.description,

      category:
        scrapedProduct.category,

      reviewsCount:
        scrapedProduct.reviewsCount,

      isOutOfStock:
        scrapedProduct.isOutOfStock,
    };

    /*
      IMPORTANT:

      Use $set instead of replacing the entire MongoDB document.

      This means existing fields such as `users` are preserved.
    */

    const newProduct =
      await Product.findOneAndUpdate(
        {
          url: scrapedProduct.url,
        },
        {
          $set: productData,
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        }
      );

    if (!newProduct) {
      throw new Error(
        "Failed to save the product."
      );
    }

    revalidatePath(
      `/products/${newProduct._id}`
    );

    /*
      IMPORTANT:

      Return a plain JSON object instead of a raw
      Mongoose document.

      This prevents the:
      "Maximum call stack size exceeded"
      error in the Server Action.
    */

    return JSON.parse(
      JSON.stringify(newProduct)
    );

  } catch (error: any) {
    console.log(
      "Failed to create/update product:",
      error
    );

    throw new Error(
      error?.message ||
        "Failed to create/update product."
    );
  }
}


/* ============================================================
   GET PRODUCT BY ID
   ============================================================ */

export async function getProductById(
  productId: string
) {
  try {
    await connectToDB();

    const product =
      await Product.findOne({
        _id: productId,
      });

    if (!product) {
      return null;
    }

    return product;

  } catch (error) {
    console.log(
      "Failed to get product:",
      error
    );

    return null;
  }
}


/* ============================================================
   GET ALL PRODUCTS
   ============================================================ */

export async function getAllProducts() {
  try {
    await connectToDB();

    const products =
      await Product.find();

    return products;

  } catch (error: any) {
    console.log(
      "Failed to get all products:",
      error
    );

    return [];
  }
}


/* ============================================================
   GET SIMILAR PRODUCTS
   ============================================================ */

export async function getSimilarProducts(
  productId: string
) {
  try {
    await connectToDB();

    const currentProduct =
      await Product.findById(productId);

    if (!currentProduct) {
      return null;
    }

    const similarProducts =
      await Product.find({
        _id: {
          $ne: productId,
        },
      }).limit(3);

    return similarProducts;

  } catch (error) {
    console.log(
      "Failed to get similar products:",
      error
    );

    return [];
  }
}


/* ============================================================
   ADD USER EMAIL TO PRODUCT
   ============================================================ */

export async function addUserEmailToProduct(
  productId: string,
  userEmail: string
) {
  try {
    const email =
      userEmail
        .trim()
        .toLowerCase();

    if (!productId) {
      return {
        success: false,
        message:
          "Product ID is missing.",
      };
    }

    if (!email) {
      return {
        success: false,
        message:
          "Please enter your email address.",
      };
    }

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return {
        success: false,
        message:
          "Please enter a valid email address.",
      };
    }

    await connectToDB();

    const product =
      await Product.findById(
        productId
      );

    if (!product) {
      return {
        success: false,
        message:
          "Product could not be found.",
      };
    }

    const userExists =
      product.users?.some(
        (user: any) =>
          user.email
            .toLowerCase() ===
          email
      );

    if (userExists) {
      return {
        success: true,
        alreadyTracking: true,
        message:
          "This email is already tracking this product.",
      };
    }

    product.users.push({
      email,
    });

    await product.save();

    const emailContent =
      await generateEmailBody(
        product,
        "WELCOME"
      );

    await sendEmail(
      emailContent,
      [email]
    );

    revalidatePath(
      `/products/${productId}`
    );

    return {
      success: true,
      alreadyTracking: false,
      message:
        "You're now tracking this product! Check your email for confirmation.",
    };

  } catch (error: any) {
    console.log(
      "Failed to add user email:",
      error
    );

    return {
      success: false,
      message:
        error?.message ||
        "Something went wrong while setting up price tracking.",
    };
  }
}


/* ============================================================
   REGISTER USER
   ============================================================ */

export async function registerUser(
  name: string,
  email: string,
  password: string
) {
  try {
    const cleanName =
      name.trim();

    const cleanEmail =
      email.trim().toLowerCase();

    if (!cleanName) {
      return {
        success: false,
        message:
          "Please enter your name.",
      };
    }

    if (!cleanEmail) {
      return {
        success: false,
        message:
          "Please enter your email address.",
      };
    }

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(cleanEmail)) {
      return {
        success: false,
        message:
          "Please enter a valid email address.",
      };
    }

    if (!password) {
      return {
        success: false,
        message:
          "Please enter a password.",
      };
    }

    if (password.length < 6) {
      return {
        success: false,
        message:
          "Password must be at least 6 characters long.",
      };
    }

    await connectToDB();

    const existingUser =
      await UserModel.findOne({
        email: cleanEmail,
      });

    if (existingUser) {
      return {
        success: false,
        message:
          "An account with this email already exists.",
      };
    }

    const bcrypt =
      await import("bcryptjs");

    const hashedPassword =
      await bcrypt.hash(
        password,
        12
      );

    await UserModel.create({
      name: cleanName,
      email: cleanEmail,
      password: hashedPassword,
      bookmarkedProducts: [],
      trackedProducts: [],
    });

    return {
      success: true,
      message:
        "Account created successfully.",
    };

  } catch (error: any) {
    console.log(
      "Failed to register user:",
      error
    );

    return {
      success: false,
      message:
        error?.message ||
        "Something went wrong while creating your account.",
    };
  }
}


/* ============================================================
   ADD PRODUCT TO CURRENT USER'S TRACKING
   ============================================================ */

export async function addProductToTracking(
  productId: string
) {
  try {
    const session =
      await getServerSession(
        authOptions
      );

    if (!session?.user?.id) {
      return {
        success: false,
        message:
          "Please sign in to track products.",
      };
    }

    if (!productId) {
      return {
        success: false,
        message:
          "Product ID is missing.",
      };
    }

    await connectToDB();

    const product =
      await Product.findById(
        productId
      );

    if (!product) {
      return {
        success: false,
        message:
          "Product could not be found.",
      };
    }

    const user =
      await UserModel.findById(
        session.user.id
      );

    if (!user) {
      return {
        success: false,
        message:
          "User account could not be found.",
      };
    }

    const alreadyTracking =
      user.trackedProducts.some(
        (trackedProductId) =>
          trackedProductId.toString() ===
          productId
      );

    if (alreadyTracking) {
      return {
        success: true,
        alreadyTracking: true,
        message:
          "You're already tracking this product.",
      };
    }

    user.trackedProducts.push(
      product._id
    );

    await user.save();

    /*
      Keep the existing email-alert system connected.
    */

    const userEmail =
      user.email.toLowerCase();

    const emailAlreadyExists =
      product.users?.some(
        (trackedUser: any) =>
          trackedUser.email
            .toLowerCase() ===
          userEmail
      );

    if (!emailAlreadyExists) {
      product.users.push({
        email: userEmail,
      });

      await product.save();

      const emailContent =
        await generateEmailBody(
          product,
          "WELCOME"
        );

      await sendEmail(
        emailContent,
        [userEmail]
      );
    }

    revalidatePath(
      `/products/${productId}`
    );

    revalidatePath(
      "/tracking"
    );

    return {
      success: true,
      alreadyTracking: false,
      message:
        "You're now tracking this product!",
    };

  } catch (error: any) {
    console.log(
      "Failed to add product to tracking:",
      error
    );

    return {
      success: false,
      message:
        error?.message ||
        "Something went wrong while tracking this product.",
    };
  }
}


/* ============================================================
   REMOVE PRODUCT FROM CURRENT USER'S TRACKING
   ============================================================ */

export const removeProductFromTracking = async (
  productId: string
) => {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    throw new Error(
      "Please sign in to manage tracked products."
    );
  }

  await connectToDB();

  const email = session.user.email
    .trim()
    .toLowerCase();

  const user = await UserModel.findOne({ email });

  if (!user) {
    throw new Error("User account not found.");
  }

  // Remove product from the user's tracking list
  user.trackedProducts =
    user.trackedProducts.filter(
      (id) => id.toString() !== productId
    );

  await user.save();

  // Remove the user's email from the product's
  // notification list as well.
  const product = await Product.findById(productId);

  if (product) {
    product.users =
      product.users.filter(
        (entry: any) =>
          entry.email?.trim().toLowerCase() !== email
      );

    await product.save();
  }

  revalidatePath("/tracking");
  revalidatePath(`/products/${productId}`);

  return {
    success: true,
    message: "Product removed from tracking.",
  };
};


/* ============================================================
   GET CURRENT USER'S TRACKED PRODUCTS
   ============================================================ */

export async function getCurrentUserTracking() {
  try {
    const session =
      await getServerSession(
        authOptions
      );

    if (!session?.user?.id) {
      return [];
    }

    await connectToDB();

    const user =
      await UserModel.findById(
        session.user.id
      ).populate(
        "trackedProducts"
      );

    if (!user) {
      return [];
    }

    return JSON.parse(
      JSON.stringify(
        user.trackedProducts
      )
    );

  } catch (error) {
    console.log(
      "Failed to get current user tracking:",
      error
    );

    return [];
  }
}


/* ============================================================
   ADD PRODUCT TO CURRENT USER'S BOOKMARKS
   ============================================================ */

export async function addProductToBookmarks(
  productId: string
) {
  try {
    const session =
      await getServerSession(
        authOptions
      );

    if (!session?.user?.id) {
      return {
        success: false,
        message:
          "Please sign in to bookmark products.",
      };
    }

    if (!productId) {
      return {
        success: false,
        message:
          "Product ID is missing.",
      };
    }

    await connectToDB();

    const product =
      await Product.findById(
        productId
      );

    if (!product) {
      return {
        success: false,
        message:
          "Product could not be found.",
      };
    }

    const user =
      await UserModel.findById(
        session.user.id
      );

    if (!user) {
      return {
        success: false,
        message:
          "User account could not be found.",
      };
    }

    const alreadyBookmarked =
      user.bookmarkedProducts.some(
        (bookmarkedProductId) =>
          bookmarkedProductId.toString() ===
          productId
      );

    if (alreadyBookmarked) {
      return {
        success: true,
        alreadyBookmarked: true,
        message:
          "This product is already bookmarked.",
      };
    }

    user.bookmarkedProducts.push(
      product._id
    );

    await user.save();

    revalidatePath(
      "/bookmarks"
    );

    revalidatePath(
      `/products/${productId}`
    );

    return {
      success: true,
      alreadyBookmarked: false,
      message:
        "Product added to bookmarks.",
    };

  } catch (error: any) {
    console.log(
      "Failed to add product to bookmarks:",
      error
    );

    return {
      success: false,
      message:
        error?.message ||
        "Something went wrong while bookmarking the product.",
    };
  }
}


/* ============================================================
   REMOVE PRODUCT FROM CURRENT USER'S BOOKMARKS
   ============================================================ */

export async function removeProductFromBookmarks(
  productId: string
) {
  try {
    const session =
      await getServerSession(
        authOptions
      );

    if (!session?.user?.id) {
      return {
        success: false,
        message:
          "Please sign in to manage your bookmarks.",
      };
    }

    if (!productId) {
      return {
        success: false,
        message:
          "Product ID is missing.",
      };
    }

    await connectToDB();

    const user =
      await UserModel.findById(
        session.user.id
      );

    if (!user) {
      return {
        success: false,
        message:
          "User account could not be found.",
      };
    }

    const wasBookmarked =
      user.bookmarkedProducts.some(
        (bookmarkedProductId) =>
          bookmarkedProductId.toString() ===
          productId
      );

    if (!wasBookmarked) {
      return {
        success: true,
        message:
          "This product is not bookmarked.",
      };
    }

    user.bookmarkedProducts =
      user.bookmarkedProducts.filter(
        (bookmarkedProductId) =>
          bookmarkedProductId.toString() !==
          productId
      );

    await user.save();

    revalidatePath(
      "/bookmarks"
    );

    revalidatePath(
      `/products/${productId}`
    );

    return {
      success: true,
      message:
        "Product removed from bookmarks.",
    };

  } catch (error: any) {
    console.log(
      "Failed to remove product from bookmarks:",
      error
    );

    return {
      success: false,
      message:
        error?.message ||
        "Something went wrong while removing the bookmark.",
    };
  }
}


/* ============================================================
   GET CURRENT USER'S BOOKMARKS
   ============================================================ */

export async function getCurrentUserBookmarks() {
  try {
    const session =
      await getServerSession(
        authOptions
      );

    if (!session?.user?.id) {
      return [];
    }

    await connectToDB();

    const user =
      await UserModel.findById(
        session.user.id
      ).populate(
        "bookmarkedProducts"
      );

    if (!user) {
      return [];
    }

    return JSON.parse(
      JSON.stringify(
        user.bookmarkedProducts
      )
    );

  } catch (error) {
    console.log(
      "Failed to get current user bookmarks:",
      error
    );

    return [];
  }
}


/* ============================================================
   GET PRODUCTS WITH A PRICE DROP
   ============================================================ */

export const getPriceDropProducts =
  async () => {
    try {
      await connectToDB();

      const products =
        await Product.find({})
          .sort({
            updatedAt: -1,
          })
          .lean();

      const priceDropProducts =
        products.filter(
          (product: any) => {
            const history =
              product.priceHistory ||
              [];

            if (history.length < 2) {
              return false;
            }

            const latestPrice =
              history[
                history.length - 1
              ]?.price;

            const previousPrice =
              history[
                history.length - 2
              ]?.price;

            if (
              typeof latestPrice !==
                "number" ||
              typeof previousPrice !==
                "number"
            ) {
              return false;
            }

            return (
              latestPrice <
              previousPrice
            );
          }
        );

      return JSON.parse(
        JSON.stringify(
          priceDropProducts
        )
      );

    } catch (error) {
      console.log(
        "Error fetching price drop products:",
        error
      );

      return [];
    }
  };