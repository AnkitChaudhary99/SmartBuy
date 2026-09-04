import Image from "next/image";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import {
  getCurrentUserTracking,
  getCurrentUserBookmarks,
} from "@/lib/actions";

import SignOutButton from "@/components/SignOutButton";


const ProfilePage = async () => {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/sign-in");
  }

  const [trackedProducts, bookmarkedProducts] =
    await Promise.all([
      getCurrentUserTracking(),
      getCurrentUserBookmarks(),
    ]);


  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">

      <div className="mx-auto max-w-5xl">

        {/* HEADER */}

        <div className="mb-8">

          <h1 className="text-4xl font-bold text-gray-900">
            My Profile
          </h1>

          <p className="mt-2 text-gray-500">
            Manage your account and saved products.
          </p>

        </div>


        {/* ACCOUNT + ACTIVITY */}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">


          {/* ACCOUNT INFORMATION */}

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

            <div className="mb-6 flex items-center gap-4">

              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-900">

                <Image
                  src="/assets/icons/user.svg"
                  alt="User"
                  width={27}
                  height={27}
                  className="brightness-0 invert"
                />

              </div>


              <div>

                <h2 className="text-xl font-semibold text-gray-900">
                  Account Information
                </h2>

                <p className="text-sm text-gray-500">
                  Your account details
                </p>

              </div>

            </div>


            <div className="space-y-5">

              <div>

                <p className="text-sm text-gray-500">
                  Name
                </p>

                <p className="mt-1 text-lg font-semibold text-gray-900">
                  {session.user.name}
                </p>

              </div>


              <div>

                <p className="text-sm text-gray-500">
                  Email
                </p>

                <p className="mt-1 break-all text-lg font-semibold text-gray-900">
                  {session.user.email}
                </p>

              </div>

            </div>

          </div>


          {/* MY ACTIVITY */}

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

            <h2 className="mb-6 text-xl font-semibold text-gray-900">
              My Activity
            </h2>


            <div className="grid grid-cols-2 gap-4">


              {/* TRACKING */}

              <Link
                href="/tracking"
                className="
                  group
                  rounded-xl
                  bg-gray-900
                  p-5
                  text-white
                  transition-all
                  duration-200
                  hover:-translate-y-1
                  hover:bg-gray-800
                  hover:shadow-lg
                "
              >

                <p className="text-3xl font-bold">
                  {trackedProducts.length}
                </p>

                <p className="mt-1 text-sm text-gray-300">
                  Currently Tracking
                </p>

              </Link>


              {/* BOOKMARKS */}

              <Link
                href="/bookmarks"
                className="
                  group
                  rounded-xl
                  bg-gray-900
                  p-5
                  text-white
                  transition-all
                  duration-200
                  hover:-translate-y-1
                  hover:bg-gray-800
                  hover:shadow-lg
                "
              >

                <p className="text-3xl font-bold">
                  {bookmarkedProducts.length}
                </p>

                <p className="mt-1 text-sm text-gray-300">
                  Bookmarked Items
                </p>

              </Link>

            </div>

          </div>

        </div>


        {/* QUICK LINKS */}

        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

          <h2 className="mb-5 text-xl font-semibold text-gray-900">
            Quick Links
          </h2>


          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">


            <Link
              href="/tracking"
              className="
                rounded-xl
                bg-gray-900
                px-5
                py-3
                text-center
                font-semibold
                text-white
                transition-all
                duration-200
                hover:-translate-y-0.5
                hover:bg-gray-800
                hover:shadow-md
              "
            >
              Currently Tracking
            </Link>


            <Link
              href="/bookmarks"
              className="
                rounded-xl
                bg-gray-900
                px-5
                py-3
                text-center
                font-semibold
                text-white
                transition-all
                duration-200
                hover:-translate-y-0.5
                hover:bg-gray-800
                hover:shadow-md
              "
            >
              Bookmarked Items
            </Link>

          </div>

        </div>


        {/* SIGN OUT */}

        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">

            <div>

              <h2 className="text-xl font-semibold text-gray-900">
                Sign Out
              </h2>

              <p className="mt-1 text-gray-500">
                Sign out of your SmartBuy account.
              </p>

            </div>


            <SignOutButton />

          </div>

        </div>

      </div>

    </main>
  );
};


export default ProfilePage;