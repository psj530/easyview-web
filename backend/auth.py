# -*- coding: utf-8 -*-
"""
PwC Easy View 3.0 - Authentication Module
Handles user management, JWT tokens, and company access control.
"""

import sqlite3
import hashlib
import hmac
import os
import json
import time
import base64
from typing import Optional, Dict, List
from datetime import datetime

AUTH_DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "auth.db")
JWT_SECRET = os.environ.get("JWT_SECRET", "easyview-secret-key-change-in-production")
JWT_EXPIRY = 7 * 24 * 60 * 60  # 7 days


def _hash_password(password: str, salt: Optional[bytes] = None) -> tuple[str, str]:
    """Hash password with PBKDF2-HMAC-SHA256."""
    if salt is None:
        salt = os.urandom(32)
    key = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 100000)
    return base64.b64encode(salt).decode(), base64.b64encode(key).decode()


def _verify_password(password: str, salt_b64: str, hash_b64: str) -> bool:
    """Verify password against stored hash."""
    salt = base64.b64decode(salt_b64)
    key = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 100000)
    return hmac.compare_digest(base64.b64encode(key).decode(), hash_b64)


def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def _b64url_decode(s: str) -> bytes:
    padding = 4 - len(s) % 4
    if padding != 4:
        s += "=" * padding
    return base64.urlsafe_b64decode(s)


def create_jwt(payload: dict) -> str:
    """Create a simple JWT token."""
    header = {"alg": "HS256", "typ": "JWT"}
    payload["exp"] = int(time.time()) + JWT_EXPIRY
    payload["iat"] = int(time.time())

    h = _b64url_encode(json.dumps(header).encode())
    p = _b64url_encode(json.dumps(payload).encode())
    signature = hmac.new(JWT_SECRET.encode(), f"{h}.{p}".encode(), hashlib.sha256).digest()
    s = _b64url_encode(signature)
    return f"{h}.{p}.{s}"


def verify_jwt(token: str) -> Optional[dict]:
    """Verify and decode a JWT token."""
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None

        h, p, s = parts
        expected_sig = hmac.new(JWT_SECRET.encode(), f"{h}.{p}".encode(), hashlib.sha256).digest()
        actual_sig = _b64url_decode(s)

        if not hmac.compare_digest(expected_sig, actual_sig):
            return None

        payload = json.loads(_b64url_decode(p))
        if payload.get("exp", 0) < time.time():
            return None

        return payload
    except Exception:
        return None


