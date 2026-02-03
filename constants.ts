
import { Card, GemColor, Noble } from './types';

export const INITIAL_TOKENS = (playerCount: number) => {
  // Rule: Keep 7 tokens as requested by user (originally constant)
  const count = 7;
  return {
    [GemColor.White]: count,
    [GemColor.Blue]: count,
    [GemColor.Green]: count,
    [GemColor.Red]: count,
    [GemColor.Black]: count,
    [GemColor.Gold]: 5,
  };
};

export const WINNING_SCORE = 15;
export const SEASON_DURATION_DAYS = 28;

// --- RANK SYSTEM ---
export interface RankInfo {
  id: number;
  name: string;
  threshold: number;
  color: string;
}

export const RANK_SYSTEM: RankInfo[] = [
  { id: 1, name: '수습', threshold: 0, color: 'text-slate-400' },
  { id: 2, name: '사원', threshold: 3, color: 'text-slate-200' },
  { id: 3, name: '주임', threshold: 8, color: 'text-emerald-200' },
  { id: 4, name: '대리', threshold: 15, color: 'text-emerald-400' },
  { id: 5, name: '과장', threshold: 25, color: 'text-emerald-500' },
  { id: 6, name: '차장', threshold: 40, color: 'text-teal-400' },
  { id: 7, name: '부장', threshold: 60, color: 'text-cyan-400' },
  { id: 8, name: '상무', threshold: 90, color: 'text-blue-400' },
  { id: 9, name: '전무', threshold: 130, color: 'text-indigo-400' },
  { id: 10, name: '부사장', threshold: 180, color: 'text-violet-400' },
  { id: 11, name: '사장', threshold: 235, color: 'text-purple-400' },
  { id: 12, name: '부회장', threshold: 300, color: 'text-fuchsia-400' },
  { id: 13, name: '회장', threshold: 365, color: 'text-amber-400' }
];

export const REWARD_TABLE: Record<number, number[]> = {
    2: [1, 0],
    3: [2, 1, 0],
    4: [3, 1, 0, 0]
};

export const getRank = (vacations: number) => {
  for (let i = RANK_SYSTEM.length - 1; i >= 0; i--) {
    if (vacations >= RANK_SYSTEM[i].threshold) {
      return RANK_SYSTEM[i];
    }
  }
  return RANK_SYSTEM[0];
};

export const getNextRank = (vacations: number) => {
  for (let i = 0; i < RANK_SYSTEM.length; i++) {
    if (vacations < RANK_SYSTEM[i].threshold) {
      return RANK_SYSTEM[i];
    }
  }
  return null;
};

// Mapping Helper: Korean -> GemColor
const mapColor = (k: string): GemColor => {
  switch (k) {
    case '김': return GemColor.Red;
    case '박': return GemColor.Blue;
    case '나': return GemColor.Green;
    case '이': return GemColor.Black;
    case '하': return GemColor.White;
    default: return GemColor.Gold;
  }
};

const mapCost = (costObj: any) => {
  const newCost: any = {};
  for (const [key, val] of Object.entries(costObj)) {
    if (val && val !== 0) {
      newCost[mapColor(key)] = val;
    }
  }
  return newCost;
};

// --- DATA INJECTION ---

export const NOBLES: Noble[] = [
  {"id":"R-01","name":"김이사 추천서","points":3,"requirements":{"김":4,"박":2,"이":2,"나":0,"하":0}},
  {"id":"R-02","name":"나이사 추천서","points":3,"requirements":{"나":4,"이":2,"하":2,"김":0,"박":0}},
  {"id":"R-03","name":"박이사 추천서","points":3,"requirements":{"박":4,"나":2,"김":2,"이":0,"하":0}},
  {"id":"R-04","name":"이이사 추천서","points":3,"requirements":{"이":4,"김":2,"하":2,"나":0,"박":0}},
  {"id":"R-05","name":"하이사 추천서","points":3,"requirements":{"하":4,"박":2,"나":2,"김":0,"이":0}},
  {"id":"R-06","name":"책임연구원 추천서","points":3,"requirements":{"김":3,"나":3,"박":3,"이":0,"하":0}},
  {"id":"R-07","name":"상무 추천서","points":3,"requirements":{"이":3,"하":3,"김":3,"나":0,"박":0}},
  {"id":"R-08","name":"전무 추천서","points":3,"requirements":{"박":4,"이":4,"김":0,"나":0,"하":0}},
  {"id":"R-09","name":"부사장 추천서","points":3,"requirements":{"나":4,"하":4,"김":0,"박":0,"이":0}},
  {"id":"R-10","name":"인사팀장 추천서","points":3,"requirements":{"김":2,"나":2,"박":2,"이":2,"하":2}}
].map(n => ({
  ...n,
  requirements: mapCost(n.requirements)
}));

