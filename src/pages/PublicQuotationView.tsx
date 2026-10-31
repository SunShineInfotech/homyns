import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Loader2, AlertCircle, Printer } from "lucide-react";
// html2canvas + jsPDF are already installed as dependencies of html2pdf.js.
// They are used directly so the full 900px document is captured (html2pdf
// placed it inside an A4-width box, which cut off the right side).
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { quotationService } from "@/services/quotation.service";
import {
  quotationStatusService,
  QuotationStatusHistory,
} from "@/services/quotation-status.service";
import { termsService } from "@/services/terms.service";
import { companyService } from "@/services/company.service";
import { API_URL } from "@/services/api.config";
import { PRODUCTION_STATUSES } from "@/services/workorder.service";

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

const getWorkOrderImageUrl = (imagePath?: string) => {
  if (!imagePath) return "";
  if (/^https?:\/\//i.test(imagePath)) return imagePath;
  const apiBaseUrl = API_URL.endsWith("/") ? API_URL : `${API_URL}/`;
  return new URL(imagePath.replace(/^\/+/, ""), apiBaseUrl).toString();
};

const getCompanyLogoUrl = (logo?: string) => {
  if (!logo) return "";
  if (/^https?:\/\//i.test(logo)) return logo;
  const apiBaseUrl = API_URL.endsWith("/") ? API_URL : `${API_URL}/`;
  const logoPath = logo.replace(/^\/+/, "");
  if (logoPath.startsWith("uploadfiles/")) {
    return new URL(`../${logoPath}`, apiBaseUrl).toString();
  }
  if (logoPath.startsWith("interior_designer/")) {
    return new URL(`/${logoPath}`, new URL(apiBaseUrl).origin).toString();
  }
  return new URL(`../uploadfiles/company/${logoPath}`, apiBaseUrl).toString();
};

// ─── PDF export settings ────────────────────────────────────────────────────
const PDF_RENDER_WIDTH = 900; // CSS px the document is laid out at
const PDF_PAGE = { w: 210, h: 297 }; // A4 in mm
const PDF_MARGIN = 8; // mm on every side
const PDF_FOOTER_SPACE = 5; // mm reserved at the bottom for "Page x of y"

// Blocks that should never be split across two pages
const PDF_KEEP_TOGETHER = [
  ".qp-hd",
  ".qp-meta",
  ".qp-cl",
  ".qp-tbl thead tr",
  ".qp-tbl tfoot tr",
  ".qp-tot",
  ".qp-tm > .qp-ey",
  ".qp-tmi",
  ".qp-sg",
  ".qp-wo-title",
  ".qp-wo-card",
].join(",");

type PdfBlock = { top: number; bottom: number };

/** Measure every keep-together block, relative to the top of the exported element. */
const measurePdfBlocks = (element: HTMLElement): PdfBlock[] => {
  const base = element.getBoundingClientRect().top;
  const toBlock = (first: Element, last: Element = first): PdfBlock => ({
    top: first.getBoundingClientRect().top - base,
    bottom: last.getBoundingClientRect().bottom - base,
  });

  const blocks: PdfBlock[] = [];
  element
    .querySelectorAll(PDF_KEEP_TOGETHER)
    .forEach((node) => blocks.push(toBlock(node)));

  // Each product = name row + value row (+ room heading row when it is the first item)
  element.querySelectorAll(".qp-tbl tr.nr").forEach((nameRow) => {
    const next = nameRow.nextElementSibling;
    const valueRow = next && next.classList.contains("vr") ? next : nameRow;
    const prev = nameRow.previousElementSibling;
    const start = prev && prev.classList.contains("rr") ? prev : nameRow;
    blocks.push(toBlock(start, valueRow));
  });

  // Room heading + its products in the work-order section
  element.querySelectorAll(".qp-wo-room").forEach((roomTitle) => {
    const firstCard =
      roomTitle.nextElementSibling?.querySelector(".qp-wo-card");
    blocks.push(toBlock(roomTitle, firstCard || roomTitle));
  });

  return blocks.filter((b) => b.bottom > b.top);
};

/** Choose page break positions (in CSS px) that do not cut through any block. */
const getPdfPageBreaks = (
  totalHeight: number,
  pageHeight: number,
  blocks: PdfBlock[],
): number[] => {
  const breaks: number[] = [];
  let start = 0;
  const minFill = pageHeight * 0.3; // never leave a page less than 30% filled

  while (start + pageHeight < totalHeight) {
    let cut = start + pageHeight;
    let moved = true;
    while (moved) {
      moved = false;
      for (const block of blocks) {
        if (
          block.top < cut &&
          block.bottom > cut &&
          block.top > start + minFill
        ) {
          cut = block.top;
          moved = true;
        }
      }
    }
    breaks.push(cut);
    start = cut;
  }
  return breaks;
};

const nextFrame = () =>
  new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  );

const imageToDataUrl = (imageUrl: string): Promise<string> =>
  fetch(imageUrl, { mode: "cors", credentials: "omit" })
    .then((response) => {
      if (!response.ok) throw new Error("Image request failed");
      return response.blob();
    })
    .then(
      (blob) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () =>
            typeof reader.result === "string"
              ? resolve(reader.result)
              : reject(new Error("Image conversion failed"));
          reader.onerror = () => reject(new Error("Image conversion failed"));
          reader.readAsDataURL(blob);
        }),
    );

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
// Matches the quotation reference PDF: Width (Inch) / Height (Inch) / Qty / Per /
// Total Measure / Rate / Amount. Fixed-type items (e.g. Paint, Curtain) show
// blank width/height/per, same as the reference document.
function getPrintDisplayInfo(item: any) {
  const isFixed = item.qty_type === "Fixed";

  const per = isFixed ? "NOS" : "SQ FT";

  const w = item.width ?? "";
  const h = item.height ?? "";
  const wVal =
    w !== "" && Number.isFinite(parseFloat(w)) ? parseFloat(w).toFixed(2) : "";
  const hVal =
    h !== "" && Number.isFinite(parseFloat(h)) ? parseFloat(h).toFixed(2) : "";

  const measureRaw = item.calculated_qty ?? item.qty ?? 0;
  const measure = Number.isFinite(parseFloat(measureRaw))
    ? parseFloat(measureRaw).toFixed(2)
    : "0.00";

  const rate = parseFloat(item.unit_price) || 0;
  const amount = parseFloat(item.total_price) || 0;

  return { per, wVal, hVal, measure, rate, amount, isFixed };
}

