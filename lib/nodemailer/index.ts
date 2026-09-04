"use server";

import {
  EmailContent,
  EmailProductInfo,
  NotificationType,
} from "@/types";

import nodemailer from "nodemailer";


const Notification = {
  WELCOME: "WELCOME",
  CHANGE_OF_STOCK: "CHANGE_OF_STOCK",
  LOWEST_PRICE: "LOWEST_PRICE",
  THRESHOLD_MET: "THRESHOLD_MET",
};


export async function generateEmailBody(
  product: EmailProductInfo,
  type: NotificationType
) {
  const THRESHOLD_PERCENTAGE = 40;

  const shortenedTitle =
    product.title.length > 50
      ? `${product.title.substring(0, 50)}...`
      : product.title;

  const productTitle = product.title;

  let subject = "";
  let body = "";


  /* ============================================================
     WELCOME / TRACKING EMAIL
     ============================================================ */

  switch (type) {
    case Notification.WELCOME:
      subject = `You're now tracking ${shortenedTitle}`;

      body = `
        <div
          style="
            font-family: Arial, Helvetica, sans-serif;
            max-width: 600px;
            margin: 0 auto;
            padding: 30px 20px;
            color: #222;
            background-color: #ffffff;
          "
        >

          <div
            style="
              text-align: center;
              padding-bottom: 25px;
              border-bottom: 1px solid #eeeeee;
            "
          >
            <h1
              style="
                margin: 0;
                font-size: 28px;
                color: #222222;
              "
            >
              SmartBuy 🚀
            </h1>

            <p
              style="
                margin: 8px 0 0;
                color: #777777;
                font-size: 14px;
              "
            >
              Smart shopping starts here.
            </p>
          </div>


          <div style="padding: 30px 0;">

            <h2
              style="
                margin: 0 0 15px;
                font-size: 24px;
                color: #222222;
              "
            >
              Product Tracking Started
            </h2>

            <p
              style="
                font-size: 16px;
                line-height: 1.6;
                color: #444444;
              "
            >
              You're now tracking:
            </p>

            <div
              style="
                margin: 20px 0;
                padding: 18px;
                background-color: #f7f7f7;
                border-radius: 10px;
                border: 1px solid #eeeeee;
              "
            >
              <p
                style="
                  margin: 0;
                  font-size: 17px;
                  line-height: 1.5;
                  font-weight: bold;
                  color: #222222;
                "
              >
                ${productTitle}
              </p>
            </div>

            <p
              style="
                font-size: 15px;
                line-height: 1.7;
                color: #555555;
              "
            >
              SmartBuy will keep an eye on this product and
              send you an email when an important update occurs,
              such as a price drop or a stock change.
            </p>


            <div style="text-align: center; margin: 30px 0;">

              <a
                href="${product.url}"
                target="_blank"
                rel="noopener noreferrer"
                style="
                  display: inline-block;
                  padding: 13px 24px;
                  background-color: #e43030;
                  color: #ffffff;
                  text-decoration: none;
                  border-radius: 7px;
                  font-size: 15px;
                  font-weight: bold;
                "
              >
                View Product
              </a>

            </div>


            <p
              style="
                margin-top: 30px;
                font-size: 14px;
                line-height: 1.6;
                color: #777777;
              "
            >
              You can manage the products you're tracking
              from your SmartBuy account.
            </p>

          </div>


          <div
            style="
              padding-top: 20px;
              border-top: 1px solid #eeeeee;
              text-align: center;
            "
          >
            <p
              style="
                margin: 0;
                font-size: 13px;
                color: #999999;
              "
            >
              You're receiving this email because you
              started tracking this product on SmartBuy.
            </p>

            <p
              style="
                margin: 8px 0 0;
                font-size: 13px;
                color: #999999;
              "
            >
              SmartBuy • Track prices. Shop smarter.
            </p>
          </div>

        </div>
      `;
      break;


    /* ============================================================
       BACK IN STOCK
       ============================================================ */

    case Notification.CHANGE_OF_STOCK:
      subject = `${shortenedTitle} is back in stock`;

      body = `
        <div
          style="
            font-family: Arial, Helvetica, sans-serif;
            max-width: 600px;
            margin: 0 auto;
            padding: 30px 20px;
            color: #222222;
            background-color: #ffffff;
          "
        >

          <div
            style="
              text-align: center;
              padding-bottom: 25px;
              border-bottom: 1px solid #eeeeee;
            "
          >
            <h1
              style="
                margin: 0;
                font-size: 28px;
                color: #222222;
              "
            >
              SmartBuy 🚀
            </h1>
          </div>


          <div style="padding: 30px 0;">

            <h2
              style="
                margin: 0 0 15px;
                font-size: 24px;
                color: #e43030;
              "
            >
              Back in Stock 📦
            </h2>

            <p
              style="
                font-size: 16px;
                line-height: 1.6;
                color: #444444;
              "
            >
              Good news! The product you're tracking is
              available again.
            </p>

            <div
              style="
                margin: 20px 0;
                padding: 18px;
                background-color: #f7f7f7;
                border-radius: 10px;
                border: 1px solid #eeeeee;
              "
            >
              <p
                style="
                  margin: 0;
                  font-size: 17px;
                  line-height: 1.5;
                  font-weight: bold;
                "
              >
                ${productTitle}
              </p>
            </div>

            <p
              style="
                font-size: 15px;
                line-height: 1.6;
                color: #555555;
              "
            >
              If you've been waiting for it to become
              available, now may be a good time to check it.
            </p>


            <div style="text-align: center; margin: 30px 0;">

              <a
                href="${product.url}"
                target="_blank"
                rel="noopener noreferrer"
                style="
                  display: inline-block;
                  padding: 13px 24px;
                  background-color: #e43030;
                  color: #ffffff;
                  text-decoration: none;
                  border-radius: 7px;
                  font-size: 15px;
                  font-weight: bold;
                "
              >
                View Product
              </a>

            </div>

          </div>


          <div
            style="
              padding-top: 20px;
              border-top: 1px solid #eeeeee;
              text-align: center;
            "
          >
            <p
              style="
                margin: 0;
                font-size: 13px;
                color: #999999;
              "
            >
              You're receiving this email because you're
              tracking this product on SmartBuy.
            </p>
          </div>

        </div>
      `;
      break;


    /* ============================================================
       LOWEST PRICE
       ============================================================ */

    case Notification.LOWEST_PRICE:
      subject = `Lowest Price Alert: ${shortenedTitle}`;

      body = `
        <div
          style="
            font-family: Arial, Helvetica, sans-serif;
            max-width: 600px;
            margin: 0 auto;
            padding: 30px 20px;
            color: #222222;
            background-color: #ffffff;
          "
        >

          <div
            style="
              text-align: center;
              padding-bottom: 25px;
              border-bottom: 1px solid #eeeeee;
            "
          >
            <h1
              style="
                margin: 0;
                font-size: 28px;
                color: #222222;
              "
            >
              SmartBuy 🚀
            </h1>
          </div>


          <div style="padding: 30px 0;">

            <h2
              style="
                margin: 0 0 15px;
                font-size: 24px;
                color: #e43030;
              "
            >
              Lowest Price Alert 📉
            </h2>

            <p
              style="
                font-size: 16px;
                line-height: 1.6;
                color: #444444;
              "
            >
              Great news! The product you're tracking has
              reached its lowest recorded price on SmartBuy.
            </p>

            <div
              style="
                margin: 20px 0;
                padding: 18px;
                background-color: #f7f7f7;
                border-radius: 10px;
                border: 1px solid #eeeeee;
              "
            >
              <p
                style="
                  margin: 0;
                  font-size: 17px;
                  line-height: 1.5;
                  font-weight: bold;
                "
              >
                ${productTitle}
              </p>
            </div>

            <p
              style="
                font-size: 15px;
                line-height: 1.6;
                color: #555555;
              "
            >
              This could be a good opportunity to check
              the current price.
            </p>


            <div style="text-align: center; margin: 30px 0;">

              <a
                href="${product.url}"
                target="_blank"
                rel="noopener noreferrer"
                style="
                  display: inline-block;
                  padding: 13px 24px;
                  background-color: #e43030;
                  color: #ffffff;
                  text-decoration: none;
                  border-radius: 7px;
                  font-size: 15px;
                  font-weight: bold;
                "
              >
                View Product
              </a>

            </div>

          </div>


          <div
            style="
              padding-top: 20px;
              border-top: 1px solid #eeeeee;
              text-align: center;
            "
          >
            <p
              style="
                margin: 0;
                font-size: 13px;
                color: #999999;
              "
            >
              You're receiving this email because you're
              tracking this product on SmartBuy.
            </p>
          </div>

        </div>
      `;
      break;


    /* ============================================================
       DISCOUNT THRESHOLD
       ============================================================ */

    case Notification.THRESHOLD_MET:
      subject = `Discount Alert: ${shortenedTitle}`;

      body = `
        <div
          style="
            font-family: Arial, Helvetica, sans-serif;
            max-width: 600px;
            margin: 0 auto;
            padding: 30px 20px;
            color: #222222;
            background-color: #ffffff;
          "
        >

          <div
            style="
              text-align: center;
              padding-bottom: 25px;
              border-bottom: 1px solid #eeeeee;
            "
          >
            <h1
              style="
                margin: 0;
                font-size: 28px;
                color: #222222;
              "
            >
              SmartBuy 🚀
            </h1>
          </div>


          <div style="padding: 30px 0;">

            <h2
              style="
                margin: 0 0 15px;
                font-size: 24px;
                color: #e43030;
              "
            >
              Discount Alert 🏷️
            </h2>

            <p
              style="
                font-size: 16px;
                line-height: 1.6;
                color: #444444;
              "
            >
              The product you're tracking is now available
              at a discount of more than
              <strong>${THRESHOLD_PERCENTAGE}%</strong>.
            </p>

            <div
              style="
                margin: 20px 0;
                padding: 18px;
                background-color: #f7f7f7;
                border-radius: 10px;
                border: 1px solid #eeeeee;
              "
            >
              <p
                style="
                  margin: 0;
                  font-size: 17px;
                  line-height: 1.5;
                  font-weight: bold;
                "
              >
                ${productTitle}
              </p>
            </div>

            <p
              style="
                font-size: 15px;
                line-height: 1.6;
                color: #555555;
              "
            >
              It may be worth checking the product while
              the discount is available.
            </p>


            <div style="text-align: center; margin: 30px 0;">

              <a
                href="${product.url}"
                target="_blank"
                rel="noopener noreferrer"
                style="
                  display: inline-block;
                  padding: 13px 24px;
                  background-color: #e43030;
                  color: #ffffff;
                  text-decoration: none;
                  border-radius: 7px;
                  font-size: 15px;
                  font-weight: bold;
                "
              >
                View Product
              </a>

            </div>

          </div>


          <div
            style="
              padding-top: 20px;
              border-top: 1px solid #eeeeee;
              text-align: center;
            "
          >
            <p
              style="
                margin: 0;
                font-size: 13px;
                color: #999999;
              "
            >
              You're receiving this email because you're
              tracking this product on SmartBuy.
            </p>
          </div>

        </div>
      `;
      break;


    default:
      throw new Error("Invalid notification type.");
  }


  return {
    subject,
    body,
  };
}


/* ============================================================
   GMAIL TRANSPORTER
   ============================================================ */

const transporter = nodemailer.createTransport({
  service: "gmail",

  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});


/* ============================================================
   SEND EMAIL
   ============================================================ */

export const sendEmail = async (
  emailContent: EmailContent,
  sendTo: string[]
) => {
  if (!process.env.EMAIL_USER) {
    throw new Error("EMAIL_USER is not configured.");
  }

  if (!process.env.EMAIL_PASS) {
    throw new Error("EMAIL_PASS is not configured.");
  }

  const mailOptions = {
    from: `"SmartBuy" <${process.env.EMAIL_USER}>`,
    to: sendTo,
    html: emailContent.body,
    subject: emailContent.subject,
  };


  try {
    const info =
      await transporter.sendMail(mailOptions);

    console.log(
      "Email sent:",
      info.messageId
    );

    return {
      success: true,
      messageId: info.messageId,
    };

  } catch (error) {

    console.error(
      "Email sending failed:",
      error
    );

    throw new Error(
      "Unable to send email. Please check your Gmail configuration."
    );
  }
};