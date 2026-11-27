/**
 * Admin sidebar navigation, grouped. `badge` names a live count from
 * getAdminBadges() shown next to the item.
 * @type {{ title: string, items: { href: string, label: string, icon: string, exact?: boolean, badge?: string }[] }[]}
 */
export const ADMIN_NAV = [
  {
    title: "Business",
    items: [
      { href: "/admin", label: "Overview", icon: "grid", exact: true },
      { href: "/admin/orders", label: "Orders", icon: "orders" },
      { href: "/admin/payments", label: "Payments", icon: "cash", badge: "payments" },
      { href: "/admin/members", label: "Members", icon: "users" },
      { href: "/admin/plans", label: "Plans", icon: "membership" },
    ],
  },
  {
    title: "Catalog",
    items: [
      { href: "/admin/products", label: "Products", icon: "bag" },
      { href: "/admin/categories", label: "Categories", icon: "catalog" },
      { href: "/admin/requests", label: "Custom requests", icon: "request", badge: "requests" },
    ],
  },
  {
    title: "Sellers",
    items: [
      { href: "/admin/chats", label: "Chats", icon: "chat" },
      { href: "/admin/services", label: "Store management", icon: "services", badge: "services" },
      { href: "/admin/sessions", label: "Live sessions", icon: "video" },
      { href: "/admin/messages", label: "Messages", icon: "mail", badge: "messages" },
    ],
  },
  {
    title: "System",
    items: [{ href: "/admin/security", label: "Security", icon: "shield" }],
  },
];
