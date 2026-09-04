import HeroCarousel from "@/components/HeroCarousel";
import ProductCard from "@/components/ProductCard";
import Searchbar from "@/components/Searchbar";
import { getPriceDropProducts } from "@/lib/actions";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import Image from "next/image";
import Link from "next/link";

const Home = async () => {
  const priceDropProducts =
    await getPriceDropProducts();

  const session =
    await getServerSession(authOptions);

  const isLoggedIn = !!session?.user;

  const firstName =
    session?.user?.name
      ?.trim()
      .split(" ")[0] || "there";

  return (
    <>
      {/* HERO SECTION */}
      <section className="min-h-[calc(100vh-100px)] px-6 py-8 md:px-20 md:py-6">
        <div className="flex min-h-[calc(100vh-150px)] items-center gap-8 max-xl:flex-col max-xl:justify-center max-xl:py-8">

          {/* HERO CONTENT */}
          <div className="flex w-full -translate-y-14 flex-col justify-center xl:w-[56%]">

            {/* WELCOME TEXT */}
            {isLoggedIn ? (
              <p className="small-text">
                Welcome back, {firstName}

                <Image
                  src="/assets/icons/arrow-right.svg"
                  alt="arrow-right"
                  width={16}
                  height={16}
                />
              </p>
            ) : (
              <p className="small-text">
                Smart Shopping Starts Here:

                <Image
                  src="/assets/icons/arrow-right.svg"
                  alt="arrow-right"
                  width={16}
                  height={16}
                />
              </p>
            )}

            {/* HERO HEADING */}
            <h1 className="head-text !text-7xl">
              Track Prices.
              <span className="text-primary">
                {" "}Shop Smarter.
              </span>
            </h1>

            {/* DESCRIPTION */}
            <p className="mt-5 max-w-2xl text-base leading-7 text-gray-700 md:text-lg">
              Find products, track their prices, bookmark your
              favorites, and get notified when the price drops.
            </p>

            {/* SEARCH */}
            <div className="mt-8 rounded-xl ring-1 ring-gray-300">
              <Searchbar />
            </div>

            {/* LOGGED-IN SHORTCUTS */}
            {isLoggedIn && (
              <div className="mt-5 flex flex-wrap gap-3">

                <Link
                  href="/tracking"
                  className="rounded-lg bg-gray-900 px-5 py-3 font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-gray-800 hover:shadow-md"
                >
                  Currently Tracking
                </Link>

                <Link
                  href="/bookmarks"
                  className="rounded-lg bg-gray-900 px-5 py-3 font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-gray-800 hover:shadow-md"
                >
                  Bookmarked Items
                </Link>

              </div>
            )}

            {/* LOGGED-OUT CTA */}
            {!isLoggedIn && (
              <div className="mt-5 flex flex-wrap gap-3">

                <Link
                  href="/sign-up"
                  className="rounded-lg bg-gray-900 px-6 py-3 font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-gray-800 hover:shadow-md"
                >
                  Create Account
                </Link>

                <Link
                  href="/sign-in"
                  className="rounded-lg border border-gray-300 bg-white px-6 py-3 font-semibold text-gray-900 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-gray-50 hover:shadow-md"
                >
                  Sign In
                </Link>

              </div>
            )}

          </div>

          {/* HERO CAROUSEL */}
          <div className="flex w-full scale-[0.88] justify-center xl:w-[44%]">
            <HeroCarousel />
          </div>

        </div>
      </section>

      {/* PRICE DROPS */}
      <section className="trending-section">

        <div className="mb-8 flex flex-col gap-2">

          <div className="flex items-center gap-3">
            <h2 className="section-text">
              Price Drops
            </h2>

            <span className="rounded-full bg-red-50 px-3 py-1 text-sm font-semibold text-primary">
              🔥 Deals
            </span>
          </div>

          <p className="text-sm text-gray-500">
            Products whose tracked price has recently gone down.
          </p>

        </div>

        {priceDropProducts.length > 0 ? (
          <div className="flex flex-wrap gap-x-8 gap-y-16">

            {priceDropProducts.map((product: any) => (
              <ProductCard
                key={product._id}
                product={product}
              />
            ))}

          </div>
        ) : (
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-6 py-10 text-center">

            <p className="text-lg font-semibold text-gray-800">
              No recent price drops
            </p>

            <p className="mt-2 text-sm text-gray-500">
              SmartBuy will show products here when their
              tracked price goes down.
            </p>

          </div>
        )}

      </section>
    </>
  );
};

export default Home;