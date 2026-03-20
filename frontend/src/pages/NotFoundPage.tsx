import React from "react";
import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
      <h1 className="text-4xl font-bold text-gray-800 mb-4">404</h1>
      <p className="text-gray-600 mb-6">Page doesn’t exist</p>

      <Link
        to="/login"
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Go to Login
      </Link>
    </div>
  );
}