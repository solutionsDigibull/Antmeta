export interface User {
  name: string;
  role: string;
  type: "admin" | "client";
  id: string;
}

export interface Client {
  id: string;
  name: string;
  type: "individual" | "corporate";
  mob: string;
  email: string;
  pan: string;
  plan: string;
  kyc: "pending" | "verified" | "rejected";
  status: "active" | "pending" | "inactive";
  algo: string;
  partner: string;
  aum: string;
  pnl: string;
  joined: string;
}

export interface Master {
  id: string;
  name: string;
  assets: string;
  clients: number;
  pnl: string;
  status: "active" | "review";
  rate: string;
  trades: number;
}

export interface Partner {
  id: string;
  name: string;
  clients: number;
  aum: string;
  pnl: string;
  rev: string;
  status: "active" | "review";
}

export interface Invoice {
  id: string;
  client: string;
  amt: string;
  type: string;
  status: "overdue" | "pending" | "paid";
  due: string;
}

export interface Ticket {
  uuid: string;
  id: string;
  client: string;
  subj: string;
  pri: "high" | "medium" | "low";
  status: "open" | "resolved";
  time: string;
}

export interface KYCItem {
  id: string;
  name: string;
  type: "individual" | "corporate";
  docs: string[];
  time: string;
}

export interface NavSubItem {
  id: string;
  label: string;
  badge?: number;
  bt?: "warn" | "bad";
}

export interface NavItem {
  id: string;
  label: string;
  ico: string;
  sec?: string;
  sub?: NavSubItem[];
  badge?: number;
  bt?: "warn" | "bad";
}

export interface SignupData {
  mobile: string;
  name: string;
  email: string;
  accountType: "individual" | "corporate";
  password: string;
  confirmPw: string;
  phone?: string;
}
