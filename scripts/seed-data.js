/**
 * Static demo data for `npm run seed`. All copy here is original to Flip Baz.
 * Prices are in PKR.
 */

/** Membership plans: longer commitment → lower monthly price. */
export const plans = [
  {
    name: "Starter",
    months: 1,
    pricePerMonth: 2500,
    totalPrice: 2500,
    isRecommended: false,
    features: ["Full catalog with prices", "Listing images & text", "Order fulfilment"],
  },
  {
    name: "Quarterly",
    months: 3,
    pricePerMonth: 2200,
    totalPrice: 6600,
    isRecommended: true,
    features: [
      "Everything in Starter",
      "Save 12% per month",
      "Priority WhatsApp support",
    ],
  },
  {
    name: "Half-Year",
    months: 6,
    pricePerMonth: 2000,
    totalPrice: 12000,
    isRecommended: false,
    features: ["Everything in Quarterly", "Save 20% per month", "Early access to new products"],
  },
  {
    name: "Annual",
    months: 12,
    pricePerMonth: 1750,
    totalPrice: 21000,
    isRecommended: false,
    features: ["Everything in Half-Year", "Save 30% per month", "Custom branding requests"],
  },
];

/** Categories with their placeholder look. */
export const categories = [
  {
    name: "Leather Goods",
    slug: "leather-goods",
    description: "Full-grain jackets, wallets, bags and belts cut and stitched by hand.",
    glyph: "bag",
    colors: ["#7C3A1D", "#C2692F"],
    sortOrder: 1,
  },
  {
    name: "Sportswear",
    slug: "sportswear",
    description: "Team kits, training wear and gym basics in breathable fabrics.",
    glyph: "tshirt",
    colors: ["#0F766E", "#22A28E"],
    sortOrder: 2,
  },
  {
    name: "Boxing Gear",
    slug: "boxing-gear",
    description: "Gloves, mitts, headgear and wraps built for real training.",
    glyph: "glove",
    colors: ["#9F1239", "#E2445C"],
    sortOrder: 3,
  },
  {
    name: "Gloves",
    slug: "gloves",
    description: "Driving, riding, cycling and goalkeeper gloves for every season.",
    glyph: "hand",
    colors: ["#1E3A5F", "#3F6FA6"],
    sortOrder: 4,
  },
];

const ADULT_SIZES = ["S", "M", "L", "XL", "XXL"];

/**
 * Products. `category` is a category slug; `glyph` picks the placeholder
 * drawing. Shades vary per image to make galleries feel real.
 */
