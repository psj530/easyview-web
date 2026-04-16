# -*- coding: utf-8 -*-
"""
Easy View 3.0 - Project Overview PDF v2
Includes actual screen examples and data.
"""

import os
from fpdf import FPDF

OUTPUT_DIR = os.path.dirname(os.path.abspath(__file__))
FONT_PATH = os.path.join(OUTPUT_DIR, "NotoSansKR.ttf")


class EasyViewPDF(FPDF):
    ORANGE = (208, 74, 2)
    DARK = (45, 45, 45)
    GRAY = (125, 125, 125)
    LGRAY = (232, 232, 232)
    BG = (245, 245, 245)
    WHITE = (255, 255, 255)
    RED = (220, 38, 38)
    BLUE = (37, 99, 235)
    GREEN = (22, 163, 74)

    def __init__(self):
        super().__init__(orientation="P", unit="mm", format="A4")
        self.add_font("noto", "", FONT_PATH)
        self.add_font("noto", "B", FONT_PATH)
        self.set_auto_page_break(auto=True, margin=20)

    def _c(self, rgb):
        self.set_text_color(*rgb)

    def _f(self, rgb):
        self.set_fill_color(*rgb)

    def _d(self, rgb):
        self.set_draw_color(*rgb)

    def footer(self):
        if self.page_no() <= 1:
            return
        self.set_y(-12)
        self._d(self.LGRAY)
        self.line(self.l_margin, self.get_y(), 210 - self.r_margin, self.get_y())
        self.ln(2)
        self.set_font("noto", "", 7)
        self._c(self.GRAY)
        self.cell(0, 4, f"PwC Easy View 3.0 Project Overview  |  Confidential  |  {self.page_no() - 1}", align="C")

    # ===== Components =====
    def cover(self):
        self.add_page()
        self._f(self.DARK)
        self.rect(0, 0, 210, 297, "F")
        self.set_y(70)
        self.set_font("noto", "B", 28)
        self._c(self.WHITE)
        self.cell(0, 12, "pwc", align="C", new_x="LMARGIN", new_y="NEXT")
        self._f(self.ORANGE)
        self.rect(85, self.get_y() + 4, 40, 2, "F")
        self.ln(14)
        self.set_font("noto", "B", 34)
        self.cell(0, 14, "Easy View 3.0", align="C", new_x="LMARGIN", new_y="NEXT")
        self.ln(4)
        self.set_font("noto", "", 13)
        self._c((170, 170, 170))
        self.cell(0, 8, "PwC Worldwide Financial Analysis Platform", align="C", new_x="LMARGIN", new_y="NEXT")
        self.ln(10)
        self._f(self.ORANGE)
        bw = 55
        self.set_x((210 - bw) / 2)
        self.set_font("noto", "B", 10)
        self._c(self.WHITE)
        self.cell(bw, 9, "Web Service Edition", align="C", fill=True, new_x="LMARGIN", new_y="NEXT")
        self.ln(30)
        self.set_font("noto", "", 10)
        self._c(self.GRAY)
        for line in ["삼일회계법인  Assurance Innovation",
                      "Project Overview & Screen Examples",
                      "", "2024 - 2026  |  Confidential"]:
            self.cell(0, 7, line, align="C", new_x="LMARGIN", new_y="NEXT")

    def section(self, num, title):
        self.ln(2)
        self._f(self.ORANGE)
        self.rect(self.l_margin, self.get_y(), 3, 8, "F")
        self.set_x(self.l_margin + 6)
        self.set_font("noto", "B", 14)
        self._c(self.DARK)
        self.cell(0, 8, f"{num}. {title}", new_x="LMARGIN", new_y="NEXT")
        self.ln(4)

    def sub(self, title):
        self.ln(2)
        self.set_font("noto", "B", 10)
        self._c(self.DARK)
        self.cell(0, 6, title, new_x="LMARGIN", new_y="NEXT")
        self.ln(2)

    def text_body(self, text):
        self.set_font("noto", "", 9)
        self._c(self.DARK)
        self.multi_cell(0, 5.5, text)
        self.ln(2)

    def table(self, headers, rows, col_w=None, header_bg=None, right_cols=None):
        if col_w is None:
            w = (210 - self.l_margin - self.r_margin) / len(headers)
            col_w = [w] * len(headers)
        if right_cols is None:
            right_cols = set()
        if header_bg is None:
            header_bg = self.BG
        # Header
        self._f(header_bg)
        self._d(self.LGRAY)
        self.set_font("noto", "B", 8)
        hdr_text_color = self.WHITE if header_bg == self.DARK else (70, 70, 70)
        self._c(hdr_text_color)
        for i, h in enumerate(headers):
            al = "R" if i in right_cols else "L"
            self.cell(col_w[i], 7, h, border="B", fill=True, align=al)
        self.ln()
        # Rows
        for row in rows:
            bold = row[-1] if isinstance(row[-1], bool) else False
            data = row[:-1] if isinstance(row[-1], bool) else row
            self.set_font("noto", "B" if bold else "", 8)
            for i, cell in enumerate(data):
                al = "R" if i in right_cols else "L"
                txt = str(cell)
                # Color for change rates
                if i in right_cols and ("▲" in txt or "▼" in txt):
                    if "▲" in txt:
                        self._c(self.RED)
                    else:
                        self._c(self.BLUE)
                else:
                    self._c(self.DARK)
                self._d(self.LGRAY)
                self.cell(col_w[i], 6, txt, border="B", align=al)
            self.ln()
        self.ln(2)

    def card_row(self, cards, y=None):
        if y is None:
            y = self.get_y()
        w = (210 - self.l_margin - self.r_margin - (len(cards) - 1) * 4) / len(cards)
        for i, (title, value, sub, color) in enumerate(cards):
            x = self.l_margin + i * (w + 4)
            self._f(self.WHITE)
            self._d(self.LGRAY)
            self.rect(x, y, w, 20, "DF")
            # Top accent
            self._f(color)
            self.rect(x, y, w, 1.5, "F")
            # Title
            self.set_xy(x + 3, y + 3)
            self.set_font("noto", "", 7)
            self._c(self.GRAY)
            self.cell(w - 6, 4, title)
            # Value
            self.set_xy(x + 3, y + 8)
            self.set_font("noto", "B", 12)
            self._c(self.DARK)
            self.cell(w - 6, 6, value)
            # Sub
            self.set_xy(x + 3, y + 15)
            self.set_font("noto", "", 6)
            self._c(self.GRAY)
            self.cell(w - 6, 3, sub)
        self.set_y(y + 24)

    def screen_box(self, title, desc):
        """A box simulating a screen section"""
        y = self.get_y()
        self._f(self.BG)
        self._d(self.LGRAY)
        full_w = 210 - self.l_margin - self.r_margin
        self.rect(self.l_margin, y, full_w, 18, "DF")
        # Orange left bar
        self._f(self.ORANGE)
        self.rect(self.l_margin, y, 3, 18, "F")
        self.set_xy(self.l_margin + 6, y + 2)
        self.set_font("noto", "B", 9)
        self._c(self.DARK)
        self.cell(full_w - 12, 5, title)
        self.set_xy(self.l_margin + 6, y + 8)
        self.set_font("noto", "", 7.5)
        self._c(self.GRAY)
        self.multi_cell(full_w - 12, 4, desc)
        self.set_y(y + 20)

    def nav_bar(self, items, active_idx=0):
        y = self.get_y()
        full_w = 210 - self.l_margin - self.r_margin
        self._f(self.DARK)
        self.rect(self.l_margin, y, full_w, 9, "F")
        x = self.l_margin + 4
        for i, item in enumerate(items):
            self.set_xy(x, y + 1)
            self.set_font("noto", "B" if i == active_idx else "", 7)
            self._c(self.WHITE if i == active_idx else (150, 150, 150))
            tw = self.get_string_width(item) + 8
            self.cell(tw, 7, item, align="C")
            if i == active_idx:
                self._f(self.ORANGE)
                self.rect(x, y + 8, tw, 1, "F")
            x += tw + 2
        self.set_y(y + 11)

    def indicator(self, label, value, color, x, y, w=30):
        self.set_xy(x, y)
        self.set_font("noto", "", 7)
        self._c(self.GRAY)
        self.cell(w, 4, label, align="C")
        self.set_xy(x, y + 5)
        self.set_font("noto", "B", 12)
        self._c(color)
        self.cell(w, 6, value, align="C")

    def scenario_card(self, label, count, x, y, w=38):
        self._f(self.WHITE)
        self._d(self.LGRAY)
        self.rect(x, y, w, 16, "DF")
        self.set_xy(x, y + 2)
        self.set_font("noto", "", 6.5)
        self._c(self.GRAY)
        self.cell(w, 4, label, align="C")
        self.set_xy(x, y + 7)
        self.set_font("noto", "B", 11)
        self._c(self.RED)
        self.cell(w, 5, str(count), align="C")
        self.set_xy(x, y + 12)
        self.set_font("noto", "", 5.5)
        self._c(self.GRAY)
        self.cell(w, 3, "건", align="C")


