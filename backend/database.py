# -*- coding: utf-8 -*-
"""
PwC Easy View 3.0 - SQLite Database Module
Manages TB/JE data in SQLite for efficient querying with filter support.
"""

import csv
import os
import sqlite3
from collections import defaultdict
from datetime import datetime, timedelta
from typing import Optional


DB_NAME = "easyview.db"


def parse_num(s: str) -> float:
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


def safe_rate(current: float, prior: float) -> float:
    if prior == 0:
        return 0 if current == 0 else 100.0
    return round((current - prior) / abs(prior) * 100, 1)


def detect_encoding(path: str) -> str:
    for enc in ['utf-8-sig', 'utf-8', 'cp949', 'euc-kr']:
        try:
            with open(path, 'r', encoding=enc) as f:
                line = f.readline()
                if '\uacc4\uc815' in line or '\ucf54\ub4dc' in line or '\uad6c\ubd84' in line:
                    return enc
        except Exception:
            continue
    return 'cp949'


SGA_MGMT_NAMES = [
    '\uae09\uc5ec','\ud1f4\uc9c1\uae09\uc5ec','\ubcf5\ub9ac\ud6c4\uc0dd\ube44','\uc5ec\ube44\uad50\ud1b5\ube44','\uc811\ub300\ube44','\ud1b5\uc2e0\ube44','\uc138\uae08\uacfc\uacf5\uacfc',
    '\uc720\ud615\uc790\uc0b0\uac10\uac00\uc0c1\uac01\ube44','\uc0ac\uc6a9\uad8c\uc790\uc0b0\uc0c1\uac01\ube44','\uc9c0\uae09\uc784\ucc28\ub8cc','\ubcf4\ud5d8\ub8cc','\ucc28\ub7c9\uc720\uc9c0\ube44',
    '\uacbd\uc0c1\uac1c\ubc1c\uc5f0\uad6c\ube44','\uc6b4\ubc18\ube44','\uad50\uc721\ud6c8\ub828\ube44','\ub3c4\uc11c\uc778\uc1c4\ube44','\ud3ec\uc7a5\ube44','\uc18c\ubaa8\ud488\ube44',
    '\uc9c0\uae09\uc218\uc218\ub8cc','\uad11\uace0\uc120\uc804\ube44','\ud310\ub9e4\ucd09\uc9c4\ube44','\ub300\uc190\uc0c1\uac01\ube44','\uac74\ubb3c\uad00\ub9ac\ube44','\uc218\ucd9c\uc81c\ube44\uc6a9',
    '\ud310\ub9e4\uc218\uc218\ub8cc','\ubb34\ud615\uc790\uc0b0\uc0c1\uac01\ube44','\ud574\uc678\ucd9c\uc7a5\ube44'
]


