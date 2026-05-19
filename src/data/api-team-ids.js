// API-Football team IDs — World Cup 2026 (48 teams, 12 groups)
// League ID 1 = World Cup | Season: 2026
export const API_FOOTBALL_LEAGUE_ID = 1;

export const TEAM_ID_MAP = {
  // Group A
  MEX: 16,
  CZE: 770,
  KOR: 17,
  RSA: 1531, // South Africa
  // Group B
  CAN: 5529,
  BIH: 1113, // Bosnia & Herzegovina
  SUI: 15,
  QAT: 1569,
  // Group C
  BRA: 6,
  SCO: 1108,
  HAI: 2386,
  MAR: 31, // Morocco
  // Group D
  PAR: 2380,
  TUR: 777, // Türkiye
  AUS: 20,
  USA: 2384,
  // Group E
  ECU: 2382,
  GER: 25,
  CIV: 19129, // Côte d'Ivoire
  CUW: 5530, // Curaçao
  // Group F
  NED: 1118,
  SWE: 5,
  JPN: 12,
  TUN: 28,
  // Group G
  BEL: 1,
  IRN: 22,
  EGY: 32,
  NZL: 4673,
  // Group H
  ESP: 9,
  URU: 7,
  KSA: 23, // Saudi Arabia
  CPV: 1533, // Cape Verde
  // Group I
  NOR: 1090,
  FRA: 2,
  SEN: 13,
  IRQ: 1567,
  // Group J
  ARG: 26,
  AUT: 775,
  ALG: 1532,
  JOR: 1548,
  // Group K
  COL: 8,
  POR: 27,
  UZB: 1568,
  COD: 1508, // Congo DR
  // Group L
  ENG: 10,
  CRO: 3,
  PAN: 11,
  GHA: 1504,
};

// Reverse map: api-football ID → our 3-letter code
export const ID_TO_CODE = Object.fromEntries(
  Object.entries(TEAM_ID_MAP).map(([code, id]) => [id, code])
);
