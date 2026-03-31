# -*- coding: utf-8 -*-
"""
PwC Easy View 3.0 - Data Processor
Reads TB/JE CSV files and builds the complete financial dataset.
Extracted from build_data.py for use as a module in FastAPI.
"""

import csv
import os
import glob
from collections import defaultdict
from datetime import datetime


def parse_num(s):
    s = s.strip().replace('"', '').replace(' ', '')
    if not s or s == '-':
        return 0
    negative = False
    if s.startswith('(') and s.endswith(')'):
        negative = True
        s = s[1:-1]
    s = s.replace(',', '')
    try:
        val = float(s)
        return -val if negative else val
    except Exception:
        return 0


def safe_rate(current, prior):
    if prior == 0:
        return 0 if current == 0 else 100.0
    return round((current - prior) / abs(prior) * 100, 1)


class DataProcessor:
    def __init__(self, input_dir: str):
        self.input_dir = input_dir
        self.data = {}
        self.is_loaded = False

    def try_load(self):
        """Try to load data from existing CSV files in input directory."""
        tb_candidates = glob.glob(os.path.join(self.input_dir, "*TB*.csv"))
        je_candidates = glob.glob(os.path.join(self.input_dir, "*JE*.csv"))
        if tb_candidates and je_candidates:
            try:
                self.load(tb_candidates[0], je_candidates[0])
            except Exception as e:
                print(f"Auto-load failed: {e}")

    def load(self, tb_path: str, je_path: str):
        """Load and process TB and JE CSV files."""
        # Detect encoding
        encoding = self._detect_encoding(tb_path)

        tb = self._read_tb(tb_path, encoding)
        je = self._read_je(je_path, encoding)
        self.data = self._build_data(tb, je)
        self.is_loaded = True

    def _detect_encoding(self, path: str) -> str:
        for enc in ['utf-8-sig', 'utf-8', 'cp949', 'euc-kr']:
            try:
                with open(path, 'r', encoding=enc) as f:
                    line = f.readline()
                    if '계정' in line or '코드' in line or '구분' in line:
                        return enc
            except Exception:
                continue
        return 'cp949'

    def _read_tb(self, path: str, encoding: str) -> dict:
        tb = {}
        with open(path, 'r', encoding=encoding) as f:
            reader = csv.reader(f)
            next(reader)  # skip header
            for row in reader:
                if len(row) < 10:
                    continue
                tb[row[1].strip()] = {
                    'account': row[1].strip(),
                    'disclosure': row[3].strip(),
                    'management': row[4].strip(),
                    'gubun': row[5].strip(),
                    'category': row[6].strip(),
                    'aggregate': row[7].strip(),
                    'beginBalance': parse_num(row[9]),
                }
        return tb

    def _read_je(self, path: str, encoding: str) -> list:
        entries = []
        with open(path, 'r', encoding=encoding) as f:
            reader = csv.reader(f)
            next(reader)
            for row in reader:
                if len(row) < 18:
                    continue
                entries.append({
                    'date': row[0].strip(),
                    'voucher': row[1].strip(),
                    'side': row[2].strip(),
                    'amount': parse_num(row[3]),
                    'customer': row[4].strip(),
                    'customerTrans': row[5].strip(),
                    'memo': row[6].strip(),
                    'memoTrans': row[7].strip(),
                    'acctCode': row[8].strip(),
                    'companyAcct': row[9].strip(),
                    'account': row[11].strip(),
                    'mgmtAcct': row[12].strip(),
                    'disclosure': row[13].strip(),
                    'aggregate': row[14].strip(),
                    'category': row[15].strip(),
                    'gubun': row[16].strip(),
                    'recordId': row[17].strip(),
                })
        return entries

    def _build_data(self, tb: dict, je: list) -> dict:
        current_year = '2025'
        prior_year = '2024'
        current_cutoff = '2025-09-30'
        prior_cutoff = '2024-09-30'

        # PL aggregation
        pl_disclosure_current = defaultdict(float)
        pl_disclosure_prior = defaultdict(float)
        pl_mgmt_current = defaultdict(float)
        pl_mgmt_prior = defaultdict(float)
        monthly_revenue_current = [0] * 12
        monthly_revenue_prior = [0] * 12
        sales_by_customer_current = defaultdict(float)
        sales_by_customer_prior = defaultdict(float)

        # Monthly PL breakdown by month key (e.g., '2025-01')
        monthly_pl_disclosure = defaultdict(lambda: defaultdict(float))

        # Journal
        account_credit_totals = defaultdict(float)
        customer_credit_totals = defaultdict(float)

        # Scenario
        dup_key = defaultdict(list)
        scenario3_data = []
        scenario4_entries = []

        # BS movements
        bs_movements = defaultdict(float)

        for e in je:
            date = e['date']
            year = date[:4]
            month_idx = int(date[5:7]) - 1 if date[5:7].isdigit() else 0

            # PL
            if e['gubun'] == 'PL':
                if e['category'] in ('수익', '손익대체'):
                    net = e['amount'] if e['side'] == '대변' else -e['amount']
                else:
                    net = e['amount'] if e['side'] == '차변' else -e['amount']

                # Track monthly PL by disclosure account
                month_key = date[:7]
                monthly_pl_disclosure[month_key][e['disclosure']] += net

                if year == current_year and date <= current_cutoff:
                    pl_disclosure_current[e['disclosure']] += net
                    pl_mgmt_current[e['mgmtAcct']] += net
                    if e['disclosure'] == '매출액':
                        rev = e['amount'] if e['side'] == '대변' else -e['amount']
                        sales_by_customer_current[e['customer']] += rev
                        monthly_revenue_current[month_idx] += rev
                elif year == prior_year and date <= prior_cutoff:
                    pl_disclosure_prior[e['disclosure']] += net
                    pl_mgmt_prior[e['mgmtAcct']] += net
                    if e['disclosure'] == '매출액':
                        rev = e['amount'] if e['side'] == '대변' else -e['amount']
                        sales_by_customer_prior[e['customer']] += rev
                        monthly_revenue_prior[month_idx] += rev

            # BS movements (current year)
            if e['gubun'] == 'BS' and year == current_year and date <= current_cutoff:
                if e['side'] == '차변':
                    bs_movements[e['account']] += e['amount']
                else:
                    bs_movements[e['account']] -= e['amount']

            # Journal totals
            if e['side'] == '대변':
                account_credit_totals[e['account']] += e['amount']
                customer_credit_totals[e['customer']] += e['amount']

            # Scenario 1: duplicates
            if year == current_year and e['side'] == '차변' and e['gubun'] == 'PL' and e['amount'] >= 1000000:
                dup_key[(date[:7], e['account'], e['amount'])].append(e)

            # Scenario 3: weekend cash
            try:
                dt = datetime.strptime(date, '%Y-%m-%d')
                if dt.weekday() >= 5 and '보통예금' in e['account'] and e['side'] == '대변' and year == current_year:
                    scenario3_data.append({
                        'voucher': e['voucher'], 'account': e['account'],
                        'customer': e['customer'], 'credit': round(e['amount']), 'date': date,
                    })
            except Exception:
                pass

            # Scenario 4: large cash
            if '보통예금' in e['account'] and e['side'] == '대변' and e['amount'] >= 1000000000:
                scenario4_entries.append({
                    'voucher': e['voucher'], 'account': e['account'],
                    'customer': e['customer'], 'credit': round(e['amount']), 'date': date,
                })

        # Compute PL values
        revenue_c = pl_disclosure_current.get('매출액', 0)
        revenue_p = pl_disclosure_prior.get('매출액', 0)
        if revenue_c == 0:
            revenue_c = sum(monthly_revenue_current)
        if revenue_p == 0:
            revenue_p = sum(monthly_revenue_prior)
        revenue_c = abs(revenue_c)
        revenue_p = abs(revenue_p)

        cogs_c = pl_disclosure_current.get('매출원가', 0)
        cogs_p = pl_disclosure_prior.get('매출원가', 0)
        sga_c = pl_disclosure_current.get('판매비와관리비', 0)
        sga_p = pl_disclosure_prior.get('판매비와관리비', 0)

        sga_mgmt_names = [
            '급여','퇴직급여','복리후생비','여비교통비','접대비','통신비','세급과공과',
            '유형자산감가상각비','사용권자산상각비','지급임차료','보험료','차량유지비',
            '경상개발연구비','운반비','교육훈련비','도서인쇄비','포장비','소모품비',
            '지급수수료','광고선전비','판매촉진비','대손상각비','건물관리비','수출제비용',
            '판매수수료','무형자산상각비','해외출장비'
        ]

        if sga_c == 0:
            sga_c = sum(pl_mgmt_current.get(n, 0) for n in sga_mgmt_names)
        if sga_p == 0:
            sga_p = sum(pl_mgmt_prior.get(n, 0) for n in sga_mgmt_names)

        gross_c = revenue_c - cogs_c
        gross_p = revenue_p - cogs_p
        other_inc_c = pl_disclosure_current.get('기타수익', 0)
        other_inc_p = pl_disclosure_prior.get('기타수익', 0)
        other_exp_c = pl_disclosure_current.get('기타비용', 0)
        other_exp_p = pl_disclosure_prior.get('기타비용', 0)
        fin_inc_c = pl_disclosure_current.get('금융수익', 0)
        fin_inc_p = pl_disclosure_prior.get('금융수익', 0)
        fin_exp_c = pl_disclosure_current.get('금융비용', 0)
        fin_exp_p = pl_disclosure_prior.get('금융비용', 0)
        tax_c = pl_disclosure_current.get('법인세비용', 0)
        tax_p = pl_disclosure_prior.get('법인세비용', 0)
        op_c = gross_c - sga_c
        op_p = gross_p - sga_p
        net_c = op_c + other_inc_c - other_exp_c + fin_inc_c - fin_exp_c - tax_c
        net_p = op_p + other_inc_p - other_exp_p + fin_inc_p - fin_exp_p - tax_p

        # Build PL items
        pl_items = []

        def add_pl(name, c, p, level, bold, highlight=False):
            if c == 0 and p == 0:
                return
            pl_items.append({
                'account': name, 'current': round(c), 'prior': round(p),
                'change': round(c - p), 'changeRate': safe_rate(c, p),
                'level': level, 'bold': bold, 'highlight': highlight,
            })

        add_pl('매출액', revenue_c, revenue_p, 0, True)
        add_pl('제품매출', revenue_c, revenue_p, 1, False)
        add_pl('매출원가', cogs_c, cogs_p, 0, True)
        add_pl('판매비와관리비', sga_c, sga_p, 0, True)
        for n in sga_mgmt_names:
            add_pl(n, pl_mgmt_current.get(n, 0), pl_mgmt_prior.get(n, 0), 1, False)
        add_pl('기타수익', other_inc_c, other_inc_p, 0, True)
        add_pl('기타비용', other_exp_c, other_exp_p, 0, True)
        add_pl('금융수익', fin_inc_c, fin_inc_p, 0, True)
        add_pl('금융비용', fin_exp_c, fin_exp_p, 0, True)
        add_pl('법인세비용', tax_c, tax_p, 0, True)
        add_pl('당기순손익', net_c, net_p, 0, True, True)

        # Build BS
        bs_by_category = defaultdict(lambda: {'begin': 0, 'end': 0})
        bs_by_disclosure = defaultdict(lambda: {'begin': 0, 'end': 0})
        bs_items_raw = []

        for acct, info in tb.items():
            begin = info['beginBalance']
            movement = bs_movements.get(acct, 0)
            end = (begin - movement) if info['category'] in ('부채', '자본') else (begin + movement)

            bs_items_raw.append({**info, 'begin': begin, 'end': end, 'change': end - begin})
            bs_by_category[info['category']]['begin'] += begin
            bs_by_category[info['category']]['end'] += end
            bs_by_disclosure[info['disclosure']]['begin'] += begin
            bs_by_disclosure[info['disclosure']]['end'] += end

        bs_items = []
        for cat in ['자산', '부채', '자본']:
            b, e = bs_by_category[cat]['begin'], bs_by_category[cat]['end']
            bs_items.append({'category': cat, 'endBal': round(e), 'beginBal': round(b), 'change': round(e - b), 'level': 0, 'bold': True})

            agg_data = defaultdict(lambda: {'begin': 0, 'end': 0})
            for item in bs_items_raw:
                if item['category'] == cat:
                    agg_data[item['aggregate']]['begin'] += item['begin']
                    agg_data[item['aggregate']]['end'] += item['end']

            for agg_name, vals in sorted(agg_data.items()):
                if vals['begin'] == 0 and vals['end'] == 0:
                    continue
                display = '유동' if '유동' in agg_name and '비유동' not in agg_name else ('비유동' if '비유동' in agg_name else agg_name)
                bs_items.append({'category': display, 'endBal': round(vals['end']), 'beginBal': round(vals['begin']), 'change': round(vals['end'] - vals['begin']), 'level': 1, 'bold': True})

                added_disclosures = set()
                for item in sorted(bs_items_raw, key=lambda x: x['disclosure']):
                    if item['category'] == cat and item['aggregate'] == agg_name:
                        dk = item['disclosure']
                        if dk not in added_disclosures:
                            db, de = bs_by_disclosure[dk]['begin'], bs_by_disclosure[dk]['end']
                            if db != 0 or de != 0:
                                bs_items.append({'category': dk, 'endBal': round(de), 'beginBal': round(db), 'change': round(de - db), 'level': 2, 'bold': False})
                                added_disclosures.add(dk)

        # BS Trend
        months_all = sorted(set(e['date'][:7] for e in je))
        bs_trend = {'labels': [], 'assets': {'current': [], 'nonCurrent': []}, 'liabilities': {'current': [], 'nonCurrent': []}, 'equity': []}
        for month in months_all:
            mvmt = defaultdict(float)
            for e in je:
                if e['date'][:7] <= month and e['gubun'] == 'BS':
                    mvmt[e['account']] += e['amount'] if e['side'] == '차변' else -e['amount']

            ac, anc, lc, lnc, eq = 0, 0, 0, 0, 0
            for acct, info in tb.items():
                b = info['beginBalance']
                m = mvmt.get(acct, 0)
                end = (b - m) if info['category'] in ('부채', '자본') else (b + m)
                if info['category'] == '자산':
                    if '유동' in info['aggregate'] and '비유동' not in info['aggregate']:
                        ac += end
                    else:
                        anc += end
                elif info['category'] == '부채':
                    if '유동' in info['aggregate'] and '비유동' not in info['aggregate']:
                        lc += end
                    else:
                        lnc += end
                elif info['category'] == '자본':
                    eq += end

            bs_trend['labels'].append(month)
            bs_trend['assets']['current'].append(round(ac / 1e6))
            bs_trend['assets']['nonCurrent'].append(round(anc / 1e6))
            bs_trend['liabilities']['current'].append(round(lc / 1e6))
            bs_trend['liabilities']['nonCurrent'].append(round(lnc / 1e6))
            bs_trend['equity'].append(round(eq / 1e6))

        # Activity metrics
        days = 273
        avg_ar = (bs_by_disclosure.get('매출채권', {}).get('begin', 0) + bs_by_disclosure.get('매출채권', {}).get('end', 0)) / 2
        daily_rev = revenue_c / days if days else 0
        avg_inv = (bs_by_disclosure.get('재고자산', {}).get('begin', 0) + bs_by_disclosure.get('재고자산', {}).get('end', 0)) / 2
        daily_cogs = cogs_c / days if days else 0

        # Sales analysis
        customer_changes = {}
        for c in set(list(sales_by_customer_current.keys()) + list(sales_by_customer_prior.keys())):
            if c:
                customer_changes[c] = sales_by_customer_current.get(c, 0) - sales_by_customer_prior.get(c, 0)

        top_inc = sorted(customer_changes.items(), key=lambda x: x[1], reverse=True)[:10]
        top_dec = sorted(customer_changes.items(), key=lambda x: x[1])[:10]

        total_rev = sum(sales_by_customer_current.values())
        top_share = [{'name': n or '(공백)', 'share': round(a / total_rev * 100, 2) if total_rev else 0}
                     for n, a in sorted(sales_by_customer_current.items(), key=lambda x: x[1], reverse=True)[:10]]

        # Expense changes
        expense_changes = sorted(
            [{'name': n, 'amount': round(pl_mgmt_current.get(n, 0) - pl_mgmt_prior.get(n, 0))}
             for n in sga_mgmt_names if pl_mgmt_current.get(n, 0) - pl_mgmt_prior.get(n, 0) != 0],
            key=lambda x: x['amount'], reverse=True
        )

        # Asset/liability changes
        asset_changes = sorted(
            [{'name': d, 'amount': round(v['end'] - v['begin'])}
             for d, v in bs_by_disclosure.items()
             if any(i['category'] == '자산' and i['disclosure'] == d for i in bs_items_raw) and v['end'] - v['begin'] != 0],
            key=lambda x: x['amount'], reverse=True
        )
        liab_changes = sorted(
            [{'name': d, 'amount': round(v['end'] - v['begin'])}
             for d, v in bs_by_disclosure.items()
             if any(i['category'] == '부채' and i['disclosure'] == d for i in bs_items_raw) and v['end'] - v['begin'] != 0],
            key=lambda x: x['amount'], reverse=True
        )

        # Scenarios
        s1_exceptions = [{'period': k[0][2:], 'account': k[1], 'amount': round(k[2]), 'debitCount': len(v)}
                         for k, v in dup_key.items() if len(v) >= 2]

        # Scenario 5
        voucher_entries = defaultdict(list)
        for e in je:
            if e['date'][:4] == current_year:
                voucher_entries[e['voucher']].append(e)

        s5_entries = []
        for vid, ves in voucher_entries.items():
            has_exp = any(e['gubun'] == 'PL' and e['category'] == '비용' and e['side'] == '차변' for e in ves)
            cash = [e for e in ves if '보통예금' in e['account'] and e['side'] == '대변']
            if has_exp and cash:
                exp_t = sum(e['amount'] for e in ves if e['gubun'] == 'PL' and e['category'] == '비용' and e['side'] == '차변')
                cash_t = sum(e['amount'] for e in cash)
                if exp_t > 0:
                    s5_entries.append({'voucher': vid, 'expenseAmt': round(exp_t), 'cashAmt': round(cash_t)})

        # Scenario 6
        cust_freq = defaultdict(int)
        for e in je:
            if e['customer']:
                cust_freq[e['customer']] += 1
        seldom = [c for c, f in sorted(cust_freq.items()) if f == 1][:20]

        # Journal
        total_debit = sum(e['amount'] for e in je if e['side'] == '차변')
        total_credit = sum(e['amount'] for e in je if e['side'] == '대변')
        total_vouchers = len(set(e['voucher'] for e in je))
        top_accts = sorted(account_credit_totals.items(), key=lambda x: x[1], reverse=True)[:8]
        top_custs_credit = sorted(customer_credit_totals.items(), key=lambda x: x[1], reverse=True)[:10]
        tc_total = sum(customer_credit_totals.values())

        # Indicator values
        assets_end = bs_by_category['자산']['end']
        liab_end = bs_by_category['부채']['end']
        equity_end = bs_by_category['자본']['end']
        gm = round(gross_c / revenue_c * 100, 1) if revenue_c else 0
        om = round(op_c / revenue_c * 100, 1) if revenue_c else 0
        nm = round(net_c / revenue_c * 100, 1) if revenue_c else 0
        dr = round(liab_end / equity_end * 100, 1) if equity_end else 0

        agg_end = defaultdict(float)
        for item in bs_items_raw:
            agg_end[item['aggregate']] += item['end']
        ca = agg_end.get('유동자산', 0)
        cl = agg_end.get('유동부채', 0)
        cr = round(ca / cl * 100, 1) if cl else 0

        cc_current = len([c for c in sales_by_customer_current if sales_by_customer_current[c] > 0])
        cc_prior = len([c for c in sales_by_customer_prior if sales_by_customer_prior[c] > 0])

        # Available months and monthly PL breakdown
        available_months = sorted(set(e['date'][:7] for e in je))

        monthly_pl = {}
        for mk, disclosures in monthly_pl_disclosure.items():
            m_revenue = abs(disclosures.get('매출액', 0))
            m_cogs = disclosures.get('매출원가', 0)
            m_sga = disclosures.get('판매비와관리비', 0)
            if m_sga == 0:
                # Fall back to summing individual SGA items from mgmt accounts
                # We only have disclosure-level here, so keep 0 if not available
                pass
            m_gross = m_revenue - m_cogs
            m_op = m_gross - m_sga
            m_other_inc = disclosures.get('기타수익', 0)
            m_other_exp = disclosures.get('기타비용', 0)
            m_fin_inc = disclosures.get('금융수익', 0)
            m_fin_exp = disclosures.get('금융비용', 0)
            m_tax = disclosures.get('법인세비용', 0)
            m_net = m_op + m_other_inc - m_other_exp + m_fin_inc - m_fin_exp - m_tax

            monthly_pl[mk] = {
                'revenue': round(m_revenue),
                'cogs': round(m_cogs),
                'sga': round(m_sga),
                'operatingProfit': round(m_op),
                'netIncome': round(m_net),
            }

        return {
            'baseDate': '2025년 09월',
            'companyName': 'ABC Company',
            'summary': {
                'revenue': {'current': round(revenue_c), 'prior': round(revenue_p), 'changeRate': safe_rate(revenue_c, revenue_p)},
                'operatingProfit': {'current': round(op_c), 'prior': round(op_p), 'changeRate': safe_rate(op_c, op_p)},
                'assets': {'current': round(assets_end), 'prior': round(bs_by_category['자산']['begin']), 'changeRate': safe_rate(assets_end, bs_by_category['자산']['begin'])},
                'liabilities': {'current': round(liab_end), 'prior': round(bs_by_category['부채']['begin']), 'changeRate': safe_rate(liab_end, bs_by_category['부채']['begin'])},
                'revenueTopCustomers': [{'name': n, 'amount': round(a)} for n, a in top_inc[:3]],
                'expenseTopAccounts': expense_changes[:3],
                'assetTopAccounts': asset_changes[:3],
                'liabilityTopAccounts': liab_changes[:3],
                'profitIndicators': {'grossMargin': gm, 'operatingMargin': om, 'netMargin': nm},
                'liquidityIndicators': {'debtRatio': dr, 'currentRatio': cr},
                'scenarioCounts': {'duplicateAmount': len(s1_exceptions), 'cashAfterLiability': 0, 'weekendCash': len(scenario3_data), 'cashAndExpense': len(s5_entries[:50])},
            },
            'plItems': pl_items,
            'monthlyRevenue': {'current': [round(v / 1e6) for v in monthly_revenue_current], 'prior': [round(v / 1e6) for v in monthly_revenue_prior]},
            'monthlyOperatingProfit': {'current': [0]*12, 'prior': [0]*12},
            'monthlyNetIncome': {'current': [0]*12, 'prior': [0]*12},
            'monthlyGrossProfit': {'current': [0]*12, 'prior': [0]*12},
            'bsItems': bs_items,
            'bsTrend': bs_trend,
            'activityMetrics': {
                'arTurnover': {'days': round(avg_ar / daily_rev, 1) if daily_rev else 0, 'avgBalance': round(avg_ar), 'dailyRevenue': round(daily_rev)},
                'inventoryTurnover': {'days': round(avg_inv / daily_cogs, 1) if daily_cogs else 0, 'avgBalance': round(avg_inv), 'dailyCOGS': round(daily_cogs)},
            },
            'salesAnalysis': {
                'customerCount': {'current': cc_current, 'prior': cc_prior, 'change': cc_current - cc_prior, 'changeRate': safe_rate(cc_current, cc_prior)},
                'topCustomerShare': top_share,
                'topIncreaseCustomers': [{'name': n, 'amount': round(a)} for n, a in top_inc],
                'topDecreaseCustomers': [{'name': n, 'amount': round(a)} for n, a in top_dec if a < 0],
            },
            'quarterlyPL': {'headers': ['공시용계정'], 'rows': []},
            'availableMonths': available_months,
            'monthlyPL': monthly_pl,
            'journalSummary': {
                'totalEntries': total_vouchers,
                'totalDebit': round(total_debit),
                'totalCredit': round(total_credit),
                'topAccountsByCredit': [{'account': a, 'amount': round(v)} for a, v in top_accts],
                'topCustomersByCredit': [{'name': n or '(공백)', 'share': round(v / tc_total * 100, 2) if tc_total else 0} for n, v in top_custs_credit],
            },
            'scenarios': {
                'scenario1': {'title': '동일 금액 중복 전표', 'risk': '동일월에 동일한 증빙으로 이중 청구', 'count': len(s1_exceptions), 'exceptions': s1_exceptions[:20]},
                'scenario2': {'title': '현금지급 후 동일금액 월말 부채인식', 'risk': '월중 부채를 반제하면서 현금 집행한 후 월말 결산시 동일 금액의 부채를 재인식', 'count': 0, 'exceptions': []},
                'scenario3': {'title': '주말 현금 지급 전표', 'risk': '주말에 별도 승인 없이 현금 집행', 'count': len(scenario3_data), 'entries': scenario3_data[:20]},
                'scenario4': {'title': '고액 현금 지급 전표', 'risk': '고액 현금 인출을 통한 부정', 'count': len(scenario4_entries), 'entries': sorted(scenario4_entries, key=lambda x: x['date'], reverse=True)[:20]},
                'scenario5': {'title': '비용 인식과 동시에 현금지급 전표', 'risk': '충당금을 계상하지 않고 비용 인식과 동시에 현금지급, 발생주의 위배 가능성', 'count': len(s5_entries), 'entries': sorted(s5_entries, key=lambda x: x['cashAmt'], reverse=True)[:20]},
                'scenario6': {'title': 'Seldom Used Customer', 'risk': '사용 빈도가 낮은 거래처를 통한 회계 오류의 가능성이 있는 전표 식별', 'customers': seldom},
            },
        }