class Database:
    def __init__(self, db_dir: str):
        self.db_path = os.path.join(db_dir, DB_NAME)
        self.is_loaded = False
        # Cache for monthly PL data (populated on first PL query)
        self._monthly_pl_cache = None

    def _conn(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA journal_mode=WAL")
        return conn

    def try_load(self, input_dir: str):
        """Try to load from existing DB or rebuild from CSV."""
        if os.path.exists(self.db_path):
            try:
                conn = self._conn()
                count = conn.execute("SELECT COUNT(*) FROM je").fetchone()[0]
                conn.close()
                if count > 0:
                    self.is_loaded = True
                    return
            except Exception:
                pass

        import glob
        tb_candidates = glob.glob(os.path.join(input_dir, "*TB*.csv"))
        je_candidates = glob.glob(os.path.join(input_dir, "*JE*.csv"))
        if tb_candidates and je_candidates:
            try:
                self.import_csv(tb_candidates[0], je_candidates[0])
            except Exception as e:
                print(f"Auto-load failed: {e}")

    def import_csv(self, tb_path: str, je_path: str):
        """Import TB and JE CSV files into SQLite."""
        encoding = detect_encoding(tb_path)
        self._monthly_pl_cache = None  # Clear cache

        conn = self._conn()
        conn.execute("DROP TABLE IF EXISTS tb")
        conn.execute("DROP TABLE IF EXISTS je")

        conn.execute("""
            CREATE TABLE tb (
                first_trans TEXT, account TEXT, acct_code TEXT,
                disclosure TEXT, management TEXT, gubun TEXT,
                category TEXT, aggregate TEXT, company_acct TEXT,
                begin_balance REAL
            )
        """)

        conn.execute("""
            CREATE TABLE je (
                date TEXT, voucher TEXT, side TEXT, amount REAL,
                customer TEXT, customer_trans TEXT, memo TEXT, memo_trans TEXT,
                acct_code TEXT, company_acct TEXT, first_trans TEXT, account TEXT,
                mgmt_acct TEXT, disclosure TEXT, aggregate TEXT, category TEXT,
                gubun TEXT, record_id TEXT
            )
        """)

        # Import TB
        with open(tb_path, 'r', encoding=encoding) as f:
            reader = csv.reader(f)
            next(reader)
            rows = []
            for row in reader:
                if len(row) < 10:
                    continue
                rows.append((
                    row[0].strip(), row[1].strip(), row[2].strip(),
                    row[3].strip(), row[4].strip(), row[5].strip(),
                    row[6].strip(), row[7].strip(), row[8].strip(),
                    parse_num(row[9])
                ))
            conn.executemany("INSERT INTO tb VALUES (?,?,?,?,?,?,?,?,?,?)", rows)

        # Import JE
        je_encoding = detect_encoding(je_path)
        with open(je_path, 'r', encoding=je_encoding) as f:
            reader = csv.reader(f)
            next(reader)
            batch = []
            for row in reader:
                if len(row) < 18:
                    continue
                batch.append((
                    row[0].strip(), row[1].strip(), row[2].strip(),
                    parse_num(row[3]),
                    row[4].strip(), row[5].strip(), row[6].strip(),
                    row[7].strip(), row[8].strip(), row[9].strip(),
                    row[10].strip(), row[11].strip(), row[12].strip(),
                    row[13].strip(), row[14].strip(), row[15].strip(),
                    row[16].strip(), row[17].strip()
                ))
                if len(batch) >= 10000:
                    conn.executemany("INSERT INTO je VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", batch)
                    batch = []
            if batch:
                conn.executemany("INSERT INTO je VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", batch)

        # Create indexes
        conn.execute("CREATE INDEX idx_je_date ON je(date)")
        conn.execute("CREATE INDEX idx_je_gubun ON je(gubun)")
        conn.execute("CREATE INDEX idx_je_disclosure ON je(disclosure)")
        conn.execute("CREATE INDEX idx_je_side ON je(side)")
        conn.execute("CREATE INDEX idx_je_voucher ON je(voucher)")
        conn.execute("CREATE INDEX idx_je_customer ON je(customer)")
        conn.execute("CREATE INDEX idx_tb_account ON tb(account)")
        conn.execute("CREATE INDEX idx_tb_category ON tb(category)")

        conn.commit()
        conn.close()
        self.is_loaded = True

    # ====================================================================
    # Query helpers
    # ====================================================================

    def get_available_months(self) -> list:
        conn = self._conn()
        rows = conn.execute("SELECT DISTINCT substr(date,1,7) as m FROM je ORDER BY m").fetchall()
        conn.close()
        return [r[0] for r in rows]

    def _resolve_date_ranges(self, period: str, month: str):
        """Return (current_start, current_end, prior_start, prior_end)."""
        year = int(month[:4])
        mon = int(month[5:7])

        if period == 'ytd':
            current_start = f"{year}-01-01"
            current_end = self._month_end(year, mon)
            prior_start = f"{year-1}-01-01"
            prior_end = self._month_end(year-1, mon)
        elif period == 'yoy_month':
            current_start = f"{year}-{mon:02d}-01"
            current_end = self._month_end(year, mon)
            prior_start = f"{year-1}-{mon:02d}-01"
            prior_end = self._month_end(year-1, mon)
        elif period == 'mom':
            current_start = f"{year}-{mon:02d}-01"
            current_end = self._month_end(year, mon)
            if mon == 1:
                prior_start = f"{year-1}-12-01"
                prior_end = self._month_end(year-1, 12)
            else:
                prior_start = f"{year}-{mon-1:02d}-01"
                prior_end = self._month_end(year, mon-1)
        else:
            current_start = f"{year}-01-01"
            current_end = self._month_end(year, mon)
            prior_start = f"{year-1}-01-01"
            prior_end = self._month_end(year-1, mon)

        return current_start, current_end, prior_start, prior_end

    def _month_end(self, year: int, month: int) -> str:
        if month == 12:
            return f"{year}-12-31"
        next_month = datetime(year, month + 1, 1)
        last_day = next_month - timedelta(days=1)
        return last_day.strftime('%Y-%m-%d')

    def _aggregate_pl(self, conn, start: str, end: str) -> dict:
        rows = conn.execute("""
            SELECT disclosure,
                   SUM(CASE
                       WHEN category IN ('\uc218\uc775','\uc190\uc775\ub300\uccb4') THEN
                           CASE WHEN side='\ub300\ubcc0' THEN amount ELSE -amount END
                       ELSE
                           CASE WHEN side='\ucc28\ubcc0' THEN amount ELSE -amount END
                   END) as net
            FROM je WHERE gubun='PL' AND date BETWEEN ? AND ?
            GROUP BY disclosure
        """, (start, end)).fetchall()
        return {r['disclosure']: r['net'] for r in rows}

    def _aggregate_pl_mgmt(self, conn, start: str, end: str) -> dict:
        rows = conn.execute("""
            SELECT mgmt_acct,
                   SUM(CASE
                       WHEN category IN ('\uc218\uc775','\uc190\uc775\ub300\uccb4') THEN
                           CASE WHEN side='\ub300\ubcc0' THEN amount ELSE -amount END
                       ELSE
                           CASE WHEN side='\ucc28\ubcc0' THEN amount ELSE -amount END
                   END) as net
            FROM je WHERE gubun='PL' AND date BETWEEN ? AND ?
            GROUP BY mgmt_acct
        """, (start, end)).fetchall()
        return {r['mgmt_acct']: r['net'] for r in rows}

    def _get_monthly_pl_cache(self, conn):
        """Build and cache monthly PL breakdowns (disc + mgmt) for all months."""
        if self._monthly_pl_cache is not None:
            return self._monthly_pl_cache

        # Monthly disclosure-level PL
        disc_rows = conn.execute("""
            SELECT substr(date,1,7) as ym, disclosure,
                   SUM(CASE
                       WHEN category IN ('\uc218\uc775','\uc190\uc775\ub300\uccb4') THEN
                           CASE WHEN side='\ub300\ubcc0' THEN amount ELSE -amount END
                       ELSE
                           CASE WHEN side='\ucc28\ubcc0' THEN amount ELSE -amount END
                   END) as net
            FROM je WHERE gubun='PL'
            GROUP BY ym, disclosure
        """).fetchall()

        ym_disc = defaultdict(lambda: defaultdict(float))
        for r in disc_rows:
            ym_disc[r['ym']][r['disclosure']] = r['net']

        # Monthly mgmt-level PL
        mgmt_rows = conn.execute("""
            SELECT substr(date,1,7) as ym, mgmt_acct,
                   SUM(CASE
                       WHEN category IN ('\uc218\uc775','\uc190\uc775\ub300\uccb4') THEN
                           CASE WHEN side='\ub300\ubcc0' THEN amount ELSE -amount END
                       ELSE
                           CASE WHEN side='\ucc28\ubcc0' THEN amount ELSE -amount END
                   END) as net
            FROM je WHERE gubun='PL'
            GROUP BY ym, mgmt_acct
        """).fetchall()

        ym_mgmt = defaultdict(lambda: defaultdict(float))
        for r in mgmt_rows:
            ym_mgmt[r['ym']][r['mgmt_acct']] = r['net']

        self._monthly_pl_cache = (ym_disc, ym_mgmt)
        return self._monthly_pl_cache

    # ====================================================================
    # PL Data
    # ====================================================================

    def get_pl_data(self, period: str = 'ytd', month: str = '2025-09') -> dict:
        cs, ce, ps, pe = self._resolve_date_ranges(period, month)
        conn = self._conn()

        pl_current = self._aggregate_pl(conn, cs, ce)
        pl_prior = self._aggregate_pl(conn, ps, pe)
        pl_mgmt_current = self._aggregate_pl_mgmt(conn, cs, ce)
        pl_mgmt_prior = self._aggregate_pl_mgmt(conn, ps, pe)

        revenue_c = abs(pl_current.get('\ub9e4\ucd9c\uc561', 0))
        revenue_p = abs(pl_prior.get('\ub9e4\ucd9c\uc561', 0))
        cogs_c = pl_current.get('\ub9e4\ucd9c\uc6d0\uac00', 0)
        cogs_p = pl_prior.get('\ub9e4\ucd9c\uc6d0\uac00', 0)

        sga_c = pl_current.get('\ud310\ub9e4\ube44\uc640\uad00\ub9ac\ube44', 0)
        sga_p = pl_prior.get('\ud310\ub9e4\ube44\uc640\uad00\ub9ac\ube44', 0)
        if sga_c == 0:
            sga_c = sum(pl_mgmt_current.get(n, 0) for n in SGA_MGMT_NAMES)
        if sga_p == 0:
            sga_p = sum(pl_mgmt_prior.get(n, 0) for n in SGA_MGMT_NAMES)

        gross_c = revenue_c - cogs_c
        gross_p = revenue_p - cogs_p
        other_inc_c = pl_current.get('\uae30\ud0c0\uc218\uc775', 0)
        other_inc_p = pl_prior.get('\uae30\ud0c0\uc218\uc775', 0)
        other_exp_c = pl_current.get('\uae30\ud0c0\ube44\uc6a9', 0)
        other_exp_p = pl_prior.get('\uae30\ud0c0\ube44\uc6a9', 0)
        fin_inc_c = pl_current.get('\uae08\uc735\uc218\uc775', 0)
        fin_inc_p = pl_prior.get('\uae08\uc735\uc218\uc775', 0)
        fin_exp_c = pl_current.get('\uae08\uc735\ube44\uc6a9', 0)
        fin_exp_p = pl_prior.get('\uae08\uc735\ube44\uc6a9', 0)
        tax_c = pl_current.get('\ubc95\uc778\uc138\ube44\uc6a9', 0)
        tax_p = pl_prior.get('\ubc95\uc778\uc138\ube44\uc6a9', 0)
        op_c = gross_c - sga_c
        op_p = gross_p - sga_p
        net_c = op_c + other_inc_c - other_exp_c + fin_inc_c - fin_exp_c - tax_c
        net_p = op_p + other_inc_p - other_exp_p + fin_inc_p - fin_exp_p - tax_p

        # Build PL items list
        pl_items = []

        def add_pl(name, c, p, level, bold, highlight=False):
            if c == 0 and p == 0:
                return
            pl_items.append({
                'account': name, 'current': round(c), 'prior': round(p),
                'change': round(c - p), 'changeRate': safe_rate(c, p),
                'level': level, 'bold': bold, 'highlight': highlight,
            })

        add_pl('\ub9e4\ucd9c\uc561', revenue_c, revenue_p, 0, True)
        add_pl('\uc81c\ud488\ub9e4\ucd9c', revenue_c, revenue_p, 1, False)
        add_pl('\ub9e4\ucd9c\uc6d0\uac00', cogs_c, cogs_p, 0, True)
        add_pl('\ub9e4\ucd9c\ucd1d\uc774\uc775', gross_c, gross_p, 0, True, True)
        add_pl('\ud310\ub9e4\ube44\uc640\uad00\ub9ac\ube44', sga_c, sga_p, 0, True)
        for n in SGA_MGMT_NAMES:
            add_pl(n, pl_mgmt_current.get(n, 0), pl_mgmt_prior.get(n, 0), 1, False)
        add_pl('\uc601\uc5c5\uc774\uc775', op_c, op_p, 0, True, True)
        add_pl('\uae30\ud0c0\uc218\uc775', other_inc_c, other_inc_p, 0, True)
        add_pl('\uae30\ud0c0\ube44\uc6a9', other_exp_c, other_exp_p, 0, True)
        add_pl('\uae08\uc735\uc218\uc775', fin_inc_c, fin_inc_p, 0, True)
        add_pl('\uae08\uc735\ube44\uc6a9', fin_exp_c, fin_exp_p, 0, True)
        add_pl('\ubc95\uc778\uc138\ube44\uc6a9', tax_c, tax_p, 0, True)
        add_pl('\ub2f9\uae30\uc21c\uc190\uc775', net_c, net_p, 0, True, True)

        # Monthly data using cached batch query
        year = int(month[:4])
        prior_year = year - 1
        monthly_rev_c, monthly_rev_p = [0]*12, [0]*12
        monthly_gp_c, monthly_gp_p = [0]*12, [0]*12
        monthly_op_c, monthly_op_p = [0]*12, [0]*12
        monthly_ni_c, monthly_ni_p = [0]*12, [0]*12

        ym_disc, ym_mgmt = self._get_monthly_pl_cache(conn)

        def _compute_monthly(target_year, out_rev, out_gp, out_op, out_ni):
            for m in range(1, 13):
                ym = f"{target_year}-{m:02d}"
                disc = ym_disc.get(ym, {})
                mgmt = ym_mgmt.get(ym, {})
                m_rev = abs(disc.get('\ub9e4\ucd9c\uc561', 0))
                m_cogs = disc.get('\ub9e4\ucd9c\uc6d0\uac00', 0)
                m_sga = disc.get('\ud310\ub9e4\ube44\uc640\uad00\ub9ac\ube44', 0)
                if m_sga == 0:
                    m_sga = sum(mgmt.get(n, 0) for n in SGA_MGMT_NAMES)
                m_gross = m_rev - m_cogs
                m_other_inc = disc.get('\uae30\ud0c0\uc218\uc775', 0)
                m_other_exp = disc.get('\uae30\ud0c0\ube44\uc6a9', 0)
                m_fin_inc = disc.get('\uae08\uc735\uc218\uc775', 0)
                m_fin_exp = disc.get('\uae08\uc735\ube44\uc6a9', 0)
                m_tax = disc.get('\ubc95\uc778\uc138\ube44\uc6a9', 0)
                m_op = m_gross - m_sga
                m_net = m_op + m_other_inc - m_other_exp + m_fin_inc - m_fin_exp - m_tax
                out_rev[m-1] = round(m_rev / 1e6)
                out_gp[m-1] = round(m_gross / 1e6)
                out_op[m-1] = round(m_op / 1e6)
                out_ni[m-1] = round(m_net / 1e6)

        _compute_monthly(year, monthly_rev_c, monthly_gp_c, monthly_op_c, monthly_ni_c)
        _compute_monthly(prior_year, monthly_rev_p, monthly_gp_p, monthly_op_p, monthly_ni_p)

        # Margin rates
        gross_margin_c = [round(monthly_gp_c[i] / monthly_rev_c[i] * 100, 1) if monthly_rev_c[i] else None for i in range(12)]
        gross_margin_p = [round(monthly_gp_p[i] / monthly_rev_p[i] * 100, 1) if monthly_rev_p[i] else None for i in range(12)]
        op_margin_c = [round(monthly_op_c[i] / monthly_rev_c[i] * 100, 1) if monthly_rev_c[i] else None for i in range(12)]
        op_margin_p = [round(monthly_op_p[i] / monthly_rev_p[i] * 100, 1) if monthly_rev_p[i] else None for i in range(12)]

        # PL Trend (monthly SGA by mgmt account) - use cached data
        pl_trend = []
        for acct_name in SGA_MGMT_NAMES:
            current_vals = []
            prior_vals = []
            for m in range(1, 13):
                ym_c = f"{year}-{m:02d}"
                ym_p = f"{prior_year}-{m:02d}"
                c_val = ym_mgmt.get(ym_c, {}).get(acct_name, 0)
                p_val = ym_mgmt.get(ym_p, {}).get(acct_name, 0)
                current_vals.append(round(c_val / 1e6, 1) if c_val else None)
                prior_vals.append(round(p_val / 1e6, 1) if p_val else 0)

            if any(v and v != 0 for v in current_vals) or any(v != 0 for v in prior_vals):
                pl_trend.append({
                    'account': acct_name,
                    'current': current_vals,
                    'prior': prior_vals,
                })

        # Expense changes
        expense_changes = sorted(
            [{'name': n, 'amount': round(pl_mgmt_current.get(n, 0) - pl_mgmt_prior.get(n, 0))}
             for n in SGA_MGMT_NAMES if pl_mgmt_current.get(n, 0) - pl_mgmt_prior.get(n, 0) != 0],
            key=lambda x: x['amount'], reverse=True
        )

        conn.close()

        return {
            'plItems': pl_items,
            'monthlyRevenue': {'current': monthly_rev_c, 'prior': monthly_rev_p},
            'monthlyOperatingProfit': {'current': monthly_op_c, 'prior': monthly_op_p},
            'monthlyNetIncome': {'current': monthly_ni_c, 'prior': monthly_ni_p},
            'monthlyGrossProfit': {'current': monthly_gp_c, 'prior': monthly_gp_p},
            'grossMarginRate': {'current': gross_margin_c, 'prior': gross_margin_p},
            'operatingMarginRate': {'current': op_margin_c, 'prior': op_margin_p},
            'plTrend': pl_trend,
            'quarterlyPL': self.get_quarterly_pl(month),
            'expenseChanges': expense_changes,
            'revenue': {'current': round(revenue_c), 'prior': round(revenue_p), 'changeRate': safe_rate(revenue_c, revenue_p)},
            'operatingProfit': {'current': round(op_c), 'prior': round(op_p), 'changeRate': safe_rate(op_c, op_p)},
            'profitIndicators': {
                'grossMargin': round(gross_c / revenue_c * 100, 1) if revenue_c else 0,
                'operatingMargin': round(op_c / revenue_c * 100, 1) if revenue_c else 0,
                'netMargin': round(net_c / revenue_c * 100, 1) if revenue_c else 0,
            },
        }

    # ====================================================================
    # BS Data
    # ====================================================================

    def get_bs_data(self, period: str = 'ytd', month: str = '2025-09', bs_compare: str = 'year_start') -> dict:
        conn = self._conn()
        year = int(month[:4])
        mon = int(month[5:7])
        current_start = f"{year}-01-01"
        current_end = self._month_end(year, mon)

        tb_rows = conn.execute("SELECT * FROM tb").fetchall()
        tb = {}
        for r in tb_rows:
            tb[r['account']] = dict(r)

        bs_movements = {}
        mvmt_rows = conn.execute("""
            SELECT account,
                   SUM(CASE WHEN side='\ucc28\ubcc0' THEN amount ELSE -amount END) as net
            FROM je WHERE gubun='BS' AND date BETWEEN ? AND ?
            GROUP BY account
        """, (current_start, current_end)).fetchall()
        for r in mvmt_rows:
            bs_movements[r['account']] = r['net']

        bs_by_category = defaultdict(lambda: {'begin': 0, 'end': 0})
        bs_by_disclosure = defaultdict(lambda: {'begin': 0, 'end': 0})
        bs_items_raw = []

        for acct, info in tb.items():
            begin = info['begin_balance']
            movement = bs_movements.get(acct, 0)
            end = (begin - movement) if info['category'] in ('\ubd80\ucc44', '\uc790\ubcf8') else (begin + movement)
            item = {**info, 'begin': begin, 'end': end, 'change': end - begin}
            bs_items_raw.append(item)
            bs_by_category[info['category']]['begin'] += begin
            bs_by_category[info['category']]['end'] += end
            bs_by_disclosure[info['disclosure']]['begin'] += begin
            bs_by_disclosure[info['disclosure']]['end'] += end

        # Include JE-only BS accounts (not in TB but have JE movements)
        je_only_rows = conn.execute("""
            SELECT je.account, je.category, je.disclosure, je.aggregate,
                   SUM(CASE WHEN je.side='\ucc28\ubcc0' THEN je.amount ELSE -je.amount END) as net
            FROM je LEFT JOIN tb ON je.account = tb.account
            WHERE tb.account IS NULL AND je.gubun='BS'
              AND je.date BETWEEN ? AND ?
            GROUP BY je.account, je.category, je.disclosure, je.aggregate
        """, (current_start, current_end)).fetchall()
        for r in je_only_rows:
            movement = r['net']
            cat = r['category']
            end = -movement if cat in ('\ubd80\ucc44', '\uc790\ubcf8') else movement
            info = {'account': r['account'], 'category': cat, 'disclosure': r['disclosure'],
                    'aggregate': r['aggregate'], 'begin_balance': 0, 'gubun': 'BS',
                    'management': r['disclosure'], 'first_trans': r['account'],
                    'acct_code': '', 'company_acct': r['account']}
            item = {**info, 'begin': 0, 'end': end, 'change': end}
            bs_items_raw.append(item)
            bs_by_category[cat]['end'] += end
            bs_by_disclosure[r['disclosure']]['end'] += end

        # Add net income to equity end balance (merged into 자본 accounts)
        net_income = 0
        try:
            pl = self.get_pl_data(period, month)
            for item in pl.get('plItems', []):
                if item['account'] == '당기순손익':
                    net_income = item['current']
                    break
            bs_by_category['자본']['end'] += net_income
            # Distribute net income into 자본 sub-accounts proportionally
            if net_income and bs_items_raw:
                equity_items = [i for i in bs_items_raw if i['category'] == '자본']
                if equity_items:
                    # Add to the first equity aggregate and its disclosure
                    first_agg = equity_items[0]['aggregate']
                    first_disc = equity_items[0]['disclosure']
                    for item in bs_items_raw:
                        if item['category'] == '자본' and item['aggregate'] == first_agg:
                            item['end'] += net_income
                            item['change'] = item['end'] - item['begin']
                            break
                    bs_by_disclosure[first_disc]['end'] += net_income
        except Exception:
            pass

        # For 월초 (month_start) comparison: recalculate begin as balance at month start
        if bs_compare == 'month_start':
            prev_end = f"{year}-{mon:02d}-01"  # month start = previous month end + 1
            if mon == 1:
                prev_month_end = self._month_end(year - 1, 12)
            else:
                prev_month_end = self._month_end(year, mon - 1)
            # Recalculate begin balances as TB begin + movements up to prev month end
            prev_mvmt_rows = conn.execute("""
                SELECT account, SUM(CASE WHEN side='\ucc28\ubcc0' THEN amount ELSE -amount END) as net
                FROM je WHERE gubun='BS' AND date BETWEEN ? AND ?
                GROUP BY account
            """, (current_start, prev_month_end)).fetchall()
            prev_mvmt = {r['account']: r['net'] for r in prev_mvmt_rows}

            # Reset begin values
            for cat_key in bs_by_category:
                bs_by_category[cat_key]['begin'] = 0
            for disc_key in bs_by_disclosure:
                bs_by_disclosure[disc_key]['begin'] = 0

            for item in bs_items_raw:
                acct = item['account']
                tb_begin = item.get('begin_balance', 0)
                pm = prev_mvmt.get(acct, 0)
                new_begin = (tb_begin - pm) if item['category'] in ('\ubd80\ucc44', '\uc790\ubcf8') else (tb_begin + pm)
                item['begin'] = new_begin
                item['change'] = item['end'] - new_begin
                bs_by_category[item['category']]['begin'] += new_begin
                bs_by_disclosure[item['disclosure']]['begin'] += new_begin

            # JE-only accounts for prev month
            je_only_prev = conn.execute("""
                SELECT je.account, je.category, je.disclosure,
                       SUM(CASE WHEN je.side='\ucc28\ubcc0' THEN je.amount ELSE -je.amount END) as net
                FROM je LEFT JOIN tb ON je.account = tb.account
                WHERE tb.account IS NULL AND je.gubun='BS' AND je.date BETWEEN ? AND ?
                GROUP BY je.account, je.category, je.disclosure
            """, (current_start, prev_month_end)).fetchall()
            for r in je_only_prev:
                cat = r['category']
                new_begin = -r['net'] if cat in ('\ubd80\ucc44', '\uc790\ubcf8') else r['net']
                bs_by_category[cat]['begin'] += new_begin
                bs_by_disclosure[r['disclosure']]['begin'] += new_begin

        bs_items = []
        for cat in ['자산', '부채', '자본']:
            b, e = bs_by_category[cat]['begin'], bs_by_category[cat]['end']
            bs_items.append({'category': cat, 'endBal': round(e), 'beginBal': round(b), 'change': round(e - b), 'changeRate': safe_rate(e, b), 'level': 0, 'bold': True})

            agg_data = defaultdict(lambda: {'begin': 0, 'end': 0})
            for item in bs_items_raw:
                if item['category'] == cat:
                    agg_data[item['aggregate']]['begin'] += item['begin']
                    agg_data[item['aggregate']]['end'] += item['end']

            # Sort: 유동 before 비유동 (reverse alphabetical for Korean)
            def agg_sort_key(name):
                if '유동' in name and '비유동' not in name:
                    return 0  # 유동 first
                elif '비유동' in name:
                    return 1  # 비유동 second
                return 2  # others

            for agg_name, vals in sorted(agg_data.items(), key=lambda x: agg_sort_key(x[0])):
                if vals['begin'] == 0 and vals['end'] == 0:
                    continue
                display = '유동' if '유동' in agg_name and '비유동' not in agg_name else ('비유동' if '비유동' in agg_name else agg_name)
                bs_items.append({'category': display, 'endBal': round(vals['end']), 'beginBal': round(vals['begin']), 'change': round(vals['end'] - vals['begin']), 'changeRate': safe_rate(vals['end'], vals['begin']), 'level': 1, 'bold': True})

                added_disclosures = set()
                for item in sorted(bs_items_raw, key=lambda x: x['disclosure']):
                    if item['category'] == cat and item['aggregate'] == agg_name:
                        dk = item['disclosure']
                        if dk not in added_disclosures:
                            db, de = bs_by_disclosure[dk]['begin'], bs_by_disclosure[dk]['end']
                            if db != 0 or de != 0:
                                bs_items.append({'category': dk, 'endBal': round(de), 'beginBal': round(db), 'change': round(de - db), 'changeRate': safe_rate(de, db), 'level': 2, 'bold': False})
                                added_disclosures.add(dk)

            # Net income is already merged into 자본 sub-accounts above

        # BS Trend
        months_all = [r[0] for r in conn.execute("SELECT DISTINCT substr(date,1,7) FROM je ORDER BY 1").fetchall()]
        bs_trend = {'labels': [], 'assets': {'current': [], 'nonCurrent': []}, 'liabilities': {'current': [], 'nonCurrent': []}, 'equity': []}
        fin_labels = []
        current_ratios = []
        quick_ratios = []
        debt_ratios = []

        for m_key in months_all:
            m_year = int(m_key[:4])
            m_mon = int(m_key[5:7])
            m_start = f"{m_year}-01-01"
            m_end = self._month_end(m_year, m_mon)
            mvmt = {}
            m_rows = conn.execute("""
                SELECT account,
                       SUM(CASE WHEN side='\ucc28\ubcc0' THEN amount ELSE -amount END) as net
                FROM je WHERE gubun='BS' AND date BETWEEN ? AND ?
                GROUP BY account
            """, (m_start, m_end)).fetchall()
            for r in m_rows:
                mvmt[r['account']] = r['net']

            ac, anc, lc, lnc, eq = 0, 0, 0, 0, 0
            for acct, info in tb.items():
                b = info['begin_balance']
                movement = mvmt.get(acct, 0)
                end = (b - movement) if info['category'] in ('\ubd80\ucc44', '\uc790\ubcf8') else (b + movement)
                if info['category'] == '\uc790\uc0b0':
                    if '\uc720\ub3d9' in info['aggregate'] and '\ube44\uc720\ub3d9' not in info['aggregate']:
                        ac += end
                    else:
                        anc += end
                elif info['category'] == '\ubd80\ucc44':
                    if '\uc720\ub3d9' in info['aggregate'] and '\ube44\uc720\ub3d9' not in info['aggregate']:
                        lc += end
                    else:
                        lnc += end
                elif info['category'] == '\uc790\ubcf8':
                    eq += end

            # Include JE-only BS accounts in trend
            je_only_t = conn.execute("""
                SELECT je.category, je.aggregate,
                       SUM(CASE WHEN je.side='\ucc28\ubcc0' THEN je.amount ELSE -je.amount END) as net
                FROM je LEFT JOIN tb ON je.account = tb.account
                WHERE tb.account IS NULL AND je.gubun='BS' AND je.date BETWEEN ? AND ?
                GROUP BY je.category, je.aggregate
            """, (m_start, m_end)).fetchall()
            for r in je_only_t:
                cat = r['category']
                end_val = -r['net'] if cat in ('\ubd80\ucc44', '\uc790\ubcf8') else r['net']
                if cat == '\uc790\uc0b0':
                    if '\uc720\ub3d9' in r['aggregate'] and '\ube44\uc720\ub3d9' not in r['aggregate']:
                        ac += end_val
                    else:
                        anc += end_val
                elif cat == '\ubd80\ucc44':
                    if '\uc720\ub3d9' in r['aggregate'] and '\ube44\uc720\ub3d9' not in r['aggregate']:
                        lc += end_val
                    else:
                        lnc += end_val
                elif cat == '\uc790\ubcf8':
                    eq += end_val

            bs_trend['labels'].append(m_key)
            bs_trend['assets']['current'].append(round(ac / 1e6))
            bs_trend['assets']['nonCurrent'].append(round(anc / 1e6))
            bs_trend['liabilities']['current'].append(round(lc / 1e6))
            bs_trend['liabilities']['nonCurrent'].append(round(lnc / 1e6))
            bs_trend['equity'].append(round(eq / 1e6))

            # Financial ratios
            fin_labels.append(m_key)
            current_ratios.append(round(ac / lc * 100, 1) if lc else 0)
            inv_for_ratio = sum((info['begin_balance'] + mvmt.get(acct, 0)) for acct, info in tb.items()
                                if info['disclosure'] == '\uc7ac\uace0\uc790\uc0b0')
            quick_ratios.append(round((ac - inv_for_ratio) / lc * 100, 1) if lc else 0)
            debt_ratios.append(round((lc + lnc) / eq * 100, 1) if eq else 0)

        # Activity metrics
        cs, ce, _, _ = self._resolve_date_ranges('ytd', month)
        days = (datetime.strptime(ce, '%Y-%m-%d') - datetime.strptime(cs, '%Y-%m-%d')).days + 1
        pl_data = self._aggregate_pl(conn, cs, ce)
        revenue = abs(pl_data.get('\ub9e4\ucd9c\uc561', 0))
        cogs = pl_data.get('\ub9e4\ucd9c\uc6d0\uac00', 0)

        avg_ar = (bs_by_disclosure.get('\ub9e4\ucd9c\ucc44\uad8c', {}).get('begin', 0) + bs_by_disclosure.get('\ub9e4\ucd9c\ucc44\uad8c', {}).get('end', 0)) / 2
        daily_rev = revenue / days if days else 0
        avg_inv = (bs_by_disclosure.get('\uc7ac\uace0\uc790\uc0b0', {}).get('begin', 0) + bs_by_disclosure.get('\uc7ac\uace0\uc790\uc0b0', {}).get('end', 0)) / 2
        daily_cogs = cogs / days if days else 0

        assets_end = bs_by_category['\uc790\uc0b0']['end']
        liab_end = bs_by_category['\ubd80\ucc44']['end']
        equity_end = bs_by_category['\uc790\ubcf8']['end']
        agg_end = defaultdict(float)
        for item in bs_items_raw:
            agg_end[item['aggregate']] += item['end']
        ca = agg_end.get('\uc720\ub3d9\uc790\uc0b0', 0)
        cl = agg_end.get('\uc720\ub3d9\ubd80\ucc44', 0)

        asset_changes = sorted(
            [{'name': d, 'amount': round(v['end'] - v['begin'])}
             for d, v in bs_by_disclosure.items()
             if any(i['category'] == '\uc790\uc0b0' and i['disclosure'] == d for i in bs_items_raw) and v['end'] - v['begin'] != 0],
            key=lambda x: x['amount'], reverse=True
        )
        liab_changes = sorted(
            [{'name': d, 'amount': round(v['end'] - v['begin'])}
             for d, v in bs_by_disclosure.items()
             if any(i['category'] == '\ubd80\ucc44' and i['disclosure'] == d for i in bs_items_raw) and v['end'] - v['begin'] != 0],
            key=lambda x: x['amount'], reverse=True
        )

        conn.close()

        return {
            'bsItems': bs_items,
            'bsTrend': bs_trend,
            'activityMetrics': {
                'arTurnover': {'days': round(avg_ar / daily_rev, 1) if daily_rev else 0, 'avgBalance': round(avg_ar), 'dailyRevenue': round(daily_rev)},
                'inventoryTurnover': {'days': round(avg_inv / daily_cogs, 1) if daily_cogs else 0, 'avgBalance': round(avg_inv), 'dailyCOGS': round(daily_cogs)},
            },
            'assets': {'current': round(assets_end), 'prior': round(bs_by_category['\uc790\uc0b0']['begin']), 'changeRate': safe_rate(assets_end, bs_by_category['\uc790\uc0b0']['begin'])},
            'liabilities': {'current': round(liab_end), 'prior': round(bs_by_category['\ubd80\ucc44']['begin']), 'changeRate': safe_rate(liab_end, bs_by_category['\ubd80\ucc44']['begin'])},
            'liquidityIndicators': {
                'debtRatio': round(liab_end / equity_end * 100, 1) if equity_end else 0,
                'currentRatio': round(ca / cl * 100, 1) if cl else 0,
            },
            'assetChanges': asset_changes,
            'liabilityChanges': liab_changes,
            'financialRatios': {
                'labels': fin_labels,
                'currentRatio': current_ratios,
                'quickRatio': quick_ratios,
                'debtRatio': debt_ratios,
            },
        }

    # ====================================================================
    # Sales Data
    # ====================================================================

    def get_sales_data(self, period: str = 'ytd', month: str = '2025-09') -> dict:
        cs, ce, ps, pe = self._resolve_date_ranges(period, month)
        conn = self._conn()

        current_sales = {}
        rows = conn.execute("""
            SELECT customer, SUM(CASE WHEN side='\ub300\ubcc0' THEN amount ELSE -amount END) as net
            FROM je WHERE gubun='PL' AND disclosure='\ub9e4\ucd9c\uc561' AND date BETWEEN ? AND ?
            GROUP BY customer
        """, (cs, ce)).fetchall()
        for r in rows:
            current_sales[r['customer']] = r['net']

        prior_sales = {}
        rows = conn.execute("""
            SELECT customer, SUM(CASE WHEN side='\ub300\ubcc0' THEN amount ELSE -amount END) as net
            FROM je WHERE gubun='PL' AND disclosure='\ub9e4\ucd9c\uc561' AND date BETWEEN ? AND ?
            GROUP BY customer
        """, (ps, pe)).fetchall()
        for r in rows:
            prior_sales[r['customer']] = r['net']

        cc_current = len([c for c, v in current_sales.items() if v > 0])
        cc_prior = len([c for c, v in prior_sales.items() if v > 0])

        total_rev = sum(v for v in current_sales.values() if v > 0)
        top_share = sorted(
            [{'name': n or '(\uacf5\ubc31)', 'share': round(a / total_rev * 100, 2) if total_rev else 0}
             for n, a in current_sales.items() if a > 0],
            key=lambda x: x['share'], reverse=True
        )[:10]

        all_customers = set(list(current_sales.keys()) + list(prior_sales.keys()))
        customer_changes = {c: current_sales.get(c, 0) - prior_sales.get(c, 0) for c in all_customers if c}
        top_inc = sorted(customer_changes.items(), key=lambda x: x[1], reverse=True)[:10]
        top_dec = sorted(customer_changes.items(), key=lambda x: x[1])[:10]

        conn.close()

        return {
            'customerCount': {'current': cc_current, 'prior': cc_prior, 'change': cc_current - cc_prior, 'changeRate': safe_rate(cc_current, cc_prior)},
            'topCustomerShare': top_share,
            'topIncreaseCustomers': [{'name': n, 'amount': round(a)} for n, a in top_inc],
            'topDecreaseCustomers': [{'name': n, 'amount': round(a)} for n, a in top_dec if a < 0],
        }

    # ====================================================================
    # Journal Data
    # ====================================================================

    def get_journal_data(self, period: str = 'ytd', month: str = '2025-09') -> dict:
        conn = self._conn()

        total_debit = conn.execute("SELECT COALESCE(SUM(amount),0) FROM je WHERE side='\ucc28\ubcc0'").fetchone()[0]
        total_credit = conn.execute("SELECT COALESCE(SUM(amount),0) FROM je WHERE side='\ub300\ubcc0'").fetchone()[0]
        total_vouchers = conn.execute("SELECT COUNT(DISTINCT voucher) FROM je").fetchone()[0]

        top_accts = conn.execute("""
            SELECT account, SUM(amount) as total FROM je WHERE side='\ub300\ubcc0'
            GROUP BY account ORDER BY total DESC LIMIT 8
        """).fetchall()

        top_custs = conn.execute("""
            SELECT customer, SUM(amount) as total FROM je WHERE side='\ub300\ubcc0'
            GROUP BY customer ORDER BY total DESC LIMIT 10
        """).fetchall()

        tc_total = total_credit if total_credit else 1

        # Daily credit totals
        daily_rows = conn.execute("""
            SELECT date, SUM(amount) as total FROM je WHERE side='\ub300\ubcc0'
            GROUP BY date ORDER BY date
        """).fetchall()
        daily_credits = [{'date': r['date'], 'amount': round(r['total'])} for r in daily_rows]

        conn.close()

        return {
            'totalEntries': total_vouchers,
            'totalDebit': round(total_debit),
            'totalCredit': round(total_credit),
            'topAccountsByCredit': [{'account': r['account'], 'amount': round(r['total'])} for r in top_accts],
            'topCustomersByCredit': [{'name': r['customer'] or '(\uacf5\ubc31)', 'share': round(r['total'] / tc_total * 100, 2)} for r in top_custs],
            'dailyCredits': daily_credits,
        }

    # ====================================================================
    # Scenario Data
    # ====================================================================

    def get_scenario_data(self, period: str = 'ytd', month: str = '2025-09') -> dict:
        conn = self._conn()
        year = int(month[:4])
        current_year = str(year)

        s1_rows = conn.execute("""
            SELECT substr(date,1,7) as period, account, amount, COUNT(*) as cnt
            FROM je
            WHERE date LIKE ? AND side='\ucc28\ubcc0' AND gubun='PL' AND amount >= 1000000
            GROUP BY substr(date,1,7), account, amount
            HAVING cnt >= 2
        """, (f"{current_year}%",)).fetchall()
        s1_exceptions = [{'period': r['period'][2:], 'account': r['account'], 'amount': round(r['amount']), 'debitCount': r['cnt']} for r in s1_rows]

        # Scenario 2: 현금지급 후 동일금액 부채인식
        # 동일 전표 내에서 보통예금 대변(현금지급) + 부채계정 차변(부채감소)이 있고,
        # 같은 월에 동일 금액의 부채 대변(부채재인식) 전표가 존재
        s2_rows = conn.execute("""
            SELECT a.voucher, a.date, a.amount, a.account as cash_account,
                   b.account as liability_account, a.customer
            FROM je a
            JOIN je b ON a.voucher = b.voucher AND a.amount = b.amount
            WHERE a.date LIKE ?
              AND a.account LIKE '%보통예금%' AND a.side = '대변'
              AND b.gubun = 'BS' AND b.category = '부채' AND b.side = '차변'
              AND a.amount > 0
            GROUP BY a.voucher, a.amount
            ORDER BY a.amount DESC
            LIMIT 50
        """, (f"{current_year}%",)).fetchall()
        s2_entries = [{'voucher': r['voucher'], 'date': r['date'], 'amount': round(r['amount']),
                       'cashAccount': r['cash_account'], 'liabilityAccount': r['liability_account'],
                       'customer': r['customer'] or ''} for r in s2_rows]

        s3_entries = []
        rows = conn.execute("""
            SELECT voucher, account, customer, amount, date
            FROM je
            WHERE date LIKE ? AND account LIKE '%\ubcf4\ud1b5\uc608\uae08%' AND side='\ub300\ubcc0'
        """, (f"{current_year}%",)).fetchall()
        for r in rows:
            try:
                dt = datetime.strptime(r['date'], '%Y-%m-%d')
                if dt.weekday() >= 5:
                    s3_entries.append({'voucher': r['voucher'], 'account': r['account'], 'customer': r['customer'], 'credit': round(r['amount']), 'date': r['date']})
            except Exception:
                pass

        s4_rows = conn.execute("""
            SELECT voucher, account, customer, amount, date
            FROM je
            WHERE account LIKE '%\ubcf4\ud1b5\uc608\uae08%' AND side='\ub300\ubcc0' AND amount >= 1000000000
            ORDER BY date DESC LIMIT 20
        """).fetchall()
        s4_entries = [{'voucher': r['voucher'], 'account': r['account'], 'customer': r['customer'], 'credit': round(r['amount']), 'date': r['date']} for r in s4_rows]

        voucher_rows = conn.execute("""
            SELECT voucher,
                   SUM(CASE WHEN gubun='PL' AND category='\ube44\uc6a9' AND side='\ucc28\ubcc0' THEN amount ELSE 0 END) as expense_amt,
                   SUM(CASE WHEN account LIKE '%\ubcf4\ud1b5\uc608\uae08%' AND side='\ub300\ubcc0' THEN amount ELSE 0 END) as cash_amt
            FROM je
            WHERE date LIKE ?
            GROUP BY voucher
            HAVING expense_amt > 0 AND cash_amt > 0
            ORDER BY cash_amt DESC
            LIMIT 50
        """, (f"{current_year}%",)).fetchall()
        s5_entries = [{'voucher': r['voucher'], 'expenseAmt': round(r['expense_amt']), 'cashAmt': round(r['cash_amt'])} for r in voucher_rows]

        seldom_rows = conn.execute("""
            SELECT customer, COUNT(*) as cnt FROM je
            WHERE customer != ''
            GROUP BY customer HAVING cnt = 1
            ORDER BY customer LIMIT 20
        """).fetchall()
        seldom = [r['customer'] for r in seldom_rows]

        conn.close()

        return {
            'scenario1': {'title': '\ub3d9\uc77c \uae08\uc561 \uc911\ubcf5 \uc804\ud45c', 'risk': '\ub3d9\uc77c\uc6d4\uc5d0 \ub3d9\uc77c\ud55c \uc99d\ube59\uc73c\ub85c \uc774\uc911 \uccad\uad6c', 'count': len(s1_exceptions), 'exceptions': s1_exceptions[:20]},
            'scenario2': {'title': '\ud604\uae08\uc9c0\uae09 \ud6c4 \ub3d9\uc77c\uae08\uc561 \ubd80\ucc44\uc778\uc2dd', 'risk': '\uc6d4\uc911 \ubd80\ucc44\ub97c \ubc18\uc81c\ud558\uba74\uc11c \ud604\uae08 \uc9d1\ud589\ud55c \ud6c4 \ub3d9\uc77c \uae08\uc561\uc758 \ubd80\ucc44\ub97c \uc7ac\uc778\uc2dd', 'count': len(s2_entries), 'entries': s2_entries[:20]},
            'scenario3': {'title': '\uc8fc\ub9d0 \ud604\uae08 \uc9c0\uae09 \uc804\ud45c', 'risk': '\uc8fc\ub9d0\uc5d0 \ubcc4\ub3c4 \uc2b9\uc778 \uc5c6\uc774 \ud604\uae08 \uc9d1\ud589', 'count': len(s3_entries), 'entries': s3_entries[:20]},
            'scenario4': {'title': '\uace0\uc561 \ud604\uae08 \uc9c0\uae09 \uc804\ud45c', 'risk': '\uace0\uc561 \ud604\uae08 \uc778\ucd9c\uc744 \ud1b5\ud55c \ubd80\uc815', 'count': len(s4_entries), 'entries': s4_entries},
            'scenario5': {'title': '\ube44\uc6a9 \uc778\uc2dd\uacfc \ub3d9\uc2dc\uc5d0 \ud604\uae08\uc9c0\uae09 \uc804\ud45c', 'risk': '\ucda9\ub2f9\uae08\uc744 \uacc4\uc0c1\ud558\uc9c0 \uc54a\uace0 \ube44\uc6a9 \uc778\uc2dd\uacfc \ub3d9\uc2dc\uc5d0 \ud604\uae08\uc9c0\uae09, \ubc1c\uc0dd\uc8fc\uc758 \uc704\ubc30 \uac00\ub2a5\uc131', 'count': len(s5_entries), 'entries': s5_entries[:20]},
            'scenario6': {'title': 'Seldom Used Customer', 'risk': '\uc0ac\uc6a9 \ube48\ub3c4\uac00 \ub0ae\uc740 \uac70\ub798\ucc98\ub97c \ud1b5\ud55c \ud68c\uacc4 \uc624\ub958\uc758 \uac00\ub2a5\uc131\uc774 \uc788\ub294 \uc804\ud45c \uc2dd\ubcc4', 'customers': seldom},
        }

    # ====================================================================
    # Summary (composite)
    # ====================================================================

    def get_summary_data(self, period: str = 'ytd', month: str = '2025-09', bs_compare: str = 'year_start') -> dict:
        """Lightweight summary - direct SQL queries instead of calling heavy endpoints."""
        cs, ce, ps, pe = self._resolve_date_ranges(period, month)
        conn = self._conn()

        # PL basics
        pl_c = self._aggregate_pl(conn, cs, ce)
        pl_p = self._aggregate_pl(conn, ps, pe)
        pl_mgmt_c = self._aggregate_pl_mgmt(conn, cs, ce)
        pl_mgmt_p = self._aggregate_pl_mgmt(conn, ps, pe)

        rev_c = abs(pl_c.get('매출액', 0))
        rev_p = abs(pl_p.get('매출액', 0))
        cogs_c = pl_c.get('매출원가', 0)
        cogs_p = pl_p.get('매출원가', 0)
        sga_c = pl_c.get('판매비와관리비', 0)
        if sga_c == 0:
            sga_c = sum(pl_mgmt_c.get(n, 0) for n in SGA_MGMT_NAMES)
        sga_p = pl_p.get('판매비와관리비', 0)
        if sga_p == 0:
            sga_p = sum(pl_mgmt_p.get(n, 0) for n in SGA_MGMT_NAMES)
        gross_c = rev_c - cogs_c
        op_c = gross_c - sga_c
        gross_p = rev_p - cogs_p
        op_p = gross_p - sga_p
        net_c = op_c + pl_c.get('기타수익', 0) - pl_c.get('기타비용', 0) + pl_c.get('금융수익', 0) - pl_c.get('금융비용', 0) - pl_c.get('법인세비용', 0)

        # Expense changes
        expense_changes = sorted(
            [{'name': n, 'amount': round(pl_mgmt_c.get(n, 0) - pl_mgmt_p.get(n, 0))}
             for n in SGA_MGMT_NAMES if pl_mgmt_c.get(n, 0) - pl_mgmt_p.get(n, 0) != 0],
            key=lambda x: x['amount'], reverse=True
        )

        # BS basics
        year = int(month[:4])
        mon = int(month[5:7])
        bs_start = f"{year}-01-01"
        current_end = self._month_end(year, mon)
        tb_rows = conn.execute("SELECT account, begin_balance, category, disclosure, aggregate FROM tb").fetchall()
        mvmt_rows = conn.execute("""
            SELECT account, SUM(CASE WHEN side='차변' THEN amount ELSE -amount END) as net
            FROM je WHERE gubun='BS' AND date BETWEEN ? AND ? GROUP BY account
        """, (bs_start, current_end)).fetchall()
        mvmt = {r['account']: r['net'] for r in mvmt_rows}

        bs_cat = defaultdict(lambda: {'begin': 0, 'end': 0})
        bs_disc = defaultdict(lambda: {'begin': 0, 'end': 0, 'cat': ''})
        agg_end = defaultdict(float)
        for r in tb_rows:
            b = r['begin_balance']
            m = mvmt.get(r['account'], 0)
            end = (b - m) if r['category'] in ('부채', '자본') else (b + m)
            bs_cat[r['category']]['begin'] += b
            bs_cat[r['category']]['end'] += end
            bs_disc[r['disclosure']]['begin'] += b
            bs_disc[r['disclosure']]['end'] += end
            bs_disc[r['disclosure']]['cat'] = r['category']
            agg_end[r['aggregate']] += end

        # Include JE-only BS accounts (not in TB)
        je_only_rows = conn.execute("""
            SELECT je.account, je.category, je.disclosure, je.aggregate,
                   SUM(CASE WHEN je.side='\ucc28\ubcc0' THEN je.amount ELSE -je.amount END) as net
            FROM je LEFT JOIN tb ON je.account = tb.account
            WHERE tb.account IS NULL AND je.gubun='BS'
              AND je.date BETWEEN ? AND ?
            GROUP BY je.account, je.category, je.disclosure, je.aggregate
        """, (bs_start, current_end)).fetchall()
        for r in je_only_rows:
            cat = r['category']
            end = -r['net'] if cat in ('\ubd80\ucc44', '\uc790\ubcf8') else r['net']
            bs_cat[cat]['end'] += end
            bs_disc[r['disclosure']]['end'] += end
            bs_disc[r['disclosure']]['cat'] = cat
            agg_end[r['aggregate']] += end

        # For 월초 comparison: recalculate begin as balance at month start
        if bs_compare == 'month_start':
            if mon == 1:
                prev_month_end = self._month_end(year - 1, 12)
            else:
                prev_month_end = self._month_end(year, mon - 1)
            prev_mvmt_rows = conn.execute("""
                SELECT account, SUM(CASE WHEN side='\ucc28\ubcc0' THEN amount ELSE -amount END) as net
                FROM je WHERE gubun='BS' AND date BETWEEN ? AND ? GROUP BY account
            """, (bs_start, prev_month_end)).fetchall()
            prev_mvmt = {r['account']: r['net'] for r in prev_mvmt_rows}
            for cat_key in bs_cat:
                bs_cat[cat_key]['begin'] = 0
            for disc_key in bs_disc:
                bs_disc[disc_key]['begin'] = 0
            for r in tb_rows:
                pm = prev_mvmt.get(r['account'], 0)
                new_begin = (r['begin_balance'] - pm) if r['category'] in ('\ubd80\ucc44', '\uc790\ubcf8') else (r['begin_balance'] + pm)
                bs_cat[r['category']]['begin'] += new_begin
                bs_disc[r['disclosure']]['begin'] += new_begin
            # JE-only accounts for prev month
            je_only_prev = conn.execute("""
                SELECT je.category, je.disclosure,
                       SUM(CASE WHEN je.side='\ucc28\ubcc0' THEN je.amount ELSE -je.amount END) as net
                FROM je LEFT JOIN tb ON je.account = tb.account
                WHERE tb.account IS NULL AND je.gubun='BS' AND je.date BETWEEN ? AND ?
                GROUP BY je.category, je.disclosure
            """, (bs_start, prev_month_end)).fetchall()
            for r in je_only_prev:
                cat = r['category']
                new_begin = -r['net'] if cat in ('\ubd80\ucc44', '\uc790\ubcf8') else r['net']
                bs_cat[cat]['begin'] += new_begin
                bs_disc[r['disclosure']]['begin'] += new_begin

        assets_end = bs_cat['자산']['end']
        liab_end = bs_cat['부채']['end']
        equity_end = bs_cat['자본']['end']
        ca = agg_end.get('유동자산', 0)
        cl = agg_end.get('유동부채', 0)

        asset_changes = sorted(
            [{'name': d, 'amount': round(v['end'] - v['begin'])} for d, v in bs_disc.items() if v['cat'] == '자산' and v['end'] - v['begin'] != 0],
            key=lambda x: x['amount'], reverse=True
        )
        liab_changes = sorted(
            [{'name': d, 'amount': round(v['end'] - v['begin'])} for d, v in bs_disc.items() if v['cat'] == '부채' and v['end'] - v['begin'] != 0],
            key=lambda x: x['amount'], reverse=True
        )

        # Sales
        sales = self.get_sales_data(period, month)

        # Scenario counts (lightweight)
        current_year = str(year)
        s1_count = conn.execute("""
            SELECT COUNT(*) FROM (
                SELECT 1 FROM je WHERE date LIKE ? AND side='차변' AND gubun='PL' AND amount >= 1000000
                GROUP BY substr(date,1,7), account, amount HAVING COUNT(*) >= 2
            )
        """, (f"{current_year}%",)).fetchone()[0]
        s3_count = 0
        s3_rows = conn.execute("SELECT date FROM je WHERE date LIKE ? AND account LIKE '%보통예금%' AND side='대변'", (f"{current_year}%",)).fetchall()
        for r in s3_rows:
            try:
                from datetime import datetime as dt2
                if dt2.strptime(r['date'], '%Y-%m-%d').weekday() >= 5:
                    s3_count += 1
            except Exception:
                pass
        s2_count = conn.execute("""
            SELECT COUNT(*) FROM (
                SELECT 1 FROM je a
                JOIN je b ON a.voucher = b.voucher AND a.amount = b.amount
                WHERE a.date LIKE ?
                  AND a.account LIKE '%보통예금%' AND a.side = '대변'
                  AND b.gubun = 'BS' AND b.category = '부채' AND b.side = '차변'
                  AND a.amount > 0
                GROUP BY a.voucher, a.amount
            )
        """, (f"{current_year}%",)).fetchone()[0]
        s5_count = conn.execute("""
            SELECT COUNT(*) FROM (
                SELECT 1 FROM je WHERE date LIKE ?
                GROUP BY voucher
                HAVING SUM(CASE WHEN gubun='PL' AND category='비용' AND side='차변' THEN amount ELSE 0 END) > 0
                   AND SUM(CASE WHEN account LIKE '%보통예금%' AND side='대변' THEN amount ELSE 0 END) > 0
            )
        """, (f"{current_year}%",)).fetchone()[0]

        conn.close()

        return {
            'revenue': {'current': round(rev_c), 'prior': round(rev_p), 'changeRate': safe_rate(rev_c, rev_p)},
            'operatingProfit': {'current': round(op_c), 'prior': round(op_p), 'changeRate': safe_rate(op_c, op_p)},
            'assets': {'current': round(assets_end), 'prior': round(bs_cat['자산']['begin']), 'changeRate': safe_rate(assets_end, bs_cat['자산']['begin'])},
            'liabilities': {'current': round(liab_end), 'prior': round(bs_cat['부채']['begin']), 'changeRate': safe_rate(liab_end, bs_cat['부채']['begin'])},
            'revenueTopCustomers': sales['topIncreaseCustomers'][:3],
            'expenseTopAccounts': expense_changes[:3],
            'assetTopAccounts': asset_changes[:3],
            'liabilityTopAccounts': liab_changes[:3],
            'profitIndicators': {
                'grossMargin': round(gross_c / rev_c * 100, 1) if rev_c else 0,
                'operatingMargin': round(op_c / rev_c * 100, 1) if rev_c else 0,
                'netMargin': round(net_c / rev_c * 100, 1) if rev_c else 0,
            },
            'liquidityIndicators': {
                'debtRatio': round(liab_end / equity_end * 100, 1) if equity_end else 0,
                'currentRatio': round(ca / cl * 100, 1) if cl else 0,
            },
            'scenarioCounts': {
                'duplicateAmount': s1_count,
                'cashAfterLiability': s2_count,
                'weekendCash': s3_count,
                'cashAndExpense': s5_count,
            },
        }

    # ====================================================================
    # Full Data
    # ====================================================================

    def get_full_data(self, period: str = 'ytd', month: str = '2025-09') -> dict:
        pl = self.get_pl_data(period, month)
        bs = self.get_bs_data(period, month)
        sales = self.get_sales_data(period, month)
        journal = self.get_journal_data(period, month)
        scenarios = self.get_scenario_data(period, month)
        months = self.get_available_months()
        last_month = months[-1] if months else month

        return {
            'baseDate': f"{last_month[:4]}\ub144 {last_month[5:7]}\uc6d4",
            'companyName': 'ABC Company',
            'summary': self.get_summary_data(period, month),
            'plItems': pl['plItems'],
            'monthlyRevenue': pl['monthlyRevenue'],
            'monthlyOperatingProfit': pl['monthlyOperatingProfit'],
            'monthlyNetIncome': pl['monthlyNetIncome'],
            'monthlyGrossProfit': pl['monthlyGrossProfit'],
            'bsItems': bs['bsItems'],
            'bsTrend': bs['bsTrend'],
            'activityMetrics': bs['activityMetrics'],
            'salesAnalysis': sales,
            'quarterlyPL': pl['quarterlyPL'],
            'availableMonths': months,
            'journalSummary': journal,
            'scenarios': scenarios,
        }

    def get_meta(self) -> dict:
        months = self.get_available_months()
        last_month = months[-1] if months else '2025-09'
        return {
            'baseDate': f"{last_month[:4]}\ub144 {last_month[5:7]}\uc6d4",
            'companyName': 'ABC Company',
        }

    # ====================================================================
    # Journal Search
    # ====================================================================

    def get_journal_search(self, start_date='2024-01-01', end_date='2025-09-30',
                           account='', customer='', memo='', page=1, page_size=50):
        conn = self._conn()
        conditions = ["date BETWEEN ? AND ?"]
        params = [start_date, end_date]
        if account:
            conditions.append("account LIKE ?")
            params.append(f"%{account}%")
        if customer:
            conditions.append("customer LIKE ?")
            params.append(f"%{customer}%")
        if memo:
            conditions.append("(memo LIKE ? OR memo_trans LIKE ?)")
            params.extend([f"%{memo}%", f"%{memo}%"])

        where = " AND ".join(conditions)

        total = conn.execute(f"SELECT COUNT(*) FROM je WHERE {where}", params).fetchone()[0]

        offset = (page - 1) * page_size
        rows = conn.execute(f"""
            SELECT date, voucher, account, customer, memo,
                   CASE WHEN side='\ucc28\ubcc0' THEN amount ELSE 0 END as debit,
                   CASE WHEN side='\ub300\ubcc0' THEN amount ELSE 0 END as credit
            FROM je WHERE {where}
            ORDER BY date DESC, voucher
            LIMIT ? OFFSET ?
        """, params + [page_size, offset]).fetchall()

        conn.close()
        return {
            'entries': [{'date': r['date'], 'voucherNo': r['voucher'], 'account': r['account'],
                         'customer': r['customer'], 'memo': r['memo'],
                         'debit': round(r['debit']), 'credit': round(r['credit'])} for r in rows],
            'totalCount': total,
        }

    # ====================================================================
    # BS Account Detail
    # ====================================================================

    def get_bs_account_detail(self, account: str, period: str = 'ytd', month: str = '2025-09'):
        conn = self._conn()

        # Find matching TB accounts for this disclosure/category name
        tb_rows = conn.execute(
            "SELECT account, begin_balance, category, disclosure, aggregate FROM tb WHERE disclosure=? OR aggregate=? OR category=?",
            (account, account, account)
        ).fetchall()

        if not tb_rows:
            conn.close()
            return {'labels': [], 'balances': [], 'counterparties': []}

        acct_names = [r['account'] for r in tb_rows]
        total_begin = sum(r['begin_balance'] for r in tb_rows)
        is_credit_normal = tb_rows[0]['category'] in ('\ubd80\ucc44', '\uc790\ubcf8')

        # Monthly balance trend
        months_all = [r[0] for r in conn.execute("SELECT DISTINCT substr(date,1,7) FROM je ORDER BY 1").fetchall()]
        placeholders = ','.join(['?'] * len(acct_names))

        labels = []
        balances = []
        for m_key in months_all:
            m_year = int(m_key[:4])
            m_mon = int(m_key[5:7])
            m_start = f"{m_year}-01-01"
            m_end = self._month_end(m_year, m_mon)
            row = conn.execute(f"""
                SELECT SUM(CASE WHEN side='\ucc28\ubcc0' THEN amount ELSE -amount END) as net
                FROM je WHERE account IN ({placeholders}) AND date BETWEEN ? AND ?
            """, acct_names + [m_start, m_end]).fetchone()
            movement = row['net'] or 0
            bal = (total_begin - movement) if is_credit_normal else (total_begin + movement)
            labels.append(m_key)
            balances.append(round(bal / 1e6))

        # Counterparty breakdown
        cs, ce, _, _ = self._resolve_date_ranges(period, month)
        cust_rows = conn.execute(f"""
            SELECT customer, SUM(CASE WHEN side='\ucc28\ubcc0' THEN amount ELSE -amount END) as net
            FROM je WHERE account IN ({placeholders}) AND date BETWEEN ? AND ? AND customer != ''
            GROUP BY customer
            ORDER BY ABS(net) DESC
            LIMIT 20
        """, acct_names + [cs, ce]).fetchall()

        counterparties = [{'name': r['customer'], 'amount': round(r['net'])} for r in cust_rows]

        conn.close()
        return {'labels': labels, 'balances': balances, 'counterparties': counterparties}

    # ====================================================================
    # Quarterly PL
    # ====================================================================

    def get_quarterly_pl(self, month: str = '2025-09'):
        """Generate quarterly PL using cached monthly data (no extra SQL queries)."""
        conn = self._conn()
        year = int(month[:4])
        ym_disc, ym_mgmt = self._get_monthly_pl_cache(conn)
        conn.close()

        quarter_months = []
        for y in [year - 1, year]:
            for q in range(1, 5):
                ms = [(q - 1) * 3 + 1, (q - 1) * 3 + 2, (q - 1) * 3 + 3]
                quarter_months.append((f"{y} Q{q}", [f"{y}-{m:02d}" for m in ms]))

        headers = ['공시용계정'] + [q[0] for q in quarter_months]

        def sum_quarter_disc(months_list, key):
            return sum(ym_disc.get(m, {}).get(key, 0) for m in months_list)

        def sum_quarter_mgmt(months_list, key):
            return sum(ym_mgmt.get(m, {}).get(key, 0) for m in months_list)

        rows = []
        for _, ms in quarter_months:
            rev = abs(sum_quarter_disc(ms, '매출액'))
            cogs = sum_quarter_disc(ms, '매출원가')
            sga = sum_quarter_disc(ms, '판매비와관리비')
            if sga == 0:
                sga = sum(sum_quarter_mgmt(ms, n) for n in SGA_MGMT_NAMES)
            gross = rev - cogs
            op = gross - sga
            other_inc = sum_quarter_disc(ms, '기타수익')
            other_exp = sum_quarter_disc(ms, '기타비용')
            fin_inc = sum_quarter_disc(ms, '금융수익')
            fin_exp = sum_quarter_disc(ms, '금융비용')
            tax = sum_quarter_disc(ms, '법인세비용')
            net = op + other_inc - other_exp + fin_inc - fin_exp - tax

            if not rows:
                rows = [
                    {'account': '매출액', 'values': [], 'bold': True, 'highlight': False},
                    {'account': '매출원가', 'values': [], 'bold': True, 'highlight': False},
                    {'account': '매출총이익', 'values': [], 'bold': True, 'highlight': True},
                    {'account': '판매비와관리비', 'values': [], 'bold': True, 'highlight': False},
                    {'account': '영업이익', 'values': [], 'bold': True, 'highlight': True},
                    {'account': '기타수익', 'values': [], 'bold': False, 'highlight': False},
                    {'account': '기타비용', 'values': [], 'bold': False, 'highlight': False},
                    {'account': '금융수익', 'values': [], 'bold': False, 'highlight': False},
                    {'account': '금융비용', 'values': [], 'bold': False, 'highlight': False},
                    {'account': '법인세비용', 'values': [], 'bold': False, 'highlight': False},
                    {'account': '당기순손익', 'values': [], 'bold': True, 'highlight': True},
                ]

            vals = [rev, cogs, gross, sga, op, other_inc, other_exp, fin_inc, fin_exp, tax, net]
            for i, v in enumerate(vals):
                rows[i]['values'].append(round(v))

        return {'headers': headers, 'rows': rows}

    # ====================================================================
    # PL Journal Entries (drill-down)
    # ====================================================================

    def get_pl_journal_entries(self, month_key: str, disclosure: str = '', limit: int = 50):
        conn = self._conn()

        conditions = ["substr(date,1,7) = ?", "gubun = 'PL'"]
        params = [month_key]
        if disclosure:
            conditions.append("disclosure = ?")
            params.append(disclosure)

        where = " AND ".join(conditions)
        rows = conn.execute(f"""
            SELECT date, voucher, account, customer, memo,
                   CASE WHEN side='\ucc28\ubcc0' THEN amount ELSE 0 END as debit,
                   CASE WHEN side='\ub300\ubcc0' THEN amount ELSE 0 END as credit
            FROM je WHERE {where}
            ORDER BY date, voucher
            LIMIT ?
        """, params + [limit]).fetchall()

        conn.close()
        return {
            'entries': [{'date': r['date'], 'voucherNo': r['voucher'], 'account': r['account'],
                         'customer': r['customer'], 'memo': r['memo'],
                         'debit': round(r['debit']), 'credit': round(r['credit'])} for r in rows],
            'totalCount': len(rows),
        }
