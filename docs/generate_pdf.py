# -*- coding: utf-8 -*-
"""
Easy View 3.0 - Project Overview PDF Generator
Generates a professional PDF document using fpdf2.
"""

import os
from fpdf import FPDF

OUTPUT_DIR = os.path.dirname(os.path.abspath(__file__))
FONT_URL = "https://github.com/google/fonts/raw/main/ofl/notosanskr/NotoSansKR%5Bwght%5D.ttf"
FONT_PATH = os.path.join(OUTPUT_DIR, "NotoSansKR.ttf")

# Download font if not present
if not os.path.exists(FONT_PATH):
    print("Downloading Noto Sans KR font...")
    import urllib.request
    urllib.request.urlretrieve(FONT_URL, FONT_PATH)
    print("Font downloaded.")


class EasyViewPDF(FPDF):
    """Custom PDF class for Easy View project document."""

    # PwC Colors
    ORANGE = (208, 74, 2)
    DARK = (45, 45, 45)
    GRAY = (125, 125, 125)
    LIGHT_GRAY = (232, 232, 232)
    BG = (245, 245, 245)
    WHITE = (255, 255, 255)

    def __init__(self):
        super().__init__(orientation="P", unit="mm", format="A4")
        self.add_font("noto", "", FONT_PATH, uni=True)
        self.add_font("noto", "B", FONT_PATH, uni=True)
        self.set_auto_page_break(auto=True, margin=20)

    def _color(self, rgb):
        self.set_text_color(*rgb)

    def _fill(self, rgb):
        self.set_fill_color(*rgb)

    def _draw(self, rgb):
        self.set_draw_color(*rgb)

    # ===== Cover Page =====
    def cover_page(self):
        self.add_page()
        # Dark background
        self._fill(self.DARK)
        self.rect(0, 0, 210, 297, "F")

        # PwC logo text
        self.set_y(80)
        self.set_font("noto", "B", 28)
        self._color(self.WHITE)
        self.cell(0, 12, "pwc", align="C", new_x="LMARGIN", new_y="NEXT")

        # Orange bar
        self._fill(self.ORANGE)
        self.set_x(85)
        self.rect(85, self.get_y() + 5, 40, 2, "F")
        self.ln(15)

        # Title
        self.set_font("noto", "B", 32)
        self._color(self.WHITE)
        self.cell(0, 14, "Easy View 3.0", align="C", new_x="LMARGIN", new_y="NEXT")
        self.ln(3)

        # Subtitle
        self.set_font("noto", "", 13)
        self._color(self.GRAY)
        self.cell(0, 8, "PwC Worldwide Financial Analysis Platform", align="C", new_x="LMARGIN", new_y="NEXT")
        self.ln(8)

        # Version badge
        self._fill(self.ORANGE)
        badge_w = 60
        self.set_x((210 - badge_w) / 2)
        self.set_font("noto", "B", 10)
        self._color(self.WHITE)
        self.cell(badge_w, 9, "Web Service Edition", align="C", fill=True, new_x="LMARGIN", new_y="NEXT")
        self.ln(20)

        # Meta info
        self.set_font("noto", "", 10)
        self._color(self.GRAY)
        lines = [
            "삼일회계법인  Assurance Innovation",
            "Project Overview & Technical Documentation",
            "",
            "2024 - 2026  |  Confidential",
        ]
        for line in lines:
            self.cell(0, 7, line, align="C", new_x="LMARGIN", new_y="NEXT")

    # ===== Section Header =====
    def section_header(self, number, title):
        self._fill(self.ORANGE)
        self.rect(self.l_margin, self.get_y(), 3, 8, "F")
        self.set_x(self.l_margin + 6)
        self.set_font("noto", "B", 14)
        self._color(self.DARK)
        self.cell(0, 8, f"{number}. {title}", new_x="LMARGIN", new_y="NEXT")
        self.ln(4)

    # ===== Sub Header =====
    def sub_header(self, title):
        self.ln(3)
        self.set_font("noto", "B", 10)
        self._color(self.DARK)
        self.cell(0, 7, title, new_x="LMARGIN", new_y="NEXT")
        self.ln(2)

    # ===== Body Text =====
    def body_text(self, text):
        self.set_font("noto", "", 9)
        self._color(self.DARK)
        self.multi_cell(0, 5.5, text)
        self.ln(2)

    # ===== Table =====
    def table(self, headers, rows, col_widths=None):
        if col_widths is None:
            w = (210 - self.l_margin - self.r_margin) / len(headers)
            col_widths = [w] * len(headers)

        # Header
        self._fill(self.BG)
        self._draw(self.LIGHT_GRAY)
        self.set_font("noto", "B", 8)
        self._color((70, 70, 70))
        for i, h in enumerate(headers):
            self.cell(col_widths[i], 8, h, border="B", fill=True, align="L")
        self.ln()

        # Rows
        self.set_font("noto", "", 8)
        self._color(self.DARK)
        for row in rows:
            max_h = 6
            for i, cell in enumerate(row):
                self._draw(self.LIGHT_GRAY)
                bold = i == 0
                if bold:
                    self.set_font("noto", "B", 8)
                else:
                    self.set_font("noto", "", 8)
                self.cell(col_widths[i], max_h, str(cell), border="B", align="L")
            self.ln()
        self.ln(3)

    # ===== Card =====
    def card(self, title, desc, x=None, w=82):
        if x is not None:
            self.set_x(x)
        y = self.get_y()
        # Orange top line
        self._fill(self.ORANGE)
        self.rect(self.get_x(), y, w, 1.5, "F")
        # Card bg
        self._fill(self.WHITE)
        self._draw(self.LIGHT_GRAY)
        self.rect(self.get_x(), y + 1.5, w, 22, "DF")
        # Title
        self.set_xy(self.get_x() + 4, y + 4)
        self.set_font("noto", "B", 9)
        self._color(self.DARK)
        self.cell(w - 8, 5, title)
        # Desc
        self.set_xy(self.get_x() - w + 4, y + 10)
        self.set_font("noto", "", 7.5)
        self._color(self.GRAY)
        self.multi_cell(w - 8, 4, desc)

    # ===== Checklist =====
    def checklist(self, items):
        self.set_font("noto", "", 9)
        for item in items:
            self._color(self.ORANGE)
            self.cell(6, 6, chr(10003))
            self._color(self.DARK)
            self.cell(0, 6, "  " + item, new_x="LMARGIN", new_y="NEXT")
        self.ln(3)

    # ===== Flow Arrow =====
    def flow_box(self, label, x, y, w=32, h=14, active=False):
        if active:
            self._fill(self.ORANGE)
            self._color(self.WHITE)
        else:
            self._fill(self.BG)
            self._color(self.DARK)
        self._draw(self.LIGHT_GRAY)
        self.rect(x, y, w, h, "DF")
        self.set_xy(x, y + 3)
        self.set_font("noto", "B" if active else "", 7.5)
        self.cell(w, 4, label, align="C")

    def flow_arrow(self, x, y):
        self._color(self.GRAY)
        self.set_font("noto", "", 12)
        self.text(x, y + 4, chr(8594))

    # ===== Page Footer =====
    def footer(self):
        if self.page_no() == 1:
            return
        self.set_y(-15)
        self._draw(self.LIGHT_GRAY)
        self.line(self.l_margin, self.get_y(), 210 - self.r_margin, self.get_y())
        self.ln(2)
        self.set_font("noto", "", 7)
        self._color(self.GRAY)
        self.cell(0, 5, f"PwC Easy View 3.0 - Project Overview  |  Confidential  |  Page {self.page_no() - 1}", align="C")