/* 
  Card Generation Rules:
  
  Tier 1:
  - 001-005: 1 Point, Cost 4 (Single Color).
  - 006-010: 0 Points, Cost Sum 3 (Must be 2+1 pattern). ONLY 5 CARDS.
  - 011-015: 0 Points, Cost 4 (4 colors: 1/1/1/1).
  - Others: 0 Points, Cost Sum >= 4. (No 1/1/1 allowed).
  
  Tier 2:
  - 001-005: 2 Points, Cost 5 (Single Color).
  - 006-010: 3 Points, Cost 6 (Single Color).
  - 011-015: 1-2 Points, Cost Sum 6~8 (4 colors).
  - Others: 1-3 Points, Mixed.
  
  Tier 3:
  - 001-005: 5 Points, Cost 7 (A) + 3 (B).
  - 006-008: 4 Points, Cost 7 (Single Color).
  - 009-013: 3-4 Points, Cost Sum 10~12 (4 colors).
  - Others: 3-4 Points, Mixed.
*/

const RAW_CARDS = [
  // --- TIER 1 (Lv 1) ---
  // Special: 1 Point, Cost 4 Single
  {"id":"T1-001","tier":1,"name":"출근체크 정정","bonus":"김","points":1,"cost":{"이":4}},
  {"id":"T1-002","tier":1,"name":"회의실 예약 확정","bonus":"나","points":1,"cost":{"하":4}},
  {"id":"T1-003","tier":1,"name":"메일 제목 규칙 정리","bonus":"박","points":1,"cost":{"김":4}},
  {"id":"T1-004","tier":1,"name":"서명란 누락 점검","bonus":"이","points":1,"cost":{"나":4}},
  {"id":"T1-005","tier":1,"name":"첨부파일 바이러스 검사","bonus":"하","points":1,"cost":{"박":4}},

  // Cost 3 (2+1) - EXACTLY 5 CARDS
  {"id":"T1-006","tier":1,"name":"출장비 영수증 스캔","bonus":"김","points":0,"cost":{"나":2,"하":1}},
  {"id":"T1-007","tier":1,"name":"주간업무보고 초안","bonus":"나","points":0,"cost":{"이":2,"하":1}},
  {"id":"T1-008","tier":1,"name":"문서 폴더 구조 정리","bonus":"박","points":0,"cost":{"김":2,"나":1}},
  {"id":"T1-009","tier":1,"name":"파일명 표준 적용","bonus":"이","points":0,"cost":{"박":2,"김":1}},
  {"id":"T1-010","tier":1,"name":"회의록 요약본 작성","bonus":"하","points":0,"cost":{"김":2,"이":1}},
  
  // Cost 4 (1/1/1/1)
  {"id":"T1-011","tier":1,"name":"업무요청 티켓 등록","bonus":"김","points":0,"cost":{"나":1,"박":1,"이":1,"하":1}}, 
  {"id":"T1-012","tier":1,"name":"간단 QA 체크","bonus":"나","points":0,"cost":{"김":1,"박":1,"이":1,"하":1}}, 
  {"id":"T1-013","tier":1,"name":"재고 확인 체크리스트","bonus":"박","points":0,"cost":{"김":1,"나":1,"이":1,"하":1}}, 
  {"id":"T1-014","tier":1,"name":"고객문의 분류 태깅","bonus":"이","points":0,"cost":{"김":1,"나":1,"박":1,"하":1}}, 
  {"id":"T1-015","tier":1,"name":"사내공지 게시 초안","bonus":"하","points":0,"cost":{"김":1,"나":1,"박":1,"이":1}}, 

  // Cost >= 4 (Mixed, no 3-cost)
  {"id":"T1-016","tier":1,"name":"권한요청서 작성","bonus":"김","points":0,"cost":{"나":2,"박":1,"하":1}}, // 4
  {"id":"T1-017","tier":1,"name":"전표 입력 보조","bonus":"나","points":0,"cost":{"이":1,"김":1,"박":2}}, // 4
  {"id":"T1-018","tier":1,"name":"견적요청서 작성","bonus":"박","points":0,"cost":{"김":1,"하":2,"나":2}}, // 5
  {"id":"T1-019","tier":1,"name":"일정 캘린더 등록","bonus":"이","points":0,"cost":{"박":2,"하":1,"김":2}}, // 5
  {"id":"T1-020","tier":1,"name":"리스트업(업체/자재) 작성","bonus":"하","points":0,"cost":{"김":2,"나":2,"이":1}}, // 5
  {"id":"T1-021","tier":1,"name":"템플릿 적용(서식)","bonus":"김","points":0,"cost":{"이":3,"나":2}}, // 5
  {"id":"T1-022","tier":1,"name":"표준서식 변환","bonus":"나","points":0,"cost":{"김":2,"하":3}}, // 5
  {"id":"T1-023","tier":1,"name":"업무 로그 정리","bonus":"박","points":0,"cost":{"이":3,"하":2}}, // 5
  {"id":"T1-024","tier":1,"name":"샘플 발송 등록","bonus":"이","points":0,"cost":{"김":2,"나":3}}, // 5
  {"id":"T1-025","tier":1,"name":"검수표 체크","bonus":"하","points":0,"cost":{"박":3,"김":2}}, // 5
  {"id":"T1-026","tier":1,"name":"리스크 체크리스트 작성","bonus":"김","points":0,"cost":{"나":2,"하":2,"이":2}}, // 6
  {"id":"T1-027","tier":1,"name":"버전표기 통일","bonus":"나","points":0,"cost":{"이":2,"하":2,"김":2}}, // 6
  {"id":"T1-028","tier":1,"name":"자료요청 회신","bonus":"박","points":0,"cost":{"김":2,"나":2,"하":2}}, // 6
  {"id":"T1-029","tier":1,"name":"회의자료 출력","bonus":"이","points":0,"cost":{"박":3,"김":3}}, // 6
  {"id":"T1-030","tier":1,"name":"근태표 업데이트","bonus":"하","points":0,"cost":{"김":3,"이":3}}, // 6
  {"id":"T1-031","tier":1,"name":"데이터 정렬/중복 제거","bonus":"김","points":0,"cost":{"이":2,"하":1,"박":1}}, // 4
  {"id":"T1-032","tier":1,"name":"이미지 리사이즈","bonus":"나","points":0,"cost":{"김":1,"박":1,"이":2}}, // 4 (Increased from 3)
  {"id":"T1-033","tier":1,"name":"백업 스냅샷 생성","bonus":"박","points":0,"cost":{"이":2,"김":1,"하":2}}, // 5
  {"id":"T1-034","tier":1,"name":"결재선 확인","bonus":"이","points":0,"cost":{"김":2,"하":2,"나":2}}, // 6
  {"id":"T1-035","tier":1,"name":"전화메모 입력","bonus":"하","points":0,"cost":{"박":2,"이":1,"나":1}}, // 4 (Increased from 3)
  {"id":"T1-036","tier":1,"name":"중요메일 분류","bonus":"김","points":0,"cost":{"나":2,"박":2,"이":2}}, // 6
  {"id":"T1-037","tier":1,"name":"프로젝트 현황표 갱신","bonus":"나","points":0,"cost":{"이":2,"김":1,"하":1}}, // 4
  {"id":"T1-038","tier":1,"name":"간단 매크로 적용","bonus":"박","points":0,"cost":{"김":1,"하":2,"나":2}}, // 5
  {"id":"T1-039","tier":1,"name":"문서 스캔 등록","bonus":"이","points":0,"cost":{"박":2,"하":2}}, // 4
  {"id":"T1-040","tier":1,"name":"체크리스트 최종확인","bonus":"하","points":0,"cost":{"김":1,"나":2,"이":2}}, // 5

  // --- TIER 2 (Lv 2) ---
  // Special A: 2 Points, Cost 5 Same
  {"id":"T2-001","tier":2,"name":"프로세스 개선안 초안","bonus":"김","points":2,"cost":{"이":5}},
  {"id":"T2-002","tier":2,"name":"협업툴 도입 보고","bonus":"나","points":2,"cost":{"하":5}},
  {"id":"T2-003","tier":2,"name":"부서간 일정조율안","bonus":"박","points":2,"cost":{"김":5}},
  {"id":"T2-004","tier":2,"name":"고객 VOC 분석서","bonus":"이","points":2,"cost":{"나":5}},
  {"id":"T2-005","tier":2,"name":"월간 실적 요약","bonus":"하","points":2,"cost":{"박":5}},

  // Special B: 3 Points, Cost 6 Same
  {"id":"T2-006","tier":2,"name":"원가 분석표","bonus":"김","points":3,"cost":{"하":6}},
  {"id":"T2-007","tier":2,"name":"납기 리스크 보고","bonus":"나","points":3,"cost":{"이":6}},
  {"id":"T2-008","tier":2,"name":"품질 이슈 대응안","bonus":"박","points":3,"cost":{"나":6}},
  {"id":"T2-009","tier":2,"name":"신규 공급처 검토서","bonus":"이","points":3,"cost":{"박":6}},
  {"id":"T2-010","tier":2,"name":"계약조건 비교표","bonus":"하","points":3,"cost":{"김":6}},

  // NEW: 4-Color Cost (Mixed)
  {"id":"T2-011","tier":2,"name":"프로젝트 WBS 작성","bonus":"김","points":1,"cost":{"나":2,"박":2,"이":1,"하":1}}, // 6 (4-color)
  {"id":"T2-012","tier":2,"name":"테스트 계획서","bonus":"나","points":2,"cost":{"김":2,"박":2,"이":2,"하":1}}, // 7 (4-color)
  {"id":"T2-013","tier":2,"name":"배포 체크리스트 v2","bonus":"박","points":2,"cost":{"김":2,"나":2,"이":2,"하":2}}, // 8 (4-color)
  {"id":"T2-014","tier":2,"name":"보안 점검 결과보고","bonus":"이","points":2,"cost":{"김":1,"나":2,"박":2,"하":2}}, // 7 (4-color)
  {"id":"T2-015","tier":2,"name":"인프라 비용 절감안","bonus":"하","points":1,"cost":{"김":2,"나":1,"박":2,"이":1}}, // 6 (4-color)

  {"id":"T2-016","tier":2,"name":"교육자료 제작(신입)","bonus":"김","points":2,"cost":{"나":2,"박":3,"하":2}}, // 7
  {"id":"T2-017","tier":2,"name":"제품 소개서 업데이트","bonus":"나","points":2,"cost":{"이":4,"김":1,"박":1}}, // 6
  {"id":"T2-018","tier":2,"name":"QA 리포트(주간)","bonus":"박","points":1,"cost":{"김":3,"하":3}}, // 6
  {"id":"T2-019","tier":2,"name":"대외 커뮤니케이션 초안","bonus":"이","points":2,"cost":{"박":3,"하":2,"김":2}}, // 7
  {"id":"T2-020","tier":2,"name":"클레임 처리 보고","bonus":"하","points":2,"cost":{"김":2,"나":3,"이":3}}, // 8
  {"id":"T2-021","tier":2,"name":"매출 예측 모델 시트","bonus":"김","points":3,"cost":{"이":3,"나":3,"박":2}}, // 8
  {"id":"T2-022","tier":2,"name":"인력 배치안","bonus":"나","points":2,"cost":{"김":2,"하":4,"이":1}}, // 7
  {"id":"T2-023","tier":2,"name":"구매 요청서 패키지","bonus":"박","points":2,"cost":{"이":3,"하":2}}, // 5
  {"id":"T2-024","tier":2,"name":"검수 기준서 정비","bonus":"이","points":1,"cost":{"김":2,"나":3}}, // 5
  {"id":"T2-025","tier":2,"name":"서비스 장애 회고서","bonus":"하","points":2,"cost":{"박":3,"김":2,"나":2}}, // 7
  {"id":"T2-026","tier":2,"name":"고객사 제안서 초안","bonus":"김","points":2,"cost":{"나":2,"하":2,"이":2}}, // 6
  {"id":"T2-027","tier":2,"name":"성과지표(OKR) 설계","bonus":"나","points":1,"cost":{"이":2,"하":2,"김":1}}, // 5
  {"id":"T2-028","tier":2,"name":"문서 자동화 스크립트","bonus":"박","points":3,"cost":{"김":4,"나":4}}, // 8
  {"id":"T2-029","tier":2,"name":"데이터 대시보드 초안","bonus":"이","points":2,"cost":{"박":2,"김":2,"나":2}}, // 6
  {"id":"T2-030","tier":2,"name":"리뷰 프로세스 정착안","bonus":"하","points":1,"cost":{"김":3,"이":3}}, // 6

  // --- TIER 3 (Lv 3) ---
  // Special A: 5 Points, Cost 7(A) + 3(B)
  {"id":"T3-001","tier":3,"name":"전사 KPI 개선 보고서","bonus":"김","points":5,"cost":{"나":7,"이":3}},
  {"id":"T3-002","tier":3,"name":"대형 계약 성사 보고","bonus":"나","points":5,"cost":{"박":7,"하":3}},
  {"id":"T3-003","tier":3,"name":"임원 브리핑 자료","bonus":"박","points":5,"cost":{"이":7,"김":3}},
  {"id":"T3-004","tier":3,"name":"연간 전략 로드맵","bonus":"이","points":5,"cost":{"하":7,"나":3}},
  {"id":"T3-005","tier":3,"name":"감사 대응 최종본","bonus":"하","points":5,"cost":{"김":7,"박":3}},

  // Special B: 4 Points, Cost 7 (Single Color) - Only 3 cards
  {"id":"T3-006","tier":3,"name":"신규 사업 타당성 보고","bonus":"김","points":4,"cost":{"이":7}},
  {"id":"T3-007","tier":3,"name":"전사 프로세스 표준화안","bonus":"나","points":4,"cost":{"하":7}},
  {"id":"T3-008","tier":3,"name":"대외 발표 자료(컨퍼런스)","bonus":"박","points":4,"cost":{"김":7}},

  // NEW: 4-Color Cost (High Cost)
  {"id":"T3-009","tier":3,"name":"핵심 고객 리텐션 전략","bonus":"이","points":3,"cost":{"나":3,"박":3,"이":3,"하":3}}, // 12 (4-color)
  {"id":"T3-010","tier":3,"name":"위기관리 대응 매뉴얼","bonus":"하","points":4,"cost":{"김":3,"나":3,"박":3,"이":3}}, // 12 (4-color)
  {"id":"T3-011","tier":3,"name":"전사 비용 구조 혁신안","bonus":"김","points":3,"cost":{"나":3,"박":3,"이":2,"하":2}}, // 10 (4-color)
  {"id":"T3-012","tier":3,"name":"M&A 사전 검토 보고","bonus":"나","points":4,"cost":{"김":3,"박":3,"이":3,"하":2}}, // 11 (4-color)
  {"id":"T3-013","tier":3,"name":"글로벌 런칭 체크리스트","bonus":"박","points":3,"cost":{"김":2,"나":3,"이":3,"하":3}}, // 11 (4-color)

  {"id":"T3-014","tier":3,"name":"보안 인증 심사 패키지","bonus":"이","points":4,"cost":{"하":6,"김":6}}, // 12
  {"id":"T3-015","tier":3,"name":"전사 데이터 거버넌스","bonus":"하","points":3,"cost":{"하":4,"나":4,"이":4}}, // 12
  {"id":"T3-016","tier":3,"name":"대규모 장애 예방 설계","bonus":"김","points":4,"cost":{"나":3,"이":3,"김":5}}, // 11
  {"id":"T3-017","tier":3,"name":"AI 자동화 전환 보고","bonus":"나","points":3,"cost":{"박":5,"하":2,"김":3}}, // 10
  {"id":"T3-018","tier":3,"name":"전사 인력 효율화 계획","bonus":"박","points":4,"cost":{"이":3,"박":3,"나":5}}, // 11
  {"id":"T3-019","tier":3,"name":"이사회 보고서","bonus":"이","points":3,"cost":{"하":4,"김":4,"박":4}}, // 12
  {"id":"T3-020","tier":3,"name":"연말 성과 총정리","bonus":"하","points":4,"cost":{"하":3,"나":3,"이":4}} // 10
];

// Split cards by Tier and Map
const processCards = (tier: number): Card[] => {
  return RAW_CARDS
    .filter(c => c.tier === tier)
    .map(c => ({
      ...c,
      tier: c.tier as 1|2|3,
      bonus: mapColor(c.bonus),
      cost: mapCost(c.cost)
    }));
};

export const TIER_1_CARDS: Card[] = processCards(1);
export const TIER_2_CARDS: Card[] = processCards(2);
export const TIER_3_CARDS: Card[] = processCards(3);