// Helper to get company color (falls back to the standard brand red)
const getCompanyColor = (): string => {
  try {
    const data = localStorage.getItem("company_data");
    if (data) {
      const parsed = JSON.parse(data);
      return parsed.background_color || "#ee3c31";
    }
  } catch {}
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
/* Logo: no object-fit (html2canvas ignores it and stretches the image).
   The image keeps its own aspect ratio via max-width / max-height + auto size. */
.qp-logo{height:64px;min-width:64px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:800;color:#fff;border-radius:6px;background:var(--company-color, #ee3c31);overflow:hidden;}
.qp-logo:not(.has-img){width:64px;}
.qp-logo.has-img{background:transparent!important;border-radius:0;justify-content:flex-start;}
.qp-logo img{display:block;width:auto;height:auto;max-height:64px;max-width:180px;}
.qp-co-name{font-size:20px;font-weight:800;color:#1a1a1a;line-height:1.2;}
.qp-co-addr{font-size:11px;color:#555;margin-top:4px;max-width:320px;}
.qp-hd-right{text-align:left;display:flex;flex-direction:column;gap:5px;}
.qp-hd-row{display:flex;align-items:center;gap:6px;font-size:11.5px;line-height:16px;color:#222;white-space:nowrap;}
.qp-hd-row b{font-weight:800;color:#1a1a1a;letter-spacing:.03em;line-height:16px;}
.qp-hd-row span.val{color:#333;line-height:16px;}

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
/* Raw materials: one clean text line (no pill backgrounds — html2canvas
   draws text slightly lower than the box, which made pills look misaligned) */
.irml{display:block;margin-top:4px;margin-bottom:2px;font-size:10.5px;line-height:1.6;color:#64748b;}
.irml-label{font-weight:700;color:#475569;margin-right:4px;}
.irmlb{display:inline;}
.irmlb b{font-weight:600;color:#475569;}
.irml-sep{color:#94a3b8;padding:0 6px;}
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

/* Product-wise work order page (screen only; intentionally excluded from PDF) */
.qp-work-order-page{margin-top:22px;background:#fff;border:1px solid #d8dde3;padding:22px 28px;}
.qp-wo-title{font-size:16px;font-weight:800;color:#1a1a1a;margin-bottom:16px;}
.qp-wo-room{font-size:12px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:.05em;margin:16px 0 8px;}
.qp-wo-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;}
.qp-wo-card{min-width:0;border:1px solid #e2e8f0;border-radius:9px;padding:13px;break-inside:avoid;}
.qp-wo-product{font-size:13px;font-weight:700;color:#1a1a1a;overflow-wrap:anywhere;}
.qp-wo-status{display:inline-flex;margin-top:8px;border-radius:999px;padding:4px 9px;background:#ecfeff;color:#0e7490;font-size:11px;font-weight:700;}
.qp-wo-remark{margin-top:9px;color:#475569;font-size:12px;line-height:1.5;white-space:pre-wrap;overflow-wrap:anywhere;}
.qp-wo-image{display:block;margin-top:10px;max-width:100%;max-height:220px;object-fit:contain;border:1px solid #e2e8f0;border-radius:7px;background:#f8fafc;}
.qp-pdf-overlay{position:fixed;inset:0;z-index:200;background:rgba(15,23,42,.55);display:flex;align-items:center;justify-content:center;padding:16px;}
.qp-pdf-dialog{width:min(100%,390px);background:#fff;border-radius:14px;padding:22px;box-shadow:0 24px 60px rgba(15,23,42,.25);font-family:'Inter',system-ui,sans-serif;}
.qp-pdf-dialog h2{font-size:17px;font-weight:800;color:#1a1a1a;}
.qp-pdf-dialog p{margin:7px 0 16px;color:#64748b;font-size:13px;line-height:1.5;}
.qp-pdf-dialog button{display:block;width:100%;margin-top:9px;border:0;border-radius:8px;padding:11px 14px;background:var(--company-color, #ee3c31);color:#fff;font-size:13px;font-weight:700;cursor:pointer;}
.qp-pdf-dialog button:disabled{opacity:.6;cursor:wait;}
.qp-pdf-dialog button.qp-pdf-cancel{background:#f1f5f9;color:#475569;}
.qp-pdf-error{margin:10px 0 0!important;color:#b91c1c!important;}

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
  .qp-wo-grid{grid-template-columns:1fr;}
  .qp-work-order-page{padding:16px 18px;}
}

@media(max-width:480px){
  .qp-wrap{padding:12px 6px 20px;}
  .qp-hd{padding:14px 12px;}
  .qp-logo{height:48px;min-width:48px;font-size:15px;}
  .qp-logo:not(.has-img){width:48px;}
  .qp-logo img{max-height:48px;max-width:140px;}
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
  .qp-work-order-page{padding:14px 12px;}
}

/* Fixed desktop composition for PDF downloads initiated from mobile devices */
html.qp-export-desktop .qp-wrap{max-width:900px!important;padding:24px 16px 40px!important;}
html.qp-export-desktop .qp-hd{grid-template-columns:auto 1fr auto!important;gap:18px!important;padding:22px 28px!important;}
html.qp-export-desktop .qp-hd-right{align-items:flex-start!important;}
html.qp-export-desktop .qp-logo{height:64px!important;min-width:64px!important;font-size:20px!important;}
html.qp-export-desktop .qp-logo:not(.has-img){width:64px!important;}
html.qp-export-desktop .qp-logo img{max-height:64px!important;max-width:180px!important;}
html.qp-export-desktop .qp-co-name{font-size:20px!important;}
html.qp-export-desktop .qp-cl{padding:16px 28px!important;}
html.qp-export-desktop .qp-clg{grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:12px!important;}
html.qp-export-desktop .qp-clf.full{grid-column:1/-1!important;}
html.qp-export-desktop .qp-meta{padding:14px 28px!important;}
html.qp-export-desktop .qp-tot{padding:18px 28px!important;}
html.qp-export-desktop .qp-tm{padding:18px 28px!important;}
html.qp-export-desktop .qp-sg{grid-template-columns:1fr 1fr!important;gap:32px!important;padding:26px 28px 30px!important;}
html.qp-export-desktop .qp-tbl{font-size:12px!important;min-width:640px!important;}
html.qp-export-desktop .qp-work-order-page{padding:22px 28px!important;}
html.qp-export-desktop .qp-wo-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;}

/* ─── PRINT STYLES ────────────────────────────────────────────────────── */
@media print{
  @page{size:A4 portrait;margin:8mm 6mm;}
  *{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}
  body{background:#fff!important;}
  .qp{background:#fff!important;}
  .qp-bar{display:none!important;}
  .qp-ft{display:none!important;}
  .qp-work-order-page{display:none!important;}
  .qp-pdf-overlay{display:none!important;}
  .qp-wrap{padding:0!important;max-width:100%!important;}
  .qp-doc{border:none!important;}
  .qp-tbl tr{page-break-inside:avoid;}
  .qp-tbl tr.rr{page-break-after:avoid;}
  .qp-tbl tr.nr{page-break-after:avoid;}
  .qp-hd{padding:10px 14px!important;}
  .qp-co-name{font-size:16px!important;}
  .qp-logo{height:48px!important;min-width:48px!important;font-size:14px!important;}
  .qp-logo:not(.has-img){width:48px!important;}
  .qp-logo img{max-height:48px!important;max-width:140px!important;}
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

export default function PublicQuotationView({
  documentType = "quotation",
}: {
  documentType?: "quotation" | "invoice";
}) {
  const isInvoice = documentType === "invoice";
  const { id } = useParams();
  const [quotation, setQuotation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [terms, setTerms] = useState<any[]>([]);
  const [company, setCompany] = useState<any>(null);
  const [companyColor, setCompanyColor] = useState("#ee3c31");
  const [pdfChoiceOpen, setPdfChoiceOpen] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [pdfError, setPdfError] = useState("");
  const [invoiceHistory, setInvoiceHistory] =
    useState<QuotationStatusHistory | null>(null);

  const getCompanyId = (): string => {
    try {
      const r = localStorage.getItem("company_data");
      if (r) return JSON.parse(r)?.company_id || "";
    } catch {}
    return "";
  };

  // Load company color
  useEffect(() => {
    const color = getCompanyColor();
    setCompanyColor(color);
    document.documentElement.style.setProperty("--company-color", color);
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
            if (isInvoice) {
              try {
                const invoiceResult =
                  await quotationStatusService.getLatestInvoiceGenerated(
                    id,
                    String(cid),
                  );
                if (invoiceResult.status === "success" && invoiceResult.data)
                  setInvoiceHistory(invoiceResult.data);
              } catch {}
            }
            try {
              const cr = await companyService.getCompany(cid);
              if (cr.status === "success" && cr.data) {
                setCompany(cr.data);
                if (cr.data.background_color) {
                  setCompanyColor(cr.data.background_color);
                  document.documentElement.style.setProperty(
                    "--company-color",
                    cr.data.background_color,
                  );
                }
              }
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
  }, [id, isInvoice]);

  // Use the quotation's company details for browser title and share metadata.
  useEffect(() => {
    if (!quotation) return;

    const metaCompanyName =
      company?.company_name ||
      quotation.company_name ||
      "Interior Design Company";
    const quotationNumber =
      quotation.quotation_number || String(quotation.quotation_id || "");
    const documentLabel = isInvoice ? "Invoice" : "Quotation";
    const title = `${metaCompanyName} | ${documentLabel} ${quotationNumber}`;
    const description = `${metaCompanyName} ${documentLabel.toLowerCase()} ${quotationNumber}. View ${documentLabel.toLowerCase()} details and product-wise work status.`;
    const logo = getCompanyLogoUrl(
      company?.logo || quotation.logo || quotation.company_logo || "",
    );
    const previousTitle = document.title;
    const restore: Array<() => void> = [];
    document.title = title;

    const upsertHeadTag = (
      selector: string,
      tagName: "meta" | "link",
      attribute: string,
      value: string,
    ) => {
      let element = document.head.querySelector<HTMLElement>(selector);
      const wasCreated = !element;
      if (!element) {
        element = document.createElement(tagName);
        document.head.appendChild(element);
      }
      const previousValue = element.getAttribute(attribute);
      element.setAttribute(attribute, value);
      restore.push(() => {
        if (wasCreated) element?.remove();
        else if (previousValue === null) element?.removeAttribute(attribute);
        else element?.setAttribute(attribute, previousValue);
      });
    };

    upsertHeadTag('meta[name="description"]', "meta", "content", description);
    upsertHeadTag(
      'meta[name="keywords"]',
      "meta",
      "content",
      `${metaCompanyName}, ${documentLabel.toLowerCase()}, interior design`,
    );
    upsertHeadTag('meta[name="author"]', "meta", "content", metaCompanyName);
    upsertHeadTag('meta[property="og:type"]', "meta", "content", "website");
    upsertHeadTag(
      'meta[property="og:url"]',
      "meta",
      "content",
      window.location.href,
    );
    upsertHeadTag('meta[property="og:title"]', "meta", "content", title);
    upsertHeadTag(
      'meta[property="og:description"]',
      "meta",
      "content",
      description,
    );
    upsertHeadTag(
      'meta[property="og:site_name"]',
      "meta",
      "content",
      metaCompanyName,
    );
    upsertHeadTag(
      'meta[name="twitter:card"]',
      "meta",
      "content",
      "summary_large_image",
    );
    upsertHeadTag('meta[name="twitter:title"]', "meta", "content", title);
    upsertHeadTag(
      'meta[name="twitter:description"]',
      "meta",
      "content",
      description,
    );
    upsertHeadTag(
      'link[rel="canonical"]',
      "link",
      "href",
      window.location.href,
    );
    upsertHeadTag('meta[name="theme-color"]', "meta", "content", companyColor);
    if (logo) {
      upsertHeadTag('meta[property="og:image"]', "meta", "content", logo);
      upsertHeadTag('meta[name="twitter:image"]', "meta", "content", logo);
      upsertHeadTag('link[rel="icon"]', "link", "href", logo);
      upsertHeadTag('link[rel="apple-touch-icon"]', "link", "href", logo);
    }

    return () => {
      if (document.title === title) document.title = previousTitle;
      restore.reverse().forEach((restoreTag) => restoreTag());
    };
  }, [quotation, company, companyColor, isInvoice]);

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
            background: "#e9edf1",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <Loader2
              style={{
                width: 40,
                height: 40,
                animation: "spin 1s linear infinite",
                color: companyColor,
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
              Loading {isInvoice ? "invoice" : "quotation"}…
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
            background: "#e9edf1",
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
                color: "#1a1a1a",
                marginBottom: 8,
              }}
            >
              {isInvoice ? "Invoice" : "Quotation"} Not Found
            </h2>
            <p style={{ color: "#64748b", fontSize: 14, marginBottom: 20 }}>
              {error ||
                `This ${isInvoice ? "invoice" : "quotation"} doesn't exist.`}
            </p>
            <button
              onClick={() => (window.location.href = "/")}
              style={{
                background: companyColor,
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "10px 24px",
                fontWeight: 700,
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
  const cWebsite = company?.website || quotation.company_website || "";
  const cLogo = getCompanyLogoUrl(
    company?.logo || quotation.logo || quotation.company_logo || "",
  );

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
  const quotationDateLabel = qDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const invoiceDateValue =
    quotation.invoice_generated_at ||
    (invoiceHistory?.c_date
      ? `${invoiceHistory.c_date.slice(0, 10)} ${invoiceHistory.c_time || ""}`.trim()
      : "");
  const invoiceDateLabel = invoiceDateValue
    ? `${new Date(`${invoiceDateValue.slice(0, 10)}T00:00:00Z`).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}${invoiceDateValue.length > 10 ? ` · ${invoiceDateValue.slice(11, 16)} IST` : ""}`
    : "—";
  const fmtDate = isInvoice ? invoiceDateLabel : quotationDateLabel;

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

  const downloadPdf = async (kind: "quotation" | "work-order" | "both") => {
    const selector =
      kind === "quotation"
        ? ".qp-doc"
        : kind === "work-order"
          ? ".qp-work-order-page"
          : ".qp-pdf-bundle";
    const element = document.querySelector<HTMLElement>(selector);
    if (!element) return;

    setGeneratingPdf(true);
    const originalImageSources: Array<{
      image: HTMLImageElement;
      src: string;
    }> = [];
    const originalElementStyle = element.getAttribute("style");
    const previousScroll = { x: window.scrollX, y: window.scrollY };
    document.documentElement.classList.add("qp-export-desktop");
    try {
      // Keep export layout identical on mobile and desktop: use the same
      // 900px document width and render CSS as a desktop-sized viewport.
      element.style.width = `${PDF_RENDER_WIDTH}px`;
      element.style.maxWidth = "none";
      element.style.marginLeft = "auto";
      element.style.marginRight = "auto";

      // Embed accessible images as data URLs before html2canvas snapshots the
      // actual visible page content. Restore their original URLs afterwards.
      const images = Array.from(element.querySelectorAll("img"));
      const inaccessibleExternalImages: string[] = [];
      await Promise.all(
        images.map(async (image) => {
          const source = image.currentSrc || image.src;
          if (!source || source.startsWith("data:")) return;
          try {
            const dataUrl = await imageToDataUrl(source);
            originalImageSources.push({
              image,
              src: image.getAttribute("src") || source,
            });
            image.src = dataUrl;
          } catch {
            try {
              if (new URL(source).origin !== window.location.origin) {
                inaccessibleExternalImages.push(source);
              }
            } catch {
              inaccessibleExternalImages.push(source);
            }
          }
          try {
            await image.decode();
          } catch {
            // Keep generating the PDF if an optional product image is unavailable.
          }
        }),
      );
      if (inaccessibleExternalImages.length > 0) {
        throw new Error(
          "The image server is blocking PDF access. Enable CORS for the company logo and work-order upload folders, then try again.",
        );
      }

      const safeQuotationNumber = String(
        quotation.quotation_number || quotation.id || "quotation",
      ).replace(/[^a-z0-9_-]+/gi, "_");
      const documentName = isInvoice ? "Invoice" : "Quotation";
      const title =
        kind === "quotation"
          ? documentName
          : kind === "work-order"
            ? "Work_Order"
            : `${documentName}_and_Work_Order`;

      // Let the 900px desktop layout and web fonts settle before measuring
      window.scrollTo(0, 0);
      await nextFrame();
      if ((document as any).fonts?.ready) await (document as any).fonts.ready;

      await nextFrame();

      const cssWidth = element.offsetWidth;
      const cssHeight = element.scrollHeight;
      const blocks = measurePdfBlocks(element);

      // Scale 2 for sharp text, reduced for very long documents so the canvas
      // stays inside mobile browser limits (iOS Safari ≈ 16.7M pixels).
      const scale = Math.max(
        1,
        Math.min(
          2,
          Math.sqrt(15_000_000 / (cssWidth * cssHeight)),
          32000 / cssHeight,
        ),
      );

      const canvas = await html2canvas(element, {
        scale,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        windowWidth: 1200,
        width: cssWidth,
        height: cssHeight,
        scrollX: 0,
        scrollY: 0,
      });

      // Fit the full document width into the A4 printable width
      const contentWidthMm = PDF_PAGE.w - PDF_MARGIN * 2;
      const contentHeightMm = PDF_PAGE.h - PDF_MARGIN * 2 - PDF_FOOTER_SPACE;
      const cssPxPerMm = cssWidth / contentWidthMm;
      const pageHeightCss = contentHeightMm * cssPxPerMm;
      const canvasPxPerCss = canvas.width / cssWidth;

      const breaks = getPdfPageBreaks(cssHeight, pageHeightCss, blocks);
      const slices = [0, ...breaks, cssHeight];

      const pdf = new jsPDF({
        unit: "mm",
        format: "a4",
        orientation: "portrait",
        compress: true,
      });
      const pageCanvas = document.createElement("canvas");
      const pageCtx = pageCanvas.getContext("2d");
      if (!pageCtx)
        throw new Error("Could not create the PDF. Please try again.");

      for (let i = 0; i < slices.length - 1; i++) {
        const fromCss = slices[i];
        const toCss = slices[i + 1];
        const sourceY = Math.round(fromCss * canvasPxPerCss);
        const sourceH = Math.max(
          1,
          Math.min(
            canvas.height - sourceY,
            Math.round((toCss - fromCss) * canvasPxPerCss),
          ),
        );

        pageCanvas.width = canvas.width;
        pageCanvas.height = sourceH;
        pageCtx.fillStyle = "#ffffff";
        pageCtx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
        pageCtx.drawImage(
          canvas,
          0,
          sourceY,
          canvas.width,
          sourceH,
          0,
          0,
          canvas.width,
          sourceH,
        );

        if (i > 0) pdf.addPage();
        pdf.addImage(
          pageCanvas.toDataURL("image/jpeg", 0.95),
          "JPEG",
          PDF_MARGIN,
          PDF_MARGIN,
          contentWidthMm,
          sourceH / canvasPxPerCss / cssPxPerMm,
          undefined,
          "FAST",
        );
      }

      // Page numbers
      const totalPages = pdf.getNumberOfPages();
      if (totalPages > 1) {
        for (let page = 1; page <= totalPages; page++) {
          pdf.setPage(page);
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(8);
          pdf.setTextColor(148, 163, 184);
          pdf.text(
            `Page ${page} of ${totalPages}`,
            PDF_PAGE.w / 2,
            PDF_PAGE.h - 4,
            { align: "center" },
          );
        }
      }

      pdf.save(`${title}_${safeQuotationNumber}.pdf`);
      setPdfChoiceOpen(false);
    } catch (downloadError) {
      console.error("PDF download failed:", downloadError);
      setPdfError(
        downloadError instanceof Error
          ? downloadError.message
          : "Could not create the PDF. Please try again.",
      );
    } finally {
      originalImageSources.forEach(({ image, src }) => {
        image.src = src;
      });
      if (originalElementStyle === null) element.removeAttribute("style");
      else element.setAttribute("style", originalElementStyle);
      document.documentElement.classList.remove("qp-export-desktop");
      window.scrollTo(previousScroll.x, previousScroll.y);
      setGeneratingPdf(false);
    }
  };

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
      const { per, wVal, hVal, measure, rate, amount, isFixed } =
        getPrintDisplayInfo(item);
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
                <span className="irml-label">Material:</span>
                {rm.map((r: any, ri: number) => (
                  <span key={ri} className="irmlb">
                    {ri > 0 && <span className="irml-sep">·</span>}
                    {r.rm_name || r.name || "Material"}
                    {r.brand_name && <b>{` (${r.brand_name})`}</b>}
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
          <button
            className="qp-btn"
            onClick={() => {
              setPdfError("");
              setPdfChoiceOpen(true);
            }}
          >
            <Printer style={{ width: 15, height: 15 }} />
            Print / Save PDF
          </button>
        </div>

        <div className="qp-wrap">
          <div className="qp-pdf-bundle">
            <div className="qp-doc">
              {/* HEADER — logo/company left, Web/Email/Mobile stacked right, like the reference PDF */}
              <div className="qp-hd">
                <div
                  className={cLogo ? "qp-logo has-img" : "qp-logo"}
                  style={{ background: cLogo ? "transparent" : companyColor }}
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
                  {cAddress && <div className="qp-co-addr">{cAddress}</div>}
                </div>

                <div className="qp-hd-right">
                  {cWebsite && (
                    <div className="qp-hd-row">
                      <b>WEB.</b>
                      <span className="val">{cWebsite}</span>
                    </div>
                  )}
                  {cEmail && (
                    <div className="qp-hd-row">
                      <b>EM.</b>
                      <span className="val">{cEmail}</span>
                    </div>
                  )}
                  {cPhone && (
                    <div className="qp-hd-row">
                      <b>MO.</b>
                      <span className="val">{cPhone}</span>
                    </div>
                  )}
                  {cWA && cWA !== cPhone && (
                    <div className="qp-hd-row">
                      <b>WA.</b>
                      <span className="val">{cWA}</span>
                    </div>
                  )}
                  {cGst && (
                    <div className="qp-hd-row">
                      <b>GST.</b>
                      <span className="val">{cGst}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Document date and number */}
              <div className="qp-meta">
                <div className="qp-meta-l">
                  {isInvoice ? "Invoice Date" : "Quotation Date"}:{" "}
                  <b>{fmtDate}</b>
                </div>
                <div className="qp-meta-num">{quotation.quotation_number}</div>
              </div>

              {/* CLIENT */}
              <div className="qp-cl">
                <div className="qp-ey">
                  {isInvoice ? "Bill To" : "Prepared For"}
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

              {/* ITEMS TABLE — column set matches the reference PDF exactly */}
              <div className="qp-tw">
                <table className="qp-tbl">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th style={{ minWidth: 170 }}>Description</th>
                      <th className="r" style={{ width: 80 }}>
                        Width
                      </th>
                      <th className="r" style={{ width: 80 }}>
                        Height
                      </th>
                      <th className="c" style={{ width: 46 }}>
                        Qty
                      </th>
                      <th className="c" style={{ width: 60 }}>
                        Per
                      </th>
                      <th className="r" style={{ width: 90 }}>
                        Total Measure
                      </th>
                      <th className="r" style={{ width: 80 }}>
                        Rate
                      </th>
                      <th className="r" style={{ width: 100 }}>
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
                          colSpan={9}
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
                          <span className="l">
                            Discount{discType === "PCT" ? ` (${discVal}%)` : ""}
                          </span>
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

            {/* Product-wise work order details: screen only, excluded from quotation PDF */}
            <section
              className="qp-work-order-page"
              aria-label="Product-wise work order status"
            >
              <h2 className="qp-wo-title">Product-wise Work Order Status</h2>
              {roomGroups.map((room, roomIndex) => (
                <div key={`${room.name}-${roomIndex}`}>
                  <h3 className="qp-wo-room">
                    {room.name || `Room ${roomIndex + 1}`}
                  </h3>
                  <div className="qp-wo-grid">
                    {room.items.map((item: any, productIndex: number) => {
                      const statusValue = Number(item.production_status || 1);
                      const history =
                        item.latest_work_status ||
                        item.latest_history ||
                        item.work_status_history?.[0] ||
                        null;
                      const imageUrl = getWorkOrderImageUrl(history?.image);
                      const statusTitle =
                        item.production_status_title ||
                        PRODUCTION_STATUSES.find(
                          (status) => status.value === statusValue,
                        )?.label ||
                        "Pending";

                      return (
                        <article
                          className="qp-wo-card"
                          key={item.qp_id || `${roomIndex}-${productIndex}`}
                        >
                          <h4 className="qp-wo-product">
                            {item.product_name || `Product ${productIndex + 1}`}
                          </h4>
                          <span className="qp-wo-status">{statusTitle}</span>
                          <p className="qp-wo-remark">
                            {history?.remark?.trim() || "No work remark added."}
                          </p>
                          {imageUrl && (
                            <a
                              href={imageUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <img
                                className="qp-wo-image"
                                src={imageUrl}
                                alt={`Work update for ${item.product_name || "product"}`}
                              />
                            </a>
                          )}
                        </article>
                      );
                    })}
                  </div>
                </div>
              ))}
            </section>
          </div>

          {pdfChoiceOpen && (
            <div
              className="qp-pdf-overlay"
              role="presentation"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget && !generatingPdf)
                  setPdfChoiceOpen(false);
              }}
            >
              <div
                className="qp-pdf-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="qp-pdf-title"
              >
                <h2 id="qp-pdf-title">Choose what to download</h2>
                <p>
                  Select one document. The PDF will download directly to your
                  device.
                </p>
                {pdfError && <p className="qp-pdf-error">{pdfError}</p>}
                <button
                  disabled={generatingPdf}
                  onClick={() => void downloadPdf("quotation")}
                >
                  {generatingPdf
                    ? "Preparing PDF…"
                    : `${isInvoice ? "Invoice" : "Quotation"} only`}
                </button>
                <button
                  disabled={generatingPdf}
                  onClick={() => void downloadPdf("work-order")}
                >
                  {generatingPdf ? "Preparing PDF…" : "Work Order"}
                </button>
                <button
                  disabled={generatingPdf}
                  onClick={() => void downloadPdf("both")}
                >
                  {generatingPdf
                    ? "Preparing PDF…"
                    : `${isInvoice ? "Invoice" : "Quotation"} + Work Order`}
                </button>
                <button
                  className="qp-pdf-cancel"
                  disabled={generatingPdf}
                  onClick={() => setPdfChoiceOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

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
