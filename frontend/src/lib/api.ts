const BASE_URL = "/api";

async function fetchJSON<T>(endpoint: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${endpoint}`);
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

/* ---------- Types ---------- */

export interface MetaData {
  baseDate: string;
  companyName: string;
}

export interface SummaryKPI {
  current: number;
  prior: number;
  changeRate: number;
}

export interface TopItem {
  name: string;
  amount: number;
}

export interface TopShareItem {
  name: string;
  share: number;
}

export interface SummaryData {
  revenue: SummaryKPI;
  operatingProfit: SummaryKPI;
  assets: SummaryKPI;
  liabilities: SummaryKPI;
  revenueTopCustomers: TopItem[];
  expenseTopAccounts: TopItem[];
  assetTopAccounts: TopItem[];
  liabilityTopAccounts: TopItem[];
  profitIndicators: {
    grossMargin: number;
    operatingMargin: number;
    netMargin: number;
  };
  liquidityIndicators: {
    debtRatio: number;
    currentRatio: number;
  };
  scenarioCounts: {
    duplicateAmount: number;
    cashAfterLiability: number;
    weekendCash: number;
    cashAndExpense: number;
  };
}

export interface PLItem {
  account: string;
  current: number;
  prior: number;
  change: number;
  changeRate: number;
  level: number;
  bold: boolean;
  highlight: boolean;
}

export interface BSItem {
  category: string;
  endBal: number;
  beginBal: number;
  change: number;
  level: number;
  bold: boolean;
}

export interface MonthlyData {
  current: number[];
  prior: number[];
}

export interface BSTrend {
  labels: string[];
  assets: { current: number[]; nonCurrent: number[] };
  liabilities: { current: number[]; nonCurrent: number[] };
  equity: number[];
}

export interface ActivityMetrics {
  arTurnover: { days: number; avgBalance: number; dailyRevenue: number };
  inventoryTurnover: { days: number; avgBalance: number; dailyCOGS: number };
}

export interface SalesAnalysis {
  customerCount: { current: number; prior: number; change: number; changeRate: number };
  topCustomerShare: TopShareItem[];
  topIncreaseCustomers: TopItem[];
  topDecreaseCustomers: TopItem[];
}

export interface QuarterlyPL {
  headers: string[];
  rows: { account: string; values: number[]; bold: boolean; highlight: boolean }[];
}

export interface JournalSummary {
  totalEntries: number;
  totalDebit: number;
  totalCredit: number;
  topAccountsByCredit: { account: string; amount: number }[];
  topCustomersByCredit: TopShareItem[];
}

export interface Scenario1 {
  title: string;
  risk: string;
  count: number;
  exceptions: { period: string; account: string; amount: number; debitCount: number }[];
}

export interface Scenario2 {
  title: string;
  risk: string;
  count: number;
  exceptions: { period: string; amount: number; count: number }[];
}

export interface Scenario3 {
  title: string;
  risk: string;
  count: number;
  entries: { voucher: string; account: string; customer: string; credit: number; date: string }[];
}

export interface Scenario4 {
  title: string;
  risk: string;
  count: number;
  entries: { voucher: string; account: string; customer: string; credit: number; date: string }[];
}

export interface Scenario5 {
  title: string;
  risk: string;
  count: number;
  entries: { voucher: string; expenseAmt: number; cashAmt: number }[];
}

export interface Scenario6 {
  title: string;
  risk: string;
  customers: string[];
}

export interface Scenarios {
  scenario1: Scenario1;
  scenario2: Scenario2;
  scenario3: Scenario3;
  scenario4: Scenario4;
  scenario5: Scenario5;
  scenario6: Scenario6;
}

export interface FullData {
  baseDate: string;
  companyName: string;
  summary: SummaryData;
  plItems: PLItem[];
  monthlyRevenue: MonthlyData;
  monthlyOperatingProfit: MonthlyData;
  monthlyNetIncome: MonthlyData;
  monthlyGrossProfit: MonthlyData;
  bsItems: BSItem[];
  bsTrend: BSTrend;
  activityMetrics: ActivityMetrics;
  salesAnalysis: SalesAnalysis;
  quarterlyPL: QuarterlyPL;
  journalSummary: JournalSummary;
  scenarios: Scenarios;
}

/* ---------- API Functions ---------- */

export function fetchMeta() {
  return fetchJSON<MetaData>("/meta");
}

export function fetchSummary() {
  return fetchJSON<SummaryData>("/summary");
}

export function fetchPL() {
  return fetchJSON<{
    plItems: PLItem[];
    monthlyRevenue: MonthlyData;
    monthlyOperatingProfit: MonthlyData;
    monthlyNetIncome: MonthlyData;
    monthlyGrossProfit: MonthlyData;
    quarterlyPL: QuarterlyPL;
    salesAnalysis: SalesAnalysis;
    activityMetrics: ActivityMetrics;
  }>("/pl");
}

export function fetchBS() {
  return fetchJSON<{
    bsItems: BSItem[];
    bsTrend: BSTrend;
    activityMetrics: ActivityMetrics;
  }>("/bs");
}

export function fetchSales() {
  return fetchJSON<SalesAnalysis>("/sales");
}

export function fetchJournal() {
  return fetchJSON<JournalSummary>("/journal");
}

export function fetchScenarios() {
  return fetchJSON<Scenarios>("/scenarios");
}

export function fetchFullData() {
  return fetchJSON<FullData>("/data");
}

export function fetchHealth() {
  return fetchJSON<{ status: string }>("/health");
}
