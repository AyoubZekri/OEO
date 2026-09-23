export interface Position {
  id: string;
  x: number;
  y: number;
  role: string;
}

export interface Formation {
  name: string;
  positions: Position[];
}

export const FORMATIONS: Record<string, Formation> = {
  "4-3-3": {
    name: "4-3-3",
    positions: [
      { id: "GK", x: 50, y: 92, role: "GK" },
      { id: "LB", x: 15, y: 75, role: "LB" },
      { id: "CB1", x: 35, y: 80, role: "CB" },
      { id: "CB2", x: 65, y: 80, role: "CB" },
      { id: "RB", x: 85, y: 75, role: "RB" },
      { id: "LCM", x: 25, y: 55, role: "CM" },
      { id: "CDM", x: 50, y: 65, role: "CDM" },
      { id: "RCM", x: 75, y: 55, role: "CM" },
      { id: "LW", x: 20, y: 30, role: "LW" },
      { id: "ST", x: 50, y: 20, role: "ST" },
      { id: "RW", x: 80, y: 30, role: "RW" },
    ]
  },
  "4-4-2": {
    name: "4-4-2",
    positions: [
      { id: "GK", x: 50, y: 92, role: "GK" },
      { id: "LB", x: 15, y: 75, role: "LB" },
      { id: "CB1", x: 35, y: 80, role: "CB" },
      { id: "CB2", x: 65, y: 80, role: "CB" },
      { id: "RB", x: 85, y: 75, role: "RB" },
      { id: "LM", x: 15, y: 50, role: "LM" },
      { id: "CM1", x: 35, y: 50, role: "CM" },
      { id: "CM2", x: 65, y: 50, role: "CM" },
      { id: "RM", x: 85, y: 50, role: "RM" },
      { id: "ST1", x: 35, y: 20, role: "ST" },
      { id: "ST2", x: 65, y: 20, role: "ST" },
    ]
  },
  "4-2-3-1": {
    name: "4-2-3-1",
    positions: [
      { id: "GK", x: 50, y: 92, role: "GK" },
      { id: "LB", x: 15, y: 75, role: "LB" },
      { id: "CB1", x: 35, y: 80, role: "CB" },
      { id: "CB2", x: 65, y: 80, role: "CB" },
      { id: "RB", x: 85, y: 75, role: "RB" },
      { id: "CDM1", x: 35, y: 65, role: "CDM" },
      { id: "CDM2", x: 65, y: 65, role: "CDM" },
      { id: "LM", x: 20, y: 45, role: "LM" },
      { id: "CAM", x: 50, y: 40, role: "CAM" },
      { id: "RM", x: 80, y: 45, role: "RM" },
      { id: "ST", x: 50, y: 20, role: "ST" },
    ]
  },
  "3-5-2": {
    name: "3-5-2",
    positions: [
      { id: "GK", x: 50, y: 92, role: "GK" },
      { id: "CB1", x: 25, y: 80, role: "CB" },
      { id: "CB2", x: 50, y: 80, role: "CB" },
      { id: "CB3", x: 75, y: 80, role: "CB" },
      { id: "LWB", x: 15, y: 55, role: "LWB" },
      { id: "CM1", x: 35, y: 50, role: "CM" },
      { id: "CDM", x: 50, y: 60, role: "CDM" },
      { id: "CM2", x: 65, y: 50, role: "CM" },
      { id: "RWB", x: 85, y: 55, role: "RWB" },
      { id: "ST1", x: 35, y: 20, role: "ST" },
      { id: "ST2", x: 65, y: 20, role: "ST" },
    ]
  },
  "5-3-2": {
    name: "5-3-2",
    positions: [
      { id: "GK", x: 50, y: 92, role: "GK" },
      { id: "LWB", x: 15, y: 75, role: "LWB" },
      { id: "CB1", x: 30, y: 80, role: "CB" },
      { id: "CB2", x: 50, y: 80, role: "CB" },
      { id: "CB3", x: 70, y: 80, role: "CB" },
      { id: "RWB", x: 85, y: 75, role: "RWB" },
      { id: "LCM", x: 30, y: 50, role: "CM" },
      { id: "CM", x: 50, y: 50, role: "CM" },
      { id: "RCM", x: 70, y: 50, role: "CM" },
      { id: "ST1", x: 35, y: 20, role: "ST" },
      { id: "ST2", x: 65, y: 20, role: "ST" },
    ]
  },
  "3-4-3": {
    name: "3-4-3",
    positions: [
      { id: "GK", x: 50, y: 92, role: "GK" },
      { id: "CB1", x: 25, y: 80, role: "CB" },
      { id: "CB2", x: 50, y: 80, role: "CB" },
      { id: "CB3", x: 75, y: 80, role: "CB" },
      { id: "LM", x: 15, y: 55, role: "LM" },
      { id: "CM1", x: 35, y: 55, role: "CM" },
      { id: "CM2", x: 65, y: 55, role: "CM" },
      { id: "RM", x: 85, y: 55, role: "RM" },
      { id: "LW", x: 25, y: 25, role: "LW" },
      { id: "ST", x: 50, y: 20, role: "ST" },
      { id: "RW", x: 75, y: 25, role: "RW" },
    ]
  },
  "4-1-4-1": {
    name: "4-1-4-1",
    positions: [
      { id: "GK", x: 50, y: 92, role: "GK" },
      { id: "LB", x: 15, y: 75, role: "LB" },
      { id: "CB1", x: 35, y: 80, role: "CB" },
      { id: "CB2", x: 65, y: 80, role: "CB" },
      { id: "RB", x: 85, y: 75, role: "RB" },
      { id: "CDM", x: 50, y: 65, role: "CDM" },
      { id: "LM", x: 15, y: 45, role: "LM" },
      { id: "CM1", x: 35, y: 45, role: "CM" },
      { id: "CM2", x: 65, y: 45, role: "CM" },
      { id: "RM", x: 85, y: 45, role: "RM" },
      { id: "ST", x: 50, y: 20, role: "ST" },
    ]
  },
  "4-3-1-2": {
    name: "4-3-1-2",
    positions: [
      { id: "GK", x: 50, y: 92, role: "GK" },
      { id: "LB", x: 15, y: 75, role: "LB" },
      { id: "CB1", x: 35, y: 80, role: "CB" },
      { id: "CB2", x: 65, y: 80, role: "CB" },
      { id: "RB", x: 85, y: 75, role: "RB" },
      { id: "LCM", x: 25, y: 55, role: "CM" },
      { id: "CM", x: 50, y: 55, role: "CM" },
      { id: "RCM", x: 75, y: 55, role: "CM" },
      { id: "CAM", x: 50, y: 40, role: "CAM" },
      { id: "ST1", x: 35, y: 20, role: "ST" },
      { id: "ST2", x: 65, y: 20, role: "ST" },
    ]
  },
  "4-5-1": {
    name: "4-5-1",
    positions: [
      { id: "GK", x: 50, y: 92, role: "GK" },
      { id: "LB", x: 15, y: 75, role: "LB" },
      { id: "CB1", x: 35, y: 80, role: "CB" },
      { id: "CB2", x: 65, y: 80, role: "CB" },
      { id: "RB", x: 85, y: 75, role: "RB" },
      { id: "LM", x: 15, y: 50, role: "LM" },
      { id: "LCM", x: 30, y: 50, role: "CM" },
      { id: "CM", x: 50, y: 50, role: "CM" },
      { id: "RCM", x: 70, y: 50, role: "CM" },
      { id: "RM", x: 85, y: 50, role: "RM" },
      { id: "ST", x: 50, y: 20, role: "ST" },
    ]
  },
  "3-4-2-1": {
    name: "3-4-2-1",
    positions: [
      { id: "GK", x: 50, y: 92, role: "GK" },
      { id: "CB1", x: 25, y: 80, role: "CB" },
      { id: "CB2", x: 50, y: 80, role: "CB" },
      { id: "CB3", x: 75, y: 80, role: "CB" },
      { id: "LM", x: 15, y: 55, role: "LM" },
      { id: "CM1", x: 35, y: 55, role: "CM" },
      { id: "CM2", x: 65, y: 55, role: "CM" },
      { id: "RM", x: 85, y: 55, role: "RM" },
      { id: "CAM1", x: 35, y: 35, role: "CAM" },
      { id: "CAM2", x: 65, y: 35, role: "CAM" },
      { id: "ST", x: 50, y: 20, role: "ST" },
    ]
  },
  "3-5-1-1": {
    name: "3-5-1-1",
    positions: [
      { id: "GK", x: 50, y: 92, role: "GK" },
      { id: "CB1", x: 25, y: 80, role: "CB" },
      { id: "CB2", x: 50, y: 80, role: "CB" },
      { id: "CB3", x: 75, y: 80, role: "CB" },
      { id: "LWB", x: 15, y: 55, role: "LWB" },
      { id: "LCM", x: 35, y: 55, role: "CM" },
      { id: "CDM", x: 50, y: 65, role: "CDM" },
      { id: "RCM", x: 65, y: 55, role: "CM" },
      { id: "RWB", x: 85, y: 55, role: "RWB" },
      { id: "CF", x: 50, y: 35, role: "CF" },
      { id: "ST", x: 50, y: 20, role: "ST" },
    ]
  },
  "5-4-1": {
    name: "5-4-1",
    positions: [
      { id: "GK", x: 50, y: 92, role: "GK" },
      { id: "LWB", x: 15, y: 75, role: "LWB" },
      { id: "CB1", x: 30, y: 80, role: "CB" },
      { id: "CB2", x: 50, y: 80, role: "CB" },
      { id: "CB3", x: 70, y: 80, role: "CB" },
      { id: "RWB", x: 85, y: 75, role: "RWB" },
      { id: "LM", x: 20, y: 50, role: "LM" },
      { id: "CM1", x: 35, y: 50, role: "CM" },
      { id: "CM2", x: 65, y: 50, role: "CM" },
      { id: "RM", x: 80, y: 50, role: "RM" },
      { id: "ST", x: 50, y: 20, role: "ST" },
    ]
  },
  "5-2-3": {
    name: "5-2-3",
    positions: [
      { id: "GK", x: 50, y: 92, role: "GK" },
      { id: "LWB", x: 15, y: 75, role: "LWB" },
      { id: "CB1", x: 30, y: 80, role: "CB" },
      { id: "CB2", x: 50, y: 80, role: "CB" },
      { id: "CB3", x: 70, y: 80, role: "CB" },
      { id: "RWB", x: 85, y: 75, role: "RWB" },
      { id: "CM1", x: 35, y: 55, role: "CM" },
      { id: "CM2", x: 65, y: 55, role: "CM" },
      { id: "LW", x: 25, y: 25, role: "LW" },
      { id: "ST", x: 50, y: 20, role: "ST" },
      { id: "RW", x: 75, y: 25, role: "RW" },
    ]
  },
  "4-2-2-2": {
    name: "4-2-2-2",
    positions: [
      { id: "GK", x: 50, y: 92, role: "GK" },
      { id: "LB", x: 15, y: 75, role: "LB" },
      { id: "CB1", x: 35, y: 80, role: "CB" },
      { id: "CB2", x: 65, y: 80, role: "CB" },
      { id: "RB", x: 85, y: 75, role: "RB" },
      { id: "CDM1", x: 35, y: 65, role: "CDM" },
      { id: "CDM2", x: 65, y: 65, role: "CDM" },
      { id: "LAM", x: 25, y: 40, role: "LAM" },
      { id: "RAM", x: 75, y: 40, role: "RAM" },
      { id: "ST1", x: 35, y: 20, role: "ST" },
      { id: "ST2", x: 65, y: 20, role: "ST" },
    ]
  },
  "4-3-2-1": {
    name: "4-3-2-1",
    positions: [
      { id: "GK", x: 50, y: 92, role: "GK" },
      { id: "LB", x: 15, y: 75, role: "LB" },
      { id: "CB1", x: 35, y: 80, role: "CB" },
      { id: "CB2", x: 65, y: 80, role: "CB" },
      { id: "RB", x: 85, y: 75, role: "RB" },
      { id: "LCM", x: 25, y: 55, role: "CM" },
      { id: "CM", x: 50, y: 55, role: "CM" },
      { id: "RCM", x: 75, y: 55, role: "CM" },
      { id: "LAM", x: 35, y: 35, role: "LAM" },
      { id: "RAM", x: 65, y: 35, role: "RAM" },
      { id: "ST", x: 50, y: 20, role: "ST" },
    ]
  },
  "3-3-3-1": {
    name: "3-3-3-1",
    positions: [
      { id: "GK", x: 50, y: 92, role: "GK" },
      { id: "CB1", x: 25, y: 80, role: "CB" },
      { id: "CB2", x: 50, y: 80, role: "CB" },
      { id: "CB3", x: 75, y: 80, role: "CB" },
      { id: "LWB", x: 15, y: 60, role: "LWB" },
      { id: "CDM", x: 50, y: 60, role: "CDM" },
      { id: "RWB", x: 85, y: 60, role: "RWB" },
      { id: "LAM", x: 25, y: 40, role: "LAM" },
      { id: "CAM", x: 50, y: 40, role: "CAM" },
      { id: "RAM", x: 75, y: 40, role: "RAM" },
      { id: "ST", x: 50, y: 20, role: "ST" },
    ]
  }
};
