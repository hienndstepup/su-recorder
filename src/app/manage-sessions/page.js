"use client";

import React from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Header from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { appApi } from "@/api/app";
import { getDeviceId } from "@/lib";

const ManageSessionsPage = () => {
  return (
    <ProtectedRoute>
      <div>ManageSessionsPage</div>
    </ProtectedRoute>
  );
};

export default ManageSessionsPage;
