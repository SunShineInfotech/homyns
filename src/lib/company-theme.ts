type CompanyTheme = {
  text_color?: string | null;
  background_color?: string | null;
};

const hexToHsl = (hex: string) => {
  const normalized = hex.replace(/^#/, "");
  const full = normalized.length === 3 ? normalized.split("").map((c) => c + c).join("") : normalized;
  if (!/^[\da-f]{6}$/i.test(full)) return null;

  const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1));
    switch (max) {
      case r: h = ((g - b) / delta) % 6; break;
      case g: h = (b - r) / delta + 2; break;
      default: h = (r - g) / delta + 4;
    }
    h *= 60;
    if (h < 0) h += 360;
  }
  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
};

export const applyCompanyTheme = (company?: CompanyTheme | null) => {
  if (!company || typeof document === "undefined") return;
  const root = document.documentElement;
  const background = company.background_color && hexToHsl(company.background_color);
  const foreground = company.text_color && hexToHsl(company.text_color);
  if (background) {
    const [hue, saturation, lightness] = background.split(" ");
    const light = Number.parseFloat(lightness);
    const direction = light > 55 ? -1 : 1;
    const shade = (amount: number) => `${hue} ${saturation} ${Math.max(0, Math.min(100, light + direction * amount))}%`;

    // Brand tokens drive primary buttons, focus rings, accents, and gradients
    // throughout the app. Keep destructive/success/warning colors semantic.
    root.style.setProperty("--primary", background);
    root.style.setProperty("--accent", shade(12));
    root.style.setProperty("--ring", background);
    root.style.setProperty("--primary-glow", shade(7));
    root.style.setProperty("--gradient-primary", `linear-gradient(135deg, hsl(${background}), hsl(${shade(7)}))`);
    root.style.setProperty("--gradient-accent", `linear-gradient(135deg, hsl(${background}), hsl(${shade(12)}))`);

    root.style.setProperty("--sidebar-bg", background);
    root.style.setProperty("--sidebar-accent", shade(7));
    root.style.setProperty("--sidebar-hover", shade(12));
  }
  if (foreground) {
    root.style.setProperty("--primary-foreground", foreground);
    root.style.setProperty("--accent-foreground", foreground);
    root.style.setProperty("--sidebar-foreground", foreground);
    root.style.setProperty("--sidebar-muted", foreground);
  }
};
