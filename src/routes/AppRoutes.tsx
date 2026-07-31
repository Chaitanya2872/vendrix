import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout.tsx";
import { DashboardPage } from "@/pages/Dashboard/DashboardPage.tsx";
import React from "react";

function PlaceholderPage({ title }: { title: string }) {
  return (
    <section>
      <h1 className="m-0 text-2xl font-semibold text-brand-forest">
        {title}
      </h1>

      <p className="mb-0 mt-2 text-sm text-brand-muted">
        This page is ready for implementation.
      </p>
    </section>
  );
}

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<DashboardPage />} />

        <Route
          path="vendors"
          element={<PlaceholderPage title="Vendors" />}
        />

        <Route
          path="contracts"
          element={<PlaceholderPage title="Contracts" />}
        />

        <Route
          path="documents"
          element={<PlaceholderPage title="Documents" />}
        />

        <Route
          path="users"
          element={<PlaceholderPage title="Users" />}
        />

        <Route
          path="settings"
          element={<PlaceholderPage title="Settings" />}
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
