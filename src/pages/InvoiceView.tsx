import PublicQuotationView from "@/pages/PublicQuotationView";

/** Invoice uses the same full detail layout and print styling as quotation view. */
export default function InvoiceView() {
  return <PublicQuotationView documentType="invoice" />;
}
