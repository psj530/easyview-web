# -*- coding: utf-8 -*-
"""
Demo data seeder for the 자료게시판 page.
Run once from the backend/ directory:  python seed_demo_docs.py

Creates:
  - 3 periods: 2026-03, 2026-04, 2026-05
  - Dummy submitted files across 3 companies / 3 required categories
  - Requests with varying sent counts so all 4 statuses appear:
      제출 / 미제출 / 요청됨 / 재요청
"""

import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "auth.db")
DOCS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "documents")
os.makedirs(DOCS_DIR, exist_ok=True)

conn = sqlite3.connect(DB_PATH)
conn.row_factory = sqlite3.Row
conn.execute("PRAGMA journal_mode=WAL")
conn.execute("PRAGMA foreign_keys=ON")

# ── helpers ──────────────────────────────────────────────────────────────────

def first(query, *params):
    row = conn.execute(query, params).fetchone()
    return dict(row) if row else None

def insert(query, *params):
    cur = conn.execute(query, params)
    conn.commit()
    return cur.lastrowid

# ── look up existing data ─────────────────────────────────────────────────────

admin_user = first("SELECT id, name FROM users WHERE role='admin' LIMIT 1")
if not admin_user:
    print("ERROR: no admin user found — run the server at least once first to seed users.")
    conn.close()
    exit(1)
admin_id   = admin_user["id"]
admin_name = admin_user["name"]

companies = {row["code"]: dict(row) for row in conn.execute("SELECT id, name, code FROM companies")}
cats_raw  = [dict(r) for r in conn.execute(
    "SELECT id, name FROM doc_categories WHERE is_required=1 ORDER BY id")]

if not companies:
    print("ERROR: no companies found — run the server at least once first.")
    conn.close()
    exit(1)
if not cats_raw:
    print("ERROR: no required categories found — run the server at least once first.")
    conn.close()
    exit(1)

print(f"Admin: {admin_name} (id={admin_id})")
print(f"Companies: {[c for c in companies]}")
print(f"Required categories: {[c['name'] for c in cats_raw]}")

cat_ids   = [c["id"]   for c in cats_raw]
cat_names = [c["name"] for c in cats_raw]

# ── periods ───────────────────────────────────────────────────────────────────

PERIODS = [
    ("2026-03", "2026년 3월", "2026-04-15"),
    ("2026-04", "2026년 4월", "2026-05-15"),
    ("2026-05", "2026년 5월", "2026-06-15"),
]
period_ids = {}
for period, label, due in PERIODS:
    existing = first("SELECT id FROM doc_periods WHERE period=?", period)
    if existing:
        period_ids[period] = existing["id"]
        print(f"  Period {period} already exists (id={existing['id']})")
    else:
        pid = insert(
            "INSERT INTO doc_periods (period, label, due_date, created_by) VALUES (?,?,?,?)",
            period, label, due, admin_id,
        )
        period_ids[period] = pid
        print(f"  Created period {period} (id={pid})")

# ── helper: create a dummy file on disk and insert a doc_post ─────────────────

def make_post(company_code, period, cat_index, author_name="현지담당자"):
    """Insert one submitted file for the given company / period / category index (0-based)."""
    co  = companies.get(company_code)
    if not co:
        return None
    cat_id   = cat_ids[cat_index]
    cat_name = cat_names[cat_index]
    period_start = f"{period}-01"
    period_end   = f"{period}-28"

    fname = f"{company_code}_{period}_{cat_index+1:02d}_sample.txt"
    fpath = os.path.join(DOCS_DIR, fname)
    if not os.path.exists(fpath):
        with open(fpath, "w", encoding="utf-8") as f:
            f.write(f"[DEMO] {co['name']} / {cat_name} / {period}\n")
            f.write("이 파일은 테스트용 더미 데이터입니다.\n")

    existing = first(
        "SELECT id FROM doc_posts WHERE company_id=? AND category_id=? AND period_start=?",
        co["id"], cat_id, period_start,
    )
    if existing:
        print(f"    Post already exists: {company_code} / {period} / cat{cat_index+1}")
        return existing["id"]

    post_id = insert(
        """INSERT INTO doc_posts
           (category_id, title, file_name, file_path, file_size,
            company_id, company_name, author_id, author_name,
            period_start, period_end)
           VALUES (?,?,?,?,?,?,?,?,?,?,?)""",
        cat_id,
        f"[DEMO] {cat_name} — {period}",
        fname,
        fpath,
        len(open(fpath, "rb").read()),
        co["id"], co["name"],
        admin_id, author_name,
        period_start, period_end,
    )
    print(f"    Post created: {company_code} / {period} / {cat_name} (id={post_id})")
    return post_id

