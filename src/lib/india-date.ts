const INDIA_TIME_ZONE = "Asia/Kolkata";

export const getIndiaDate = (daysOffset = 0): string => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: INDIA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  const [year, month, day] = [
    Number(values.year),
    Number(values.month),
    Number(values.day),
  ];
  const date = new Date(Date.UTC(year, month - 1, day + daysOffset));
  return date.toISOString().slice(0, 10);
};

export const getDateInIndia = (dateTime?: string): string => {
  if (!dateTime) return "";

  // API values without an offset are PHP timestamps already expressed in IST.
  if (!/(?:Z|[+-]\d{2}:?\d{2})$/i.test(dateTime)) {
    return dateTime.slice(0, 10);
  }

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: INDIA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(dateTime));
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
};
