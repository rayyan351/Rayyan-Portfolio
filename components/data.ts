export type Rect = [number, number, number, number]; // x, y, w, h in a 1440×900 frame

export type TreeLine = { depth: number; name: string; dir?: boolean; note?: string };

export type Project = {
  id: string;
  name: string;
  kind: string;
  year: string;
  stack: string[];
  live?: string;
  code?: string;
  shot: string;
  shotAlt: string;
  mobileShot: string;
  steps: [string, string, string, string]; // idea, design, code, ship
  wireframe: Rect[];
  tree: TreeLine[];
};

export const projects: Project[] = [
  {
    id: "cypress",
    name: "Cypress Grill",
    kind: "Restaurant website",
    year: "2025",
    stack: ["Next.js", "React", "CSS"],
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
      { depth: 1, name: "page.jsx" },
      { depth: 0, name: "components", dir: true },
      { depth: 1, name: "Navbar.jsx" },
      { depth: 1, name: "Hero.jsx" },
      { depth: 1, name: "Footer.jsx" },
      { depth: 0, name: "public/images", dir: true },
    ],
  },
  {
    id: "luxscents",
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
    kind: "Company website, built on contract",
    stack: "React, GSAP, Three.js",
    live: "https://nexusinftech.it.com",
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
};

export const reel: ReelItem[] = [
  { id: "luxscents", name: "LuxScents", kind: "Full-stack perfume store", video: "/reel/luxscents.mp4", poster: "/reel/luxscents.webp", href: "#build-luxscents", action: "See how it's built" },
  { id: "cypress", name: "Cypress Grill", kind: "Restaurant website", video: "/reel/cypress.mp4", poster: "/reel/cypress.webp", href: "#build-cypress", action: "See how it's built" },
  { id: "beast", name: "BEAST", kind: "Cinematic landing page", video: "/reel/beast.mp4", poster: "/reel/beast.webp", href: "https://cinematiclandingpage.vercel.app", action: "Visit the site" },
  { id: "functions", name: "Functions Global", kind: "Agency homepage", video: "/reel/functions.mp4", poster: "/reel/functions.webp", href: "#build-functions", action: "See how it's built" },
  { id: "salon", name: "Salon Luxe", kind: "Booking-focused salon site", video: "/reel/salon.mp4", poster: "/reel/salon.webp", href: "https://hair-salon-weld-three.vercel.app", action: "Visit the site" },
  { id: "mew", name: "Modern Engineering Works", kind: "Engineering firm website", video: "/reel/mew.mp4", poster: "/reel/mew.webp", href: "https://modern-engineering-works.vercel.app", action: "Visit the site" },
  { id: "nexus", name: "Nexus Infinity Tech", kind: "Company website, on contract", video: "/reel/nexus.mp4", poster: "/reel/nexus.webp", href: "https://nexusinftech.it.com", action: "Visit the site" },
];

export const reelTiles = reel.flatMap((r) => [`/reel/tile-${r.id}-0.webp`, `/reel/tile-${r.id}-1.webp`]);

export const timeline = [
  { year: "2022", title: "Started with HTML and CSS", body: "Learned from YouTube and rebuilt the YouTube interface as my first project." },
  { year: "2023", title: "Aptech diploma and first real sites", body: "Learned PHP and JavaScript, then built and ran the WordPress sites for my college's science and technology society." },
  { year: "2024", title: "React, Express and Next.js", body: "Taught myself the modern stack, while working with international customers at IBEX Global." },
  { year: "2025", title: "BS in Artificial Intelligence", body: "Started at Bahria University Karachi. Built the Nexus Infinity Tech website on contract and completed a data analytics training program in SQL and PostgreSQL." },
  { year: "2026", title: "Client and full-stack work", body: "Restaurant, agency and e-commerce builds, and now taking on remote and freelance projects." },
];

export const contact = {
  email: "rayyanhabib1@gmail.com",
  github: "https://github.com/rayyan351",
  linkedin: "https://www.linkedin.com/in/muhammad-rayyan-b101a621a",
};
