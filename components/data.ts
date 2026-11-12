export type Rect = [number, number, number, number]; // x, y, w, h in a 1440×900 frame

export type TreeLine = { depth: number; name: string; dir?: boolean; note?: string };

export type Project = {
  id: string;
  name: string;
  kind: string;
  year: string;
  stack: string[];
  live?: string;
  liveLabel?: string;
  code?: string;
  shot: string;
  shotAlt: string;
  mobileShot: string;
  steps: [string, string, string, string]; // idea, design, code, ship
  accent: string;
  video?: string;
  excerpt?: { file: string; lines: string[] };
  wireframe: Rect[];
  tree: TreeLine[];
};

export const projects: Project[] = [
  {
    id: "boc",
    video: "/reel/boc.mp4",
    excerpt: { file: "back-end/utils/branchRoutingEngine.js", lines: ["const activeQueueCount = await Order.countDocuments({", "  branch: selectedBranch._id,", "  orderStatus: { $in: ['PENDING', 'PREPARING'] },", "});", "", "const prepTime = 15;", "const travelTime = Math.ceil(distKm * 2.5);", "const queueBuffer = Math.min(Math.floor(activeQueueCount / 2) * 3, 25);", "calculatedETA = prepTime + travelTime + queueBuffer;"] },
    name: "Burger O'Clock",
    kind: "Ordering platform and admin system, internship at CodeLabs",
    year: "2026",
    stack: ["Next.js", "Node.js", "Express", "MongoDB", "Redux", "Ant Design"],
    live: "https://burger-o-clock-gamma.vercel.app",
    code: "https://github.com/rayyan351/Intership_BOC",
    shot: "/work/boc-desktop-hero.webp",
    shotAlt: "Burger O'Clock storefront with a Share Box campaign banner, category rail and menu search",
    mobileShot: "/work/boc-desktop-hero.webp",
    accent: "#f2b705",
    steps: [
      "A multi-branch burger chain needed online ordering for customers and one system for staff to run menus, stock and branches.",
      "A bold storefront built around their campaign banners and a sticky category rail, plus an admin panel organised by job: products, orders, inventory, branches and settings.",
      "Orders go to the nearest branch with an ETA from its live kitchen queue. Recipes draw down stock earliest-expiry first inside a database transaction, and roles limit each staff account to its own branch.",
      "Shipped during my month at CodeLabs. Admin edits refresh the cached storefront straight away, so the menu stays current and the site stays fast.",
    ],
    wireframe: [
      [0, 0, 1440, 92],
      [110, 18, 95, 52],
      [215, 24, 140, 40],
      [330, 24, 130, 40],
      [1170, 20, 60, 50],
      [28, 100, 1384, 605],
      [130, 735, 1140, 42],
      [470, 825, 500, 58],
    ],
    tree: [
      { depth: 0, name: "front-end/src/app", dir: true },
      { depth: 1, name: "(site)", dir: true, note: "storefront" },
      { depth: 1, name: "admin/(dashboard)", dir: true },
      { depth: 2, name: "inventory/", dir: true, note: "stock, POs" },
      { depth: 2, name: "branchoperations/", dir: true, note: "staff, roles" },
      { depth: 2, name: "orders/", dir: true },
      { depth: 0, name: "back-end", dir: true },
      { depth: 1, name: "middleware", dir: true },
      { depth: 2, name: "rbacMiddleware.js", note: "roles + permissions" },
      { depth: 2, name: "branchScopeMiddleware.js" },
      { depth: 1, name: "services/inventoryDepletionService.js" },
      { depth: 1, name: "utils/branchRoutingEngine.js", note: "nearest branch + ETA" },
    ],
  },
  {
    id: "cypress",
    video: "/reel/cypress.mp4",
    excerpt: { file: "app/eat/brunch/page.tsx", lines: ["export default function BrunchPage() {", "  return (", "    <div className=\"menu-page\">", "      <h1 className=\"menu-title\">New Orleans Brunch</h1>", "      {/* … */}", "      <div className=\"menu-section\">", "        <h2>Brunch Specialties</h2>", "        <div className=\"menu-item\">", "          <div className=\"menu-left\">", "            <h4>Creole Eggs Benedict</h4>"] },
    accent: "#1fa192",
    name: "Cypress Grill",
    kind: "Restaurant website",
    year: "2025",
    stack: ["Next.js", "React", "TypeScript", "CSS"],
    live: "https://cypress-grill.vercel.app",
    code: "https://github.com/rayyan351/CypressGrill",
    shot: "/work/cypress-desktop-hero.webp",
    shotAlt: "Cypress Grill homepage with the welcome panel, featured dishes and a photo of a food spread",
    mobileShot: "/work/cypress-mobile-hero.webp",
    steps: [
      "A New Orleans-style grill in Austin needed one place where guests could find the menu, hours, delivery links and seasonal specials.",
      "I kept the restaurant's teal and cream, put ordering, DoorDash and reservations in the top bar, and gave the specials a readable panel over the dining-room photo.",
      "Built with the Next.js app router. Each menu category is its own route, so a guest can share a link straight to brunch or po'boys.",
      "Live on Vercel, with a menu that is easy to update one category at a time.",
    ],
    wireframe: [
      [0, 0, 1440, 57],
      [0, 57, 1440, 70],
      [136, 66, 141, 90],
      [676, 80, 560, 26],
      [136, 208, 608, 692],
      [185, 265, 430, 105],
      [185, 445, 495, 140],
      [805, 438, 499, 332],
    ],
    tree: [
      { depth: 0, name: "app", dir: true },
      { depth: 1, name: "eat", dir: true, note: "one route per menu" },
      { depth: 2, name: "brunch/", dir: true },
      { depth: 2, name: "poboys/", dir: true },
      { depth: 2, name: "cajun/", dir: true },
      { depth: 1, name: "catering", dir: true },
      { depth: 1, name: "drinks", dir: true },
      { depth: 1, name: "page.tsx" },
      { depth: 0, name: "components", dir: true },
      { depth: 1, name: "Navbar.jsx" },
      { depth: 1, name: "Hero.jsx" },
      { depth: 1, name: "Footer.jsx" },
      { depth: 0, name: "public/images", dir: true },
    ],
  },
  {
    id: "luxscents",
    video: "/reel/luxscents.mp4",
    excerpt: { file: "src/context/CartContext.js", lines: ["const addToCart = (product) => {", "  const existing = cartItems.find(item => item.id === product.id);", "  if (existing) {", "    setCartItems(cartItems.map(item =>", "      item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item", "    ));", "  } else {", "    setCartItems([...cartItems, { ...product, quantity: 1 }]);", "  }", "};"] },
    accent: "#c9a45c",
    name: "LuxScents",
    kind: "Full-stack perfume store",
    year: "2025",
    stack: ["React", "Node.js", "Express", "MongoDB", "JWT"],
    live: "https://perfume-store-frontend.vercel.app",
    code: "https://github.com/rayyan351/perfume-store-frontend",
    shot: "/work/luxscents-desktop-s2.webp",
    shotAlt: "LuxScents collection page showing three perfume cards with prices and a View Full Collection button",
    mobileShot: "/work/luxscents-mobile-hero.webp",
    steps: [
      "A complete online shop, not just a storefront: accounts, cart, checkout, order history and an admin view.",
      "Dark navigation and a warm gold accent for a premium feel, with plain white product cards so the bottles carry the colour.",
      "React front end with separate auth and cart contexts, talking to an Express and MongoDB API with JWT sign-in and email password resets.",
      "Deployed and working end to end, from browsing to placing an order.",
    ],
    wireframe: [
      [0, 0, 1440, 67],
      [130, 112, 360, 390],
      [540, 112, 360, 390],
      [951, 112, 360, 390],
      [210, 140, 200, 220],
      [612, 140, 216, 220],
      [1012, 133, 237, 237],
      [612, 583, 216, 47],
      [0, 710, 1440, 190],
    ],
    tree: [
      { depth: 0, name: "src", dir: true },
      { depth: 1, name: "context", dir: true },
      { depth: 2, name: "AuthContext.js", note: "JWT session" },
      { depth: 2, name: "CartContext.js" },
      { depth: 1, name: "pages", dir: true },
      { depth: 2, name: "CheckoutPage.js" },
      { depth: 2, name: "OrderHistoryPage.js" },
      { depth: 2, name: "AdminDashboardPage.js" },
      { depth: 2, name: "ResetPasswordPage.js" },
      { depth: 1, name: "components", dir: true },
      { depth: 2, name: "PerfumeCard.js" },
      { depth: 1, name: "data/perfumes.js" },
    ],
  },
  {
    id: "functions",
    video: "/reel/functions.mp4",
    excerpt: { file: "src/components/Hero.tsx", lines: ["export function Hero() {", "  const { scrollY } = useScroll();", "  const y = useTransform(scrollY, [0, 500], [0, 150]);", "  const opacity = useTransform(scrollY, [0, 300], [1, 0]);", "", "  return (", "    <section className=\"relative min-h-screen pt-20 overflow-hidden\">"] },
    accent: "#5b5bd6",
    name: "Functions Global",
    kind: "Agency homepage, Figma to React",
    year: "2025",
    stack: ["React", "TypeScript", "Vite", "Radix UI", "Motion"],
    live: "https://functions-global-design.vercel.app",
    code: "https://github.com/rayyan351/FUNCTIONS-GLOBAL-DESIGN",
    shot: "/work/functions-desktop-hero.webp",
    shotAlt: "Functions Global homepage hero with stats, call buttons and a product mockup",
    mobileShot: "/work/functions-mobile-hero.webp",
    steps: [
      "A digital agency wanted its navbar and hero redesigned so the page explains what they do and gets visitors to book a call.",
      "The design started in Figma: a clear headline, three proof points, one primary button, and a mockup that shows their work.",
      "Translated into typed React components, one per section, with accessible Radix primitives underneath.",
      "Shipped as a fast Vite build that matches the Figma file.",
    ],
    wireframe: [
      [112, 20, 175, 40],
      [490, 28, 506, 26],
      [1200, 22, 128, 36],
      [112, 160, 246, 38],
      [112, 232, 130, 55],
      [112, 302, 566, 72],
      [112, 406, 178, 106],
      [316, 406, 178, 106],
      [518, 406, 178, 106],
      [112, 544, 205, 48],
      [333, 544, 190, 48],
      [744, 295, 584, 252],
    ],
    tree: [
      { depth: 0, name: "src", dir: true },
      { depth: 1, name: "components", dir: true },
      { depth: 2, name: "Navbar.tsx" },
      { depth: 2, name: "Hero.tsx" },
      { depth: 2, name: "ServicesSection.tsx" },
      { depth: 2, name: "PortfolioSection.tsx" },
      { depth: 2, name: "TestimonialsSection.tsx" },
      { depth: 2, name: "ui", dir: true, note: "Radix primitives" },
      { depth: 1, name: "styles", dir: true },
      { depth: 1, name: "App.tsx" },
    ],
  },
];

