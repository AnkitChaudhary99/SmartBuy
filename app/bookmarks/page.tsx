import Image from "next/image";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import {
  getCurrentUserBookmarks,
  removeProductFromBookmarks,
} from "@/lib/actions";


const BookmarksPage = async () => {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/sign-in");
  }

  const bookmarkedProducts =
    await getCurrentUserBookmarks();


  return (
    <main className="min-h-screen bg-white px-6 py-10">
      <div className="mx-auto max-w-6xl">

        {/* HEADER */}
        <div className="mb-10">
          <h1 className="text-4xl font-semibold">
            Bookmarked Items
          </h1>

          <p className="mt-2 text-gray-500">
            Products you have saved for later.
          </p>
        </div>


        {/* EMPTY STATE */}
        {bookmarkedProducts.length === 0 && (
          <div className="rounded-2xl border border-gray-200 bg-gray-50 px-6 py-16 text-center">

            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm">
              <Image
                src="/assets/icons/bookmark.svg"
                alt="Bookmarks"
                width={30}
                height={30}
              />
            </div>

            <h2 className="text-2xl font-semibold">
              No bookmarked products
            </h2>

            <p className="mx-auto mt-2 max-w-md text-gray-500">
              Save products you are interested in by clicking
              the bookmark button on a product page.
            </p>

            <Link
              href="/"
              className="mt-6 inline-block rounded-lg bg-gray-900 px-6 py-3 font-semibold text-white transition hover:bg-gray-700"
            >
              Browse Products
            </Link>

          </div>
        )}


        {/* BOOKMARKED PRODUCTS */}
        {bookmarkedProducts.length > 0 && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">

            {bookmarkedProducts.map(
              (product: any) => (
                <div
                  key={product._id}
                  className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >

                  {/* IMAGE */}
                  <Link
                    href={`/products/${product._id}`}
                    className="flex h-56 items-center justify-center bg-gray-50 p-6"
                  >
                    <Image
                      src={product.image}
                      alt={product.title}
                      width={220}
                      height={220}
                      className="h-full w-full object-contain"
                    />
                  </Link>


                  {/* CONTENT */}
                  <div className="flex flex-1 flex-col p-5">

                    <Link
                      href={`/products/${product._id}`}
                    >
                      <h2 className="line-clamp-2 text-lg font-semibold transition hover:text-gray-600">
                        {product.title}
                      </h2>
                    </Link>


                    <div className="mt-4">
                      <p className="text-sm text-gray-500">
                        Current Price
                      </p>

                      <p className="mt-1 text-2xl font-bold">
                        ₹ {product.currentPrice}
                      </p>
                    </div>


                    {/* BUTTONS */}
                    <div className="mt-auto flex gap-3 pt-6">

                      <Link
                        href={`/products/${product._id}`}
                        className="flex-1 rounded-lg bg-gray-900 px-4 py-3 text-center font-semibold text-white transition hover:bg-gray-700"
                      >
                        View Product
                      </Link>


                      <form
                        action={removeProductFromBookmarks.bind(
                          null,
                          product._id.toString()
                        )}
                      >
                        <button
                          type="submit"
                          className="rounded-lg border border-gray-300 px-4 py-3 font-semibold transition hover:bg-gray-100"
                        >
                          Remove
                        </button>
                      </form>

                    </div>

                  </div>

                </div>
              )
            )}

          </div>
        )}

      </div>
    </main>
  );
};


export default BookmarksPage;