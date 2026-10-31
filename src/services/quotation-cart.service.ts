import { apiClient, ApiResponse } from "./api.config";

const ACTIVE_CART_PREFIX = "active_quotation_cart_";
const API_URL = import.meta.env.VITE_API_URL || "";

export interface QuotationCart {
  cart_id: string;
  cart_number: string;
  company_id: string;
  client_id: string;
  client_name?: string;
  client_email?: string;
  phone1?: string;
  phone2?: string;
  whatsapp_number?: string;
  address?: string;
  state_id?: string;
  city_id?: string;
  area_id?: string;
  package_name?: string;
  generated_by_name?: string;
  status: string;
  current_step?: number | string;
  subtotal: string | number;
  final_amount: string | number;
  c_date: string;
  updated_at?: string;
  rooms?: any[];
  [key: string]: any;
}

let saveQueue: Promise<any> = Promise.resolve();

const getCompanyId = () => {
  try { return JSON.parse(localStorage.getItem("company_data") || "{}").company_id || ""; }
  catch { return ""; }
};

const getGeneratedBy = () => {
  try { return JSON.parse(localStorage.getItem("user_data") || "{}").emp_id || ""; }
  catch { return ""; }
};

export const getActiveQuotationCartId = (companyId = getCompanyId()) =>
  companyId ? localStorage.getItem(`${ACTIVE_CART_PREFIX}${companyId}`) || "" : "";

export const clearActiveQuotationCartId = (companyId = getCompanyId()) => {
  if (companyId) localStorage.removeItem(`${ACTIVE_CART_PREFIX}${companyId}`);
};

const toCartPayload = (data: any, currentStep = 1) => {
  const rooms = (data.rooms || [])
    .filter((room: any) => room.selected !== false)
    .map((room: any) => {
      const items = (room.items || []).filter((item: any) => item.included !== false).map((item: any) => {
        const qty = Number(item.quantity ?? item.qty ?? 1) || 1;
        const unitPrice = Number(item.unit_price ?? item.price ?? 0) || 0;
        const qtyType = item.qty_type || "Fixed";
        const toFeet = (value: number) => (item.measurement_unit || "feet") === "feet" ? value : value / 12;
        const h = toFeet(Number(item.height) || 0);
        const w = toFeet(Number(item.width) || 0);
        const depth = toFeet(Number(item.depth) || 0);
        const length = toFeet(Number(item.length) || 0);
        const calculatedQty = qtyType === "ByHW" ? h * w * qty
          : qtyType === "ByHWD" ? h * w * depth * qty
          : qtyType === "ByHWL" ? h * w * length * qty
          : qty;
        const roundedQty = Math.round(calculatedQty * 100) / 100;
        return {
          product_id: item.product_id,
          is_special: item.is_special ? 1 : 0,
          qty_type: qtyType,
          qty,
          height: Number(item.height) || 0,
          width: Number(item.width) || 0,
          depth: Number(item.depth) || 0,
          length: Number(item.length) || 0,
          dimension_unit: item.measurement_unit || "feet",
          unit_price: unitPrice,
          calculated_qty: roundedQty,
          total_price: Math.round(roundedQty * unitPrice * 100) / 100,
          remark: item.remark || "",
        };
      });
      if (!items.length) return null;
      return {
        room_id: room.room_id || room.id,
        room_total: items.reduce((total: number, item: any) => total + item.total_price, 0),
        items,
      };
    }).filter(Boolean);

  const subtotal = rooms.reduce((total: number, room: any) => total + room.room_total, 0);
  const discountType = data.discountType === "pct" ? "PCT" : "INR";
  const discountValue = Number(data.discountValue) || 0;
  const discountAmount = discountType === "PCT" ? subtotal * discountValue / 100 : discountValue;
  const afterDiscount = Math.max(0, subtotal - discountAmount);
  const gstPercent = Number(data.gstPercent ?? (data.withGst ? 18 : 0)) || 0;
  const gstAmount = afterDiscount * gstPercent / 100;

  return {
    company_id: getCompanyId(),
    client_id: data.selectedClient?.client_id || "",
    package_id: data.selectedPackage?.package_id || "",
    generated_by: getGeneratedBy(),
    current_step: currentStep,
    subtotal: Math.round(subtotal * 100) / 100,
    discount_type: discountType,
    discount_value: discountValue,
    discount_amount: Math.round(discountAmount * 100) / 100,
    amount_after_discount: Math.round(afterDiscount * 100) / 100,
    gst_applicable: gstPercent > 0 ? 1 : 0,
    gst_percent: gstPercent,
    gst_amount: Math.round(gstAmount * 100) / 100,
    final_amount: Math.round((afterDiscount + gstAmount) * 100) / 100,
    remark: data.specialInstructions || "",
    rooms,
  };
};

const saveDraftNow = async (data: any, currentStep = 1) => {
  const payload = toCartPayload(data, currentStep);
  if (!payload.company_id || !payload.client_id || !payload.generated_by) return null;
  const activeCartId = getActiveQuotationCartId(payload.company_id);
  const response = await apiClient.post(`${API_URL}quotation_cart.php`, {
    type: activeCartId ? 4 : 1,
    ...(activeCartId ? { cart_id: activeCartId } : {}),
    ...payload,
  });
  const result = response.data;
  if (result.status !== "success") throw new Error(result.message || "Could not save quotation draft");
  if (!activeCartId && result.cart_id) {
    localStorage.setItem(`${ACTIVE_CART_PREFIX}${payload.company_id}`, String(result.cart_id));
  }
  return result;
};

export const saveQuotationDraft = (data: any, currentStep = 1) => {
  const pending = saveQueue.then(() => saveDraftNow(data, currentStep));
  saveQueue = pending.catch(() => undefined);
  return pending;
};

const postCart = async (payload: Record<string, any>): Promise<any> => {
  const response = await apiClient.post(`${API_URL}quotation_cart.php`, payload);
  return response.data;
};

export const quotationCartService = {
  async getCarts(companyId = getCompanyId()): Promise<ApiResponse<QuotationCart[]>> {
    return postCart({ type: 2, company_id: companyId });
  },
  async getCart(cartId: string, companyId = getCompanyId()): Promise<ApiResponse<QuotationCart>> {
    return postCart({ type: 3, cart_id: cartId, company_id: companyId });
  },
  async saveDraft(data: any, currentStep = 1) { return saveQuotationDraft(data, currentStep); },
  async discard(cartId: string, companyId = getCompanyId()) {
    return postCart({ type: 5, cart_id: cartId, company_id: companyId });
  },
  async convert(cartId: string, companyId = getCompanyId()) {
    return postCart({ type: 6, cart_id: cartId, company_id: companyId });
  },
};
