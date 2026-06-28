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

// Inline SVG icons
const PhoneIcon = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.02 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.18 6.18l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
  </svg>
);
const MailIcon = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M4 4h16c1.1 0 2 .9 2 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);
const PinIcon = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);
const WaIcon = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
  </svg>
);
const HashIcon = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M3 9h18M9 21V9" />
  </svg>
);
const CalIcon = () => (
  <svg
    width="11"
    height="11"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);
const UserIcon = () => (
  <svg
    width="11"
    height="11"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);
const BagIcon = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
  </svg>
);
const CheckIcon = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
body{font-family:'Inter',system-ui,sans-serif;}
.qp{background:#f1f5f9;min-height:100vh;font-family:'Inter',system-ui,sans-serif;}

/* Topbar - hidden in print */
.qp-bar{position:sticky;top:0;z-index:100;background:rgba(255,255,255,0.96);backdrop-filter:blur(8px);border-bottom:1px solid #e2e8f0;padding:11px 20px;display:flex;align-items:center;justify-content:space-between;gap:12px;}
.qp-bar-l{display:flex;align-items:center;gap:10px;min-width:0;}
.qp-bar-co{font-weight:700;font-size:15px;color:#1e293b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.qp-bar-sep{color:#cbd5e1;}
.qp-bar-num{font-family:monospace;font-weight:700;font-size:14px;color:#ee3c31;white-space:nowrap;}
.qp-btn{display:inline-flex;align-items:center;gap:6px;background:#ee3c31;color:#fff;border:none;border-radius:10px;padding:9px 18px;font-size:13px;font-weight:600;cursor:pointer;box-shadow:0 4px 12px rgba(99,102,241,.35);transition:background .15s,transform .1s;white-space:nowrap;flex-shrink:0;}
.qp-btn:hover{background:#4f46e5;transform:translateY(-1px);}
.qp-btn:active{transform:translateY(0);}

/* Wrapper */
.qp-wrap{max-width:860px;margin:0 auto;padding:24px 16px 40px;}

/* Document */
.qp-doc{background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08),0 1px 4px rgba(0,0,0,.04);}
.qp-stripe{height:5px; background: linear-gradient(90deg, #ee3c31 0%, #f16057 50%, #f58b84 100%);}

/* Header */
.qp-hd{display:grid;grid-template-columns:1fr auto;gap:20px;padding:28px 32px 22px;align-items:start;border-bottom:1px solid #f1f5f9;}
.qp-co-block{display:flex;align-items:flex-start;gap:16px;min-width:0;}
.qp-logo{width:80px;height:80px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:800;color:#fff;flex-shrink:0;overflow:hidden;background:#ee3c31;}
.qp-logo img{width:100%;height:100%;object-fit:contain;border-radius:12px;display:block;}
.qp-co-name{font-size:22px;font-weight:800;color:#1e293b;line-height:1.2;}
.qp-co-meta{margin-top:7px;display:flex;flex-wrap:wrap;gap:5px 16px;}
.qp-mi{display:flex;align-items:center;gap:5px;font-size:12px;color:#64748b;}
.qp-mi svg{color:#ee3c31;flex-shrink:0;}
.qp-qbox{text-align:right;}
.qp-ql{font-size:10px;font-weight:700;color:#ee3c31;text-transform:uppercase;letter-spacing:.1em;}
.qp-qn{font-size:20px;font-weight:800;color:#ee3c31;font-family:monospace;margin:3px 0;letter-spacing:.03em;}
.qp-qm{font-size:11px;color:#64748b;display:flex;flex-direction:column;align-items:flex-end;gap:4px;margin-top:6px;}
.qp-qmr{display:flex;align-items:center;gap:4px;}

/* Client */
.qp-cl{padding:20px 32px;border-bottom:1px solid #f1f5f9;background:#fafbff;}
.qp-ey{font-size:10px;font-weight:700;color:#ee3c31;text-transform:uppercase;letter-spacing:.1em;display:flex;align-items:center;gap:6px;margin-bottom:14px;}
.qp-clg{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;}
.qp-clf label{font-size:10px;color:#94a3b8;display:block;margin-bottom:3px;font-weight:500;}
.qp-clf p{font-size:13px;color:#1e293b;font-weight:600;}
.qp-clf p.sm{font-weight:500;color:#475569;}
.qp-clf.full{grid-column:1/-1;}

/* Items header */
.qp-ih{padding:16px 32px 0;display:flex;align-items:center;justify-content:space-between;}
.qp-it{font-size:13px;font-weight:700;color:#1e293b;text-transform:uppercase;letter-spacing:.06em;display:flex;align-items:center;gap:8px;}
.qp-ic{font-size:12px;color:#94a3b8;font-weight:500;}

/* Table */
.qp-tw{overflow-x:auto;padding:12px 0 0;}
.qp-tbl{width:100%;border-collapse:collapse;font-size:12.5px;}
.qp-tbl thead tr th{padding:8px 10px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#94a3b8;border-bottom:1.5px solid #e2e8f0;border-top:1px solid #f1f5f9;white-space:nowrap;background:#f8fafc;}
.qp-tbl thead tr th:first-child{padding-left:32px;}
.qp-tbl thead tr th:last-child{padding-right:32px;text-align:right;}
.qp-tbl thead tr th.c{text-align:center;}
.qp-tbl thead tr th.r{text-align:right;}

/* Room row */
.qp-tbl tr.rr td{padding:7px 12px 7px 32px;    background: linear-gradient(90deg, #fff1ec 0%, #ffd6c9 50%, #ee3c31 100%);font-size:11px;font-weight:700;color:#ee3c31;text-transform:uppercase;letter-spacing:.07em;border-top:1px solid #e0e7ff;border-bottom:1px solid #e0e7ff;}
.qp-tbl tr.rr td span{display:inline-flex;align-items:center;gap:6px;}

/* Item rows */
.qp-tbl tr.ir td{padding:11px 10px;vertical-align:top;border-bottom:1px solid #f1f5f9;color:#334155;}
.qp-tbl tr.ir:last-child td{border-bottom:none;}
.qp-tbl tr.ir td:first-child{padding-left:32px;color:#94a3b8;font-size:11px;font-family:monospace;}
.qp-tbl tr.ir td:last-child{padding-right:32px;text-align:right;}
.qp-tbl tr.ir:nth-child(even) td{background:#fafbff;}

.in{font-weight:600;color:#1e293b;font-size:13px;margin-bottom:2px;}
.irm{font-size:11px;color:#94a3b8;font-style:italic;margin-top:2px;}
.idm{font-size:11px;color:#64748b;font-family:monospace;margin-top:2px;}
.isp{display:inline-block;font-size:10px;background:#fef3c7;color:#d97706;border:1px solid #fde68a;border-radius:4px;padding:1px 6px;margin-top:3px;font-weight:600;}
.irml{display:flex;flex-wrap:wrap;gap:4px;margin-top:6px;}
.irmlb{display:inline-flex;align-items:center;gap:3px;font-size:10px;background:#f1f5f9;color:#64748b;border-radius:4px;padding:2px 7px;}
.tc{text-align:center;}.tr{text-align:right;}.tm{font-family:monospace;}
.ac{font-weight:700;color:#ee3c31;font-size:13px;}

/* Totals */
.qp-tot{border-top:2px solid #f1f5f9;background:#fafbff;padding:24px 32px;}
.qp-toti{display:flex;flex-direction:column-reverse;gap:20px;}
.qp-wb{flex:1;    background: linear-gradient(90deg, #fff5f4 0%, #fde8e6 50%, #fad2ce 100%);border:1.5px dashed #ee3c31;border-radius:10px;padding:14px 16px;max-width:380px;}
.qp-wl{font-size:9px;font-weight:700;color:#ee3c31;text-transform:uppercase;letter-spacing:.1em;margin-bottom:5px;}
.qp-wt{font-size:13px;font-weight:600;color:#ee3c31;line-height:1.5;}
.qp-tt{min-width:240px;}
.qp-tr{display:flex;justify-content:space-between;align-items:center;padding:5px 0;gap:32px;}
.qp-tr .l{font-size:13px;color:#64748b;}
.qp-tr .v{font-size:13px;font-weight:600;color:#334155;font-family:monospace;}
.qp-tr .v.rd{color:#ef4444;}
.qp-tr .v.gn{color:#16a34a;}
.qp-td{height:1.5px;background:#e2e8f0;margin:8px 0;}
.qp-gr{display:flex;justify-content:space-between;align-items:center;padding:6px 0;}
.qp-gl{font-size:16px;font-weight:800;color:#1e293b;}
.qp-gv{font-size:22px;font-weight:800;color:#ee3c31;font-family:monospace;}

/* Terms */
.qp-tm{border-top:1.5px solid #f1f5f9;padding:20px 32px;}
.qp-tml{display:grid;grid-template-columns:1fr;gap:8px;margin-top:12px;}
.qp-tmi{display:flex;align-items:flex-start;gap:8px;font-size:12px;color:#475569;line-height:1.5;}
.qp-tmd{width:16px;height:16px;border-radius:50%;border:1.5px solid #ee3c31;background:#eef2ff;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px;}
.qp-tmd::after{content:'';width:6px;height:6px;border-radius:50%;background:#ee3c31;display:block;}

/* Signature */
.qp-sg{border-top:1.5px solid #f1f5f9;padding:28px 32px 32px;display:grid;grid-template-columns:1fr 1fr;gap:32px;}
.qp-sgb{text-align:center;}
.qp-sgl{height:1px;background:#cbd5e1;margin-bottom:10px;margin-top:60px;}
.qp-sgn{font-size:12px;font-weight:700;color:#334155;}
.qp-sgr{font-size:11px;color:#94a3b8;margin-top:2px;}

/* Screen footer */
.qp-ft{text-align:center;padding:20px 16px 8px;font-size:11px;color:#94a3b8;}
.qp-ft a{color:#ee3c31;text-decoration:none;font-weight:600;}

/* RESPONSIVE */
@media(min-width:560px){
  .qp-toti{flex-direction:row;align-items:flex-start;justify-content:space-between;}
  .qp-tml{grid-template-columns:1fr 1fr;}
}
@media(max-width:600px){
  .qp-hd{grid-template-columns:1fr;padding:20px 18px 18px;}
  .qp-qm{align-items:flex-start;}
  .qp-cl{padding:16px 18px;}
  .qp-clg{grid-template-columns:1fr 1fr;}
  .qp-ih{padding:14px 18px 0;}
  .qp-tot{padding:18px 18px;}
  .qp-tm{padding:16px 18px;}
  .qp-sg{padding:20px 18px 24px;gap:16px;}
  .qp-co-name{font-size:18px;}
  .qp-tbl thead tr th:first-child{padding-left:18px;}
  .qp-tbl thead tr th:last-child{padding-right:18px;}
  .qp-tbl tr.rr td{padding-left:18px;}
  .qp-tbl tr.ir td:first-child{padding-left:18px;}
  .qp-tbl tr.ir td:last-child{padding-right:18px;}
  .qp-wb{max-width:100%;}
  .qp-gv{font-size:19px;}
}
@media(max-width:420px){
  .qp-clg{grid-template-columns:1fr;}
  .qp-tbl{font-size:11.5px;}
}

/* ─── PRINT STYLES ────────────────────────────────────────────────────── */
@media print{
  @page{A4 portrait;margin:8mm 6mm;}
  *{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}
  body{background:#fff!important;}
  .qp{background:#fff!important;}
  
  /* Hide screen elements */
  .qp-bar{display:none!important;}
  .qp-ft{display:none!important;}
  
  .qp-wrap{padding:0!important;max-width:100%!important;}
  .qp-doc{border-radius:0!important;box-shadow:none!important;border:1px solid #e2e8f0;border-top:none;}
  
  /* Header - fixed on every page */
  .qp-stripe{display:block;}
  .qp-hd{display:block;padding:12px 16px 10px!important;border-bottom:1px solid #e2e8f0!important;}
  
  /* Header styling for print */
  .qp-co-name{font-size:18px!important;}
  .qp-qn{font-size:17px!important;}
  .qp-logo{width:60px!important;height:60px!important;font-size:18px!important;}
  .qp-hd{grid-template-columns:1fr auto!important;gap:12px!important;}
  .qp-co-meta{font-size:10px!important;}
  .qp-mi{font-size:10px!important;}
  .qp-ql{font-size:9px!important;}
  .qp-qm{font-size:10px!important;}
  
  /* Page breaks */
  .qp-tbl tr{page-break-inside:avoid;}
  .qp-tbl tr.rr{page-break-after:avoid;}
  .qp-tbl tr.ir{page-break-inside:avoid;}
  
  /* Compact spacing */
  .qp-cl{padding:10px 16px!important;}
  .qp-ih{padding:10px 16px 0!important;}
  .qp-tot{padding:12px 16px!important;}
  .qp-tm{padding:10px 16px!important;}
  .qp-sg{padding:14px 16px 12px!important;}
  
  .qp-tbl thead tr th:first-child{padding-left:16px!important;}
  .qp-tbl thead tr th:last-child{padding-right:16px!important;}
  .qp-tbl tr.rr td{padding-left:16px!important;}
  .qp-tbl tr.ir td:first-child{padding-left:16px!important;}
  .qp-tbl tr.ir td:last-child{padding-right:16px!important;}
  .qp-tbl{font-size:10.5px!important;}
  .in{font-size:11px!important;}
  
  .qp-gv{font-size:18px!important;}
  .qp-wb{max-width:260px!important;}
  .qp-wt{font-size:11px!important;}
  .qp-sgl{margin-top:40px!important;}
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

  const getCompanyId = (): string => {
    try {
      const r = localStorage.getItem("company_data");
      if (r) return JSON.parse(r)?.company_id || "";
    } catch {}
    return "";
  };

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
              if (cr.status === "success" && cr.data) setCompany(cr.data);
            } catch {}
            try {
              const tr = await termsService.getTerms(cid);
              if (tr.status === "success" && tr.data) setTerms(tr.data);
            } catch {}
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
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#f1f5f9",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <Loader2
              style={{
                width: 40,
                height: 40,
                animation: "spin 1s linear infinite",
                color: "#ee3c31",
                margin: "0 auto 12px",
              }}
            />
            <p
              style={{
                color: "#64748b",
                fontSize: 14,
                fontFamily: "Inter,system-ui,sans-serif",
              }}
            >
              Loading quotation…
            </p>
          </div>
        </div>
      </>
    );

  if (error || !quotation)
    return (
      <>
        <style>{CSS}</style>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#f1f5f9",
            padding: "20px",
          }}
        >
          <div
            style={{
              textAlign: "center",
              maxWidth: 360,
              fontFamily: "Inter,system-ui,sans-serif",
            }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                background: "#fee2e2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
              }}
            >
              <AlertCircle
                style={{ width: 36, height: 36, color: "#ef4444" }}
              />
            </div>
            <h2
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: "#1e293b",
                marginBottom: 8,
              }}
            >
              Quotation Not Found
            </h2>
            <p style={{ color: "#64748b", fontSize: 14, marginBottom: 20 }}>
              {error || "This quotation doesn't exist."}
            </p>
            <button
              onClick={() => (window.location.href = "/")}
              style={{
                background: "#ee3c31",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                padding: "10px 24px",
                fontWeight: 600,
                cursor: "pointer",
                fontSize: 14,
              }}
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
  const cLogo = company?.logo || "";

  const custName =
    quotation.client_name || quotation.customer_name || "Customer";
  const custPhone =
    [quotation?.phone1, quotation?.phone2, quotation?.mobile]
      .filter(Boolean)
      .join(", ") || "—";
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
  const fmtDate = qDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Group by room
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
        <td colSpan={8}>
          <span>
            <BagIcon />
            {g.name}
          </span>
        </td>
      </tr>,
    );
    g.items.forEach((item, ii) => {
      sr++;
      const { measure, label, dims } = getQtyInfo(item);
      const rm = item.raw_materials || [];
      tableRows.push(
        <tr key={`i${gi}-${ii}`} className="ir">
          <td>{sr}</td>
          <td>
            <div className="in">{item.product_name}</div>
            {item.qty_type !== "Fixed" && dims && (
              <div className="idm">{dims}</div>
            )}
            {item.remark && <div className="irm">{item.remark}</div>}
            {item.is_special === "1" && <span className="isp">Special</span>}
            {rm.length > 0 && (
              <div className="irml">
                {rm.map((r: any, ri: number) => (
                  <span key={ri} className="irmlb">
                    <Layers style={{ width: 9, height: 9 }} />
                    {r.rm_name || r.name || "Material"}
                    {r.required_qty
                      ? ` (${parseFloat(r.required_qty).toFixed(2)} ${r.unit || ""})`
                      : ""}
                  </span>
                ))}
              </div>
            )}
          </td>
          <td
            className="tc"
            style={{ fontSize: 11, color: "#64748b", fontFamily: "monospace" }}
          >
            {item.qty_type === "Fixed" ? "—" : dims}
          </td>
          <td className="tc tm" style={{ fontWeight: 600, color: "#334155" }}>
            {parseFloat(item.qty) || 1}
          </td>
          <td className="tc" style={{ fontSize: 11, color: "#94a3b8" }}>
            {label}
          </td>
          <td className="tr tm" style={{ color: "#334155" }}>
            {measure}
          </td>
          <td className="tr" style={{ color: "#475569" }}>
            {fc(parseFloat(item.unit_price) || 0)}
          </td>
          <td className="tr ac">{fc(parseFloat(item.total_price) || 0)}</td>
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
            <div className="qp-stripe" />

            {/* HEADER */}
            <div className="qp-hd">
              <div className="qp-co-block">
                <div
                  className="qp-logo"
                  style={{ background: cLogo ? "transparent" : "#ee3c31" }}
                >
                  {cLogo ? (
                    <img
                      src={cLogo}
                      alt={cName}
                      onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                  ) : (
                    cName.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <div className="qp-co-name">{cName}</div>
                  <div className="qp-co-meta">
                    {cPhone && (
                      <span className="qp-mi">
                        <PhoneIcon />
                        {cPhone}
                      </span>
                    )}
                    {cWA && cWA !== cPhone && (
                      <span className="qp-mi">
                        <WaIcon />
                        {cWA}
                      </span>
                    )}
                    {cEmail && (
                      <span className="qp-mi">
                        <MailIcon />
                        {cEmail}
                      </span>
                    )}
                    {cGst && (
                      <span className="qp-mi">
                        <HashIcon />
                        GST: {cGst}
                      </span>
                    )}
                    {cAddress && (
                      <span className="qp-mi" style={{ flexBasis: "100%" }}>
                        <PinIcon />
                        {cAddress}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="qp-qbox">
                {/* <div className="qp-ql">Quotation</div> */}
                <div className="qp-qn">{quotation.quotation_number}</div>
                <div className="qp-qm">
                  <span className="qp-qmr">
                    <CalIcon />
                    {fmtDate}
                  </span>
                </div>
              </div>
            </div>

            {/* CLIENT */}
            <div className="qp-cl">
              <div className="qp-ey">
                <UserIcon />
                Prepared For
              </div>
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

            {/* ITEMS */}
            <div className="qp-ih">
              <div className="qp-it">
                <BagIcon />
                Items Summary
              </div>
              <span className="qp-ic">
                {allItems.length} item{allItems.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="qp-tw">
              <table className="qp-tbl">
                <thead>
                  <tr>
                    <th style={{ width: 36 }}>#</th>
                    <th style={{ minWidth: 160 }}>Description</th>
                    <th className="c" style={{ minWidth: 90 }}>
                      Dimensions
                    </th>
                    <th className="c" style={{ width: 50 }}>
                      Qty
                    </th>
                    <th className="c" style={{ width: 50 }}>
                      Per
                    </th>
                    <th className="r" style={{ width: 80 }}>
                      Measure
                    </th>
                    <th className="r" style={{ width: 80 }}>
                      Rate
                    </th>
                    <th className="r" style={{ width: 90 }}>
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tableRows.length ? (
                    tableRows
                  ) : (
                    <tr>
                      <td
                        colSpan={8}
                        style={{
                          textAlign: "center",
                          padding: "40px",
                          color: "#94a3b8",
                          fontSize: 13,
                        }}
                      >
                        No items found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* TOTALS */}
            <div className="qp-tot">
              <div className="qp-toti">
                {finalAmt > 0 && (
                  <div className="qp-wb">
                    <div className="qp-wl">Amount in Words</div>
                    <div className="qp-wt">{numberToWords(finalAmt)}</div>
                  </div>
                )}
                <div className="qp-tt">
                  <div className="qp-tr">
                    <span className="l">Subtotal</span>
                    <span className="v">{fc(subtotal)}</span>
                  </div>
                  {discAmt > 0 && (
                    <>
                      <div className="qp-tr">
                        <span className="l">
                          Discount{discType === "PCT" ? ` (${discVal}%)` : ""}
                        </span>
                        <span className="v rd">− {fc(discAmt)}</span>
                      </div>
                      <div className="qp-tr">
                        <span className="l">After Discount</span>
                        <span className="v">{fc(afterDisc)}</span>
                      </div>
                    </>
                  )}
                  {gstPct > 0 && (
                    <div className="qp-tr">
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
                <div className="qp-ey">
                  <CheckIcon />
                  Terms &amp; Conditions
                </div>
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
            Generated by <strong style={{ color: "#475569" }}>{cName}</strong> ·
            Powered by{" "}
            <a
              href="https://www.sunshineinfotech.in/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Sunshine Infotech
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
