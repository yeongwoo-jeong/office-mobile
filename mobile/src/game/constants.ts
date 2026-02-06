import { Card, GemColor, Noble } from './types';

export const INITIAL_TOKENS = () => ({
  [GemColor.White]: 7,
  [GemColor.Blue]: 7,
  [GemColor.Green]: 7,
  [GemColor.Red]: 7,
  [GemColor.Black]: 7,
  [GemColor.Gold]: 5,
});

export const WINNING_SCORE = 15;
export const SEASON_DURATION_DAYS = 28;

export interface RankInfo {
  id: number;
  name: string;
  threshold: number;
  color: string;
}

export const RANK_SYSTEM: RankInfo[] = [
  { id: 1, name: '수습', threshold: 0, color: '#94a3b8' },
  { id: 2, name: '사원', threshold: 3, color: '#e2e8f0' },
  { id: 3, name: '주임', threshold: 8, color: '#a7f3d0' },
  { id: 4, name: '대리', threshold: 15, color: '#34d399' },
  { id: 5, name: '과장', threshold: 25, color: '#10b981' },
  { id: 6, name: '차장', threshold: 40, color: '#2dd4bf' },
  { id: 7, name: '부장', threshold: 60, color: '#22d3ee' },
  { id: 8, name: '상무', threshold: 90, color: '#60a5fa' },
  { id: 9, name: '전무', threshold: 130, color: '#818cf8' },
  { id: 10, name: '부사장', threshold: 180, color: '#a78bfa' },
  { id: 11, name: '사장', threshold: 235, color: '#c084fc' },
  { id: 12, name: '부회장', threshold: 300, color: '#e879f9' },
  { id: 13, name: '회장', threshold: 365, color: '#fbbf24' },
];

export const REWARD_TABLE: Record<number, number[]> = {
  2: [1, 0],
  3: [2, 1, 0],
  4: [3, 1, 0, 0],
};

export const getRank = (vacations: number) => {
  for (let i = RANK_SYSTEM.length - 1; i >= 0; i -= 1) {
    if (vacations >= RANK_SYSTEM[i].threshold) return RANK_SYSTEM[i];
  }
  return RANK_SYSTEM[0];
};

export const getNextRank = (vacations: number) => {
  for (let i = 0; i < RANK_SYSTEM.length; i += 1) {
    if (vacations < RANK_SYSTEM[i].threshold) return RANK_SYSTEM[i];
  }
  return null;
};

const mapColor = (k: string): GemColor => {
  switch (k) {
    case '김':
      return GemColor.Red;
    case '박':
      return GemColor.Blue;
    case '나':
      return GemColor.Green;
    case '이':
      return GemColor.Black;
    case '하':
      return GemColor.White;
    default:
      return GemColor.Gold;
  }
};

const mapCost = (costObj: any) => {
  const newCost: any = {};
  for (const [key, val] of Object.entries(costObj)) {
    if (val && val !== 0) newCost[mapColor(key)] = val;
  }
  return newCost;
};

export const NOBLES: Noble[] = [
  { id: 'R-01', name: '김부장 추천서', points: 3, requirements: { 김: 4, 박: 2, 나: 2, 이: 0, 하: 0 } },
  { id: 'R-02', name: '나부장 추천서', points: 3, requirements: { 하: 4, 나: 2, 이: 2, 김: 0, 박: 0 } },
  { id: 'R-03', name: '박부장 추천서', points: 3, requirements: { 박: 4, 이: 2, 김: 2, 나: 0, 하: 0 } },
  { id: 'R-04', name: '이부장 추천서', points: 3, requirements: { 이: 4, 김: 2, 하: 2, 나: 0, 박: 0 } },
  { id: 'R-05', name: '하부장 추천서', points: 3, requirements: { 하: 4, 박: 2, 나: 2, 김: 0, 이: 0 } },
  { id: 'R-06', name: '책임연구원 추천서', points: 3, requirements: { 김: 3, 이: 3, 박: 3, 나: 0, 하: 0 } },
  { id: 'R-07', name: '상무 추천서', points: 3, requirements: { 나: 3, 하: 3, 김: 3, 이: 0, 박: 0 } },
  { id: 'R-08', name: '전무 추천서', points: 3, requirements: { 박: 4, 하: 4, 김: 0, 나: 0, 이: 0 } },
  { id: 'R-09', name: '부사장 추천서', points: 3, requirements: { 이: 4, 나: 4, 김: 0, 박: 0, 하: 0 } },
  { id: 'R-10', name: '이사 추천서', points: 3, requirements: { 김: 2, 이: 2, 박: 2, 나: 2, 하: 2 } },
].map((n) => ({
  ...n,
  requirements: mapCost(n.requirements),
}));