export const moreWork = [
  {
    name: "Nexus Infinity Tech",
    kind: "Company website, built on contract. Archived after the client retired the domain.",
    stack: "React, GSAP, Three.js",
    live: "https://nexus-frontend-ashen-kappa.vercel.app",
    go: "Archive",
  },
  {
    name: "Modern Engineering Works",
    kind: "Engineering firm website with contact form",
    stack: "React, SCSS, Node.js, Nodemailer",
    live: "https://modern-engineering-works.vercel.app",
  },
  {
    name: "BEAST",
    kind: "Cinematic landing page",
    stack: "Figma, React, Framer Motion",
    live: "https://cinematiclandingpage.vercel.app",
  },
  {
    name: "Hair salon",
    kind: "Booking-focused landing page",
    stack: "Figma, React, Framer Motion",
    live: "https://hair-salon-weld-three.vercel.app",
  },
];

export type ReelItem = {
  id: string;
  name: string;
  kind: string;
  video: string;
  poster: string;
  /** In-page build section for featured projects, otherwise the live site. */
  href: string;
  action: string;
  accent: string;
};

export const reel: ReelItem[] = [
  { id: "boc", name: "Burger O'Clock", kind: "Ordering platform and admin system", video: "/reel/boc.mp4", poster: "/reel/boc.webp", href: "#build-boc", action: "See how it's built", accent: "#f2b705" },
  { id: "luxscents", name: "LuxScents", kind: "Full-stack perfume store", video: "/reel/luxscents.mp4", poster: "/reel/luxscents.webp", href: "#build-luxscents", action: "See how it's built", accent: "#c9a45c" },
  { id: "cypress", name: "Cypress Grill", kind: "Restaurant website", video: "/reel/cypress.mp4", poster: "/reel/cypress.webp", href: "#build-cypress", action: "See how it's built", accent: "#1fa192" },
  { id: "beast", name: "BEAST", kind: "Cinematic landing page", video: "/reel/beast.mp4", poster: "/reel/beast.webp", href: "https://cinematiclandingpage.vercel.app", action: "Visit the site", accent: "#d9542b" },
  { id: "functions", name: "Functions Global", kind: "Agency homepage", video: "/reel/functions.mp4", poster: "/reel/functions.webp", href: "#build-functions", action: "See how it's built", accent: "#5b5bd6" },
  { id: "salon", name: "Salon Luxe", kind: "Booking-focused salon site", video: "/reel/salon.mp4", poster: "/reel/salon.webp", href: "https://hair-salon-weld-three.vercel.app", action: "Visit the site", accent: "#c98a7a" },
  { id: "mew", name: "Modern Engineering Works", kind: "Engineering firm website", video: "/reel/mew.mp4", poster: "/reel/mew.webp", href: "https://modern-engineering-works.vercel.app", action: "Visit the site", accent: "#2f80d1" },
  { id: "nexus", name: "Nexus Infinity Tech", kind: "Company website, now retired", video: "/reel/nexus.mp4", poster: "/reel/nexus.webp", href: "https://nexus-frontend-ashen-kappa.vercel.app", action: "See the archived build", accent: "#8b5cf6" },
];


