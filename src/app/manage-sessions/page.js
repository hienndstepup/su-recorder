"use client";

import React, { Suspense } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Header from "@/components/Header";
import ManageSessionsPageContent from "./ManageSessionsPageContent";

const ManageSessionsPage = () => {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#2DA6A2]"></div>
              <p className="mt-2 text-gray-600">Đang tải...</p>
            </div>
          </div>
        }>
          <ManageSessionsPageContent />
        </Suspense>
      </div>
    </ProtectedRoute>
  );
};

export default ManageSessionsPage;
