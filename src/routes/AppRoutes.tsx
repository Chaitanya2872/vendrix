import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout.tsx";
import { DashboardPage } from "@/pages/Dashboard/DashboardPage.tsx";
import React from "react";
import { VendorsPage } from "@/pages/Vendors/VendorsPage.tsx";
import { AddVendorPage } from "@/pages/Vendors/AddVendorPage.tsx";
import { DocumentsPage } from "@/pages/Documents/DocumentsPage.tsx";
import { LoginPage } from "@/pages/Auth/LoginPage.tsx";
import { ProtectedRoute } from "@/routes/ProtectedRoute.tsx";
import { VendorProvider } from "@/contexts/VendorContext";
import { VendorCategoryProvider } from "@/contexts/VendorCategoryContext";
import { VendorCategoriesPage } from "@/pages/Settings/VendorCategoriesPage";
import { VehiclesPage } from "@/pages/Vehicles/VehiclesPage.tsx";
import { InvoicesPage } from "@/pages/Invoices/InvoicesPage.tsx";
import { UsersPage } from "@/pages/Users/UsersPage.tsx";
import { ReportsPage } from "@/pages/Reports/ReportsPage.tsx";
import { AddVehiclePage } from "@/pages/Vehicles/AddVehiclePage.tsx";
import { AddInvoicePage } from "@/pages/Invoices/AddInvoicePage.tsx";
import { InvoiceExtractionPage } from "@/pages/Invoices/InvoiceExtractionPage.tsx";
import { InvoiceReviewPage } from "@/pages/Invoices/InvoiceReviewPage.tsx";
import { PurchasesPage } from "@/pages/Procurement/PurchasesPage";
import { PurchaseFormPage } from "@/pages/Procurement/PurchaseFormPage";
import { PurchaseDetailsPage } from "@/pages/Procurement/PurchaseDetailsPage";
import { DeliveriesPage } from "@/pages/Procurement/DeliveriesPage";
import { DeliveryFormPage } from "@/pages/Procurement/DeliveryFormPage";
import { DeliveryDetailsPage } from "@/pages/Procurement/DeliveryDetailsPage";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route element={<ProtectedRoute />}>
      <Route element={<VendorProvider><VendorCategoryProvider><AppLayout /></VendorCategoryProvider></VendorProvider>}>
        <Route path="dashboard" element={<DashboardPage />} />

        <Route path="vendors" element={<VendorsPage />} />
        {/* Reachable from every picker that can come up short: the vendor
            you need not existing yet is the ordinary case, not an error. */}
        <Route path="vendors/add" element={<AddVendorPage />} />

        <Route path="vehicles" element={<VehiclesPage />} />
        <Route path="vehicles/add" element={<AddVehiclePage />} />

        <Route path="documents" element={<DocumentsPage />} />

        <Route path="invoices" element={<InvoicesPage />} />
        <Route path="invoices/add" element={<AddInvoicePage />} />
        <Route path="invoices/extract" element={<InvoiceExtractionPage />} />
        {/* Document id is the human-facing DOC-2026-000001, which is what
            the upload response hands back and what a user can read out. */}
        <Route path="invoices/review/:documentId" element={<InvoiceReviewPage />} />

        <Route path="purchases" element={<PurchasesPage />} />
        <Route path="purchases/new" element={<PurchaseFormPage />} />
        <Route path="purchases/:id" element={<PurchaseDetailsPage />} />
        <Route path="purchases/:id/edit" element={<PurchaseFormPage />} />

        <Route path="deliveries" element={<DeliveriesPage />} />
        <Route path="deliveries/new" element={<DeliveryFormPage />} />
        <Route path="deliveries/:id" element={<DeliveryDetailsPage />} />
        <Route path="deliveries/:id/edit" element={<DeliveryFormPage />} />

        <Route
          path="users"
          element={<UsersPage />}
        />

        <Route
          path="settings"
          element={<VendorCategoriesPage />}
        />

        <Route path="reports" element={<ReportsPage />} />
      </Route>
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
