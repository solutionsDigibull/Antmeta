import { Invoice } from "@/lib/types";

export const INVOICES: Invoice[] = [
  { id: "INV-2602-023", client: "Rajesh Kumar", amt: "₹4,425", type: "Standard", status: "overdue", due: "10 Feb 2026" },
  { id: "INV-2602-024", client: "TechCorp Pvt", amt: "₹32,250", type: "Premium TraaS", status: "pending", due: "28 Feb 2026" },
  { id: "INV-2602-025", client: "Priya Menon", amt: "₹8,850", type: "Exclusive", status: "paid", due: "15 Feb 2026" },
  { id: "INV-2602-026", client: "Arun Ventures", amt: "₹12,600", type: "Premium", status: "overdue", due: "5 Feb 2026" },
];
