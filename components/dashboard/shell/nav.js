/**
 * Seller sidebar navigation. `soon: true` items are planned pages shown as
 * disabled until they're built. `not` lists sub-paths that shouldn't light
 * up the item. `parent` marks a sub-item, shown indented and only while the
 * parent section is open.
 * @type {{ href: string, label: string, icon: string, exact?: boolean, soon?: boolean, not?: string[], parent?: string }[]}
 */
export const SELLER_NAV = [
  { href: "/dashboard", label: "Home", icon: "home", exact: true },
  { href: "/dashboard/orders", label: "Orders", icon: "orders", not: ["/dashboard/orders/new"] },
  { href: "/dashboard/orders/new", label: "New order", icon: "plus", exact: true },
  { href: "/dashboard/catalog", label: "Catalog", icon: "catalog", not: ["/dashboard/catalog/listings", "/dashboard/catalog/requests"] },
  { href: "/dashboard/catalog/listings", label: "My listings", icon: "bookmark", parent: "/dashboard/catalog" },
  { href: "/dashboard/catalog/requests", label: "Custom requests", icon: "request", parent: "/dashboard/catalog" },
  { href: "/dashboard/membership", label: "Membership", icon: "membership" },
  { href: "/dashboard/services", label: "Services", icon: "services", soon: true },
  { href: "/dashboard/finances", label: "Finances", icon: "finances" },
  { href: "/dashboard/analytics", label: "Analytics", icon: "analytics" },
  { href: "/dashboard/guidance", label: "Guidance", icon: "guidance", soon: true },
];

export const SELLER_NAV_BOTTOM = [{ href: "/dashboard/profile", label: "Settings", icon: "settings" }];
