# SmartBuy 🛒

SmartBuy is a full-stack web application that helps users track Amazon product prices and receive email notifications when the prices of their tracked products drop.

## ✨ Features

- 🔍 Search for Amazon products using product URLs
- 💰 View current price and original price
- 📊 View price statistics including lowest, highest, and average price
- 📈 Maintain product price history
- 🔥 View recent price drops
- 📧 Receive email notifications when a tracked product gets cheaper
- 👤 Create an account and sign in using email and password
- 🔐 Secure password storage using bcrypt
- 📌 Bookmark products
- 🎯 Track products from a personal tracking dashboard
- 🛍️ Open products directly on Amazon
- ⏰ Automatically check tracked products for price changes
- 🔒 Protected cron endpoint for automated price tracking
- 📱 Responsive and clean user interface

## 🛠️ Tech Stack

### Frontend

- Next.js 14
- React
- TypeScript
- Tailwind CSS
- Headless UI

### Backend

- Next.js Server Actions
- Next.js API Routes
- MongoDB
- Mongoose
- NextAuth.js
- Axios
- Cheerio

### Email

- Nodemailer
- Gmail SMTP

## 📁 Project Structure

```text
SmartBuy/
│
├── app/
│   ├── api/
│   │   ├── auth/
│   │   └── cron/
│   │
│   ├── bookmarks/
│   ├── products/
│   ├── profile/
│   ├── sign-in/
│   ├── sign-up/
│   ├── tracking/
│   └── page.tsx
│
├── components/
│   ├── Navbar.tsx
│   ├── ProductActions.tsx
│   ├── ProductCard.tsx
│   ├── Searchbar.tsx
│   └── ...
│
├── lib/
│   ├── actions/
│   ├── models/
│   ├── nodemailer/
│   ├── scraper/
│   ├── auth.ts
│   └── mongoose.ts
│
├── types/
├── public/
├── next.config.js
├── package.json
└── README.md