class AuthDB:
    """Manages user authentication and company access control."""

    def __init__(self, db_path: str = AUTH_DB_PATH):
        self.db_path = db_path
        self._init_db()

    def _get_conn(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA journal_mode=WAL")
        conn.execute("PRAGMA foreign_keys=ON")
        return conn

    def _init_db(self):
        conn = self._get_conn()
        try:
            conn.executescript("""
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    email TEXT UNIQUE NOT NULL,
                    password_salt TEXT NOT NULL,
                    password_hash TEXT NOT NULL,
                    name TEXT NOT NULL,
                    role TEXT NOT NULL DEFAULT 'user',
                    department TEXT DEFAULT '',
                    created_at TEXT DEFAULT (datetime('now')),
                    last_login TEXT
                );

                CREATE TABLE IF NOT EXISTS companies (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    code TEXT UNIQUE NOT NULL,
                    created_at TEXT DEFAULT (datetime('now'))
                );

                CREATE TABLE IF NOT EXISTS user_companies (
                    user_id INTEGER NOT NULL,
                    company_id INTEGER NOT NULL,
                    role TEXT DEFAULT 'viewer',
                    PRIMARY KEY (user_id, company_id),
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
                );

                CREATE TABLE IF NOT EXISTS reports (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    company_id INTEGER NOT NULL,
                    company_code TEXT NOT NULL,
                    company_name TEXT NOT NULL,
                    year INTEGER NOT NULL,
                    month INTEGER NOT NULL,
                    created_by INTEGER NOT NULL,
                    created_by_name TEXT NOT NULL,
                    revenue REAL,
                    pl_items INTEGER,
                    created_at TEXT DEFAULT (datetime('now')),
                    FOREIGN KEY (company_id) REFERENCES companies(id),
                    FOREIGN KEY (created_by) REFERENCES users(id)
                );
            """)

            # Seed default admin and sample data if empty
            cursor = conn.execute("SELECT COUNT(*) FROM users")
            if cursor.fetchone()[0] == 0:
                self._seed_data(conn)

            conn.commit()
        finally:
            conn.close()

    def _seed_data(self, conn: sqlite3.Connection):
        """Seed initial admin user and sample companies."""
        # Admin user: admin@samil.com / admin1234
        salt, pw_hash = _hash_password("admin1234")
        conn.execute(
            "INSERT INTO users (email, password_salt, password_hash, name, role, department) VALUES (?, ?, ?, ?, ?, ?)",
            ("admin@samil.com", salt, pw_hash, "관리자", "admin", "감사본부"),
        )

        # Sample user: user@samil.com / user1234
        salt2, pw_hash2 = _hash_password("user1234")
        conn.execute(
            "INSERT INTO users (email, password_salt, password_hash, name, role, department) VALUES (?, ?, ?, ?, ?, ?)",
            ("user@samil.com", salt2, pw_hash2, "박수정", "user", "감사본부"),
        )

        # Sample companies
        conn.execute("INSERT INTO companies (name, code) VALUES (?, ?)", ("ABC Company", "ABC"))
        conn.execute("INSERT INTO companies (name, code) VALUES (?, ?)", ("XYZ Corporation", "XYZ"))
        conn.execute("INSERT INTO companies (name, code) VALUES (?, ?)", ("삼일전자", "SE001"))

        # Assign companies to users (admin gets all, user gets ABC only)
        conn.execute("INSERT INTO user_companies (user_id, company_id, role) VALUES (1, 1, 'admin')")
        conn.execute("INSERT INTO user_companies (user_id, company_id, role) VALUES (1, 2, 'admin')")
        conn.execute("INSERT INTO user_companies (user_id, company_id, role) VALUES (1, 3, 'admin')")
        conn.execute("INSERT INTO user_companies (user_id, company_id, role) VALUES (2, 1, 'viewer')")

        # Sample reports
        conn.execute(
            "INSERT INTO reports (company_id, company_code, company_name, year, month, created_by, created_by_name, revenue, pl_items, created_at) VALUES (1,'ABC','ABC Company',2025,9,1,'관리자',133930227921,38,'2025-10-15 09:30:00')"
        )
        conn.execute(
            "INSERT INTO reports (company_id, company_code, company_name, year, month, created_by, created_by_name, revenue, pl_items, created_at) VALUES (1,'ABC','ABC Company',2025,8,2,'박수정',128500000000,38,'2025-09-12 14:20:00')"
        )

    def login(self, email: str, password: str) -> Optional[Dict]:
        """Authenticate user and return JWT token."""
        conn = self._get_conn()
        try:
            cursor = conn.execute("SELECT * FROM users WHERE email = ?", (email,))
            user = cursor.fetchone()
            if not user:
                return None

            if not _verify_password(password, user["password_salt"], user["password_hash"]):
                return None

            # Update last login
            conn.execute("UPDATE users SET last_login = datetime('now') WHERE id = ?", (user["id"],))
            conn.commit()

            # Get user's companies
            companies = self.get_user_companies(user["id"])

            token = create_jwt({
                "user_id": user["id"],
                "email": user["email"],
                "name": user["name"],
                "role": user["role"],
            })

            return {
                "token": token,
                "user": {
                    "id": user["id"],
                    "email": user["email"],
                    "name": user["name"],
                    "role": user["role"],
                    "department": user["department"],
                },
                "companies": companies,
            }
        finally:
            conn.close()

    def get_user_companies(self, user_id: int) -> List[Dict]:
        """Get companies accessible by a user."""
        conn = self._get_conn()
        try:
            cursor = conn.execute("""
                SELECT c.id, c.name, c.code, uc.role
                FROM companies c
                JOIN user_companies uc ON c.id = uc.company_id
                WHERE uc.user_id = ?
                ORDER BY c.name
            """, (user_id,))
            return [dict(row) for row in cursor.fetchall()]
        finally:
            conn.close()

    def get_user_by_id(self, user_id: int) -> Optional[Dict]:
        """Get user info by ID."""
        conn = self._get_conn()
        try:
            cursor = conn.execute(
                "SELECT id, email, name, role, department FROM users WHERE id = ?",
                (user_id,),
            )
            row = cursor.fetchone()
            return dict(row) if row else None
        finally:
            conn.close()

    def verify_company_access(self, user_id: int, company_code: str) -> bool:
        """Check if user has access to a company."""
        conn = self._get_conn()
        try:
            cursor = conn.execute("""
                SELECT 1 FROM user_companies uc
                JOIN companies c ON uc.company_id = c.id
                WHERE uc.user_id = ? AND c.code = ?
            """, (user_id, company_code))
            return cursor.fetchone() is not None
        finally:
            conn.close()

    def get_all_companies(self) -> List[Dict]:
        """Get all companies (admin only)."""
        conn = self._get_conn()
        try:
            cursor = conn.execute("SELECT id, name, code FROM companies ORDER BY name")
            return [dict(row) for row in cursor.fetchall()]
        finally:
            conn.close()

    # ===== Reports =====

    def save_report(self, company_id: int, company_code: str, company_name: str,
                    year: int, month: int, user_id: int, user_name: str,
                    revenue: float = 0, pl_items: int = 0) -> Dict:
        """Save a generated report record."""
        conn = self._get_conn()
        try:
            conn.execute("""
                INSERT INTO reports (company_id, company_code, company_name, year, month,
                                     created_by, created_by_name, revenue, pl_items)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (company_id, company_code, company_name, year, month,
                  user_id, user_name, revenue, pl_items))
            conn.commit()
            report_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
            return {"id": report_id}
        finally:
            conn.close()

    def get_user_reports(self, user_id: int) -> List[Dict]:
        """Get all reports accessible by a user (via their companies)."""
        conn = self._get_conn()
        try:
            cursor = conn.execute("""
                SELECT r.* FROM reports r
                JOIN user_companies uc ON r.company_id = uc.company_id
                WHERE uc.user_id = ?
                ORDER BY r.created_at DESC
            """, (user_id,))
            return [dict(row) for row in cursor.fetchall()]
        finally:
            conn.close()

    def add_company(self, name: str, code: str) -> Dict:
        """Add a new company."""
        conn = self._get_conn()
        try:
            conn.execute("INSERT INTO companies (name, code) VALUES (?, ?)", (name, code))
            conn.commit()
            company_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
            return {"id": company_id, "name": name, "code": code}
        finally:
            conn.close()


# Global instance
auth_db = AuthDB()
