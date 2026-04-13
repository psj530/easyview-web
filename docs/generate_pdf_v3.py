# -*- coding: utf-8 -*-
"""
Easy View 3.0 - PPT-style Landscape PDF
Matches the style of the previous EasyView_Web_Service_Overview.pdf
"""

import os
from fpdf import FPDF

OUTPUT_DIR = os.path.dirname(os.path.abspath(__file__))
FONT_PATH = os.path.join(OUTPUT_DIR, "NotoSansKR.ttf")

# PwC Colors
ORANGE = (208, 74, 2)
ORANGE_LIGHT = (232, 119, 34)
ORANGE_DARK = (163, 59, 1)
DARK = (45, 45, 45)
GRAY_DARK = (70, 70, 70)
GRAY = (125, 125, 125)
GRAY_LIGHT = (200, 200, 200)
LGRAY = (232, 232, 232)
BG = (245, 245, 245)
WHITE = (255, 255, 255)
RED = (220, 38, 38)
BLUE = (37, 99, 235)
GREEN = (22, 163, 74)

W = 297  # A4 landscape width
H = 210  # A4 landscape height
MARGIN = 15


class SlidesPDF(FPDF):
    def __init__(self):
        super().__init__(orientation="L", unit="mm", format="A4")
        self.add_font("noto", "", FONT_PATH)
        self.add_font("noto", "B", FONT_PATH)
        self.set_auto_page_break(auto=False)
        self.page_count_offset = 1  # cover is page 0

    def _c(self, rgb): self.set_text_color(*rgb)
    def _f(self, rgb): self.set_fill_color(*rgb)
    def _d(self, rgb): self.set_draw_color(*rgb)

    # ===== Slide base =====
    def slide_header(self, title, subtitle=""):
        """Standard slide header with PwC logo bar"""
        # Top bar
        self._f(DARK)
        self.rect(0, 0, W, 18, "F")
        # PwC logo text
        self.set_xy(MARGIN, 4)
        self.set_font("noto", "B", 11)
        self._c(WHITE)
        self.cell(20, 10, "pwc")
        # Separator
        self._c(ORANGE)
        self.cell(3, 10, "|")
        self._c(WHITE)
        self.set_font("noto", "", 9)
        self.cell(80, 10, "Easy View Web Service Overview")
        # Page number
        page_num = self.page_no() - self.page_count_offset
        if page_num > 0:
            self.set_xy(W - MARGIN - 10, 4)
            self.set_font("noto", "", 9)
            self._c(GRAY_LIGHT)
            self.cell(10, 10, str(page_num), align="R")

        # Title area
        self.set_xy(MARGIN, 24)
        self.set_font("noto", "B", 18)
        self._c(DARK)
        self.cell(0, 10, title)
        if subtitle:
            self.set_xy(MARGIN, 35)
            self.set_font("noto", "", 9)
            self._c(GRAY)
            self.cell(0, 6, subtitle)

        # Orange accent line
        self._f(ORANGE)
        self.rect(MARGIN, 42, 40, 1.5, "F")
        self.set_y(48)

    def slide_footer(self):
        """Bottom bar"""
        self._d(LGRAY)
        self.line(MARGIN, H - 12, W - MARGIN, H - 12)
        self.set_xy(MARGIN, H - 11)
        self.set_font("noto", "", 6)
        self._c(GRAY)
        self.cell(0, 6, "© 2026 PwC. All rights reserved. 삼일회계법인  |  Confidential", align="L")

    # ===== Components =====
    def section_title(self, text, y=None):
        if y is not None:
            self.set_y(y)
        self._f(ORANGE)
        self.rect(MARGIN, self.get_y(), 2.5, 7, "F")
        self.set_x(MARGIN + 5)
        self.set_font("noto", "B", 10)
        self._c(DARK)
        self.cell(0, 7, text)
        self.ln(10)

    def body(self, text, width=None):
        self.set_x(MARGIN)
        self.set_font("noto", "", 8.5)
        self._c(GRAY_DARK)
        self.multi_cell(width or (W - MARGIN * 2), 5, text)
        self.ln(2)

    def table(self, headers, rows, x=None, y=None, col_w=None, total_w=None,
              header_bg=DARK, right_cols=None, font_size=7.5):
        if x is not None: self.set_x(x)
        if y is not None: self.set_y(y)
        sx = self.get_x()
        if total_w is None:
            total_w = W - MARGIN * 2
        if col_w is None:
            cw = total_w / len(headers)
            col_w = [cw] * len(headers)
        if right_cols is None:
            right_cols = set()

        # Header
        self._f(header_bg)
        self._d(header_bg)
        hc = WHITE if header_bg == DARK else GRAY_DARK
        self.set_font("noto", "B", font_size)
        self._c(hc)
        for i, h in enumerate(headers):
            self.cell(col_w[i], 6.5, h, border=0, fill=True, align="R" if i in right_cols else "L")
        self.ln()

        # Rows
        for row in rows:
            bold = isinstance(row[-1], bool) and row[-1]
            highlight = isinstance(row[-1], str) and row[-1] == "highlight"
            data = row[:-1] if (isinstance(row[-1], bool) or isinstance(row[-1], str)) else row

            self.set_x(sx)
            if highlight:
                self._f((255, 247, 240))
                self.rect(sx, self.get_y(), sum(col_w), 5.5, "F")
            elif bold:
                self._f(BG)
                self.rect(sx, self.get_y(), sum(col_w), 5.5, "F")

            self.set_font("noto", "B" if bold else "", font_size)
            for i, cell in enumerate(data):
                txt = str(cell)
                if i in right_cols and ("▲" in txt): self._c(RED)
                elif i in right_cols and ("▼" in txt): self._c(BLUE)
                else: self._c(DARK)
                self.cell(col_w[i], 5.5, txt, align="R" if i in right_cols else "L")
            self.ln()
            # Bottom border
            self._d(LGRAY)
            self.line(sx, self.get_y(), sx + sum(col_w), self.get_y())
        self.ln(2)

    def kpi_card(self, x, y, w, h, title, value, sub, accent_color):
        self._f(WHITE)
        self._d(LGRAY)
        self.rect(x, y, w, h, "DF")
        self._f(accent_color)
        self.rect(x, y, w, 2, "F")
        # Title
        self.set_xy(x + 4, y + 4)
        self.set_font("noto", "", 7)
        self._c(GRAY)
        self.cell(w - 8, 4, title)
        # Value
        self.set_xy(x + 4, y + 10)
        self.set_font("noto", "B", 14)
        self._c(DARK)
        self.cell(w - 8, 7, value)
        # Sub
        self.set_xy(x + 4, y + 19)
        self.set_font("noto", "", 6)
        self._c(GRAY)
        self.cell(w - 8, 4, sub)

    def info_card(self, x, y, w, h, title, desc, accent=True):
        self._f(WHITE)
        self._d(LGRAY)
        self.rect(x, y, w, h, "DF")
        if accent:
            self._f(ORANGE)
            self.rect(x, y, w, 1.5, "F")
        self.set_xy(x + 4, y + (4 if accent else 3))
        self.set_font("noto", "B", 8)
        self._c(DARK)
        self.cell(w - 8, 5, title)
        self.set_xy(x + 4, y + (10 if accent else 9))
        self.set_font("noto", "", 7)
        self._c(GRAY)
        self.multi_cell(w - 8, 3.8, desc)

    def scenario_card(self, x, y, w, label, count):
        self._f(WHITE)
        self._d(LGRAY)
        self.rect(x, y, w, 18, "DF")
        self.set_xy(x, y + 3)
        self.set_font("noto", "", 6.5)
        self._c(GRAY)
        self.cell(w, 4, label, align="C")
        self.set_xy(x, y + 8)
        self.set_font("noto", "B", 13)
        self._c(RED)
        self.cell(w, 6, str(count), align="C")
        self.set_xy(x, y + 14)
        self.set_font("noto", "", 5.5)
        self._c(GRAY)
        self.cell(w, 3, "건", align="C")

    def nav_tabs(self, items, active_idx, x=None, y=None, w=None):
        if x is None: x = MARGIN
        if y is None: y = self.get_y()
        if w is None: w = W - MARGIN * 2
        self._f(DARK)
        self.rect(x, y, w, 9, "F")
        tx = x + 4
        for i, item in enumerate(items):
            self.set_xy(tx, y + 1)
            self.set_font("noto", "B" if i == active_idx else "", 7)
            self._c(WHITE if i == active_idx else (150, 150, 150))
            tw = self.get_string_width(item) + 10
            self.cell(tw, 7, item, align="C")
            if i == active_idx:
                self._f(ORANGE)
                self.rect(tx, y + 8, tw, 1, "F")
            tx += tw + 1

    def indicator_group(self, x, y, w, h, title, indicators):
        self._f(WHITE)
        self._d(LGRAY)
        self.rect(x, y, w, h, "DF")
        self._f(ORANGE)
        self.rect(x + 4, y + 4, 2, 5, "F")
        self.set_xy(x + 8, y + 4)
        self.set_font("noto", "B", 8)
        self._c(DARK)
        self.cell(w - 12, 5, title)
        iw = (w - 8) / len(indicators)
        for i, (label, value, color) in enumerate(indicators):
            ix = x + 4 + i * iw
            self.set_xy(ix, y + 12)
            self.set_font("noto", "", 6.5)
            self._c(GRAY)
            self.cell(iw, 4, label, align="C")
            self.set_xy(ix, y + 17)
            self.set_font("noto", "B", 12)
            self._c(color)
            self.cell(iw, 6, value, align="C")


