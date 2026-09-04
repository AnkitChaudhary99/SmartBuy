import Link from "next/link";
import Image from "next/image";

import {
  getCurrentUserTracking,
  removeProductFromTracking,
} from "@/lib/actions";


const TrackingPage = async () => {
  const products =
    await getCurrentUserTracking();


  return (
    <main className="min-h-screen bg-white px-6 py-10">

      <div className="container mx-auto">

        {/* ==================================================
            HEADER
            ================================================== */}

        <div className="mb-10">

          <h1 className="text-3xl font-bold">
            Currently Tracking
          </h1>

          <p className="mt-2 text-gray-500">
            Products you're currently monitoring
            for price changes.
          </p>

        </div>


        {/* ==================================================
            NO PRODUCTS
            ================================================== */}

        {products.length === 0 ? (

          <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 px-6 py-16 text-center">

            <Image
              src="/assets/icons/price-tag.svg"
              alt="No tracked products"
              width={60}
              height={60}
            />

            <h2 className="mt-6 text-xl font-semibold">
              You're not tracking any products yet.
            </h2>

            <p className="mt-2 max-w-md text-gray-500">
              Find a product you like and click
              Track to start receiving price
              change notifications.
            </p>

            <Link
              href="/"
              className="mt-6 rounded-lg bg-secondary px-6 py-3 font-semibold text-white hover:opacity-90"
            >
              Find Products
            </Link>

          </div>

        ) : (

          /* ==================================================
             PRODUCT GRID
             ================================================== */

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">

            {products.map((product: any) => (

              <div
                key={product._id}
                className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
              >

                {/* ==================================================
                    PRODUCT IMAGE
                    ================================================== */}

                <div className="relative flex h-64 items-center justify-center bg-gray-50 p-6">

                  {product.image ? (
                    <Image
                      src={product.image}
                      alt={product.title}
                      width={240}
                      height={240}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <div className="text-gray-400">
                      No image available
                    </div>
                  )}

                </div>


                {/* ==================================================
                    PRODUCT INFORMATION
                    ================================================== */}

                <div className="p-5">

                  <h2 className="line-clamp-2 text-lg font-semibold">
                    {product.title}
                  </h2>


                  {/* ==================================================
                      CURRENT PRICE
                      ================================================== */}

                  <div className="mt-4">

                    <p className="text-sm text-gray-500">
                      Current Price
                    </p>

                    <p className="mt-1 text-2xl font-bold">
                      ₹{product.currentPrice}
                    </p>

                  </div>


                  {/* ==================================================
                      ACTIONS
                      ================================================== */}

                  <div className="mt-5 flex gap-3">

                    {/* View Product */}

                    <Link
                      href={`/products/${product._id}`}
                      className="flex-1 rounded-lg border border-secondary px-4 py-3 text-center font-semibold text-secondary hover:bg-gray-50"
                    >
                      View Product
                    </Link>


                    {/* Remove Tracking */}

                    <form
                      action={removeProductFromTracking.bind(
                        null,
                        product._id.toString()
                      )}
                      className="flex-1"
                    >

                      <button
                        type="submit"
                        className="w-full rounded-lg border border-red-500 px-4 py-3 font-semibold text-red-500 hover:bg-red-50"
                      >
                        Remove Tracking
                      </button>

                    </form>

                  </div>

                </div>

              </div>

            ))}

          </div>

        )}

      </div>

    </main>
  );
};


export default TrackingPage;