def generate():
    pdf = EasyViewPDF()

    # ========== PAGE 1: COVER ==========
    pdf.cover()

    # ========== PAGE 2: OVERVIEW ==========
    pdf.add_page()
    pdf.section("1", "프로젝트 개요")
    pdf.text_body(
        "PwC Easy View 3.0은 삼일회계법인(PwC Korea)의 Power BI 기반 재무분석 리포트를 "
        "웹 환경으로 구현한 플랫폼입니다. 고객사의 분개장(JE)과 시산표(TB)를 업로드하면 "
        "Easy View Template에 맞게 자동 가공하여, 5개 분석 탭(Summary, 손익분석, 재무상태분석, "
        "전표분석, 시나리오분석)으로 구성된 인터랙티브 리포트를 즉시 생성합니다."
    )

    pdf.sub("기술 스택")
    pdf.table(
        ["구분", "기술", "버전", "비고"],
        [
            ["프론트엔드", "Next.js (App Router)", "16.2", "TypeScript, React 19"],
            ["스타일링", "Tailwind CSS", "4.0", "PwC 커스텀 색상"],
            ["차트", "Chart.js + react-chartjs-2", "4.4", "Bar, Line, Doughnut"],
            ["백엔드", "FastAPI (Python)", "3.11", "REST API 19개"],
            ["인증", "JWT", "-", "PBKDF2-HMAC-SHA256"],
            ["DB", "SQLite (WAL)", "-", "재무 DB + 인증 DB"],
        ],
        col_w=[28, 45, 14, 83],
    )

    pdf.sub("사용자 플로우")
    pdf.text_body(
        "로그인 → 리포트 목록(기존 리포트 조회) → 새 리포트 생성(데이터 업로드) → "
        "리포트 변환 애니메이션 → 대시보드(5개 탭 분석) → PDF 내보내기"
    )

    # ========== PAGE 3: LOGIN & REPORTS ==========
    pdf.add_page()
    pdf.section("2", "화면 구성 — 로그인 & 리포트 목록")

    pdf.sub("2-1. 로그인 페이지 (/login)")
    pdf.screen_box(
        "로그인",
        "삼일회계법인 등록 계정으로 로그인 | 이메일/비밀번호 인증 | 자동 로그인 옵션 | 삼일 보안 정책 안내 메시지"
    )
    pdf.text_body(
        "- 삼일회계법인(PwC Korea)에서 등록한 계정만 접근 가능\n"
        "- JWT 토큰 기반 인증 (24시간 만료)\n"
        "- 자동 로그인 선택 시 다음 접속 시 로그인 페이지 건너뜀"
    )

    pdf.table(
        ["테스트 계정", "비밀번호", "역할", "접근 회사"],
        [
            ["admin@samil.com", "admin1234", "관리자", "ABC, XYZ, 삼일전자"],
            ["user@samil.com", "user1234", "사용자", "ABC Company만"],
        ],
        col_w=[42, 28, 20, 80],
    )

    pdf.sub("2-2. 리포트 목록 페이지 (/reports)")
    pdf.screen_box(
        "리포트 목록",
        "생성된 Easy View 리포트 조회 | '새 리포트 생성' 버튼 | 리포트별 매출액, 손익항목 수, 생성자/일자 표시"
    )

    pdf.text_body("실제 화면 예시 (리포트 카드):")
    pdf.table(
        ["결산월", "회사명", "매출액", "손익항목", "생성자", "생성일"],
        [
            ["2025년 9월", "ABC Company", "1,339억", "38개", "관리자", "2025.10.15"],
            ["2025년 8월", "ABC Company", "1,285억", "38개", "박수정", "2025.09.12"],
        ],
        col_w=[25, 35, 22, 22, 22, 44],
        right_cols={2, 3},
    )

    # ========== PAGE 4: UPLOAD ==========
    pdf.add_page()
    pdf.section("3", "화면 구성 — 데이터 업로드 & 리포트 생성")

    pdf.sub("3-1. 데이터 업로드 페이지 (/upload)")
    pdf.screen_box(
        "데이터 업로드",
        "결산 연도/월 선택 | 대상 회사 선택 | 4개 파일 카테고리 업로드 | 'Report 생성하기' 버튼"
    )

    pdf.text_body("업로드 파일 구성:")
    pdf.table(
        ["구분", "파일 유형", "필수 여부", "지원 형식"],
        [
            ["1", "분개장 (JE) / 계정별원장 (GL)", "필수", "CSV, Excel, TXT"],
            ["2", "시산표 (TB)", "필수", "CSV, Excel, TXT"],
            ["3", "재무제표 (BS / PL)", "선택", "CSV, Excel, TXT, PDF"],
            ["4", "기타파일 (CoA, PKG 등)", "선택", "CSV, Excel, TXT, PDF, ZIP"],
        ],
        col_w=[10, 60, 20, 80],
    )

    pdf.sub("3-2. 리포트 변환 애니메이션")
    pdf.text_body(
        "Report 생성하기 클릭 시 단계별 진행 애니메이션이 표시됩니다:\n"
        "  1) 파일 업로드 중...\n"
        "  2) 데이터 포맷 검증 중...\n"
        "  3) Easy View Template에 맞게 데이터 가공 중...\n"
        "  4) 재무제표 항목 매핑 중...\n"
        "  5) 시나리오 분석 수행 중...\n"
        "  6) 리포트 생성 완료!"
    )

    pdf.sub("3-3. 생성 완료 화면")
    pdf.text_body("완료 후 매출액/손익항목 요약 표시 → 'Easy View 리포트 보기' 버튼으로 대시보드 이동")

    # ========== PAGE 5: SUMMARY ==========
    pdf.add_page()
    pdf.section("4", "화면 구성 — Summary 대시보드")

    # Nav bar
    pdf.nav_bar(["Summary", "손익분석", "재무상태분석", "전표분석", "시나리오분석"], 0)
    pdf.ln(2)

    # KPI cards
    pdf.card_row([
        ("매출액", "133,930백만", "전기: 114,200백만  ▲17.3%", pdf.ORANGE),
        ("영업이익", "27,771백만", "전기: 26,601백만  ▲4.4%", (224, 48, 30)),
        ("자산", "125,499백만", "전기: 103,620백만  ▲21.1%", (160, 94, 55)),
        ("부채", "20,640백만", "전기: 20,564백만  ▲0.4%", (217, 57, 84)),
    ])

    # Indicators
    y = pdf.get_y() + 2
    full_w = 210 - pdf.l_margin - pdf.r_margin
    # 손익지표
    pdf._f(pdf.WHITE)
    pdf._d(pdf.LGRAY)
    pdf.rect(pdf.l_margin, y, full_w / 2 - 2, 20, "DF")
    pdf.set_xy(pdf.l_margin + 3, y + 2)
    pdf.set_font("noto", "B", 8)
    pdf._c(pdf.DARK)
    pdf.cell(40, 4, "손익지표")
    pdf.indicator("매출총이익률", "60.5%", pdf.ORANGE, pdf.l_margin + 5, y + 8, 25)
    pdf.indicator("영업이익률", "20.7%", (224, 48, 30), pdf.l_margin + 33, y + 8, 25)
    pdf.indicator("당기손익률", "16.3%", (160, 94, 55), pdf.l_margin + 61, y + 8, 25)
    # 유동성지표
    rx = pdf.l_margin + full_w / 2 + 2
    pdf._f(pdf.WHITE)
    pdf.rect(rx, y, full_w / 2 - 2, 20, "DF")
    pdf.set_xy(rx + 3, y + 2)
    pdf.set_font("noto", "B", 8)
    pdf._c(pdf.DARK)
    pdf.cell(40, 4, "유동성지표")
    pdf.indicator("부채비율", "20.9%", (217, 57, 84), rx + 15, y + 8, 30)
    pdf.indicator("유동비율", "889.2%", pdf.ORANGE, rx + 55, y + 8, 30)
    pdf.set_y(y + 24)

    # PL table
    pdf.sub("손익항목")
    pdf.table(
        ["공시용계정", "당기", "전기", "증감률"],
        [
            ["매출액", "133,930,227,921", "114,199,589,362", "▲17.3%", True],
            ["매출원가", "52,848,102,077", "45,901,641,513", "▲15.1%", True],
            ["매출총이익", "81,082,125,844", "68,297,947,849", "▲18.7%", True],
            ["판매비와관리비", "53,311,402,310", "41,696,713,765", "▲27.9%", True],
            ["영업이익", "27,770,723,534", "26,601,234,084", "▲4.4%", True],
            ["당기순손익", "21,803,252,164", "22,627,455,682", "▼3.6%", True],
        ],
        col_w=[35, 42, 42, 51],
        header_bg=pdf.DARK,
        right_cols={1, 2, 3},
    )

    # ========== PAGE 6: BS + SCENARIO ==========
    pdf.add_page()
    pdf.sub("재무항목")
    pdf.table(
        ["분류", "기말", "기초", "증감률"],
        [
            ["자산", "145,228,358,373", "103,620,341,622", "▲40.2%", True],
            ["  유동", "136,608,821,474", "93,506,741,039", "▲46.1%", False],
            ["  비유동", "8,619,536,899", "10,113,600,583", "▼14.8%", False],
            ["부채", "17,317,820,321", "20,564,424,522", "▼15.8%", True],
            ["  유동", "15,362,306,409", "17,190,508,253", "▼10.6%", False],
            ["  비유동", "1,955,513,912", "3,373,916,269", "▼42.0%", False],
            ["자본", "104,859,169,264", "83,055,917,100", "▲26.3%", True],
            ["  자본", "83,055,917,100", "83,055,917,100", "0.0%", False],
            ["  당기순이익", "21,803,252,164", "0", "-", False],
        ],
        col_w=[30, 45, 45, 50],
        header_bg=pdf.DARK,
        right_cols={1, 2, 3},
    )

    pdf.sub("시나리오 전표 수")
    y = pdf.get_y() + 1
    gap = 4
    sw = (210 - pdf.l_margin - pdf.r_margin - gap * 3) / 4
    pdf.scenario_card("동일금액 중복", "128", pdf.l_margin, y, sw)
    pdf.scenario_card("현금지급후 부채인식", "3,642", pdf.l_margin + sw + gap, y, sw)
    pdf.scenario_card("주말현금지급", "768", pdf.l_margin + (sw + gap) * 2, y, sw)
    pdf.scenario_card("현금지급 및 비용인식", "138", pdf.l_margin + (sw + gap) * 3, y, sw)
    pdf.set_y(y + 22)

    # ========== PAGE 7: PL / BS / JOURNAL ==========
    pdf.add_page()
    pdf.section("5", "화면 구성 — 분석 탭 상세")

    pdf.sub("5-1. 손익분석 (5개 서브탭)")
    pdf.table(
        ["서브탭", "내용"],
        [
            ["PL 요약", "매출액/매출총이익/영업이익/당기순이익 KPI + 월별 추이 차트"],
            ["PL 추이분석", "21개월 Bar+Line 차트, 매출총이익률/영업이익률 추이"],
            ["PL 계정분석", "계정별 금액 비교, 증감 분석"],
            ["매출분석", "거래처별 매출 비중, Top 거래처, Doughnut 차트"],
            ["손익항목", "8분기 × 11개 항목 분기별 비교 테이블"],
        ],
        col_w=[30, 140],
    )

    pdf.sub("5-2. 재무상태분석 (3개 서브탭)")
    pdf.table(
        ["서브탭", "내용"],
        [
            ["BS 요약", "자산/부채/자본 구성, 유동/비유동 분류, 증감률"],
            ["BS 추이분석", "재무비율 추이 (유동비율, 당좌비율, 부채비율)"],
            ["BS 계정분석", "계정별 잔액추이 + 거래처별 구성 분석"],
        ],
        col_w=[30, 140],
    )

    pdf.sub("5-3. 전표분석 (2개 서브탭)")
    pdf.table(
        ["서브탭", "내용"],
        [
            ["전표분석내역", "일별 전표 건수 추이, 계정과목별/거래처별 분석"],
            ["전표검색", "기간/계정/거래처/적요 필터, 페이지네이션 지원"],
        ],
        col_w=[30, 140],
    )

    pdf.sub("5-4. 시나리오분석 (6개 시나리오)")
    pdf.table(
        ["시나리오", "설명", "건수"],
        [
            ["S1. 동일금액 중복", "동일 금액이 동일 계정에 반복 기표", "128"],
            ["S2. 현금지급후 부채인식", "현금 지급 후 동일 금액 부채 재인식", "3,642"],
            ["S3. 주말 현금지급", "주말에 현금 지급 전표", "768"],
            ["S4. 고액 현금지급", "10억 이상 고액 현금 인출", "20"],
            ["S5. 현금지급 및 비용인식", "비용 인식과 동시 현금 지급", "138"],
            ["S6. Seldom Customer", "거래 빈도 1회 거래처", "20"],
        ],
        col_w=[48, 80, 42],
        right_cols={2},
    )

    # ========== PAGE 8: API & AUTH ==========
    pdf.add_page()
    pdf.section("6", "API 엔드포인트 (19개)")
    pdf.table(
        ["Method", "Path", "인증", "설명"],
        [
            ["POST", "/api/auth/login", "-", "로그인"],
            ["GET", "/api/auth/me", "JWT", "현재 사용자 정보"],
            ["GET", "/api/auth/companies", "JWT", "접근 가능 회사 목록"],
            ["GET", "/api/reports", "JWT", "리포트 목록"],
            ["POST", "/api/upload/v2", "JWT", "파일 업로드 & 리포트 생성"],
            ["GET", "/api/summary", "-", "Summary KPI"],
            ["GET", "/api/pl", "-", "손익계산서 + 분기별 + 월별"],
            ["GET", "/api/bs", "-", "재무상태표 + 재무비율"],
            ["GET", "/api/sales", "-", "매출 거래처 분석"],
            ["GET", "/api/journal", "-", "전표 요약 + 일별 추이"],
            ["GET", "/api/journal/search", "-", "전표 검색 (페이지네이션)"],
            ["GET", "/api/scenarios", "-", "시나리오 분석 6개"],
        ],
        col_w=[14, 42, 12, 102],
    )

    pdf.section("7", "인증 & 보안")
    pdf.table(
        ["항목", "구현"],
        [
            ["비밀번호 해싱", "PBKDF2-HMAC-SHA256 (100,000 iterations)"],
            ["토큰", "JWT (HMAC-SHA256, 24시간 만료)"],
            ["접근 통제", "사용자별 회사 접근 권한 (user_companies)"],
            ["자동 로그인", "선택적 (localStorage)"],
            ["보안 안내", "삼일회계법인 보안 정책 메시지"],
        ],
        col_w=[32, 138],
    )

    # ========== PAGE 9: RUN & FUTURE ==========
    pdf.add_page()
    pdf.section("8", "실행 방법")
    y = pdf.get_y()
    pdf._f(pdf.DARK)
    full_w = 210 - pdf.l_margin - pdf.r_margin
    pdf.rect(pdf.l_margin, y, full_w, 38, "F")
    pdf.set_xy(pdf.l_margin + 5, y + 4)
    code = [
        ("# 백엔드 (터미널 1)", True),
        ("cd easyview-web/backend", False),
        ("pip install -r requirements.txt", False),
        ("python run.py              # → http://localhost:8000", False),
        ("", False),
        ("# 프론트엔드 (터미널 2)", True),
        ("cd easyview-web/frontend", False),
        ("npm install", False),
        ("npm run dev -- -p 3003     # → http://localhost:3003/login", False),
    ]
    for line, is_comment in code:
        pdf.set_font("noto", "", 8)
        pdf._c((125, 125, 125) if is_comment else (220, 220, 220))
        pdf.cell(full_w - 10, 3.5, line, new_x="LMARGIN", new_y="NEXT")
        pdf.set_x(pdf.l_margin + 5)
    pdf.set_y(y + 42)

    pdf.section("9", "데이터 검증 (PDF 원본 100% 일치)")
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
        col_w=[40, 130],
        right_cols={1},
    )

    pdf.section("10", "향후 계획")
    items = [
        "리포트별 데이터 로드 (리포트 선택 → 해당 데이터로 대시보드)",
        "반응형 모바일 레이아웃",
        "Waterfall 차트 (손익 흐름 시각화)",
        "Vercel + Render 실배포",
    ]
    pdf.set_font("noto", "", 9)
    for item in items:
        pdf._c(pdf.ORANGE)
        pdf.cell(5, 6, chr(10003))
        pdf._c(pdf.DARK)
        pdf.cell(0, 6, "  " + item, new_x="LMARGIN", new_y="NEXT")

    # ===== SAVE =====
    out = os.path.join(OUTPUT_DIR, "EasyView_3.0_Overview_v2.pdf")
    pdf.output(out)
    print(f"\nPDF generated: {out}")
    print(f"Pages: {pdf.page_no()}")


if __name__ == "__main__":
    generate()