def generate():
    pdf = EasyViewPDF()

    # ===== Page 1: Cover =====
    pdf.cover_page()

    # ===== Page 2: Project Overview =====
    pdf.add_page()
    pdf.section_header("1", "프로젝트 개요")
    pdf.body_text(
        "PwC Easy View 3.0은 삼일회계법인(PwC Korea)의 Power BI 기반 재무분석 리포트를 "
        "웹 환경으로 구현한 플랫폼입니다. 기존 58페이지 PDF 리포트의 모든 분석 기능을 "
        "인터랙티브 웹 대시보드로 제공하며, 감사팀과 고객사가 실시간으로 재무 데이터를 "
        "분석하고 리포트를 생성할 수 있습니다."
    )

    pdf.sub_header("핵심 목표")
    y = pdf.get_y()
    pdf.card("자동 리포트 생성", "원본 분개장/시산표 업로드 시 Easy View Template에 맞게 자동 가공하여 리포트 생성", x=pdf.l_margin, w=82)
    pdf.set_xy(pdf.l_margin + 88, y)
    pdf.card("접근 권한 통제", "삼일회계법인 등록 계정만 접근 가능, 사용자별 담당 고객사 데이터만 노출", x=pdf.l_margin + 88, w=82)
    pdf.set_y(y + 28)

    y = pdf.get_y()
    pdf.card("인터랙티브 분석", "차트 클릭 Drill-down, 전표 검색, 시나리오 분석 등 실시간 상호작용 지원", x=pdf.l_margin, w=82)
    pdf.set_xy(pdf.l_margin + 88, y)
    pdf.card("PDF 58페이지 대체", "기존 정적 PDF 리포트를 동적 웹 대시보드로 완전 대체, 최신 데이터 실시간 반영", x=pdf.l_margin + 88, w=82)
    pdf.set_y(y + 28)

    # ===== Tech Stack =====
    pdf.ln(4)
    pdf.section_header("2", "기술 스택")
    pdf.table(
        ["구분", "기술", "버전", "비고"],
        [
            ["프론트엔드", "Next.js (App Router)", "16.2", "TypeScript, React 19"],
            ["스타일링", "Tailwind CSS", "4.0", "PwC 커스텀 색상 테마"],
            ["차트", "Chart.js + react-chartjs-2", "4.4", "Bar, Line, Doughnut"],
            ["백엔드", "FastAPI (Python)", "3.11", "REST API, 19개 엔드포인트"],
            ["인증", "JWT (자체 구현)", "-", "PBKDF2-HMAC-SHA256"],
            ["데이터베이스", "SQLite (WAL 모드)", "-", "재무 DB + 인증 DB 분리"],
            ["폰트", "Noto Sans KR", "-", "Google Fonts"],
        ],
        col_widths=[30, 45, 15, 80],
    )

    # ===== Page 3: User Flow =====
    pdf.add_page()
    pdf.section_header("3", "사용자 플로우")

    pdf.sub_header("전체 네비게이션")
    y = pdf.get_y() + 2
    pdf.flow_box("서비스 소개", pdf.l_margin, y, 34)
    pdf.flow_arrow(pdf.l_margin + 36, y + 3)
    pdf.flow_box("로그인", pdf.l_margin + 43, y, 28, active=True)
    pdf.flow_arrow(pdf.l_margin + 73, y + 3)
    pdf.flow_box("리포트 목록", pdf.l_margin + 80, y, 34)
    pdf.flow_arrow(pdf.l_margin + 116, y + 3)
    pdf.flow_box("대시보드", pdf.l_margin + 123, y, 30)
    pdf.set_y(y + 20)

    y2 = pdf.get_y() + 2
    pdf.flow_box("데이터 업로드", pdf.l_margin + 43, y2, 34)
    pdf.flow_arrow(pdf.l_margin + 79, y2 + 3)
    pdf.flow_box("리포트 변환", pdf.l_margin + 86, y2, 32)
    pdf.flow_arrow(pdf.l_margin + 120, y2 + 3)
    pdf.flow_box("생성 완료", pdf.l_margin + 127, y2, 28)
    pdf.set_y(y2 + 20)

    pdf.sub_header("리포트 생성 프로세스")
    steps = [
        "1. 로그인 후 '새 리포트' 클릭",
        "2. 결산 연도/월 선택, 대상 회사 선택",
        "3. 분개장(JE/GL) + 시산표(TB) 필수 업로드, 재무제표/기타파일 선택 업로드",
        "4. 'Report 생성하기' 클릭 → 리포트 변환 애니메이션 (단계별 진행 표시)",
        "5. 생성 완료 → 'Easy View 리포트 보기' → 대시보드에서 즉시 확인",
    ]
    pdf.set_font("noto", "", 9)
    for step in steps:
        pdf._color(pdf.DARK)
        pdf.cell(0, 6.5, step, new_x="LMARGIN", new_y="NEXT")
    pdf.ln(5)

    # ===== Dashboard =====
    pdf.section_header("4", "대시보드 구성 (5개 탭)")
    pdf.table(
        ["탭", "서브탭", "주요 내용"],
        [
            ["Summary", "-", "KPI 4개 (매출액, 매출총이익, 영업이익, 당기순이익)"],
            ["손익분석", "PL요약, 추이, 계정, 매출, 손익항목", "월별/분기별 손익 추이, 계정별 드릴다운"],
            ["재무상태분석", "BS요약, 추이분석, 계정분석", "자산/부채/자본, 재무비율 추이"],
            ["전표분석", "전표분석내역, 전표검색", "일별 추이, 기간/계정/거래처/적요 검색"],
            ["시나리오분석", "6개 시나리오", "동일금액 중복, 현금지급 후 부채인식 등"],
        ],
        col_widths=[28, 55, 87],
    )

    pdf.sub_header("비교 필터")
    pdf.body_text("전년누적(YTD) / 전년동월(YoY) / 전월비교(MoM) 3가지 기간 비교 + 21개월 자유 선택")

    # ===== Page 4: Auth & API =====
    pdf.add_page()
    pdf.section_header("5", "인증 & 보안")
    pdf.table(
        ["항목", "구현"],
        [
            ["비밀번호 해싱", "PBKDF2-HMAC-SHA256 (100,000 iterations + random salt)"],
            ["토큰 방식", "JWT (HMAC-SHA256 서명, 24시간 만료)"],
            ["접근 통제", "사용자별 회사 접근 권한 (user_companies 테이블)"],
            ["자동 로그인", "선택적 자동 로그인 (localStorage)"],
            ["보안 안내", "삼일회계법인 보안 정책 안내 메시지 표시"],
        ],
        col_widths=[35, 135],
    )

    pdf.sub_header("테스트 계정")
    pdf.table(
        ["이메일", "비밀번호", "역할", "접근 회사"],
        [
            ["admin@samil.com", "admin1234", "관리자", "ABC, XYZ, 삼일전자"],
            ["user@samil.com", "user1234", "사용자", "ABC만"],
        ],
        col_widths=[45, 30, 20, 75],
    )

    # ===== API =====
    pdf.section_header("6", "API 엔드포인트 (19개)")
    pdf.table(
        ["Method", "Path", "인증", "설명"],
        [
            ["POST", "/api/auth/login", "-", "로그인"],
            ["GET", "/api/auth/me", "JWT", "현재 사용자 정보"],
            ["GET", "/api/auth/companies", "JWT", "접근 가능 회사 목록"],
            ["GET", "/api/reports", "JWT", "리포트 목록"],
            ["POST", "/api/upload/v2", "JWT", "파일 업로드 & 리포트 생성"],
            ["GET", "/api/summary", "-", "Summary KPI 데이터"],
            ["GET", "/api/pl", "-", "손익계산서 + 분기별 + 월별 추이"],
            ["GET", "/api/bs", "-", "재무상태표 + 재무비율 추이"],
            ["GET", "/api/sales", "-", "매출 거래처 분석"],
            ["GET", "/api/journal", "-", "전표 요약 + 일별 추이"],
            ["GET", "/api/journal/search", "-", "전표 검색 (페이지네이션)"],
            ["GET", "/api/scenarios", "-", "시나리오 분석 6개"],
        ],
        col_widths=[15, 42, 12, 101],
    )
    pdf.set_font("noto", "", 7)
    pdf._color(pdf.GRAY)
    pdf.cell(0, 5, "* 외 7개 엔드포인트: health, meta, months, data, bs/account, pl/journal, scenarios/{id}, upload(legacy)", align="C", new_x="LMARGIN", new_y="NEXT")

    # ===== Page 5: Data & Future =====
    pdf.add_page()
    pdf.section_header("7", "데이터 검증")
    pdf.body_text("Power BI 원본 PDF 리포트와 Easy View 웹 대시보드의 수치가 100% 일치함을 검증하였습니다.")
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
        col_widths=[40, 130],
    )

    pdf.section_header("8", "실행 방법")
    pdf.set_font("noto", "", 8.5)
    pdf._fill((45, 45, 45))
    code_y = pdf.get_y()
    pdf.rect(pdf.l_margin, code_y, 170, 42, "F")
    pdf.set_xy(pdf.l_margin + 5, code_y + 4)
    pdf._color((180, 180, 180))
    code_lines = [
        "# 백엔드 (터미널 1)",
        "cd easyview-web/backend",
        "pip install -r requirements.txt",
        "python run.py              # → http://localhost:8000",
        "",
        "# 프론트엔드 (터미널 2)",
        "cd easyview-web/frontend",
        "npm install",
        "npm run dev -- -p 3003     # → http://localhost:3003/login",
    ]
    for line in code_lines:
        if line.startswith("#"):
            pdf._color((125, 125, 125))
        else:
            pdf._color((232, 232, 232))
        pdf.cell(160, 4, line, new_x="LMARGIN", new_y="NEXT")
        pdf.set_x(pdf.l_margin + 5)
    pdf.set_y(code_y + 46)

    pdf.section_header("9", "향후 계획")
    pdf.checklist([
        "전체 PDF 내보내기 (모든 탭 → 하나의 PDF)",
        "리포트별 데이터 로드 (리포트 선택 → 해당 데이터로 대시보드 렌더링)",
        "반응형 모바일 레이아웃",
        "Waterfall 차트 (손익 흐름 시각화)",
        "Vercel + Render 실배포",
    ])

    # ===== Save =====
    output_path = os.path.join(OUTPUT_DIR, "EasyView_3.0_Project_Overview.pdf")
    pdf.output(output_path)
    print(f"\nPDF generated: {output_path}")
    print(f"Pages: {pdf.page_no()}")


if __name__ == "__main__":
    generate()
