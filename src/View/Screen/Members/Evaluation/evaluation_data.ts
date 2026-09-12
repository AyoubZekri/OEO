import axios from 'axios';
import { Applink } from '../../../../LinkApi';

export interface EvaluationRecord {
  id: string;
  member_id: number;
  season: string;
  period: string;
  evalDate: string;
  totalScore: number;
  recommendation: string;
  strengths: string;
  weaknesses: string;
  // Specific scores
  scores: {
    discipline: number;
    physical: number;
    technical: number;
    tactical: number;
    matchOutput: number;
    instructions: number;
    behavior: number;
  };
}

const mapRecommendation = (rec: string): string => {
  const map: Record<string, string> = {
    'normal_continuation': 'استمرار عادي',
    'improvement_program': 'برنامج تحسين',
    'special_monitoring': 'متابعة خاصة',
    're_evaluate': 'إعادة تقييم بعد مدة محددة',
    'comprehensive_eval': 'تقييم شامل عند نهاية الذهاب',
    'contract_review': 'مراجعة الوضعية الرياضية/التعاقدية'
  };
  return map[rec] || rec;
};

export class EvaluationsData {
  
  // Load all evaluations for a specific member
  public async getEvaluationsByMember(memberId: number): Promise<EvaluationRecord[]> {
    try {
      console.log(`[getEvaluationsByMember] Fetching evaluations for member: ${memberId}`);
      const response = await axios.get(`${Applink.playerEvaluations}?member_id=${memberId}`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
        }
      });
      console.log(`[getEvaluationsByMember] Response data:`, response.data);
      if (response.data && response.data.data) {
        // Map the backend data to EvaluationRecord
        return response.data.data.map((item: any) => ({
          id: (item.id || item._id || '').toString(),
          member_id: item.member_id || item.playerId || 0,
          season: item.sports_season || item.season || '',
          period: item.evaluation_type || item.evaluationType || '',
          evalDate: item.evaluation_date || item.periodStart || '',
          totalScore: item.total_score || item.totalScore || 0,
          recommendation: mapRecommendation(item.recommendations || item.recommendation || ''),
          strengths: item.strengths || '',
          weaknesses: item.weaknesses || '',
          scores: {
            discipline: item.discipline_score || item.scoreDiscipline || 0,
            physical: item.physical_score || item.scoreFitness || 0,
            technical: item.technical_score || item.scoreTechnical || 0,
            tactical: item.tactical_score || item.scoreTactical || 0,
            matchOutput: item.match_output_score || item.scoreMatchPerformance || 0,
            instructions: item.instructions_score || item.scoreInstructions || 0,
            behavior: item.behavior_score || item.scoreBehavior || 0,
          }
        }));
      } else if (Array.isArray(response.data)) {
        console.warn(`[getEvaluationsByMember] Response data is a direct array, not wrapped in 'data'. Please check backend format.`);
        // If it's a direct array, map it
        return response.data.map((item: any) => ({
          id: (item.id || item._id || '').toString(),
          member_id: item.member_id || item.playerId || 0,
          season: item.sports_season || item.season || '',
          period: item.evaluation_type || item.evaluationType || '',
          evalDate: item.evaluation_date || item.periodStart || '',
          totalScore: item.total_score || item.totalScore || 0,
          recommendation: mapRecommendation(item.recommendations || item.recommendation || ''),
          strengths: item.strengths || '',
          weaknesses: item.weaknesses || '',
          scores: {
            discipline: item.discipline_score || item.scoreDiscipline || 0,
            physical: item.physical_score || item.scoreFitness || 0,
            technical: item.technical_score || item.scoreTechnical || 0,
            tactical: item.tactical_score || item.scoreTactical || 0,
            matchOutput: item.match_output_score || item.scoreMatchPerformance || 0,
            instructions: item.instructions_score || item.scoreInstructions || 0,
            behavior: item.behavior_score || item.scoreBehavior || 0,
          }
        }));
      }
      console.warn(`[getEvaluationsByMember] No data found or invalid format. returning empty array.`);
      return [];
    } catch (e: any) {
      console.error("[getEvaluationsByMember] Failed to load evaluations from API", e);
      if (e.response) {
         console.error("[getEvaluationsByMember] Error response data:", e.response.data);
      }
      return [];
    }
  }

  // Save a new evaluation
  public async saveEvaluation(evaluation: Omit<EvaluationRecord, 'id'>): Promise<EvaluationRecord | null> {
    try {
      const payload = {
        playerId: evaluation.member_id,
        periodStart: evaluation.evalDate,
        evaluationType: evaluation.period,
        season: evaluation.season,
        scoreFitness: evaluation.scores.physical,
        scoreTechnical: evaluation.scores.technical,
        scoreTactical: evaluation.scores.tactical,
        scoreMatchPerformance: evaluation.scores.matchOutput,
        scoreDiscipline: evaluation.scores.discipline,
        scoreInstructions: evaluation.scores.instructions,
        scoreBehavior: evaluation.scores.behavior,
        strengths: evaluation.strengths,
        weaknesses: evaluation.weaknesses,
        recommendation: evaluation.recommendation,
      };

      const response = await axios.post(Applink.createPlayerEvaluation, payload, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
        }
      });
      
      if (response.data && response.data.data) {
        const item = response.data.data;
        return {
          id: (item.id || item._id || '').toString(),
          member_id: item.member_id || item.playerId || 0,
          season: item.sports_season || item.season || '',
          period: item.evaluation_type || item.evaluationType || '',
          evalDate: item.evaluation_date || item.periodStart || '',
          totalScore: item.total_score || item.totalScore || 0,
          recommendation: mapRecommendation(item.recommendations || item.recommendation || ''),
          strengths: item.strengths || '',
          weaknesses: item.weaknesses || '',
          scores: {
            discipline: item.discipline_score || item.scoreDiscipline || 0,
            physical: item.physical_score || item.scoreFitness || 0,
            technical: item.technical_score || item.scoreTechnical || 0,
            tactical: item.tactical_score || item.scoreTactical || 0,
            matchOutput: item.match_output_score || item.scoreMatchPerformance || 0,
            instructions: item.instructions_score || item.scoreInstructions || 0,
            behavior: item.behavior_score || item.scoreBehavior || 0,
          }
        };
      }
      return null;
    } catch (e: any) {
      console.error("Failed to save evaluation to API", e);
      alert("Backend Error: " + (e.response?.data?.error || e.message));
      throw e;
    }
  }

  // Update an existing evaluation
  public async updateEvaluation(evaluation: EvaluationRecord): Promise<EvaluationRecord | null> {
    try {
      const payload = {
        id: evaluation.id,
        playerId: evaluation.member_id,
        periodStart: evaluation.evalDate,
        evaluationType: evaluation.period,
        season: evaluation.season,
        scoreFitness: evaluation.scores.physical,
        scoreTechnical: evaluation.scores.technical,
        scoreTactical: evaluation.scores.tactical,
        scoreMatchPerformance: evaluation.scores.matchOutput,
        scoreDiscipline: evaluation.scores.discipline,
        scoreInstructions: evaluation.scores.instructions,
        scoreBehavior: evaluation.scores.behavior,
        strengths: evaluation.strengths,
        weaknesses: evaluation.weaknesses,
        recommendation: evaluation.recommendation,
      };

      const response = await axios.post(Applink.updatePlayerEvaluation, payload, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
        }
      });
      
      if (response.data && response.data.data) {
        return evaluation;
      }
      return null;
    } catch (e: any) {
      console.error("Failed to update evaluation", e);
      alert("Backend Error: " + (e.response?.data?.error || e.message));
      throw e;
    }
  }

  // Delete an evaluation
  public async deleteEvaluation(id: string): Promise<boolean> {
    try {
      const response = await axios.post(Applink.deletePlayerEvaluation, { id: id }, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
        }
      });
      return response.status === 200;
    } catch (e: any) {
      console.error("Failed to delete evaluation", e);
      if (e.response && e.response.data) {
        console.error("Error details:", e.response.data);
      }
      throw e;
    }
  }
}
