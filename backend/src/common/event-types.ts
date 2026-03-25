export const EVENT_TYPES = [
  "page_view",
  "add_to_cart",
  "remove_from_cart",
  "checkout_started",
  "purchase"
] as const;

export type EventType = (typeof EVENT_TYPES)[number];
