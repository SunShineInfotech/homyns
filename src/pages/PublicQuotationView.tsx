import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Loader2, AlertCircle, Printer, Layers } from "lucide-react";
import { quotationService } from "@/services/quotation.service";
import { termsService } from "@/services/terms.service";
import { companyService } from "@/services/company.service";

// ─── Number to Words ────────────────────────────────────────────────────────
function numberToWords(num: number): string {
  if (num === 0) return "Zero";
  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];
  const thousands = ["", "Thousand", "Million", "Billion"];
  const cvtH = (n: number): string => {
    if (n < 20) return ones[n];
    if (n < 100)
      return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
    return (
      ones[Math.floor(n / 100)] +
      " Hundred" +
      (n % 100 ? " and " + cvtH(n % 100) : "")
    );
  };
  const cvt = (n: number): string => {
    if (n === 0) return "";
    let w = "",
      i = 0;
    while (n > 0) {
      if (n % 1000 !== 0) w = cvtH(n % 1000) + " " + thousands[i] + " " + w;
      n = Math.floor(n / 1000);
      i++;
    }
    return w.trim();
  };
  const r = Math.floor(num);
  const p = Math.round((num - r) * 100);
  return (
    cvt(r) + " Rupees" + (p > 0 ? " and " + cvt(p) + " Paise" : "") + " Only"
  );
}

const fc = (n: number) => `\u20B9${Math.round(n || 0).toLocaleString("en-IN")}`;

// ─── Legacy calculated qty/label helper (kept untouched — used elsewhere) ───
function getQtyInfo(item: any) {
  const w = parseFloat(item.width) || 0;
  const h = parseFloat(item.height) || 0;
  const d = parseFloat(item.depth) || 0;
  const l = parseFloat(item.length) || 0;
  const qty = parseFloat(item.qty) || 1;
  const unit = item.dimension_unit || "feet";
  const toFt = (v: number) => (unit === "inches" ? v / 12 : v);
  switch (item.qty_type) {
    case "ByHW":
      return {
        measure: (toFt(w) * toFt(h) * qty).toFixed(2),
        label: "Sq.Ft",
        dims: `${h} \u00D7 ${w}`,
      };
    case "ByHWD":
      return {
        measure: (toFt(w) * toFt(h) * toFt(d) * qty).toFixed(2),
        label: "Sq.Ft",
        dims: `${h} \u00D7 ${w} \u00D7 ${d}`,
      };
    case "ByHWL":
      return {
        measure: (toFt(w) * toFt(h) * toFt(l) * qty).toFixed(2),
        label: "Sq.Ft",
        dims: `${h} \u00D7 ${w} \u00D7 ${l}`,
      };
    default:
      return { measure: String(qty), label: "Nos", dims: "" };
  }
}

// ─── PRINT-ONLY helper (this page only) ─────────────────────────────────────
// Directly reads item.qty_type, item.calculated_qty, item.unit_price,
// item.total_price, item.height, item.width from the API response.
// No recalculation is done here — values are shown exactly as received.
// Matches the HOMYNS reference PDF: Width (Inch) / Height (Inch) / Qty / Per /
// Total Measure / Rate / Amount. Fixed-type items (e.g. Paint, Curtain) show
// blank width/height/per, same as the reference document.
function getPrintDisplayInfo(item: any) {
  const isFixed = item.qty_type === "Fixed";

  const per = isFixed ? "NOS" : "SQ FT";

  const w = item.width ?? "";
  const h = item.height ?? "";
  const wVal = w !== "" && Number.isFinite(parseFloat(w)) ? parseFloat(w).toFixed(2) : "";
  const hVal = h !== "" && Number.isFinite(parseFloat(h)) ? parseFloat(h).toFixed(2) : "";

  const measureRaw = item.calculated_qty ?? item.qty ?? 0;
  const measure = Number.isFinite(parseFloat(measureRaw))
    ? parseFloat(measureRaw).toFixed(2)
    : "0.00";

  const rate = parseFloat(item.unit_price) || 0;
  const amount = parseFloat(item.total_price) || 0;

  return { per, wVal, hVal, measure, rate, amount, isFixed };
}

