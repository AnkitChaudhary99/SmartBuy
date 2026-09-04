"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";


const SignInPage = () => {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);


  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const result = await signIn(
        "credentials",
        {
          email,
          password,
          redirect: false,
        }
      );

      if (result?.error) {
        setError(result.error);
        return;
      }

      if (result?.ok) {
        router.push("/");
        router.refresh();
      }
    } catch (error: any) {
      setError(
        error?.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };


  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-6 py-12">

      <div className="w-full max-w-md">

        {/* Brand */}

        <div className="text-center mb-8">

          <h1 className="text-3xl font-bold">
            SmartBuy
          </h1>

          <p className="text-gray-500 mt-2">
            Welcome back
          </p>

        </div>


        {/* Sign In Card */}

        <div className="bg-white border border-gray-200 rounded-20 p-8 shadow-sm">

          <h2 className="text-2xl font-semibold mb-2">
            Sign In
          </h2>

          <p className="text-gray-500 mb-6">
            Sign in to manage your tracked products
            and bookmarks.
          </p>


          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-5"
          >

            {/* Email */}

            <div>

              <label
                htmlFor="email"
                className="block text-sm font-medium mb-2"
              >
                Email
              </label>

              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setError("");
                }}
                disabled={loading}
                className="w-full border border-gray-300 rounded-10 px-4 py-3 outline-none focus:border-primary disabled:bg-gray-100"
                required
              />

            </div>


            {/* Password */}

            <div>

              <label
                htmlFor="password"
                className="block text-sm font-medium mb-2"
              >
                Password
              </label>

              <div className="relative">

                <input
                  id="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setError("");
                  }}
                  disabled={loading}
                  className="w-full border border-gray-300 rounded-10 px-4 py-3 pr-20 outline-none focus:border-primary disabled:bg-gray-100"
                  required
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      !showPassword
                    )
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-primary cursor-pointer"
                >
                  {showPassword
                    ? "Hide"
                    : "Show"}
                </button>

              </div>

            </div>


            {/* Error */}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-10 px-4 py-3 text-sm">
                {error}
              </div>
            )}


            {/* Submit */}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white rounded-10 px-4 py-3 font-semibold cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading
                ? "Signing in..."
                : "Sign In"}
            </button>

          </form>


          {/* Sign Up */}

          <p className="text-center text-sm text-gray-500 mt-6">

            Don't have an account?{" "}

            <button
              type="button"
              onClick={() =>
                router.push("/sign-up")
              }
              className="text-primary font-semibold cursor-pointer"
            >
              Create Account
            </button>

          </p>

        </div>

      </div>

    </main>
  );
};


export default SignInPage;