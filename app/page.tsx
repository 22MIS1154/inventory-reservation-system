"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function Home() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [expiresAt, setExpiresAt] =
    useState<string | null>(null);

  const [timeLeft, setTimeLeft] =
    useState("");

  async function fetchProducts() {
    try {
      const res = await fetch("/api/products");

      const data = await res.json();

      setProducts(data);
    } catch (error) {
      console.error(error);

      toast.error(
        "Failed to fetch products"
      );
    }
  }

  useEffect(() => {
    fetchProducts();

    const interval = setInterval(() => {
      fetchProducts();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Countdown timer
  useEffect(() => {
    if (!expiresAt) return;

    const timer = setInterval(() => {
      const now = new Date().getTime();

      const expiry =
        new Date(expiresAt).getTime();

      const difference = expiry - now;

      if (difference <= 0) {
        setTimeLeft("Expired");

        clearInterval(timer);

        return;
      }

      const seconds = Math.floor(
        (difference / 1000) % 60
      );

      const minutes = Math.floor(
        (difference / 1000 / 60) % 60
      );

      setTimeLeft(
        `${String(minutes).padStart(
          2,
          "0"
        )}:${String(seconds).padStart(
          2,
          "0"
        )}`
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [expiresAt]);

  async function reserveProduct(
    productId: number,
    warehouseName: string
  ) {
    try {
      setLoading(true);

      const res = await fetch(
        "/api/reserve",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            productId,
            warehouseName,
          }),
        }
      );

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message);

        setExpiresAt(data.expiresAt);

        localStorage.setItem(
          "reservationId",
          data.reservation.id
        );
      } else {
        toast.error(data.error);
      }

      await fetchProducts();
    } catch (error) {
      console.error(error);

      toast.error("Reservation failed");
    } finally {
      setLoading(false);
    }
  }

  async function confirmReservation() {
    try {
      const reservationId =
        localStorage.getItem(
          "reservationId"
        );

      if (!reservationId) {
        toast.error(
          "No reservation found"
        );

        return;
      }

      const res = await fetch(
        `/api/reservations/${reservationId}/confirm`,
        {
          method: "POST",
        }
      );

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message);

        setExpiresAt(null);

        localStorage.removeItem(
          "reservationId"
        );
      } else {
        toast.error(data.error);
      }

      await fetchProducts();
    } catch (error) {
      console.error(error);

      toast.error(
        "Failed to confirm reservation"
      );
    }
  }

  async function cancelReservation() {
    try {
      const reservationId =
        localStorage.getItem(
          "reservationId"
        );

      if (!reservationId) {
        toast.error(
          "No reservation found"
        );

        return;
      }

      const res = await fetch(
        `/api/reservations/${reservationId}/release`,
        {
          method: "POST",
        }
      );

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message);

        setExpiresAt(null);

        localStorage.removeItem(
          "reservationId"
        );
      } else {
        toast.error(data.error);
      }

      await fetchProducts();
    } catch (error) {
      console.error(error);

      toast.error(
        "Failed to cancel reservation"
      );
    }
  }

  async function releaseExpiredReservations() {
    try {
      const res = await fetch(
        "/api/release-expired",
        {
          method: "POST",
        }
      );

      const data = await res.json();

      toast.success(
        `${data.message} (${data.count})`
      );

      await fetchProducts();
    } catch (error) {
      console.error(error);

      toast.error(
        "Failed to release reservations"
      );
    }
  }

  return (
    <main className="min-h-screen bg-gray-100 p-10">
      <h1 className="text-4xl font-bold mb-4 text-center">
        Inventory System
      </h1>

      {/* Countdown */}
      {expiresAt && (
        <div className="mb-6 text-center">
          <p className="text-lg font-semibold text-red-600">
            Reservation expires in:
            {" "}
            {timeLeft}
          </p>
        </div>
      )}

      {/* Confirm + Cancel Buttons */}
      {expiresAt && (
        <div className="flex justify-center gap-4 mb-6">
          <button
            onClick={
              confirmReservation
            }
            className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg"
          >
            Confirm Reservation
          </button>

          <button
            onClick={
              cancelReservation
            }
            className="bg-gray-700 hover:bg-gray-800 text-white px-5 py-2 rounded-lg"
          >
            Cancel Reservation
          </button>
        </div>
      )}

      {/* Release button */}
      <div className="flex justify-center mb-8">
        <button
          onClick={
            releaseExpiredReservations
          }
          className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-lg transition"
        >
          Release Expired Reservations
        </button>
      </div>

      {/* Product cards */}
      <div className="grid gap-6">
        {products.map((product) => (
          <div
            key={product.id}
            className="bg-white p-6 rounded-2xl shadow-lg"
          >
            <h2 className="text-2xl font-semibold mb-4">
              {product.name}
            </h2>

            <div className="space-y-4">
              {product.inventory.map(
                (
                  item: any,
                  index: number
                ) => (
                  <div
                    key={index}
                    className="bg-gray-50 p-4 rounded-xl border"
                  >
                    <p>
                      <strong>
                        Warehouse:
                      </strong>{" "}
                      {item.warehouse}
                    </p>

                    <p>
                      <strong>
                        Total Stock:
                      </strong>{" "}
                      {item.totalStock}
                    </p>

                    <p>
                      <strong>
                        Reserved Stock:
                      </strong>{" "}
                      {item.reservedStock}
                    </p>

                    <p>
                      <strong>
                        Available Stock:
                      </strong>{" "}
                      {
                        item.availableStock
                      }
                    </p>

                    <button
                      onClick={() =>
                        reserveProduct(
                          product.id,
                          item.warehouse
                        )
                      }
                      disabled={
                        loading ||
                        item.availableStock <=
                          0
                      }
                      className="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition disabled:bg-gray-400"
                    >
                      {loading
                        ? "Processing..."
                        : item.availableStock <=
                          0
                        ? "Out of Stock"
                        : "Reserve"}
                    </button>
                  </div>
                )
              )}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}