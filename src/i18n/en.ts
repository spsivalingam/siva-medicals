export const en = {
  meta: {
    tagline: "Trusted neighbourhood pharmacy",
    description:
      "Genuine medicines, a registered pharmacist on duty, health devices and local home delivery. Call or WhatsApp us.",
  },
  a11y: { skip: "Skip to main content" },
  nav: { label: "Main", switchTo: "தமிழ்", switchToLabel: "தமிழ் — View this page in Tamil" },
  cta: {
    call: "Call now",
    whatsapp: "WhatsApp us",
    directions: "Get directions",
    whatsappMessage: "Hello, I have a question about a medicine.",
  },
  bar: { label: "Quick contact", call: "Call", whatsapp: "WhatsApp", directions: "Directions" },
  hero: {
    eyebrow: "Registered pharmacist on duty",
    title: "Genuine medicines, close to home",
    lead: "Prescription medicines, everyday health needs and friendly advice. Call or WhatsApp to check availability before you visit.",
  },
  services: {
    title: "What we offer",
    items: [
      { icon: "pill", title: "Prescription medicines", body: "Dispensed by a registered pharmacist against a valid prescription." },
      { icon: "heart", title: "OTC & wellness", body: "Vitamins, first aid, personal care and everyday health essentials." },
      { icon: "baby", title: "Mother & baby care", body: "Baby food, diapers, skincare and maternity essentials." },
      { icon: "device", title: "Health devices", body: "BP monitors, glucometers, thermometers and nebulisers." },
      { icon: "truck", title: "Local home delivery", body: "Nearby same-day delivery. Prescription medicines are delivered only after our pharmacist checks a valid prescription." },
    ],
  },
  why: {
    title: "Why families choose us",
    items: [
      { icon: "shield", title: "Genuine stock", body: "Sourced only from licensed distributors." },
      { icon: "badge", title: "Qualified pharmacist", body: "Clear guidance on dosage and timing." },
      { icon: "clock", title: "Open late", body: "Drop in after work. See hours below." },
      { icon: "smile", title: "Friendly service", body: "We speak Tamil and English." },
    ],
  },
  hours: {
    title: "Opening hours",
    days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    closed: "Closed",
    openNow: "Open now",
    closedNow: "Closed now",
    openUntil: "Open now · closes {time}",
    closedUntil: "Closed now · opens {time}",
    note: "Hours may change on public holidays. Please call ahead.",
  },
  location: { title: "Find us", open: "Open in Google Maps" },
  contact: {
    title: "Contact us",
    lead: "Have a prescription? Send a photo on WhatsApp and we'll confirm availability.",
    phone: "Mobile",
    landline: "Landline",
    whatsapp: "WhatsApp",
    email: "Email",
    prescription: "Send prescription on WhatsApp",
    prescriptionMessage: "Hello, I'd like to check availability for my prescription. I'm attaching a photo.",
    privacy: "This website does not collect personal data. WhatsApp messages are handled under WhatsApp's own terms.",
  },
  footer: {
    licences: "Licences",
    form20: "Drug licence (Form 20)",
    form21: "Drug licence (Form 21)",
    gstin: "GSTIN",
    pharmacist: "Registered pharmacist",
    regNo: "Reg. no.",
    disclaimer:
      "Medicines are dispensed only against a valid prescription where required by law. Information on this site is not medical advice.",
    rights: "All rights reserved.",
  },
  notFound: {
    title: "Page not found",
    body: "Sorry, we couldn't find that page.",
    home: "Go to home page",
  },
};

export type Dict = typeof en;
