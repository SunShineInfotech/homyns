// src/App.tsx
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ConfirmProvider } from "@/lib/confirm";
import { lazy, Suspense, useEffect, useState } from "react";

import CountdownGate from "./components/Countdowngate";

import CreateQuotation from "./pages/CreateQuotation";
import StepClient from "./pages/quotation/StepClient";
import StepPackage from "./pages/quotation/StepPackage";
import StepRooms from "./pages/quotation/StepRooms";
import StepItems from "./pages/quotation/StepItems";
import StepSummary from "./pages/quotation/StepSummary";
import StepGenerate from "./pages/quotation/StepGenerate";

// Lead & Followup Pages
import AllLeads from "./pages/Leads/AllLeads";
import MyLeads from "./pages/Leads/MyLeads";
import LeadForm from "./pages/Leads/LeadForm";
import LeadView from "./pages/Leads/LeadView";
import AllFollowups from "./pages/Followups/AllFollowups";
import MyFollowups from "./pages/Followups/MyFollowups";
import TodayFollowups from "./pages/Followups/TodayFollowups";
import TransferLeads from "./pages/Leads/TransferLeads";
import FollowupView from "./pages/Followups/FollowupView";

// Master Pages
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
import CustomerWalletPage from "./pages/CustomerWalletPage";
import CustomerAddresses from "./pages/CustomerAddresses";
import ClientDetails from "./pages/ClientDetails";
import Packages from "./pages/Packages";
import PackageForm from "./pages/PackageForm";
import Items from "./pages/Items";
import RawMaterials from "./pages/RawMaterials";
import RawMaterialForm from "./pages/RawMaterialForm";
import LowStockReport from "./pages/LowStockReport";
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
import HowToUse from "./pages/HowToUse";
import Welcome from "./pages/Welcome";
import QuotationCartPage from "./pages/QuotationCart";
import QuotationCartDetail from "./pages/QuotationCartDetail";
import { VendorsPage, VendorFormPage, VendorTransactionsPage, PurchasesPage, PurchaseReturnsPage, PurchasePaymentsPage, PaymentRemindersPage } from "./pages/VendorPurchasing";
import PurchaseOrderPage from "./pages/PurchaseOrderPage";
import InvoiceView from "./pages/InvoiceView";
import { AccountTransactionReportPage, ExpenseCategoriesPage, FinanceAccountsPage, FinanceAccountTransferPage, OtherExpensesPage, OtherIncomePage, OtherExpenseFormPage, OtherIncomeFormPage, TransactionReportsPage } from "./pages/Finance";
import { AllAttendancePage, AttendanceReportPage, AttendanceSheetPage, MyAttendancePage } from "./pages/Attendance";
const Create3DQuotationPage = lazy(() => import("./pages/Create3DQuotation"));
const StockModulePage = lazy(() => import("./pages/StockModulePage"));

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
  const basename = import.meta.env.VITE_BASE_PATH || '/interior_designer/build_v2/'

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter basename={basename}>
          <ConfirmProvider>
            <Toaster />
            <Sonner />

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

              <Route
                path="/welcome"
                element={
                  <ProtectedRoute>
                    <Welcome />
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

              {/* Quotation Routes */}
              <Route
                path="/quotation-cart"
                element={<ProtectedRoute><QuotationCartPage /></ProtectedRoute>}
              />
              <Route
                path="/quotation-cart/:id"
                element={<ProtectedRoute><QuotationCartDetail /></ProtectedRoute>}
              />
              <Route
                path="/quotations"
                element={
                  <ProtectedRoute>
                    <QuotationHistory />
                  </ProtectedRoute>
                }
              />

              {/* Vendor and purchasing */}
              <Route path="/create-3d-quotation" element={<ProtectedRoute><Suspense fallback={<LoadingScreen />}><Create3DQuotationPage /></Suspense></ProtectedRoute>} />
              <Route path="/create-3d-quotation/:planId" element={<ProtectedRoute><Suspense fallback={<LoadingScreen />}><Create3DQuotationPage /></Suspense></ProtectedRoute>} />
              <Route path="/vendors" element={<ProtectedRoute><VendorsPage /></ProtectedRoute>} />
              <Route path="/vendors/new" element={<ProtectedRoute><VendorFormPage /></ProtectedRoute>} />
              <Route path="/vendors/:vendorId/edit" element={<ProtectedRoute><VendorFormPage /></ProtectedRoute>} />
              <Route path="/vendors/:vendorId/transactions" element={<ProtectedRoute><VendorTransactionsPage /></ProtectedRoute>} />
              <Route path="/payment-reminders" element={<ProtectedRoute><PaymentRemindersPage /></ProtectedRoute>} />
              <Route path="/purchase-orders" element={<ProtectedRoute><PurchaseOrderPage /></ProtectedRoute>} />
              <Route path="/purchase-orders/new" element={<ProtectedRoute><PurchaseOrderPage /></ProtectedRoute>} />
              <Route path="/purchase-orders/:id" element={<ProtectedRoute><PurchaseOrderPage /></ProtectedRoute>} />
              <Route path="/purchase" element={<ProtectedRoute><PurchasesPage /></ProtectedRoute>} />
              <Route path="/purchase/new" element={<ProtectedRoute><PurchasesPage /></ProtectedRoute>} />
              <Route path="/purchase/:purchaseId/edit" element={<ProtectedRoute><PurchasesPage /></ProtectedRoute>} />
              <Route path="/purchases" element={<Navigate to="/purchase" replace />} />
              <Route path="/purchase-returns" element={<ProtectedRoute><PurchaseReturnsPage /></ProtectedRoute>} />
              <Route path="/purchase-payments" element={<ProtectedRoute><PurchasePaymentsPage /></ProtectedRoute>} />
              <Route path="/finance/expense-categories" element={<ProtectedRoute><ExpenseCategoriesPage /></ProtectedRoute>} />
              <Route path="/finance/accounts" element={<ProtectedRoute><FinanceAccountsPage /></ProtectedRoute>} />
              <Route path="/finance/account-transfer" element={<ProtectedRoute><FinanceAccountTransferPage /></ProtectedRoute>} />
              <Route path="/finance/transaction-reports" element={<ProtectedRoute><TransactionReportsPage /></ProtectedRoute>} />
              <Route path="/reports/transactions" element={<ProtectedRoute><AccountTransactionReportPage /></ProtectedRoute>} />
              <Route path="/reports/low-stock" element={<ProtectedRoute><LowStockReport /></ProtectedRoute>} />
              <Route path="/invoice/view/:id" element={<ProtectedRoute><InvoiceView /></ProtectedRoute>} />
              <Route path="/finance/expenses" element={<ProtectedRoute><OtherExpensesPage /></ProtectedRoute>} />
              <Route path="/finance/expenses/new" element={<ProtectedRoute><OtherExpenseFormPage /></ProtectedRoute>} />
              <Route path="/finance/expenses/:transactionId/edit" element={<ProtectedRoute><OtherExpenseFormPage /></ProtectedRoute>} />
              <Route path="/finance/income" element={<ProtectedRoute><OtherIncomePage /></ProtectedRoute>} />
              <Route path="/finance/income/new" element={<ProtectedRoute><OtherIncomeFormPage /></ProtectedRoute>} />
              <Route path="/finance/income/:transactionId/edit" element={<ProtectedRoute><OtherIncomeFormPage /></ProtectedRoute>} />
              <Route path="/stock/warehouses" element={<ProtectedRoute><Suspense fallback={<LoadingScreen />}><StockModulePage /></Suspense></ProtectedRoute>} />
              <Route path="/stock/in" element={<ProtectedRoute><Suspense fallback={<LoadingScreen />}><StockModulePage /></Suspense></ProtectedRoute>} />
              <Route path="/stock/out" element={<ProtectedRoute><Suspense fallback={<LoadingScreen />}><StockModulePage /></Suspense></ProtectedRoute>} />
              <Route path="/stock/transfer" element={<ProtectedRoute><Suspense fallback={<LoadingScreen />}><StockModulePage /></Suspense></ProtectedRoute>} />
              <Route path="/stock/ledger" element={<ProtectedRoute><Suspense fallback={<LoadingScreen />}><StockModulePage /></Suspense></ProtectedRoute>} />
              <Route path="/stock/all" element={<ProtectedRoute><Suspense fallback={<LoadingScreen />}><StockModulePage /></Suspense></ProtectedRoute>} />
              <Route path="/attendance/my" element={<ProtectedRoute><MyAttendancePage /></ProtectedRoute>} />
              <Route path="/attendance/all" element={<ProtectedRoute><AllAttendancePage /></ProtectedRoute>} />
              <Route path="/attendance/sheet" element={<ProtectedRoute><AttendanceSheetPage /></ProtectedRoute>} />
              <Route path="/attendance/report" element={<ProtectedRoute><AttendanceReportPage /></ProtectedRoute>} />
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

              {/* Client Routes */}
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
                path="/customers/:clientId/transactions"
                element={
                  <ProtectedRoute>
                    <CustomerWalletPage />
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

              {/* ═══════════════════════════════════════════════════════
                  LEAD & FOLLOWUP ROUTES - UPDATED
                  ═══════════════════════════════════════════════════════ */}

              {/* Lead Routes */}
              <Route
                path="/my-leads"
                element={
                  <ProtectedRoute>
                    <MyLeads />
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

              {/* Followup Routes */}
              <Route
                path="/my-followups"
                element={
                  <ProtectedRoute>
                    <MyFollowups />
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
                path="/today-followups"
                element={
                  <ProtectedRoute>
                    <TodayFollowups />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/followup/view/:id"
                element={
                  <ProtectedRoute>
                    <FollowupView />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/followup/form"
                element={
                  <ProtectedRoute>
                    <FollowupView />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/followup/form/:id"
                element={
                  <ProtectedRoute>
                    <FollowupView />
                  </ProtectedRoute>
                }
              />

              {/* Transfer Route */}
              <Route
                path="/transfer"
                element={
                  <ProtectedRoute>
                    <TransferLeads />
                  </ProtectedRoute>
                }
              />

              {/* ═══════════════════════════════════════════════════════
                  MASTER ROUTES
                  ═══════════════════════════════════════════════════════ */}

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

              {/* Location Routes */}
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

              {/* Settings & Profile */}
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

              {/* How To Use */}
              <Route
                path="/HowToUse"
                element={
                  <ProtectedRoute>
                    <HowToUse />
                  </ProtectedRoute>
                }
              />

              {/* 404 Route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ConfirmProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
