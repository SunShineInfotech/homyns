// src/App.tsx
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ConfirmProvider } from "@/lib/confirm";
import { useEffect, useState } from "react";

import CountdownGate from "./components/Countdowngate"; // <-- NEW IMPORT

import CreateQuotation from "./pages/CreateQuotation";
import StepClient from "./pages/quotation/StepClient";
import StepPackage from "./pages/quotation/StepPackage";
import StepRooms from "./pages/quotation/StepRooms";
import StepItems from "./pages/quotation/StepItems";
import StepSummary from "./pages/quotation/StepSummary";
import StepGenerate from "./pages/quotation/StepGenerate";

import AllLeads from "./pages/Leads/AllLeads";
import MyLeads from "./pages/Leads/MyLeads";
import LeadForm from "./pages/Leads/LeadForm";
import LeadView from "./pages/Leads/LeadView";
import AllFollowups from "./pages/Followups/AllFollowups";
import MyTodayFollowup from "./pages/Followups/MyTodayFollowup";

import LeadStatus from "./pages/LeadStatus";
import LeadSource from "./pages/LeadSource";
import Terms from "./pages/Terms";
import Company from "./pages/Company";
import CompanyForm from "./pages/CompanyForm";
import Employees from "./pages/Employees";
import EmployeeForm from "./pages/EmployeeForm";
import Products from "./pages/Products";
import ProductForm from "./pages/ProductForm";
import ProductCategoryForm from "./pages/ProductCategoryForm";
import ProductCategories from "./pages/ProductCategories";
import RawMaterialTypes from "./pages/RawMaterialTypes";
import Units from "./pages/Units";
import Brands from "./pages/Brands";
import Dashboard from "./pages/Dashboard";
import QuotationView from "./pages/QuotationView";
import QuotationEdit from "./pages/QuotationEdit";
import QuotationHistory from "./pages/QuotationHistory";
import Customers from "./pages/Customers";
import CustomerAddresses from "./pages/CustomerAddresses";
import ClientDetails from "./pages/ClientDetails";
import Packages from "./pages/Packages";
import PackageForm from "./pages/PackageForm";
import Items from "./pages/Items";
import RawMaterials from "./pages/RawMaterials";
import RawMaterialForm from "./pages/RawMaterialForm";
import Rooms from "./pages/Rooms";
import RoomForm from "./pages/RoomForm";
import States from "./pages/States";
import Cities from "./pages/Cities";
import Areas from "./pages/Areas";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Register from "./pages/Register";
import PublicQuotationView from "./pages/PublicQuotationView";
import NotFound from "./pages/NotFound";

// Loading component
const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  </div>
);

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    const user = localStorage.getItem("user_data");

    if (token && user) {
      try {
        JSON.parse(user);
        setIsAuthenticated(true);
      } catch {
        setIsAuthenticated(false);
        localStorage.clear();
      }
    } else {
      setIsAuthenticated(false);
    }
  }, []);

  if (isAuthenticated === null) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