def generate():
    pdf = SlidesPDF()

    # ========== SLIDE 1: COVER ==========
    pdf.add_page()
    pdf._f(DARK)
    pdf.rect(0, 0, W, H, "F")

    # Orange accent bar
    pdf._f(ORANGE)
    pdf.rect(0, 0, 8, H, "F")

    # PwC logo
    pdf.set_xy(30, 40)
    pdf.set_font("noto", "B", 32)
    pdf._c(WHITE)
    pdf.cell(40, 14, "pwc")

    # Title
    pdf.set_xy(30, 65)
    pdf.set_font("noto", "B", 28)
    pdf._c(WHITE)
    pdf.cell(0, 14, "Worldwide Easy View 3.0")

    pdf.set_xy(30, 82)
    pdf._f(ORANGE)
    pdf.rect(30, 82, 50, 2, "F")

    pdf.set_xy(30, 90)
    pdf.set_font("noto", "", 14)
    pdf._c(GRAY_LIGHT)
    pdf.cell(0, 8, "Web Service Overview")

    # Subtitle box
    pdf.set_xy(30, 115)
    pdf.set_font("noto", "", 9)
    pdf._c(GRAY)
    pdf.multi_cell(200, 6,
        "삼일회계법인 Worldwide Easy View 서비스의 웹 버전 구현 현황 및\n"
        "주요 기능, 아키텍처, 서비스 구성에 대한 소개 자료"
    )

    # Info
    pdf.set_xy(30, 145)
    pdf.set_font("noto", "", 8)
    pdf._c(GRAY)
    info = [
        "프로젝트: Easy View Web Dashboard",
        "기준 데이터: ABC Company (2024.01 ~ 2025.09)",
        "기술 스택: Next.js 16 + FastAPI + SQLite",
        "담당: 삼일회계법인 Assurance Innovation",
        "2024 - 2026  |  Confidential",
    ]
    for line in info:
        pdf.cell(200, 5, line, new_x="LMARGIN", new_y="NEXT")
        pdf.set_x(30)

    pdf.slide_footer()

    # ========== SLIDE 2: CONTENTS ==========
    pdf.add_page()
    pdf.slide_header("Contents", "목차")

    items = [
        ("1", "서비스 개요", "프로젝트 배경, 목적, 전체 구성"),
        ("2", "로그인 & 리포트 관리", "인증, 리포트 목록, 데이터 업로드"),
        ("3", "Summary 대시보드", "KPI 카드, 손익지표, 유동성지표, 손익/재무항목"),
        ("4", "분석 탭 상세", "손익분석, 재무상태분석, 전표분석"),
        ("5", "시나리오분석", "6가지 Exception 기반 전표 자동 탐지"),
        ("6", "기술 스택 & API", "아키텍처, 19개 엔드포인트, 인증/보안"),
        ("7", "실행 방법 & 향후 계획", "로컬 실행, 배포, 데이터 검증"),
    ]
    y = 52
    for num, title, desc in items:
        # Number circle
        pdf._f(ORANGE)
        pdf.rect(MARGIN + 5, y, 8, 8, "F")
        pdf.set_xy(MARGIN + 5, y)
        pdf.set_font("noto", "B", 9)
        pdf._c(WHITE)
        pdf.cell(8, 8, num, align="C")
        # Title
        pdf.set_xy(MARGIN + 18, y)
        pdf.set_font("noto", "B", 11)
        pdf._c(DARK)
        pdf.cell(60, 8, title)
        # Desc
        pdf.set_xy(MARGIN + 80, y)
        pdf.set_font("noto", "", 9)
        pdf._c(GRAY)
        pdf.cell(0, 8, desc)
        y += 16

    pdf.slide_footer()

    # ========== SLIDE 3: SERVICE OVERVIEW ==========
    pdf.add_page()
    pdf.slide_header("1. 서비스 개요",
        "Power BI 기반 Easy View Report를 웹 환경에서 고객사에 직접 제공할 수 있는 형태로 구현")

    pdf.body(
        "Worldwide Easy View는 삼일회계법인이 만든 국내외법인 재무정보에 대한 스마트한 접근법으로, "
        "복잡한 재무 데이터를 직관적인 시각화와 시나리오 분석을 통해 쉽게 파악할 수 있도록 합니다."
    )

    # Feature cards
    y = 70
    cw = (W - MARGIN * 2 - 12) / 4
    cards = [
        ("자동 리포트 생성", "분개장/시산표 업로드 시\nEasy View Template 자동 가공"),
        ("접근 권한 통제", "삼일 등록 계정만 접근\n사용자별 담당 고객사 통제"),
        ("인터랙티브 분석", "차트 클릭 Drill-down\n전표 검색, 시나리오 분석"),
        ("PDF 리포트 대체", "58페이지 PDF를 동적\n웹 대시보드로 완전 대체"),
    ]
    for i, (t, d) in enumerate(cards):
        pdf.info_card(MARGIN + i * (cw + 4), y, cw, 28, t, d)

    # Tech stack
    pdf.section_title("기술 스택", 105)
    pdf.table(
        ["구분", "기술", "버전", "비고"],
        [
            ["프론트엔드", "Next.js (App Router)", "16.2", "TypeScript, React 19, Tailwind CSS 4"],
            ["백엔드", "FastAPI (Python)", "3.11", "REST API 19개 엔드포인트"],
            ["차트", "Chart.js + react-chartjs-2", "4.4", "Bar, Line, Doughnut"],
            ["인증", "JWT (자체 구현)", "-", "PBKDF2-HMAC-SHA256, 24시간 만료"],
            ["데이터베이스", "SQLite (WAL 모드)", "-", "재무 DB + 인증 DB 분리"],
        ],
        col_w=[30, 50, 15, W - MARGIN * 2 - 95],
    )
    pdf.slide_footer()

    # ========== SLIDE 4: LOGIN & REPORTS ==========
    pdf.add_page()
    pdf.slide_header("2. 로그인 & 리포트 관리",
        "인증, 리포트 목록 조회, 데이터 업로드 & 리포트 생성")

    half_w = (W - MARGIN * 2 - 6) / 2

    # Left: Login
    pdf.info_card(MARGIN, 50, half_w, 55, "로그인 페이지 (/login)",
        "삼일회계법인 등록 계정으로 로그인\n"
        "JWT 토큰 기반 인증 (24시간 만료)\n"
        "자동 로그인 옵션\n"
        "삼일 보안 정책 안내 메시지 표시\n\n"
        "테스트 계정:\n"
        "admin@samil.com / admin1234 (관리자)\n"
        "user@samil.com / user1234 (사용자)")

    # Right: Reports
    pdf.info_card(MARGIN + half_w + 6, 50, half_w, 55, "리포트 목록 (/reports)",
        "생성된 Easy View 리포트 조회\n"
        "'새 리포트 생성' 버튼\n"
        "결산월, 회사명, 매출액, 손익항목 수 표시\n\n"
        "실제 예시:\n"
        "9월 | ABC Company | 매출 1,339억 | 38개\n"
        "8월 | ABC Company | 매출 1,285억 | 38개")

    # Bottom: Upload flow
    pdf.section_title("데이터 업로드 & 리포트 생성 플로우", 112)
    pdf.table(
        ["단계", "내용"],
        [
            ["1. 기간/회사 선택", "결산 연도/월 선택, 대상 회사 선택"],
            ["2. 파일 업로드", "분개장(JE/GL) 필수, 시산표(TB) 필수, 재무제표(BS/PL) 선택, 기타 선택"],
            ["3. Report 생성", "'Report 생성하기' 클릭 → 변환 애니메이션 (6단계 진행)"],
            ["4. 완료 & 확인", "매출액/손익항목 요약 → 'Easy View 리포트 보기' → 대시보드"],
        ],
        col_w=[40, W - MARGIN * 2 - 40],
    )
    pdf.slide_footer()

    # ========== SLIDE 5: SUMMARY DASHBOARD ==========
    pdf.add_page()
    pdf.slide_header("3. Summary 대시보드",
        "주요 BS/PL 사항과 관련된 요약 지표로, 분석 및 비교대상을 선택하여 직관적인 모니터링")

    # Nav tabs
    pdf.nav_tabs(["Summary", "손익분석", "재무상태분석", "전표분석", "시나리오분석"], 0, MARGIN, 48)

    # KPI Cards
    kpi_y = 60
    kpi_w = (W - MARGIN * 2 - 12) / 4
    pdf.kpi_card(MARGIN, kpi_y, kpi_w, 26, "매출액", "133,930백만", "전기: 114,200백만  ▲17.3%", ORANGE)
    pdf.kpi_card(MARGIN + kpi_w + 4, kpi_y, kpi_w, 26, "영업이익", "27,771백만", "전기: 26,601백만  ▲4.4%", (224, 48, 30))
    pdf.kpi_card(MARGIN + (kpi_w + 4) * 2, kpi_y, kpi_w, 26, "자산", "145,228백만", "기초: 103,620백만  ▲40.2%", (160, 94, 55))
    pdf.kpi_card(MARGIN + (kpi_w + 4) * 3, kpi_y, kpi_w, 26, "부채", "17,318백만", "기초: 20,564백만  ▼15.8%", (217, 57, 84))

    # Indicators
    ind_y = 90
    ind_w = (W - MARGIN * 2 - 6) / 2
    pdf.indicator_group(MARGIN, ind_y, ind_w, 28, "손익지표", [
        ("매출총이익률", "60.5%", ORANGE),
        ("영업이익률", "20.7%", (224, 48, 30)),
        ("당기손익률", "16.3%", (160, 94, 55)),
    ])
    pdf.indicator_group(MARGIN + ind_w + 6, ind_y, ind_w, 28, "유동성지표", [
        ("부채비율", "20.9%", (217, 57, 84)),
        ("유동비율", "889.2%", ORANGE),
    ])

    # PL + BS tables side by side
    tbl_y = 122
    tbl_w = (W - MARGIN * 2 - 6) / 2

    pdf.section_title("손익항목", tbl_y)
    pdf.table(
        ["공시용계정", "당기", "전기", "증감률"],
        [
            ["매출액", "133,930,227,921", "114,199,589,362", "▲17.3%", True],
            ["매출원가", "52,848,102,077", "45,901,641,513", "▲15.1%", False],
            ["매출총이익", "81,082,125,844", "68,297,947,849", "▲18.7%", "highlight"],
            ["영업이익", "27,770,723,534", "26,601,234,084", "▲4.4%", "highlight"],
            ["당기순손익", "21,803,252,164", "22,627,455,682", "▼3.6%", True],
        ],
        x=MARGIN, col_w=[28, 38, 38, tbl_w - 104],
        total_w=tbl_w, right_cols={1, 2, 3},
    )

    pdf.section_title("재무항목", tbl_y)
    pdf.set_y(tbl_y + 10)
    pdf.table(
        ["분류", "기말", "기초", "증감률"],
        [
            ["자산", "145,228,358,373", "103,620,341,622", "▲40.2%", True],
            ["  유동", "136,608,821,474", "93,506,741,039", "▲46.1%", False],
            ["  비유동", "8,619,536,899", "10,113,600,583", "▼14.8%", False],
            ["부채", "17,317,820,321", "20,564,424,522", "▼15.8%", True],
            ["자본", "104,859,169,264", "83,055,917,100", "▲26.3%", True],
        ],
        x=MARGIN + tbl_w + 6, col_w=[22, 38, 38, tbl_w - 98],
        total_w=tbl_w, right_cols={1, 2, 3},
    )

    pdf.slide_footer()

    # ========== SLIDE 6: ANALYSIS TABS ==========
    pdf.add_page()
    pdf.slide_header("4. 분석 탭 상세",
        "손익분석 5개, 재무상태분석 3개, 전표분석 2개 서브탭 구성")

    pdf.section_title("손익분석 (5개 서브탭)")
    pdf.table(
        ["서브탭", "주요 기능"],
        [
            ["PL 요약", "매출액/매출총이익/영업이익/당기순이익 KPI + 월별 추이 Bar+Line 차트"],
            ["PL 추이분석", "21개월 추이, 매출총이익률/영업이익률 추이 Line 차트"],
            ["PL 계정분석", "계정별 금액 비교, 당기 vs 전기 증감 분석"],
            ["매출분석", "거래처별 매출 비중, Top N 거래처, Doughnut 차트"],
            ["손익항목", "8분기 × 11개 항목 분기별 비교 테이블"],
        ],
        col_w=[30, W - MARGIN * 2 - 30],
    )

    pdf.section_title("재무상태분석 (3개 서브탭)")
    pdf.table(
        ["서브탭", "주요 기능"],
        [
            ["BS 요약", "자산/부채/자본 추이 (Stacked Area), 당좌비율, 유동비율, 부채비율"],
            ["BS 추이분석", "재무비율 추이 차트 (유동비율, 당좌비율, 부채비율)"],
            ["BS 계정분석", "계정별 잔액추이 + 거래처별 구성 분석 (클릭 → 상세)"],
        ],
        col_w=[30, W - MARGIN * 2 - 30],
    )

    pdf.section_title("전표분석 (2개 서브탭)")
    pdf.table(
        ["서브탭", "주요 기능"],
        [
            ["전표분석내역", "일별 전표 건수 추이, 계정과목별/거래처별 분석, 상대계정 추적"],
            ["전표검색", "기간/계정/거래처/적요 필터, 페이지네이션, 전표 상세 조회"],
        ],
        col_w=[30, W - MARGIN * 2 - 30],
    )
    pdf.slide_footer()

    # ========== SLIDE 7: SCENARIO ==========
    pdf.add_page()
    pdf.slide_header("5. 시나리오분석",
        "6가지 Exception 기반 전표 자동 탐지 — 기간/금액 필터 + 당월/3개월/전체 퀵 필터")

    pdf.table(
        ["시나리오", "예상 위험", "탐지 건수"],
        [
            ["S1. 동일금액 중복", "동일월에 동일한 증빙으로 이중 청구", "128"],
            ["S2. 현금지급후 부채인식", "현금 지급 후 동일 금액 부채 재인식", "3,642"],
            ["S3. 주말 현금지급", "주말에 별도 승인 없이 현금 집행", "768"],
            ["S4. 고액 현금지급", "10억 이상 고액 현금 인출을 통한 부정", "20"],
            ["S5. 현금지급 및 비용인식", "충당금 미계상, 비용 인식과 동시 현금지급", "138"],
            ["S6. Seldom Customer", "거래 빈도 1회 거래처 (가공 거래처 위험)", "20"],
        ],
        col_w=[50, 120, W - MARGIN * 2 - 170],
        right_cols={2},
    )

    # Scenario cards
    y = 120
    gap = 5
    sw = (W - MARGIN * 2 - gap * 3) / 4
    pdf.scenario_card(MARGIN, y, sw, "동일금액 중복", "128")
    pdf.scenario_card(MARGIN + sw + gap, y, sw, "현금지급후 부채인식", "3,642")
    pdf.scenario_card(MARGIN + (sw + gap) * 2, y, sw, "주말현금지급", "768")
    pdf.scenario_card(MARGIN + (sw + gap) * 3, y, sw, "현금지급 및 비용인식", "138")

    pdf.set_xy(MARGIN, y + 25)
    pdf.set_font("noto", "", 8)
    pdf._c(GRAY)
    pdf.cell(0, 5, "* 기간 필터: 당월 / 직전 3개월 / 전체기간 퀵 필터 + 기간/금액 수동 입력 + 필터 초기화 버튼")

    pdf.slide_footer()

    # ========== SLIDE 8: TECH & API ==========
    pdf.add_page()
    pdf.slide_header("6. 기술 스택 & API",
        "아키텍처, 19개 REST API 엔드포인트, JWT 인증 & 보안")

    half_w = (W - MARGIN * 2 - 6) / 2

    pdf.section_title("주요 API 엔드포인트 (19개)")
    pdf.table(
        ["Method", "Path", "인증", "설명"],
        [
            ["POST", "/api/auth/login", "-", "로그인"],
            ["GET", "/api/auth/me", "JWT", "현재 사용자 정보"],
            ["GET", "/api/reports", "JWT", "리포트 목록"],
            ["POST", "/api/upload/v2", "JWT", "파일 업로드 & 리포트 생성"],
            ["GET", "/api/summary", "-", "Summary KPI"],
            ["GET", "/api/pl", "-", "손익계산서 + 분기별 + 월별"],
            ["GET", "/api/bs", "-", "재무상태표 + 재무비율"],
            ["GET", "/api/journal/search", "-", "전표 검색 (페이지네이션)"],
            ["GET", "/api/scenarios", "-", "시나리오 분석 6개"],
        ],
        col_w=[14, 40, 12, half_w - 66],
        total_w=half_w,
        font_size=7,
    )

    pdf.section_title("인증 & 보안", 50)
    pdf.set_y(60)
    pdf.table(
        ["항목", "구현"],
        [
            ["비밀번호", "PBKDF2-HMAC-SHA256 (100K iterations)"],
            ["토큰", "JWT HMAC-SHA256 (24시간 만료)"],
            ["접근 통제", "사용자별 회사 접근 권한"],
            ["보안 안내", "삼일 보안 정책 메시지 표시"],
        ],
        x=MARGIN + half_w + 6,
        col_w=[22, half_w - 22],
        total_w=half_w,
        font_size=7,
    )

    pdf.slide_footer()

    # ========== SLIDE 9: RUN & FUTURE ==========
    pdf.add_page()
    pdf.slide_header("7. 실행 방법 & 향후 계획",
        "로컬 실행, 데이터 검증, 향후 개선 사항")

    half_w = (W - MARGIN * 2 - 6) / 2

    # Code block
    pdf.section_title("실행 방법")
    cy = pdf.get_y()
    pdf._f(DARK)
    pdf.rect(MARGIN, cy, half_w, 40, "F")
    pdf.set_xy(MARGIN + 5, cy + 4)
    code = [
        ("# 백엔드", True), ("cd easyview-web/backend", False),
        ("pip install -r requirements.txt", False),
        ("python run.py  # → localhost:8000", False), ("", False),
        ("# 프론트엔드", True), ("cd easyview-web/frontend", False),
        ("npm install", False),
        ("npm run dev -- -p 3003  # → localhost:3003", False),
    ]
    for line, is_c in code:
        pdf.set_font("noto", "", 7)
        pdf._c((120, 120, 120) if is_c else (210, 210, 210))
        pdf.cell(half_w - 10, 4, line, new_x="LMARGIN", new_y="NEXT")
        pdf.set_x(MARGIN + 5)

    # Data verification
    pdf.section_title("데이터 검증 (PDF 원본 100% 일치)", cy)
    pdf.set_y(cy + 10)
    pdf.table(
        ["항목", "값"],
        [
            ["매출액", "133,930,227,921"],
            ["매출총이익", "81,082,125,844"],
            ["영업이익", "27,770,723,534"],
            ["당기순이익", "21,803,252,164"],
            ["전표 수", "134,784건"],
            ["계정 수", "83개"],
        ],
        x=MARGIN + half_w + 6,
        col_w=[30, half_w - 30],
        total_w=half_w,
        right_cols={1},
    )

    # Future
    pdf.section_title("향후 계획", 140)
    items = [
        "리포트별 데이터 로드 (리포트 선택 → 해당 데이터로 대시보드)",
        "반응형 모바일 레이아웃 지원",
        "Waterfall 차트 (손익 흐름 시각화)",
        "Vercel + Render 실배포 및 도메인 연결",
    ]
    for item in items:
        pdf.set_x(MARGIN)
        pdf.set_font("noto", "", 8)
        pdf._c(ORANGE)
        pdf.cell(5, 5.5, chr(10003))
        pdf._c(DARK)
        pdf.cell(0, 5.5, "  " + item, new_x="LMARGIN", new_y="NEXT")

    pdf.slide_footer()

    # ===== SAVE =====
    out = os.path.join(OUTPUT_DIR, "EasyView_3.0_Web_Service_Overview.pdf")
    pdf.output(out)
    print(f"\nPDF generated: {out}")
    print(f"Pages: {pdf.page_no()}")


if __name__ == "__main__":
    generate()