export type Art = "first-html" | "grades" | "society" | "calls" | "semester" | "nexus" | "boc" | "now";
export type Commit = { lane: "study" | "work" | "now"; year: string; title: string; short: string; body: string; art: Art };

export const history: Commit[] = [
  { lane: "study", year: "2022", title: "Learned HTML and CSS from YouTube", short: "First lines of code", art: "first-html", body: "My first project was a rebuild of the YouTube interface." },
  { lane: "study", year: "2023", title: "Aptech diploma, with Distinction", short: "Aptech diploma", art: "grades", body: "PHP, Laravel, JavaScript and MySQL, with 96 out of 100 in practicals." },
  { lane: "work", year: "2023", title: "Websites for my college's science society", short: "Society websites", art: "society", body: "Designed and ran the society's WordPress sites at Sceptre College, and was on the IT team for Sceptre Sonic II." },
  { lane: "work", year: "2024", title: "Customer service at ibex", short: "ibex", art: "calls", body: "Daily calls with US customers, first for DM Clinical Research and then for Walmart." },
  { lane: "study", year: "2025", title: "BS Artificial Intelligence, Bahria University", short: "Bahria University", art: "semester", body: "Alongside it, a data analytics program in SQL and PostgreSQL, and the design team for Teknofest Pre-Event '25." },
  { lane: "work", year: "2025", title: "Nexus Infinity Tech website, on contract", short: "Nexus Infinity Tech", art: "nexus", body: "Designed and built a London company's site with React, GSAP and Three.js." },
  { lane: "work", year: "2026", title: "Software development intern at CodeLabs", short: "CodeLabs internship", art: "boc", body: "Built Burger O'Clock's ordering platform and admin system in a month." },
  { lane: "now", year: "Now", title: "Studying AI and building for clients", short: "Now", art: "now", body: "Open to remote and freelance work in the evenings, Pakistan time, which overlaps with US mornings." },
];

export const contact = {
  email: "rayyanhabib1@gmail.com",
  github: "https://github.com/rayyan351",
  linkedin: "https://www.linkedin.com/in/muhammad-rayyan-b101a621a",
};
