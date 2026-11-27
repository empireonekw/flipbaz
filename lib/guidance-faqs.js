/**
 * Marketplace FAQs for the seller Guidance page. Plain data (client-safe).
 * Marketplace menus and rules change: answers point to the setting by name
 * and tell sellers to check the platform's current policy where it matters.
 */

/** FAQ categories, in display order. */
export const FAQ_CATEGORIES = [
  { id: "etsy", label: "Etsy" },
  { id: "ebay", label: "eBay" },
  { id: "daraz", label: "Daraz" },
  { id: "listings", label: "Listings & SKU" },
  { id: "shipping", label: "Shipping" },
  { id: "orders", label: "Orders" },
  { id: "account", label: "Account setup" },
  { id: "issues", label: "Common issues" },
];

/** @type {{ id: string, cat: string, q: string, a: string }[]} */
export const MARKETPLACE_FAQS = [
  // Etsy
  {
    id: "etsy-partner",
    cat: "etsy",
    q: "How do I add Flip Baz as a production partner on Etsy?",
    a: "In Shop Manager open Settings, then Production partners, and choose Add a new production partner. Describe us as a leather and sportswear workshop in Sialkot, Pakistan, that makes your items to order. Then link that partner to every listing made by Flip Baz (in each listing's Production partners field). Etsy moves menus from time to time, so search for \"production partners\" in Shop Manager if you can't find it.",
  },
  {
    id: "etsy-partner-details",
    cat: "etsy",
    q: "What details should I enter for the production partner?",
    a: "Name: Flip Baz. Location: Sialkot, Pakistan. About: \"Workshop that cuts, stitches and finishes the items to my design and quality checks every order.\" Explain your own role honestly, for example choosing designs, colours and sizes, writing the listings and handling customers.",
  },
  {
    id: "etsy-disclosure",
    cat: "etsy",
    q: "When does Etsy expect me to disclose a production partner?",
    a: "Whenever someone outside your shop helps make the item. Because our workshop makes your products, list us on those listings. Etsy can ask questions or remove listings that don't disclose who makes them, so add it before you publish. Read Etsy's current Creativity Standards for the exact rules in your category.",
  },
  {
    id: "etsy-who-made",
    cat: "etsy",
    q: "What do I choose for \"Who made it?\" when listing on Etsy?",
    a: "Pick the option that matches how the item is made. For Flip Baz products, our partner workshop makes the item, so select the option that mentions another company or person, and attach Flip Baz as the production partner. Never mark an item as made only by you if it isn't.",
  },
  {
    id: "etsy-variations",
    cat: "etsy",
    q: "How do I set up sizes and colours on Etsy?",
    a: "In the listing editor, add Variations. Create one for Size and one for Colour, using exactly the sizes and colours shown on the product in the Flip Baz catalog. You can set a different price per size if larger sizes cost more. Only offer options we list, so every order can be made.",
  },
  {
    id: "etsy-personalisation",
    cat: "etsy",
    q: "Can I offer personalisation, like initials on a wallet?",
    a: "Ask us first, through a custom request or chat, and we'll confirm which products can be personalised. Once confirmed, turn on Personalisation in the Etsy listing, keep the instructions short (for example \"Up to 3 initials\"), and copy the buyer's text exactly into the order notes when you place the order with us.",
  },
  {
    id: "etsy-deactivate",
    cat: "etsy",
    q: "How do I pause or remove an Etsy listing?",
    a: "In Shop Manager go to Listings, tick the listing and choose Deactivate to hide it (you can turn it back on later). Delete removes it for good. Deactivate a listing if we mark a product as unavailable in the catalog, so you don't take orders you can't fill.",
  },
  // eBay
  {
    id: "ebay-variations",
    cat: "ebay",
    q: "How do I list several sizes or colours on eBay?",
    a: "Create one listing with variations: in the item specifics, add Size and Colour, then fill in the variation table with stock and price for each combination. Use the same names as the Flip Baz catalog. Set a realistic quantity (for example 5 each) rather than a huge number.",
  },
  {
    id: "ebay-revise",
    cat: "ebay",
    q: "How do I edit a live eBay listing?",
    a: "Open Seller Hub, go to Listings, find the item and choose Edit (sometimes called Revise). You can change price, photos, description and quantity. Some fields lock once the item has sold, in which case use Sell similar to make a fresh listing.",
  },
  {
    id: "ebay-handling",
    cat: "ebay",
    q: "What handling time should I set on eBay?",
    a: "Set it to cover our making time plus a day. Each product page shows its processing days, so if an item takes 7 days to make, set a handling time of at least 8 business days. A handling time that's too short leads to late-shipment marks on your account.",
  },
  {
    id: "ebay-tracking",
    cat: "ebay",
    q: "How do I add tracking to an eBay order?",
    a: "When we ship, the courier and tracking number appear on your Flip Baz order and in your Updates. In Seller Hub open the order, choose Add tracking, pick the courier (or Other) and paste the number. Upload it the same day so the buyer gets the update.",
  },
  {
    id: "ebay-item-location",
    cat: "ebay",
    q: "What item location should I show on eBay?",
    a: "Show where the item ships from: Sialkot, Pakistan. Buyers and eBay expect the real location, and a wrong one can cause problems with delivery estimates and disputes.",
  },
  // Daraz
  {
    id: "daraz-start",
    cat: "daraz",
    q: "Can I sell Flip Baz products on Daraz?",
    a: "Yes. Open a Daraz seller account, then list products using the photos and listing text from the catalog. When a Daraz order comes in, place it with us on the New order page and choose Daraz as the marketplace, with the Daraz order number.",
  },
  {
    id: "daraz-shipping",
    cat: "daraz",
    q: "How does shipping work with Daraz orders?",
    a: "Daraz has its own delivery rules, which depend on your seller account. Before your first Daraz order, message us in chat so we can agree how the parcel reaches Daraz or your buyer, and add any Daraz instructions to the order notes.",
  },
  // Listings & SKU
  {
    id: "sku-use",
    cat: "listings",
    q: "Which SKU should I use in my listings?",
    a: "Use the Flip Baz SKU from the product page (for example FB-LG-001), and add the size and colour if your marketplace needs one SKU per variation, like FB-LG-001-M-BLK. Matching SKUs make it quick to find the right product when you place an order.",
  },
  {
    id: "listing-photos",
    cat: "listings",
    q: "Can I use the catalog photos in my own listings?",
    a: "Yes, members can download the listing photos from each product page and use them on their own stores. Don't add other brands' logos to them, and don't claim they are photos of a different product.",
  },
  {
    id: "listing-text",
    cat: "listings",
    q: "Should I copy the listing text exactly?",
    a: "Use it as a starting point. The Copy listing text button gives you a ready description; then add your store's voice, your own title keywords and your shipping and return details. A little rewriting also helps your listing stand out from other sellers of the same product.",
  },
  {
    id: "listing-price",
    cat: "listings",
    q: "How should I price my listings?",
    a: "Start from the suggested price on the product page, then add your marketplace fees and any delivery you charge. Check the profit estimate: it already takes off our price and standard shipping. Analytics shows your real profit once you enter what customers paid.",
  },
  // Shipping
  {
    id: "ship-time",
    cat: "shipping",
    q: "How long does delivery take?",
    a: "Making and checking time is on each product page (usually 2 to 7 days), then the courier takes 2 to 4 days within Pakistan.",
  },
  {
    id: "ship-international",
    cat: "shipping",
    q: "Can you ship to my Etsy or eBay buyers abroad?",
    a: "Not yet: we currently ship within Pakistan. International fulfilment for Etsy, eBay and Amazon sellers is coming soon. Contact us if you'd like early access, and don't take international orders for Flip Baz products until it's live.",
  },
  {
    id: "ship-tracking",
    cat: "shipping",
    q: "Where do I get the tracking number?",
    a: "As soon as your order is shipped, the courier and tracking number appear on the order page, in Orders (the Track button) and in your Updates. Share it with your buyer and add it to your marketplace order.",
  },
  {
    id: "ship-branding",
    cat: "shipping",
    q: "Will the parcel show Flip Baz branding?",
    a: "Your buyer receives the parcel without any Flip Baz pricing inside. Branded packaging and custom labels are available on longer plans; ask us on WhatsApp.",
  },
  // Orders
  {
    id: "order-place",
    cat: "orders",
    q: "What do I do when a buyer orders from my store?",
    a: "Open New order, pick the product, size, colour and quantity, enter your buyer's name, phone and address, then pay and upload the payment proof. We confirm the payment, make the item, quality-check it and ship it to your buyer.",
  },
  {
    id: "order-cancel",
    cat: "orders",
    q: "Can I cancel an order after placing it?",
    a: "You can cancel from the order page while it's still awaiting payment. Once we've confirmed payment and started making it, message us in chat straight away: we'll stop it if production hasn't begun.",
  },
  {
    id: "order-returns",
    cat: "orders",
    q: "What if my buyer wants to return or exchange?",
    a: "If an item arrives faulty, tell us within 3 days of delivery with photos. If the fault is ours, we replace or repair it at no cost to you. For other requests, like a different size, message us with the order number and we'll tell you the options. See the refund policy for details.",
  },
  // Account setup
  {
    id: "account-membership",
    cat: "account",
    q: "Do I need a membership to sell Flip Baz products?",
    a: "You can browse the catalog without one, but prices, listing photos and ordering unlock with an active membership. Choose a plan on the Membership page and upload your payment proof; we activate it once it's verified.",
  },
  {
    id: "account-store-details",
    cat: "account",
    q: "Why should I add my store details in Settings?",
    a: "Your store name and selling platforms help us support you better and complete your launch checklist on Home. They're never shown to your buyers.",
  },
  {
    id: "account-which-marketplace",
    cat: "account",
    q: "Which marketplace should I start with?",
    a: "If you sell mainly in Pakistan, Daraz and Instagram are the quickest to start. For buyers abroad, Etsy suits leather goods and handmade-style products, and eBay suits sports gear and gloves. Start with one, get your first sales, then add another. Our Services team can also run stores for you.",
  },
  // Common issues
  {
    id: "issue-payment-rejected",
    cat: "issues",
    q: "Why was my payment proof rejected?",
    a: "Usually the screenshot doesn't show the transaction ID, the amount is different from the order total, or the same transaction was already used. The rejection note tells you why. Upload a clear new screenshot from the order page.",
  },
  {
    id: "issue-listing-removed",
    cat: "issues",
    q: "A marketplace removed my listing. What now?",
    a: "Read the platform's message: it normally names the rule. Common causes are a missing production partner (Etsy), wrong item location, or brand names in the title. Fix the listing and resubmit. If you're stuck, send us the message in chat and we'll help.",
  },
  {
    id: "issue-out-of-stock",
    cat: "issues",
    q: "A product I listed disappeared from the catalog.",
    a: "We hide products we can't make for a while. Pause that listing on your stores so you don't take orders for it. Your saved product stays in My listings history; if you need it urgently, ask us through a custom request.",
  },
];