// Inline SVG icons
const PhoneIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.02 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.18 6.18l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
  </svg>
);
const MailIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);
const PinIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);
const WaIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
  </svg>
);
const HashIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M3 9h18M9 21V9" />
  </svg>
);
const GlobeIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 010 20 15.3 15.3 0 010-20z" />
  </svg>
);

// Helper to get company color (falls back to HOMYNS red)
const getCompanyColor = (): string => {
  try {
    const data = localStorage.getItem("company_data");
    if (data) {
      const parsed = JSON.parse(data);
      return parsed.background_color || "#ee3c31";
    }
  } catch { }
  return "#ee3c31";
};

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
body{font-family:'Inter',system-ui,sans-serif;background:#e9edf1;}
.qp{background:#e9edf1;min-height:100vh;font-family:'Inter',system-ui,sans-serif;}

/* Topbar - hidden in print */
.qp-bar{position:sticky;top:0;z-index:100;background:rgba(255,255,255,0.97);backdrop-filter:blur(8px);border-bottom:1px solid #e2e8f0;padding:11px 20px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;}
.qp-bar-l{display:flex;align-items:center;gap:10px;min-width:0;flex-wrap:wrap;}
.qp-bar-co{font-weight:700;font-size:15px;color:#1a1a1a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:200px;}
.qp-bar-sep{color:#cbd5e1;}
.qp-bar-num{font-family:monospace;font-weight:700;font-size:14px;color:var(--company-color, #ee3c31);white-space:nowrap;}
.qp-btn{display:inline-flex;align-items:center;gap:6px;background:var(--company-color, #ee3c31);color:#fff;border:none;border-radius:8px;padding:9px 18px;font-size:13px;font-weight:700;cursor:pointer;transition:opacity .15s,transform .1s;white-space:nowrap;flex-shrink:0;}
.qp-btn:hover{opacity:.88;transform:translateY(-1px);}
.qp-btn:active{transform:translateY(0);}

/* Wrapper */
.qp-wrap{max-width:900px;margin:0 auto;padding:24px 16px 40px;}

/* Document - plain white sheet like the reference PDF */
.qp-doc{background:#fff;border:1px solid #d8dde3;overflow:hidden;}

/* HEADER — mirrors the reference PDF grid: logo/web left, EM/MO right */
.qp-hd{display:grid;grid-template-columns:auto 1fr auto;gap:18px;padding:22px 28px;align-items:center;border-bottom:2px solid var(--company-color, #ee3c31);}
.qp-logo{width:64px;height:64px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:800;color:#fff;border-radius:6px;background:var(--company-color, #ee3c31);overflow:hidden;}
.qp-logo img{width:100%;height:100%;object-fit:contain;display:block;}
.qp-co-name{font-size:20px;font-weight:800;color:#1a1a1a;line-height:1.2;}
.qp-co-addr{font-size:11px;color:#555;margin-top:4px;max-width:320px;}
.qp-hd-right{text-align:left;display:flex;flex-direction:column;gap:5px;}
.qp-hd-row{display:flex;align-items:baseline;gap:6px;font-size:11.5px;color:#222;white-space:nowrap;}
.qp-hd-row b{font-weight:800;color:#1a1a1a;letter-spacing:.03em;}
.qp-hd-row span.val{color:#333;}
.qp-hd-row svg{color:var(--company-color, #ee3c31);flex-shrink:0;}

/* Quotation meta strip */
.qp-meta{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;padding:14px 28px;border-bottom:1px solid #e2e8f0;background:#fafafa;}
.qp-meta-l{font-size:12px;color:#555;}
.qp-meta-l b{color:#1a1a1a;}
.qp-meta-num{font-family:monospace;font-size:15px;font-weight:800;color:var(--company-color, #ee3c31);}

/* Client block */
.qp-cl{padding:16px 28px;border-bottom:1px solid #e2e8f0;}
.qp-ey{font-size:11px;font-weight:800;color:#1a1a1a;text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px;}
.qp-clg{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;}
.qp-clf label{font-size:10px;color:#94a3b8;display:block;margin-bottom:2px;font-weight:500;}
.qp-clf p{font-size:12.5px;color:#1a1a1a;font-weight:600;}
.qp-clf p.sm{font-weight:500;color:#444;}
.qp-clf.full{grid-column:1/-1;}

/* Table wrap */
.qp-tw{overflow-x:auto;}
.qp-tbl{width:100%;border-collapse:collapse;font-size:12px;min-width:640px;}
.qp-tbl thead tr th{padding:9px 8px;font-size:10.5px;font-weight:700;color:#1a1a1a;border-bottom:2px solid #1a1a1a;border-top:1px solid #e2e8f0;white-space:nowrap;background:#fff;text-align:left;}
.qp-tbl thead tr th:first-child{padding-left:20px;width:34px;}
.qp-tbl thead tr th:last-child{padding-right:20px;}
.qp-tbl thead tr th.c{text-align:center;}
.qp-tbl thead tr th.r{text-align:right;}

/* Room name row — plain bold text like the PDF, no colored band */
.qp-tbl tr.rr td{padding:14px 20px 2px;font-size:12.5px;font-weight:800;color:#1a1a1a;text-transform:uppercase;letter-spacing:.04em;border-bottom:1px solid #eef1f4;}

/* Name row (item description line) */
.qp-tbl tr.nr td{padding:8px 8px 0;vertical-align:top;color:#1a1a1a;}
.qp-tbl tr.nr td:first-child{padding-left:20px;color:#555;font-size:11px;}
.qp-tbl tr.nr td:last-child{padding-right:20px;}

/* Value row (dimensions / qty / rate / amount) */
.qp-tbl tr.vr td{padding:2px 8px 10px;color:#c0392b;font-weight:700;border-bottom:1px solid #eef1f4;}
.qp-tbl tr.vr td:first-child{padding-left:20px;}
.qp-tbl tr.vr td:last-child{padding-right:20px;}
.qp-tbl tr.vr td.amt{color:var(--company-color, #ee3c31);}

.in{font-weight:600;color:#1a1a1a;font-size:13px;}
.irm{font-size:11px;color:#94a3b8;font-style:italic;margin-top:2px;}
.isp{display:inline-block;font-size:10px;background:#fef3c7;color:#d97706;border:1px solid #fde68a;border-radius:4px;padding:1px 6px;margin-top:3px;font-weight:600;}
.irml{display:flex;flex-wrap:wrap;gap:4px;margin-top:6px;margin-bottom:4px;}
.irmlb{display:inline-flex;align-items:center;gap:3px;font-size:10px;background:#f1f5f9;color:#64748b;border-radius:4px;padding:2px 7px;}
.tc{text-align:center;}.tr{text-align:right;}.tm{font-family:monospace;}

/* Table footer TOTAL row — mirrors the PDF's bottom total bar */
.qp-tbl tfoot tr td{padding:12px 20px;font-size:14px;font-weight:800;color:#1a1a1a;border-top:2px solid #1a1a1a;}
.qp-tbl tfoot tr td.amt{text-align:right;color:var(--company-color, #ee3c31);font-family:monospace;font-size:15px;}

/* Totals breakdown (subtotal / discount / gst) */
.qp-tot{border-top:1px solid #e2e8f0;padding:18px 28px;}
.qp-toti{display:flex;flex-direction:column-reverse;gap:18px;}
.qp-wb{flex:1;border:1px dashed var(--company-color, #ee3c31);padding:12px 14px;}
.qp-wl{font-size:9px;font-weight:800;color:#1a1a1a;text-transform:uppercase;letter-spacing:.1em;margin-bottom:5px;}
.qp-wt{font-size:12.5px;font-weight:600;color:#333;line-height:1.5;}
.qp-tt{min-width:240px;}
.qp-tr2{display:flex;justify-content:space-between;align-items:center;padding:4px 0;gap:32px;}
.qp-tr2 .l{font-size:12.5px;color:#555;}
.qp-tr2 .v{font-size:12.5px;font-weight:600;color:#1a1a1a;font-family:monospace;}
.qp-tr2 .v.rd{color:#c0392b;}
.qp-tr2 .v.gn{color:#178a4c;}
.qp-td{height:1px;background:#e2e8f0;margin:8px 0;}
.qp-gr{display:flex;justify-content:space-between;align-items:center;padding:6px 0;flex-wrap:wrap;gap:8px;}
.qp-gl{font-size:15px;font-weight:800;color:#1a1a1a;}
.qp-gv{font-size:20px;font-weight:800;color:var(--company-color, #ee3c31);font-family:monospace;}

/* Terms */
.qp-tm{border-top:1px solid #e2e8f0;padding:18px 28px;}
.qp-tml{display:grid;grid-template-columns:1fr;gap:7px;margin-top:10px;}
.qp-tmi{display:flex;align-items:flex-start;gap:8px;font-size:11.5px;color:#444;line-height:1.5;}
.qp-tmd{width:5px;height:5px;border-radius:50%;background:var(--company-color, #ee3c31);flex-shrink:0;margin-top:6px;}

/* Signature */
.qp-sg{border-top:1px solid #e2e8f0;padding:26px 28px 30px;display:grid;grid-template-columns:1fr 1fr;gap:32px;}
.qp-sgb{text-align:center;}
.qp-sgl{height:1px;background:#cbd5e1;margin-bottom:9px;margin-top:56px;}
.qp-sgn{font-size:12px;font-weight:700;color:#1a1a1a;}
.qp-sgr{font-size:10.5px;color:#94a3b8;margin-top:2px;}

/* Screen footer */
.qp-ft{text-align:center;padding:18px 16px 6px;font-size:11px;color:#94a3b8;}
.qp-ft a{color:var(--company-color, #ee3c31);text-decoration:none;font-weight:600;}

/* ─── RESPONSIVE ────────────────────────────────────────────────────────── */
@media(max-width:768px){
  .qp-wrap{padding:16px 10px 30px;}
  .qp-hd{grid-template-columns:1fr;gap:12px;padding:18px 18px;}
  .qp-hd-right{align-items:flex-start;}
  .qp-co-name{font-size:17px;}
  .qp-cl{padding:14px 18px;}
  .qp-clg{grid-template-columns:1fr 1fr;}
  .qp-meta{padding:12px 18px;}
  .qp-tot{padding:16px 18px;}
  .qp-tm{padding:14px 18px;}
  .qp-sg{padding:18px 18px 22px;gap:16px;grid-template-columns:1fr;}
  .qp-tbl thead tr th:first-child{padding-left:18px;}
  .qp-tbl thead tr th:last-child{padding-right:18px;}
  .qp-tbl tr.rr td,.qp-tbl tr.nr td:first-child,.qp-tbl tr.vr td:first-child{padding-left:18px;}
  .qp-tbl tr.nr td:last-child,.qp-tbl tr.vr td:last-child{padding-right:18px;}
  .qp-tbl tfoot tr td{padding:10px 18px;}
  .qp-gv{font-size:17px;}
  .qp-tbl{font-size:11px;min-width:520px;}
  .qp-bar-co{font-size:13px;max-width:150px;}
}

@media(max-width:480px){
  .qp-wrap{padding:12px 6px 20px;}
  .qp-hd{padding:14px 12px;}
  .qp-logo{width:48px;height:48px;font-size:15px;}
  .qp-co-name{font-size:15px;}
  .qp-cl{padding:12px 12px;}
  .qp-clg{grid-template-columns:1fr;gap:8px;}
  .qp-meta{padding:10px 12px;}
  .qp-tot{padding:12px 12px;}
  .qp-tm{padding:12px 12px;}
  .qp-sg{padding:14px 12px 18px;grid-template-columns:1fr;gap:12px;}
  .qp-tbl{font-size:10px;min-width:420px;}
  .qp-tbl thead tr th:first-child{padding-left:12px;}
  .qp-tbl thead tr th:last-child{padding-right:12px;}
  .qp-tbl tr.rr td,.qp-tbl tr.nr td:first-child,.qp-tbl tr.vr td:first-child{padding-left:12px;}
  .qp-tbl tr.nr td:last-child,.qp-tbl tr.vr td:last-child{padding-right:12px;}
  .qp-tbl tfoot tr td{padding:9px 12px;font-size:12.5px;}
  .in{font-size:11px;}
  .qp-gv{font-size:16px;}
  .qp-gl{font-size:13px;}
  .qp-wt{font-size:11px;}
  .qp-bar{padding:8px 12px;flex-direction:column;align-items:stretch;}
  .qp-bar-l{justify-content:center;}
  .qp-btn{justify-content:center;width:100%;}
  .qp-toti{flex-direction:column-reverse;}
  .qp-tt{min-width:auto;}
  .qp-tml{grid-template-columns:1fr;}
}

/* ─── PRINT STYLES ────────────────────────────────────────────────────── */
@media print{
  @page{size:A4 portrait;margin:8mm 6mm;}
  *{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}
  body{background:#fff!important;}
  .qp{background:#fff!important;}
  .qp-bar{display:none!important;}
  .qp-ft{display:none!important;}
  .qp-wrap{padding:0!important;max-width:100%!important;}
  .qp-doc{border:none!important;}
  .qp-tbl tr{page-break-inside:avoid;}
  .qp-tbl tr.rr{page-break-after:avoid;}
  .qp-tbl tr.nr{page-break-after:avoid;}
  .qp-hd{padding:10px 14px!important;}
  .qp-co-name{font-size:16px!important;}
  .qp-logo{width:48px!important;height:48px!important;font-size:14px!important;}
  .qp-cl{padding:8px 14px!important;}
  .qp-meta{padding:8px 14px!important;}
  .qp-tot{padding:10px 14px!important;}
  .qp-tm{padding:8px 14px!important;}
  .qp-sg{padding:12px 14px 10px!important;}
  .qp-tbl thead tr th:first-child{padding-left:14px!important;}
  .qp-tbl thead tr th:last-child{padding-right:14px!important;}
  .qp-tbl tr.rr td,.qp-tbl tr.nr td:first-child,.qp-tbl tr.vr td:first-child{padding-left:14px!important;}
  .qp-tbl tr.nr td:last-child,.qp-tbl tr.vr td:last-child{padding-right:14px!important;}
  .qp-tbl{font-size:10.5px!important;}
}

@keyframes spin{to{transform:rotate(360deg);}}
`;

export default function PublicQuotationView() {
  const { id } = useParams();
  const [quotation, setQuotation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [terms, setTerms] = useState<any[]>([]);
  const [company, setCompany] = useState<any>(null);
  const [companyColor, setCompanyColor] = useState("#ee3c31");

  const getCompanyId = (): string => {
    try {
      const r = localStorage.getItem("company_data");
      if (r) return JSON.parse(r)?.company_id || "";
    } catch { }
    return "";
  };

  // Load company color
  useEffect(() => {
    const color = getCompanyColor();
    setCompanyColor(color);
    document.documentElement.style.setProperty('--company-color', color);
  }, []);

  useEffect(() => {
    if (!id) {
      setError("Quotation ID required");
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const res = await quotationService.getQuotation(id);
        if (res.status === "success" && res.data) {
          let q = res.data;
          if (typeof q.rooms === "string") {
            try {
              q.rooms = JSON.parse(q.rooms);
            } catch {
              q.rooms = [];
            }
          }
          if (!q.rooms) q.rooms = [];
          setQuotation(q);
          const cid = q.company_id || getCompanyId();
          if (cid) {
            try {
              const cr = await companyService.getCompany(cid);
              if (cr.status === "success" && cr.data) {
                setCompany(cr.data);
                if (cr.data.background_color) {
                  setCompanyColor(cr.data.background_color);
                  document.documentElement.style.setProperty('--company-color', cr.data.background_color);
                }
              }
            } catch { }
            try {
              const tr = await termsService.getTerms(cid);
              if (tr.status === "success" && tr.data) setTerms(tr.data);
            } catch { }
          }
        } else {
          setError(res.message || "Failed to load");
        }
      } catch (e: any) {
        setError(e.message || "Error");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading)
    return (
      <>
        <style>{CSS}</style>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#e9edf1" }}>
          <div style={{ textAlign: "center" }}>
            <Loader2 style={{ width: 40, height: 40, animation: "spin 1s linear infinite", color: companyColor, margin: "0 auto 12px" }} />
            <p style={{ color: "#64748b", fontSize: 14, fontFamily: "Inter,system-ui,sans-serif" }}>Loading quotation…</p>
          </div>
        </div>
      </>
    );

  if (error || !quotation)
    return (
      <>
        <style>{CSS}</style>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#e9edf1", padding: "20px" }}>
          <div style={{ textAlign: "center", maxWidth: 360, fontFamily: "Inter,system-ui,sans-serif" }}>
            <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <AlertCircle style={{ width: 36, height: 36, color: "#ef4444" }} />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1a1a1a", marginBottom: 8 }}>Quotation Not Found</h2>
            <p style={{ color: "#64748b", fontSize: 14, marginBottom: 20 }}>{error || "This quotation doesn't exist."}</p>
            <button
              onClick={() => (window.location.href = "/")}
              style={{ background: companyColor, color: "#fff", border: "none", borderRadius: 8, padding: "10px 24px", fontWeight: 700, cursor: "pointer", fontSize: 14 }}
            >
              Go Home
            </button>
          </div>
        </div>
      </>
    );

  const cName = company?.company_name || quotation.company_name || "Company";
  const cEmail = company?.email || quotation.company_email || "";
  const cPhone = company?.phone || quotation.company_phone || "";
  const cAddress = company?.address || quotation.company_address || "";
  const cWA = company?.whatsapp_number || quotation.whatsapp_number || "";
  const cGst = company?.gst_number || quotation.gst_number || "";
  const cWebsite = company?.website || quotation.company_website || "";
  const cLogo = company?.logo || "";

  const custName = quotation.client_name || quotation.customer_name || "Customer";
  const custPhone = [quotation?.phone1, quotation?.phone2, quotation?.mobile].filter(Boolean).join(", ") || "—";
  const custEmail = quotation.email || quotation.client_email || "";
  const custAddr = quotation.address || quotation.client_address || "";

  const allItems: any[] = [];
  (quotation.rooms || []).forEach((room: any) => {
    (room.items || []).forEach((item: any) => {
      allItems.push({ ...item, room_name: room.room_name });
    });
  });

  const subtotal = parseFloat(quotation.subtotal) || 0;
  const discAmt = parseFloat(quotation.discount_amount) || 0;
  const discType = quotation.discount_type || "INR";
  const discVal = parseFloat(quotation.discount_value) || 0;
  const gstPct = parseFloat(quotation.gst_percent) || 0;
  const gstAmt = parseFloat(quotation.gst_amount) || 0;
  const finalAmt = parseFloat(quotation.final_amount) || 0;
  const afterDisc = subtotal - discAmt;

  const qDate = quotation.c_date ? new Date(quotation.c_date) : new Date();
  const fmtDate = qDate.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

  // Group by room, preserving order
  const roomGroups: { name: string; items: any[] }[] = [];
  let curRoom = "";
  allItems.forEach((item) => {
    if (item.room_name !== curRoom) {
      curRoom = item.room_name;
      roomGroups.push({ name: item.room_name, items: [] });
    }
    roomGroups[roomGroups.length - 1].items.push(item);
  });

  const tableRows: JSX.Element[] = [];
  let sr = 0;
  roomGroups.forEach((g, gi) => {
    tableRows.push(
      <tr key={`r${gi}`} className="rr">
        <td colSpan={9}>{g.name}</td>
      </tr>,
    );
    g.items.forEach((item, ii) => {
      sr++;
      const { per, wVal, hVal, measure, rate, amount, isFixed } = getPrintDisplayInfo(item);
      const qty = parseFloat(item.qty) || 1;
      // Raw materials are only shown when an item actually has them —
      // otherwise the row falls back purely to the PDF-style layout.
      const rm = item.raw_materials || [];
      tableRows.push(
        <tr key={`n${gi}-${ii}`} className="nr">
          <td>{sr}</td>
          <td colSpan={8}>
            <div className="in">{item.product_name}</div>
            {item.remark && <div className="irm">{item.remark}</div>}
            {item.is_special === "1" && <span className="isp">Special</span>}
            {rm.length > 0 && (
              <div className="irml">
                {rm.map((r: any, ri: number) => (
                  <span key={ri} className="irmlb">
                    <Layers style={{ width: 9, height: 9 }} />
                    {r.rm_name || r.name || "Material"}
                    <b>{r.brand_name ? ` | ${r.brand_name}` : ""}</b>
                    {r.required_qty && 1===2 ? ` (${parseFloat(r.required_qty).toFixed(2)} ${r.unit || ""})` : ""}
                  </span>
                ))}
              </div>
            )}
          </td>
        </tr>,
      );
      tableRows.push(
        <tr key={`v${gi}-${ii}`} className="vr">
          <td></td>
          <td></td>
          <td className="tr tm">{isFixed ? "—" : wVal || "—"}</td>
          <td className="tr tm">{isFixed ? "—" : hVal || "—"}</td>
          <td className="tc tm">{qty}</td>
          <td className="tc">{per}</td>
          <td className="tr tm">{measure}</td>
          <td className="tr tm">{fc(rate)}</td>
          <td className="tr tm amt">{fc(amount)}</td>
        </tr>,
      );
    });
  });

  return (
    <>
      <style>{CSS}</style>
      <div className="qp">
        {/* Topbar */}
        <div className="qp-bar">
          <div className="qp-bar-l">
            <span className="qp-bar-co">{cName}</span>
            <span className="qp-bar-sep">·</span>
            <span className="qp-bar-num">{quotation.quotation_number}</span>
          </div>
          <button className="qp-btn" onClick={() => window.print()}>
            <Printer style={{ width: 15, height: 15 }} />
            Print / Save PDF
          </button>
        </div>

        <div className="qp-wrap">
          <div className="qp-doc">
            {/* HEADER — logo/company left, Web/Email/Mobile stacked right, like the reference PDF */}
            <div className="qp-hd">
              <div
                className="qp-logo"
                style={{ background: cLogo ? "transparent" : companyColor }}
              >
                {cLogo ? (
                  <img src={cLogo} alt={cName} onError={(e) => (e.currentTarget.style.display = "none")} />
                ) : (
                  cName.charAt(0).toUpperCase()
                )}
              </div>

              <div>
                <div className="qp-co-name">{cName}</div>
                {cAddress && <div className="qp-co-addr">{cAddress}</div>}
              </div>

              <div className="qp-hd-right">
                {cWebsite && (
                  <div className="qp-hd-row"><GlobeIcon /><b>WEB.</b><span className="val">{cWebsite}</span></div>
                )}
                {cEmail && (
                  <div className="qp-hd-row"><MailIcon /><b>EM.</b><span className="val">{cEmail}</span></div>
                )}
                {cPhone && (
                  <div className="qp-hd-row"><PhoneIcon /><b>MO.</b><span className="val">{cPhone}</span></div>
                )}
                {cWA && cWA !== cPhone && (
                  <div className="qp-hd-row"><WaIcon /><b>WA.</b><span className="val">{cWA}</span></div>
                )}
                {cGst && (
                  <div className="qp-hd-row"><HashIcon /><b>GST.</b><span className="val">{cGst}</span></div>
                )}
              </div>
            </div>

            {/* QUOTATION META */}
            <div className="qp-meta">
              <div className="qp-meta-l">Quotation Date: <b>{fmtDate}</b></div>
              <div className="qp-meta-num">{quotation.quotation_number}</div>
            </div>

            {/* CLIENT */}
            <div className="qp-cl">
              <div className="qp-ey">Prepared For</div>
              <div className="qp-clg">
                <div className="qp-clf">
                  <label>Client Name</label>
                  <p>{custName}</p>
                </div>
                <div className="qp-clf">
                  <label>Phone</label>
                  <p className="sm">{custPhone}</p>
                </div>
                {custEmail && (
                  <div className="qp-clf">
                    <label>Email</label>
                    <p className="sm">{custEmail}</p>
                  </div>
                )}
                {custAddr && (
                  <div className="qp-clf full">
                    <label>Address</label>
                    <p className="sm">{custAddr}</p>
                  </div>
                )}
              </div>
            </div>

            {/* ITEMS TABLE — column set matches the reference PDF exactly */}
            <div className="qp-tw">
              <table className="qp-tbl">
                <thead>
                  <tr>
                    <th>#</th>
                    <th style={{ minWidth: 170 }}>Description</th>
                    <th className="r" style={{ width: 80 }}>Width</th>
                    <th className="r" style={{ width: 80 }}>Height</th>
                    <th className="c" style={{ width: 46 }}>Qty</th>
                    <th className="c" style={{ width: 60 }}>Per</th>
                    <th className="r" style={{ width: 90 }}>Total Measure</th>
                    <th className="r" style={{ width: 80 }}>Rate</th>
                    <th className="r" style={{ width: 100 }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {tableRows.length ? (
                    tableRows
                  ) : (
                    <tr>
                      <td colSpan={9} style={{ textAlign: "center", padding: "40px", color: "#94a3b8", fontSize: 13 }}>
                        No items found
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={8}>TOTAL</td>
                    <td className="amt">{fc(finalAmt)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* TOTALS BREAKDOWN */}
            <div className="qp-tot">
              <div className="qp-toti">
                {finalAmt > 0 && (
                  <div className="qp-wb">
                    <div className="qp-wl">Amount in Words</div>
                    <div className="qp-wt">{numberToWords(finalAmt)}</div>
                  </div>
                )}
                <div className="qp-tt">
                  <div className="qp-tr2">
                    <span className="l">Subtotal</span>
                    <span className="v">{fc(subtotal)}</span>
                  </div>
                  {discAmt > 0 && (
                    <>
                      <div className="qp-tr2">
                        <span className="l">Discount{discType === "PCT" ? ` (${discVal}%)` : ""}</span>
                        <span className="v rd">− {fc(discAmt)}</span>
                      </div>
                      <div className="qp-tr2">
                        <span className="l">After Discount</span>
                        <span className="v">{fc(afterDisc)}</span>
                      </div>
                    </>
                  )}
                  {gstPct > 0 && (
                    <div className="qp-tr2">
                      <span className="l">GST ({gstPct}%)</span>
                      <span className="v gn">+ {fc(gstAmt)}</span>
                    </div>
                  )}
                  <div className="qp-td" />
                  <div className="qp-gr">
                    <span className="qp-gl">Grand Total</span>
                    <span className="qp-gv">{fc(finalAmt)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* TERMS */}
            {terms.length > 0 && (
              <div className="qp-tm">
                <div className="qp-ey">Terms &amp; Conditions</div>
                <div className="qp-tml">
                  {terms.map((t, i) => (
                    <div key={t.terms_id || i} className="qp-tmi">
                      <div className="qp-tmd" />
                      <span>{t.content || t.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SIGNATURE */}
            <div className="qp-sg">
              <div className="qp-sgb">
                <div className="qp-sgl" />
                <div className="qp-sgn">{custName}</div>
                <div className="qp-sgr">Client Signature</div>
              </div>
              <div className="qp-sgb">
                <div className="qp-sgl" />
                <div className="qp-sgn">{cName}</div>
                <div className="qp-sgr">Authorised Signatory</div>
              </div>
            </div>
          </div>

          {/* Screen footer */}
          <div className="qp-ft">
            Generated by <strong style={{ color: "#475569" }}>{cName}</strong> · Powered by{" "}
            <a href="https://www.sunshineinfotech.in/" target="_blank" rel="noopener noreferrer">
              Sunshine Infotech
            </a>
          </div>
        </div>
      </div>
    </>
  );
}