const App = () => {
  // Get basename from environment variable
  const basename = import.meta.env.VITE_BASE_PATH || "/";

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter basename={basename}>
          <ConfirmProvider>
            <Toaster />
            <Sonner />

            {/*
              CountdownGate wraps EVERYTHING below it.
              Until 12:39 PM today, every route (even /login,
              even direct URLs typed in the address bar) shows
              the countdown screen instead.
              Once 12:39 PM hits, it renders its children (the
              normal <Routes> tree), and the existing
              ProtectedRoute logic decides Dashboard vs /login.
            */}
            <CountdownGate targetHour={11} targetMinute={39} targetSecond={0}>
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route
                  path="/quotation/view/:id"
                  element={<PublicQuotationView />}
                />

                {/* Protected Routes */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Create Quotation - Nested Routes */}
                <Route
                  path="/create-quotation"
                  element={
                    <ProtectedRoute>
                      <CreateQuotation />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Navigate to="client" replace />} />
                  <Route path="client" element={<StepClient />} />
                  <Route path="package" element={<StepPackage />} />
                  <Route path="rooms" element={<StepRooms />} />
                  <Route path="items" element={<StepItems />} />
                  <Route path="summary" element={<StepSummary />} />
                  <Route path="generate" element={<StepGenerate />} />
                </Route>

                <Route
                  path="/quotations"
                  element={
                    <ProtectedRoute>
                      <QuotationHistory />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/quotation/view/:id"
                  element={
                    <ProtectedRoute>
                      <QuotationView />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/quotation/edit/:id"
                  element={
                    <ProtectedRoute>
                      <QuotationEdit />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/clients"
                  element={
                    <ProtectedRoute>
                      <Customers />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/customers"
                  element={
                    <ProtectedRoute>
                      <Customers />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/all-leads"
                  element={
                    <ProtectedRoute>
                      <AllLeads />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/my-leads"
                  element={
                    <ProtectedRoute>
                      <MyLeads />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/lead/form"
                  element={
                    <ProtectedRoute>
                      <LeadForm />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/lead/form/:id"
                  element={
                    <ProtectedRoute>
                      <LeadForm />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/lead/view/:id"
                  element={
                    <ProtectedRoute>
                      <LeadView />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/all-followups"
                  element={
                    <ProtectedRoute>
                      <AllFollowups />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/my-today-followup"
                  element={
                    <ProtectedRoute>
                      <MyTodayFollowup />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/followup/form"
                  element={
                    <ProtectedRoute>
                      <AllFollowups />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/followup/form/:id"
                  element={
                    <ProtectedRoute>
                      <AllFollowups />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/client-addresses"
                  element={
                    <ProtectedRoute>
                      <CustomerAddresses />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/customer-addresses"
                  element={
                    <ProtectedRoute>
                      <CustomerAddresses />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/client-details"
                  element={
                    <ProtectedRoute>
                      <ClientDetails />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/packages"
                  element={
                    <ProtectedRoute>
                      <Packages />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/packages/form"
                  element={
                    <ProtectedRoute>
                      <PackageForm />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/packages/form/:id"
                  element={
                    <ProtectedRoute>
                      <PackageForm />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/company"
                  element={
                    <ProtectedRoute>
                      <Company />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/company/form"
                  element={
                    <ProtectedRoute>
                      <CompanyForm />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/company/form/:id"
                  element={
                    <ProtectedRoute>
                      <CompanyForm />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/items"
                  element={
                    <ProtectedRoute>
                      <Items />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/raw-materials"
                  element={
                    <ProtectedRoute>
                      <RawMaterials />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/raw-material-types"
                  element={
                    <ProtectedRoute>
                      <RawMaterialTypes />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/lead-sources"
                  element={
                    <ProtectedRoute>
                      <LeadSource />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/lead-statuses"
                  element={
                    <ProtectedRoute>
                      <LeadStatus />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/products"
                  element={
                    <ProtectedRoute>
                      <Products />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/products/form"
                  element={
                    <ProtectedRoute>
                      <ProductForm />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/products/form/:id"
                  element={
                    <ProtectedRoute>
                      <ProductForm />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/products/view/:id"
                  element={
                    <ProtectedRoute>
                      <ProductForm />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/terms"
                  element={
                    <ProtectedRoute>
                      <Terms />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/employees"
                  element={
                    <ProtectedRoute>
                      <Employees />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/employees/form"
                  element={
                    <ProtectedRoute>
                      <EmployeeForm />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/employees/form/:id"
                  element={
                    <ProtectedRoute>
                      <EmployeeForm />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/employees/view/:id"
                  element={
                    <ProtectedRoute>
                      <EmployeeForm />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/categories"
                  element={
                    <ProtectedRoute>
                      <ProductCategories />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/categories/form"
                  element={
                    <ProtectedRoute>
                      <ProductCategoryForm />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/categories/form/:id"
                  element={
                    <ProtectedRoute>
                      <ProductCategoryForm />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/categories/view/:id"
                  element={
                    <ProtectedRoute>
                      <ProductCategoryForm />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/units"
                  element={
                    <ProtectedRoute>
                      <Units />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/brands"
                  element={
                    <ProtectedRoute>
                      <Brands />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/raw-materials/form"
                  element={
                    <ProtectedRoute>
                      <RawMaterialForm />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/raw-materials/form/:id"
                  element={
                    <ProtectedRoute>
                      <RawMaterialForm />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/raw-materials/view/:id"
                  element={
                    <ProtectedRoute>
                      <RawMaterialForm />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/rooms"
                  element={
                    <ProtectedRoute>
                      <Rooms />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/rooms/form"
                  element={
                    <ProtectedRoute>
                      <RoomForm />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/rooms/form/:id"
                  element={
                    <ProtectedRoute>
                      <RoomForm />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/rooms/view/:id"
                  element={
                    <ProtectedRoute>
                      <RoomForm />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/states"
                  element={
                    <ProtectedRoute>
                      <States />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/cities"
                  element={
                    <ProtectedRoute>
                      <Cities />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/areas"
                  element={
                    <ProtectedRoute>
                      <Areas />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <Settings />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />

                {/* 404 Route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </CountdownGate>
          </ConfirmProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
