
"use client";

import { useState } from "react";
import { signIn, signUp } from "./actions";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { message: string };
}) {
  const [view, setView] = useState("sign-in");

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800">
            {view === "sign-in" ? "Sign In to BridgeAI" : "Create an Account"}
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            {view === "sign-in"
              ? "Enter your details to access your account"
              : "Please provide your details to get started"}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setView("sign-in")}
            className={`w-1/2 py-3 text-sm font-medium text-center ${
              view === "sign-in"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setView("sign-up")}
            className={`w-1/2 py-3 text-sm font-medium text-center ${
              view === "sign-up"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Sign Up
          </button>
        </div>

        {view === "sign-in" ? (
          <form className="space-y-6" action={signIn}>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-gray-700"
              >
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full px-4 py-2 mt-2 text-gray-700 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-gray-700"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="w-full px-4 py-2 mt-2 text-gray-700 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                placeholder="••••••••"
              />
            </div>
            <button className="w-full px-4 py-2 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
              Sign In
            </button>
          </form>
        ) : (
          <form className="space-y-6" action={signUp}>
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-semibold text-gray-700"
              >
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="w-full px-4 py-2 mt-2 text-gray-700 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                placeholder="your_username"
              />
            </div>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-gray-700"
              >
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full px-4 py-2 mt-2 text-gray-700 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-gray-700"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="w-full px-4 py-2 mt-2 text-gray-700 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                placeholder="••••••••"
              />
            </div>
            <button className="w-full px-4 py-2 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
              Sign Up
            </button>
          </form>
        )}

        {searchParams?.message && (
          <p className="p-4 mt-4 text-center text-green-700 bg-green-100 rounded-lg">
            {searchParams.message}
          </p>
        )}
      </div>
    </div>
  );
}
