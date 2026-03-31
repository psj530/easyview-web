const BASE_URL = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api`
  : "/api";

async function fetchJSON<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${BASE_URL}${endpoint}`, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v) url.searchParams.set(k, v);
    });
  }
  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

/* ---------- Filter Types ---------- */

export type PeriodType = "ytd" | "yoy_month" | "mom";

export interface FilterParams {
  period?: PeriodType;
  month?: string;
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
  changeRate?: number;
  level: number;
  bold: boolean;
}

export interface MonthlyData {
  current: number[];
  prior: number[];
}

export interface MonthlyRateData {
  current: (number | null)[];
  prior: (number | null)[];
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
  monthlyRevenue?: MonthlyData;
  journalEntries?: JournalEntry[];
}

export interface QuarterlyPL {
  headers: string[];
  rows: { account: string; values: number[]; bold: boolean; highlight: boolean }[];
}

export interface PLMetricCard {
  label: string;
  current: number;
  prior: number;
  change: number;
  changeRate: number;
  marginLabel?: string;
  marginValue?: number;
}

export interface PLSummaryData {
  metrics: PLMetricCard[];
  monthlyRevenue: MonthlyData;
  monthlyOperatingProfit: MonthlyData;
  grossMarginRate: MonthlyRateData;
  operatingMarginRate: MonthlyRateData;
}

export interface PLTrendAccount {
  account: string;
  current: (number | null)[];
  prior: number[];
}

export interface JournalEntry {
  date: string;
  voucherNo: string;
  account: string;
  customer: string;
  memo: string;
  debit: number;
  credit: number;
}

export interface JournalSummary {
  totalEntries: number;
  totalDebit: number;
  totalCredit: number;
  dailyCredits?: { date: string; amount: number }[];
  topAccountsByCredit: { account: string; amount: number }[];
  topCustomersByCredit: TopShareItem[];
}

export interface JournalSearchResult {
  entries: JournalEntry[];
  totalCount: number;
}

export interface ScenarioSummaryRow {
  [key: string]: string | number;
}

export interface ScenarioDetailRow {
  [key: string]: string | number;
}

export interface ScenarioData {
  title: string;
  risk: string;
  count: number;
  summaryHeaders: string[];
  summaryRows: ScenarioSummaryRow[];
  detailHeaders: string[];
  detailRows: ScenarioDetailRow[];
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

export interface BSAccountDetail {
  labels: string[];
  balances: number[];
  counterparties: { name: string; amount: number }[];
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

function filterToParams(filter?: FilterParams): Record<string, string> | undefined {
  if (!filter) return undefined;
  const params: Record<string, string> = {};
  if (filter.period) params.period = filter.period;
  if (filter.month) params.month = filter.month;
  return Object.keys(params).length > 0 ? params : undefined;
}

export function fetchMeta() {
  return fetchJSON<MetaData>("/meta");
}

export function fetchMonths() {
  return fetchJSON<{ months: string[] }>("/months");
}

export function fetchSummary(filter?: FilterParams) {
  return fetchJSON<SummaryData>("/summary", filterToParams(filter));
}

export function fetchPL(filter?: FilterParams) {
  return fetchJSON<{
    plItems: PLItem[];
    monthlyRevenue: MonthlyData;
    monthlyOperatingProfit: MonthlyData;
    monthlyNetIncome: MonthlyData;
    monthlyGrossProfit: MonthlyData;
    quarterlyPL: QuarterlyPL;
    salesAnalysis: SalesAnalysis;
    activityMetrics: ActivityMetrics;
    plSummary?: PLSummaryData;
    plTrend?: PLTrendAccount[];
    grossMarginRate?: MonthlyRateData;
    operatingMarginRate?: MonthlyRateData;
  }>("/pl", filterToParams(filter));
}

export function fetchMonthlyPL(filter?: FilterParams) {
  return fetchJSON<{
    plSummary: PLSummaryData;
    plTrend: PLTrendAccount[];
  }>("/pl/monthly", filterToParams(filter));
}

export function fetchBS(filter?: FilterParams) {
  return fetchJSON<{
    bsItems: BSItem[];
    bsTrend: BSTrend;
    activityMetrics: ActivityMetrics;
    equity?: SummaryKPI;
    financialRatios?: {
      labels: string[];
      currentRatio: number[];
      quickRatio: number[];
      debtRatio: number[];
    };
  }>("/bs", filterToParams(filter));
}

export function fetchBSAccountDetail(account: string, filter?: FilterParams) {
  const params = filterToParams(filter) || {};
  params.account = account;
  return fetchJSON<BSAccountDetail>("/bs/account", params);
}

export function fetchSales(filter?: FilterParams) {
  return fetchJSON<SalesAnalysis>("/sales", filterToParams(filter));
}

export function fetchJournal(filter?: FilterParams & { startDate?: string; endDate?: string; target?: string }) {
  const params: Record<string, string> = {};
  if (filter?.period) params.period = filter.period;
  if (filter?.month) params.month = filter.month;
  if (filter?.startDate) params.startDate = filter.startDate;
  if (filter?.endDate) params.endDate = filter.endDate;
  if (filter?.target) params.target = filter.target;
  return fetchJSON<JournalSummary>("/journal", Object.keys(params).length > 0 ? params : undefined);
}

export function fetchJournalSearch(params: {
  startDate?: string;
  endDate?: string;
  account?: string;
  customer?: string;
  memo?: string;
  page?: number;
  pageSize?: number;
}) {
  const p: Record<string, string> = {};
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && v !== "") p[k] = String(v);
  });
  return fetchJSON<JournalSearchResult>("/journal/search", Object.keys(p).length > 0 ? p : undefined);
}

export function fetchScenarios(filter?: FilterParams & { dateFrom?: string; dateTo?: string; amountMin?: number; amountMax?: number }) {
  const params: Record<string, string> = {};
  if (filter?.period) params.period = filter.period;
  if (filter?.month) params.month = filter.month;
  if (filter?.dateFrom) params.dateFrom = filter.dateFrom;
  if (filter?.dateTo) params.dateTo = filter.dateTo;
  if (filter?.amountMin != null) params.amountMin = String(filter.amountMin);
  if (filter?.amountMax != null) params.amountMax = String(filter.amountMax);
  return fetchJSON<Scenarios>("/scenarios", Object.keys(params).length > 0 ? params : undefined);
}

export function fetchFullData() {
  return fetchJSON<FullData>("/data");
}

export function fetchHealth() {
  return fetchJSON<{ status: string }>("/health");
}
