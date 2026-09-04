"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

import { addProductToTracking } from "@/lib/actions";


type ModalProps = {
  productId: string;
};


const Modal = ({ productId }: ModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);


  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setMessage("");
    setSuccess(false);
    setIsSubmitting(true);

    try {
      const result =
        await addProductToTracking(productId);

      if (result?.success) {
        setSuccess(true);
        setMessage(
          result.message ||
            "Product added to your tracking list."
        );
      } else {
        setMessage(
          result?.message ||
            "Unable to track this product."
        );
      }
    } catch (error: any) {
      setMessage(
        error?.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };


  const closeModal = () => {
    setIsOpen(false);
    setMessage("");
    setSuccess(false);
  };


  return (
    <>
      {/* Track Product Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="btn w-full bg-primary text-white"
      >
        Track Product
      </button>


      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">

          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60"
            onClick={closeModal}
          />


          {/* Modal */}
          <div className="relative z-50 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">

            {!success ? (
              <>
                <h2 className="text-2xl font-semibold">
                  Track This Product
                </h2>

                <p className="mt-3 text-gray-500">
                  Track this product and receive price
                  alerts at your account email.
                </p>


                <p className="mt-4 rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
                  Your signed-in email will automatically
                  be used for price alerts.
                </p>


                {message && (
                  <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                    {message}
                  </div>
                )}


                <form
                  onSubmit={handleSubmit}
                  className="mt-6 flex flex-col gap-3"
                >
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full rounded-lg bg-primary px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmitting
                      ? "Tracking..."
                      : "Start Tracking"}
                  </button>


                  {message.includes(
                    "sign in"
                  ) && (
                    <Link
                      href="/sign-in"
                      onClick={closeModal}
                      className="w-full rounded-lg border border-gray-200 px-5 py-3 text-center font-semibold"
                    >
                      Sign In
                    </Link>
                  )}


                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={isSubmitting}
                    className="w-full rounded-lg px-5 py-3 font-semibold text-gray-600"
                  >
                    Cancel
                  </button>
                </form>
              </>
            ) : (
              <>
                <div className="text-center">

                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl">
                    ✓
                  </div>


                  <h2 className="mt-4 text-2xl font-semibold">
                    Product Tracked
                  </h2>


                  <p className="mt-3 text-gray-500">
                    {message}
                  </p>


                  <p className="mt-3 text-sm text-gray-500">
                    You can manage your tracked products
                    from your Currently Tracking page.
                  </p>


                  <div className="mt-6 flex flex-col gap-3">

                    <Link
                      href="/tracking"
                      onClick={closeModal}
                      className="w-full rounded-lg bg-primary px-5 py-3 text-center font-semibold text-white"
                    >
                      View Currently Tracking
                    </Link>


                    <button
                      type="button"
                      onClick={closeModal}
                      className="w-full rounded-lg px-5 py-3 font-semibold text-gray-600"
                    >
                      Continue Browsing
                    </button>

                  </div>

                </div>
              </>
            )}

          </div>

        </div>
      )}
    </>
  );
};


export default Modal;