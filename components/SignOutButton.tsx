"use client";

import { signOut } from "next-auth/react";


const SignOutButton = () => {
  const handleSignOut = async () => {
    await signOut({
      callbackUrl: "/",
    });
  };


  return (
    <button
      type="button"
      onClick={handleSignOut}
      className="rounded-lg bg-primary px-6 py-3 font-semibold text-white transition hover:opacity-90"
    >
      Sign Out
    </button>
  );
};


export default SignOutButton;