/**
 * Seller sidebar navigation. `soon: true` items are planned pages shown as
 * disabled until they're built.
 * @type {{ href: string, label: string, icon: string, exact?: boolean, soon?: boolean, not?: string, child?: boolean }[]}
 */
export const SELLER_NAV = [
  { href: "/dashboard", label: "Home", icon: "home", exact: true },
  { href: "/dashboard/orders", label: "Orders", icon: "orders", not: "/dashboard/orders/new" },
  { href: "/dashboard/orders/new", label: "New order", icon: "plus", exact: true },
  { href: "/dashboard/catalog", label: "Catalog", icon: "catalog" },
  { href: "/dashboard/membership", label: "Membership", icon: "membership" },
  { href: "/dashboard/services", label: "Services", icon: "services", soon: true },
  { href: "/dashboard/finances", label: "Finances", icon: "finances", soon: true },
  { href: "/dashboard/analytics", label: "Analytics", icon: "analytics", soon: true },
  { href: "/dashboard/guidance", label: "Guidance", icon: "guidance", soon: true },
];

export const SELLER_NAV_BOTTOM = [{ href: "/dashboard/profile", label: "Settings", icon: "settings" }];