# ── helper: create a doc_request and optionally mark emails sent ──────────────

def make_request(company_code, period, cat_index, emails_sent=0, message=""):
    """Create a request with `emails_sent` email events (0=미제출, 1=요청됨, 2+=재요청)."""
    co  = companies.get(company_code)
    if not co:
        return
    cat_id   = cat_ids[cat_index]
    due_date = ""
    for p, _, due in PERIODS:
        if p == period:
            due_date = due
            break

    existing = first(
        "SELECT id FROM doc_requests WHERE company_id=? AND category_id=?",
        co["id"], cat_id,
    )
    if existing:
        print(f"    Request already exists: {company_code} / cat{cat_index+1}")
        return

    req_id = insert(
        """INSERT INTO doc_requests
           (category_id, company_id, company_name, due_date, message,
            created_by, created_by_name)
           VALUES (?,?,?,?,?,?,?)""",
        cat_id, co["id"], co["name"],
        due_date, message, admin_id, admin_name,
    )
    for i in range(emails_sent):
        conn.execute(
            "UPDATE doc_requests SET email_sent_at=datetime('now',?), requestee_email=? WHERE id=?",
            (f"-{emails_sent - i} days", f"contact@{company_code.lower()}.com", req_id),
        )
        conn.commit()
    status = "재요청" if emails_sent >= 2 else "요청됨" if emails_sent == 1 else "미제출"
    print(f"    Request: {company_code} / {period} / cat{cat_index+1} → {status}")

# ── seed scenario ─────────────────────────────────────────────────────────────
#
#  ABC Company
#    2026-03: 모두 제출 (3/3) → greyed out / 완료
#    2026-04: cat1 제출, cat2 재요청, cat3 미제출
#    2026-05: cat1 요청됨, cat2·cat3 미제출
#
#  XYZ Corporation
#    2026-03: cat1 제출, cat2 요청됨, cat3 미제출
#    2026-04: 모두 미제출
#    2026-05: cat1·cat2 제출, cat3 재요청
#
#  삼일전자 (SE001)
#    2026-03: cat1 제출, cat2 재요청, cat3 요청됨
#    2026-04: 모두 제출 (3/3) → greyed out / 완료
#    2026-05: 모두 미제출
#
# ─────────────────────────────────────────────────────────────────────────────

print("\n─── ABC Company ───")
make_post("ABC", "2026-03", 0)
make_post("ABC", "2026-03", 1)
make_post("ABC", "2026-03", 2)

make_post("ABC", "2026-04", 0)
make_request("ABC", "2026-04", 1, emails_sent=2, message="기한 초과로 재요청")
# cat2 미제출 — no request needed

print("\n─── ABC 2026-05 ───")
make_request("ABC", "2026-05", 0, emails_sent=1)
# cat2, cat3 미제출

print("\n─── XYZ Corporation ───")
make_post("XYZ", "2026-03", 0)
make_request("XYZ", "2026-03", 1, emails_sent=1)
# cat3 미제출

# 2026-04: all missing, no requests

make_post("XYZ", "2026-05", 0)
make_post("XYZ", "2026-05", 1)
make_request("XYZ", "2026-05", 2, emails_sent=2, message="2차 재요청 발송")

print("\n─── 삼일전자 ───")
make_post("SE001", "2026-03", 0)
make_request("SE001", "2026-03", 1, emails_sent=2, message="재무팀 확인 필요")
make_request("SE001", "2026-03", 2, emails_sent=1)

make_post("SE001", "2026-04", 0)
make_post("SE001", "2026-04", 1)
make_post("SE001", "2026-04", 2)

# 2026-05: all missing

conn.close()
print("\nDone. Refresh the admin page to see the demo data.")