const RAW_CARDS = [
  { id: 'T1-001', tier: 1, name: '출장체크 확정', bonus: '김', points: 1, cost: { 하: 4 } },
  { id: 'T1-002', tier: 1, name: '회의실예약 확정', bonus: '나', points: 1, cost: { 이: 4 } },
  { id: 'T1-003', tier: 1, name: '메일 분류 규칙 정리', bonus: '박', points: 1, cost: { 김: 4 } },
  { id: 'T1-004', tier: 1, name: '서명용 이메일 취합', bonus: '이', points: 1, cost: { 나: 4 } },
  { id: 'T1-005', tier: 1, name: '업무파일 바이러스 검사', bonus: '하', points: 1, cost: { 박: 4 } },
  { id: 'T1-006', tier: 1, name: '출장비 영수증 스캔', bonus: '김', points: 0, cost: { 이: 2, 하: 1 } },
  { id: 'T1-007', tier: 1, name: '주간업무보고 초안', bonus: '나', points: 0, cost: { 김: 2, 하: 1 } },
  { id: 'T1-008', tier: 1, name: '문서 헤더 구조 정리', bonus: '박', points: 0, cost: { 김: 2, 이: 1 } },
  { id: 'T1-009', tier: 1, name: '파일명 규칙 적용', bonus: '이', points: 0, cost: { 박: 2, 김: 1 } },
  { id: 'T1-010', tier: 1, name: '회의록 예약본 작성', bonus: '하', points: 0, cost: { 김: 2, 나: 1 } },
  { id: 'T1-011', tier: 1, name: '업무요청 연락 등록', bonus: '김', points: 0, cost: { 이: 1, 박: 1, 나: 1, 하: 1 } },
  { id: 'T1-012', tier: 1, name: '간단 QA 체크', bonus: '나', points: 0, cost: { 김: 1, 박: 1, 이: 1, 하: 1 } },
  { id: 'T1-013', tier: 1, name: '광고 확인 체크리스트', bonus: '박', points: 0, cost: { 김: 1, 나: 1, 박: 1, 하: 1 } },
  { id: 'T1-014', tier: 1, name: '고객문의 분류 템플릿', bonus: '이', points: 0, cost: { 김: 1, 나: 1, 박: 1, 이: 1 } },
  { id: 'T1-015', tier: 1, name: '사내공지 게시 초안', bonus: '하', points: 0, cost: { 김: 1, 나: 1, 박: 1, 이: 1 } },
  { id: 'T1-016', tier: 1, name: '권한요청서 작성', bonus: '김', points: 0, cost: { 이: 2, 박: 1, 하: 1 } },
  { id: 'T1-017', tier: 1, name: '간편 입력 보조', bonus: '나', points: 0, cost: { 김: 1, 이: 1, 박: 2 } },
  { id: 'T1-018', tier: 1, name: '견적요청서 작성', bonus: '박', points: 0, cost: { 김: 1, 나: 2, 하: 2 } },
  { id: 'T1-019', tier: 1, name: '일정 캘린더 등록', bonus: '이', points: 0, cost: { 박: 2, 김: 1, 하: 2 } },
  { id: 'T1-020', tier: 1, name: '리스트업(인적/자재) 작성', bonus: '하', points: 0, cost: { 김: 2, 나: 2, 이: 1 } },
  { id: 'T2-001', tier: 2, name: '프로세스 개선안 초안', bonus: '김', points: 2, cost: { 이: 5 } },
  { id: 'T2-002', tier: 2, name: '업무재입 보고', bonus: '나', points: 2, cost: { 하: 5 } },
  { id: 'T2-003', tier: 2, name: '부서간 일정조율', bonus: '박', points: 2, cost: { 김: 5 } },
  { id: 'T2-004', tier: 2, name: '고객 VOC 분석서', bonus: '이', points: 2, cost: { 나: 5 } },
  { id: 'T2-005', tier: 2, name: '야근 스케줄 예약', bonus: '하', points: 2, cost: { 박: 5 } },
  { id: 'T2-006', tier: 2, name: '성과 분석서', bonus: '김', points: 3, cost: { 이: 6 } },
  { id: 'T2-007', tier: 2, name: '중기 리스크 보고', bonus: '나', points: 3, cost: { 하: 6 } },
  { id: 'T2-008', tier: 2, name: '연말 인사 제안', bonus: '박', points: 3, cost: { 김: 6 } },
  { id: 'T2-009', tier: 2, name: '연간 공급체계 검토서', bonus: '이', points: 3, cost: { 박: 6 } },
  { id: 'T2-010', tier: 2, name: '계약조건 비교표', bonus: '하', points: 3, cost: { 김: 6 } },
  { id: 'T3-001', tier: 3, name: '전사 KPI 개선 보고서', bonus: '김', points: 5, cost: { 이: 7, 하: 3 } },
  { id: 'T3-002', tier: 3, name: '총괄계약 실사 보고', bonus: '나', points: 5, cost: { 박: 7, 하: 3 } },
  { id: 'T3-003', tier: 3, name: '임원 브리핑 자료', bonus: '박', points: 5, cost: { 나: 7, 김: 3 } },
  { id: 'T3-004', tier: 3, name: '중장기 인력 로드맵', bonus: '이', points: 5, cost: { 하: 7, 나: 3 } },
  { id: 'T3-005', tier: 3, name: '감사 최종보고', bonus: '하', points: 5, cost: { 김: 7, 박: 3 } },
];

const processCards = (tier: number): Card[] =>
  RAW_CARDS.filter((c) => c.tier === tier).map((c) => ({
    ...c,
    tier: c.tier as 1 | 2 | 3,
    bonus: mapColor(c.bonus),
    cost: mapCost(c.cost),
  }));

export const TIER_1_CARDS: Card[] = processCards(1);
export const TIER_2_CARDS: Card[] = processCards(2);
export const TIER_3_CARDS: Card[] = processCards(3);