export const products = [
  // Leather goods
  {
    title: "Classic Biker Leather Jacket",
    category: "leather-goods",
    sku: "FB-LG-001",
    glyph: "jacket",
    costPrice: 9800,
    suggestedRetailPrice: 16999,
    sizes: ADULT_SIZES,
    colors: ["Black", "Dark Brown"],
    processingDays: 7,
    description:
      "An asymmetric-zip biker jacket in soft sheepskin, lined with quilted satin. Heavy brass zips, two zip pockets and adjustable waist tabs. Each piece is cut and stitched to order in our partner workshop, then checked seam by seam before it ships.",
  },
  {
    title: "Bifold Cowhide Wallet",
    category: "leather-goods",
    sku: "FB-LG-002",
    glyph: "wallet",
    costPrice: 1150,
    suggestedRetailPrice: 2499,
    sizes: [],
    colors: ["Black", "Tan", "Brown"],
    processingDays: 3,
    description:
      "A slim bifold with six card slots, a full-length note pocket and a hidden slip for receipts. Edges are burnished and hand-painted so they stay smooth with daily use. Fits easily in a front pocket.",
  },
  {
    title: "Leather Laptop Messenger Bag",
    category: "leather-goods",
    sku: "FB-LG-003",
    glyph: "bag",
    costPrice: 5200,
    suggestedRetailPrice: 8999,
    sizes: ['14"', '15.6"'],
    colors: ["Brown", "Black"],
    processingDays: 6,
    description:
      "A structured messenger with a padded laptop sleeve, two inner organiser pockets and a removable shoulder strap. Buffalo leather that darkens nicely over time, with antique-finish hardware.",
  },
  {
    title: "Hand-Stitched Leather Belt",
    category: "leather-goods",
    sku: "FB-LG-004",
    glyph: "belt",
    costPrice: 950,
    suggestedRetailPrice: 1999,
    sizes: ["32", "34", "36", "38", "40"],
    colors: ["Black", "Brown"],
    processingDays: 3,
    description:
      "A 35 mm single-piece belt with saddle stitching along both edges and a solid zinc-alloy buckle. Works with jeans or office trousers.",
  },
  // Sportswear
  {
    title: "Sublimated Football Kit",
    category: "sportswear",
    sku: "FB-SW-001",
    glyph: "tshirt",
    costPrice: 1350,
    suggestedRetailPrice: 2799,
    sizes: ADULT_SIZES,
    colors: ["Blue/White", "Red/Black", "Green/Yellow"],
    processingDays: 5,
    description:
      "Shirt and shorts set in lightweight polyester mesh with full sublimation printing, so colours never crack or peel. Great for club teams, schools and futsal leagues. Names and numbers available on request.",
  },
  {
    title: "Performance Gym Shorts",
    category: "sportswear",
    sku: "FB-SW-002",
    glyph: "shorts",
    costPrice: 650,
    suggestedRetailPrice: 1499,
    sizes: ADULT_SIZES,
    colors: ["Black", "Charcoal", "Navy"],
    processingDays: 3,
    description:
      "Quick-dry four-way stretch shorts with a 7-inch inseam, drawcord waist and a zipped side pocket for a phone or keys.",
  },
  {
    title: "Fleece Training Hoodie",
    category: "sportswear",
    sku: "FB-SW-003",
    glyph: "hoodie",
    costPrice: 2100,
    suggestedRetailPrice: 3999,
    sizes: ADULT_SIZES,
    colors: ["Black", "Grey Melange", "Maroon"],
    processingDays: 5,
    description:
      "A 320 GSM brushed-fleece hoodie with a double-layer hood, kangaroo pocket and ribbed cuffs. Warm enough for winter mornings and roomy enough to train in.",
  },
  {
    title: "Compression Training Tee",
    category: "sportswear",
    sku: "FB-SW-004",
    glyph: "tshirt",
    costPrice: 780,
    suggestedRetailPrice: 1699,
    sizes: ADULT_SIZES,
    colors: ["Black", "White", "Olive"],
    processingDays: 3,
    description:
      "A close-fitting tee with flat-lock seams that won't rub, and a fabric that moves sweat away from your skin. A strong seller for gyms and fitness pages.",
  },
  // Boxing gear
  {
    title: "Pro Training Boxing Gloves",
    category: "boxing-gear",
    sku: "FB-BX-001",
    glyph: "glove",
    costPrice: 2600,
    suggestedRetailPrice: 4999,
    sizes: ["10 oz", "12 oz", "14 oz", "16 oz"],
    colors: ["Red", "Black", "Blue"],
    processingDays: 5,
    description:
      "Multi-layer foam padding, an attached thumb and a wide hook-and-loop strap for solid wrist support. Synthetic leather outer with a mesh palm to keep hands cool on bag and pad work.",
  },
  {
    title: "Curved Focus Mitts (Pair)",
    category: "boxing-gear",
    sku: "FB-BX-002",
    glyph: "mitt",
    costPrice: 1900,
    suggestedRetailPrice: 3699,
    sizes: [],
    colors: ["Black/Red", "Black/Gold"],
    processingDays: 4,
    description:
      "Curved mitts that sit naturally on the coach's hands, with a dense shock-absorbing core and a padded finger grip. A clear target circle helps with accuracy drills.",
  },
  {
    title: "Open-Face Sparring Headgear",
    category: "boxing-gear",
    sku: "FB-BX-003",
    glyph: "headgear",
    costPrice: 2300,
    suggestedRetailPrice: 4499,
    sizes: ["S", "M", "L"],
    colors: ["Black", "Red", "Blue"],
    processingDays: 5,
    description:
      "Cheek and forehead protection with a wide field of view. Lace-up back and chin strap for a snug fit across head sizes.",
  },
  {
    title: "Cotton Hand Wraps 180\"",
    category: "boxing-gear",
    sku: "FB-BX-004",
    glyph: "wraps",
    costPrice: 280,
    suggestedRetailPrice: 699,
    sizes: [],
    colors: ["Black", "Red", "Blue", "White", "Pink"],
    processingDays: 2,
    description:
      "Semi-elastic cotton wraps with a thumb loop and wide closure. 180 inches long, which covers knuckles and wrist for most adults. Sold as a pair, so it works well as an add-on.",
  },
  // Gloves
  {
    title: "Leather Driving Gloves",
    category: "gloves",
    sku: "FB-GL-001",
    glyph: "hand",
    costPrice: 1250,
    suggestedRetailPrice: 2699,
    sizes: ["S", "M", "L", "XL"],
    colors: ["Tan", "Black", "Cognac"],
    processingDays: 4,
    description:
      "Unlined lambskin gloves with knuckle cut-outs and a snap closure at the wrist. Thin enough to feel the steering wheel, smart enough to wear every day.",
  },
  {
    title: "Goalkeeper Gloves",
    category: "gloves",
    sku: "FB-GL-002",
    glyph: "hand",
    costPrice: 1500,
    suggestedRetailPrice: 3199,
    sizes: ["7", "8", "9", "10"],
    colors: ["Neon Green", "Orange", "Black"],
    processingDays: 4,
    description:
      "3 mm German-style latex palm for strong grip, negative-cut fingers and a long wrist bandage. For academy and weekend league keepers.",
  },
  {
    title: "Half-Finger Cycling Gloves",
    category: "gloves",
    sku: "FB-GL-003",
    glyph: "hand",
    costPrice: 700,
    suggestedRetailPrice: 1599,
    sizes: ["S", "M", "L", "XL"],
    colors: ["Black", "Black/Red", "Black/Blue"],
    processingDays: 3,
    description:
      "Gel-padded palms that soak up road buzz, a breathable mesh back and pull-tabs for easy removal after a ride.",
  },
  {
    title: "Winter Motorbike Gloves",
    category: "gloves",
    sku: "FB-GL-004",
    glyph: "hand",
    costPrice: 2200,
    suggestedRetailPrice: 4299,
    sizes: ["M", "L", "XL"],
    colors: ["Black"],
    processingDays: 5,
    description:
      "Insulated full-gauntlet gloves with a water-resistant shell, hard knuckle guards and touchscreen-friendly fingertips. Built for cold rides in the north.",
  },
];
