import { KYCItem } from "@/lib/types";

export const KYCQ: KYCItem[] = [
  { id: "260116100001", name: "Rajesh Kumar", type: "individual", docs: ["PAN ✓", "Aadhaar ⏳"], time: "2h ago" },
  { id: "260116100004", name: "Arun Ventures LLP", type: "corporate", docs: ["Cert ✓", "Co PAN ✓", "Dir PAN ⏳", "GST ⏳", "MOA ⏳"], time: "5h ago" },
  { id: "KYC006", name: "Preethi Nair", type: "individual", docs: ["PAN ✓", "Aadhaar ✓"], time: "8h ago" },
  { id: "KYC007", name: "Sunrise Fintech", type: "corporate", docs: ["Cert ✓", "Co PAN ✓", "Dir PAN ✓", "GST ✓", "MOA ⏳"], time: "12h ago" },
];
