import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { applyCompanyTheme } from "./lib/company-theme";

try {
  const companyData = localStorage.getItem("company_data");
  if (companyData) applyCompanyTheme(JSON.parse(companyData));
} catch {
  // Ignore malformed cached company data and use the default theme.
}

createRoot(document.getElementById("root")!).render(<App />);
