"use client";

import Image from "next/image";
import Link from "next/link";
import { getSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const Navbar = () => {
  const router = useRouter();

  const navIcons = [
    {
      src: "/assets/icons/search.svg",
      alt: "search",
      href: "/",
    },
    {
      src: "/assets/icons/bookmark.svg",
      alt: "bookmarks",
      href: "/bookmarks",
    },
  ];

  const handleUserClick = async () => {
    try {
      const session = await getSession();

      if (session?.user) {
        router.push("/profile");
      } else {
        router.push("/sign-in");
      }
    } catch (error) {
      console.error("Session check failed:", error);
      router.push("/sign-in");
    }
  };

  return (
    <header className="w-full">
      <nav className="nav">

        {/* LOGO */}
        <Link
          href="/"
          className="flex items-center gap-1"
        >
          <Image
            src="/assets/icons/logo.svg"
            width={27}
            height={27}
            alt="SmartBuy logo"
          />

          <p className="nav-logo">
            Smart
            <span className="text-primary">
              Buy
            </span>
          </p>
        </Link>

        {/* NAVIGATION ICONS */}
        <div className="flex items-center gap-5">

          {/* SEARCH + BOOKMARKS */}
          {navIcons.map((icon) => (
            <Link
              key={icon.alt}
              href={icon.href}
              aria-label={icon.alt}
              className="cursor-pointer"
            >
              <Image
                src={icon.src}
                alt={icon.alt}
                width={28}
                height={28}
                className="object-contain"
              />
            </Link>
          ))}

          {/* USER */}
          <button
            type="button"
            onClick={handleUserClick}
            aria-label="Profile"
            className="cursor-pointer"
          >
            <Image
              src="/assets/icons/user.svg"
              alt="Profile"
              width={28}
              height={28}
              className="object-contain"
            />
          </button>

        </div>

      </nav>
    </header>
  );
};

export default Navbar;