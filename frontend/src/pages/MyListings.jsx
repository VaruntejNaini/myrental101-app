import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";

export default function MyListings() {
  const navigate = useNavigate();
  const [isNight] = useState(() => localStorage.getItem("theme") === "night");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get("/rent/products/me")
      .then((res) => {
        setProducts(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching my products:", err);
        setLoading(false);
      });
  }, []);

  return (
    <div
      className={`min-h-screen py-10 px-4 md:px-8 transition-colors duration-500 ${
        isNight ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-800"
      }`}
      style={{ fontFamily: "'Nunito', 'Poppins', sans-serif" }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-200/20">
          <button
            onClick={() => navigate("/dashboard")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs border transition-all duration-200 cursor-pointer hover:scale-[1.03] active:scale-97 ${
              isNight
                ? "bg-slate-900 border-slate-850 text-slate-300 hover:text-white"
                : "bg-white border-slate-200 text-slate-650 hover:text-indigo-650 shadow-sm"
            }`}
          >
            ← Back to Home
          </button>
          <h1 className="text-xl font-black tracking-tight text-indigo-400">
            My Listing Dashboard
          </h1>
        </div>

        {/* Listings Display */}
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 space-y-2">
            <span className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></span>
            <p className="text-xs text-slate-400 font-bold">Retrieving your listings...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-80 text-slate-400 dark:text-zinc-600 space-y-4">
            <span className="text-6xl">📦</span>
            <p className="text-lg font-black text-slate-300 dark:text-zinc-500">No products listed yet</p>
            <p className="text-xs text-center max-w-sm leading-relaxed text-slate-450">
              When you list items for rent or buyouts, they will appear here with their live status.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((p) => {
              const statusColors = {
                ACTIVE: "text-emerald-400 bg-emerald-950/45 border-emerald-500/20",
                AUCTION_ACTIVE: "text-orange-400 bg-orange-950/45 border-orange-500/20",
                RESERVED: "text-indigo-400 bg-indigo-950/45 border-indigo-500/20",
                INACTIVE: "text-rose-400 bg-rose-950/45 border-rose-500/20",
              };

              return (
                <div
                  key={p._id}
                  className={`p-5 rounded-3xl border flex flex-col justify-between h-64 shadow transition-all duration-300 hover:shadow-xl ${
                    isNight
                      ? "bg-slate-900/60 border-slate-850 hover:border-slate-800 text-white"
                      : "bg-white border-slate-200/60 hover:border-indigo-100 text-slate-800"
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        {p.productType === "SECOND_HAND" ? "FOR SALE" : "FOR RENT"}
                      </span>
                      <span
                        className={`text-[9px] font-black tracking-wider uppercase px-2 py-0.5 rounded-full border ${
                          statusColors[p.status] || "text-slate-400 border-slate-500/20 bg-slate-950/40"
                        }`}
                      >
                        {p.status}
                      </span>
                    </div>

                    <h3 className="font-extrabold text-base tracking-tight leading-snug line-clamp-1">
                      {p.title}
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                      {p.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-200/10 mt-auto">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        Price
                      </span>
                      <span className="text-base font-black text-indigo-400">
                        ₹{p.rentalPrice}
                        <span className="text-[10px] text-slate-500 font-normal">
                          {p.productType === "SECOND_HAND" ? "" : "/day"}
                        </span>
                      </span>
                    </div>

                    <button
                      onClick={() => navigate(`/product/${p._id}`)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                        isNight
                          ? "bg-slate-850 hover:bg-slate-800 text-slate-200"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-650"
                      }`}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
