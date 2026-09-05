# SmartBuy 🛒

SmartBuy is a full-stack Amazon price tracking web application that helps users monitor product prices, save products, and receive email notifications when tracked products become cheaper.

🔗 **Live Demo:** https://smart-buy-rust.vercel.app/

---

## ✨ Features

- 🔎 Search and track Amazon products
- 📉 Monitor price changes over time
- 🔥 View recent price drops
- 📧 Receive email notifications when tracked prices decrease
- 👤 Email/password authentication
- 🔖 User-specific product bookmarks
- 🎯 User-specific tracked products
- 🛒 Direct "Buy Now" links to Amazon
- 📊 Price history with lowest, highest, and average prices
- 📱 Responsive design for desktop and mobile
- 🔐 Protected cron endpoint for automated price checking
- ☁️ Deployed on Vercel

---

## 🛠️ Tech Stack

### Frontend
- Next.js 14
- React
- TypeScript / JavaScript
- Tailwind CSS
- Headless UI

### Backend
- Next.js Server Actions
- Next.js API Routes
- Node.js
- Axios
- Cheerio

### Database
- MongoDB Atlas
- Mongoose

### Authentication
- NextAuth.js
- Credentials authentication
- bcryptjs
- JWT-based sessions

### Email
- Nodemailer
- Gmail SMTP

### Deployment
- Vercel
- GitHub

---

## 🏗️ Project Architecture

```text
SmartBuy
│
├── app/
│   ├── api/
│   │   ├── auth/
│   │   └── cron/
│   ├── bookmarks/
│   ├── products/
│   ├── profile/
│   ├── sign-in/
│   ├── sign-up/
│   └── tracking/
│
├── components/
│   ├── Navbar
│   ├── Searchbar
│   ├── ProductCard
│   ├── ProductActions
│   └── PriceInfoCard
│
├── lib/
│   ├── actions/
│   ├── models/
│   ├── scraper/
│   ├── nodemailer/
│   ├── auth.ts
│   └── mongoose.ts
│
├── public/
│   └── assets/
│
├── types/
│
└── next.config.js