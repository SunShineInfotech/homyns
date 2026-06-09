import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ConfirmProvider } from "@/lib/confirm";

import Dashboard from "./pages/Dashboard";
import CreateQuotation from "./pages/CreateQuotation";
import QuotationHistory from "./pages/QuotationHistory";
import Customers from "./pages/Customers";
import CustomerAddresses from "./pages/CustomerAddresses";
import ClientDetails from "./pages/ClientDetails";
import Packages from "./pages/Packages";
import Items from "./pages/Items";
import RawMaterials from "./pages/RawMaterials";
import Rooms from "./pages/Rooms";
import States from "./pages/States";
import Cities from "./pages/Cities";
import Areas from "./pages/Areas";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Register from "./pages/Register";
import PublicQuotationView from "./pages/PublicQuotationView";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <ConfirmProvider>
          <Toaster />
          <Sonner />
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/create-quotation" element={<CreateQuotation />} />
            <Route path="/quotations" element={<QuotationHistory />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/customer-addresses" element={<CustomerAddresses />} />
            <Route path="/client-details" element={<ClientDetails />} />
            <Route path="/packages" element={<Packages />} />
            <Route path="/items" element={<Items />} />
            <Route path="/raw-materials" element={<RawMaterials />} />
            <Route path="/rooms" element={<Rooms />} />
            <Route path="/states" element={<States />} />
            <Route path="/cities" element={<Cities />} />
            <Route path="/areas" element={<Areas />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/quotation/view/:id" element={<PublicQuotationView />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ConfirmProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
