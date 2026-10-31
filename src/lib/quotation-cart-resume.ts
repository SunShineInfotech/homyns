import type { QuotationCart } from "@/services/quotation-cart.service";
import { clearQuotationData, saveQuotationData } from "@/pages/CreateQuotation";

export const resumeQuotationCart = (cart: QuotationCart) => {
  clearQuotationData();
  if (cart.company_id) {
    localStorage.setItem(`active_quotation_cart_${cart.company_id}`, String(cart.cart_id));
  }

  saveQuotationData({
    selectedClient: {
      client_id: cart.client_id,
      client_name: cart.client_name,
      client_email: cart.client_email,
      phone1: cart.phone1,
      phone2: cart.phone2,
      whatsapp_number: cart.whatsapp_number,
      address: cart.address,
      state_id: cart.state_id,
      city_id: cart.city_id,
      area_id: cart.area_id,
    },
    selectedPackage: cart.package_id ? { package_id: cart.package_id, package_name: cart.package_name } : null,
    rooms: (cart.rooms || []).map((room: any) => ({
      ...room,
      id: room.room_id,
      name: room.room_name || "Room",
      selected: true,
      items: (room.items || []).map((item: any) => ({
        ...item,
        id: item.qcp_id,
        name: item.product_name || "Product",
        quantity: Number(item.qty) || 1,
        unit_price: Number(item.unit_price) || 0,
        measurement_unit: item.dimension_unit || "feet",
        included: true,
      })),
    })),
    expandedRooms: [],
    discountType: String(cart.discount_type).toUpperCase() === "PCT" ? "pct" : "rs",
    discountValue: Number(cart.discount_value) || 0,
    gstPercent: Number(cart.gst_percent) || 0,
    withGst: Number(cart.gst_applicable) === 1,
    specialInstructions: cart.remark || "",
    resumeCart: true,
  });

  return "items";
};
