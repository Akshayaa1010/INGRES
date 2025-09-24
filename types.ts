export interface GroundwaterData {
  State: string;
  District: string;
  Year: number;
  Recharge_MCM: number;
  WaterLevel_m: number;
  Rainfall_mm: number;
  Soil_type: string;
  Annual_Extractable_GW_HAM: number;
  Status: 'Safe' | 'Semi-Critical' | 'Critical';
}

export type PredictionData = Omit<GroundwaterData, 'State' | 'Soil_type' | 'Annual_Extractable_GW_HAM' | 'Status'> & {
  confidence: 'High' | 'Medium' | 'Low';
  rationale: string;
};

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  type: 'text' | 'graph' | 'prediction';
  data?: any;
}

export interface LanguageOption {
    code: string;
    name: string;
    voiceName: string;
}