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

export class EvaluationsData {
  private storageKey = 'olympic_oeo_evaluations';

  // Load all evaluations for a specific member
  public getEvaluationsByMember(memberId: number): EvaluationRecord[] {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (data) {
        const allEvals: EvaluationRecord[] = JSON.parse(data);
        return allEvals.filter(e => e.member_id === memberId).sort((a, b) => 
          new Date(b.evalDate).getTime() - new Date(a.evalDate).getTime()
        );
      }
    } catch (e) {
      console.error("Failed to load evaluations from local storage", e);
    }
    return [];
  }

  // Save a new evaluation
  public saveEvaluation(evaluation: Omit<EvaluationRecord, 'id'>): EvaluationRecord {
    const newEval: EvaluationRecord = {
      ...evaluation,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
    };

    try {
      const data = localStorage.getItem(this.storageKey);
      let allEvals: EvaluationRecord[] = [];
      if (data) {
        allEvals = JSON.parse(data);
      }
      allEvals.push(newEval);
      localStorage.setItem(this.storageKey, JSON.stringify(allEvals));
      return newEval;
    } catch (e) {
      console.error("Failed to save evaluation to local storage", e);
      throw e;
    }
  }

  // Update an existing evaluation
  public updateEvaluation(evaluation: EvaluationRecord): EvaluationRecord {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (data) {
        let allEvals: EvaluationRecord[] = JSON.parse(data);
        const index = allEvals.findIndex(e => e.id === evaluation.id);
        if (index !== -1) {
          allEvals[index] = evaluation;
          localStorage.setItem(this.storageKey, JSON.stringify(allEvals));
          return evaluation;
        }
      }
      throw new Error("Evaluation not found");
    } catch (e) {
      console.error("Failed to update evaluation", e);
      throw e;
    }
  }

  // Delete an evaluation
  public deleteEvaluation(id: string): void {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (data) {
        let allEvals: EvaluationRecord[] = JSON.parse(data);
        allEvals = allEvals.filter(e => e.id !== id);
        localStorage.setItem(this.storageKey, JSON.stringify(allEvals));
      }
    } catch (e) {
      console.error("Failed to delete evaluation", e);
      throw e;
    }
  }

  // Generate test evaluation
  public generateTestEvaluation(memberId: number): Omit<EvaluationRecord, 'id'> {
    const seasons = ['2023-2024', '2024-2025'];
    const periods = ['بداية الموسم', 'منتصف الموسم', 'نهاية الموسم'];
    return {
      member_id: memberId,
      season: seasons[Math.floor(Math.random() * seasons.length)],
      period: periods[Math.floor(Math.random() * periods.length)],
      evalDate: new Date().toISOString().split('T')[0],
      totalScore: Math.floor(Math.random() * 41) + 50, // 50 to 90
      recommendation: 'تقييم افتراضي تم إنشاؤه للتجريب',
      strengths: 'أداء جيد في التدريبات',
      weaknesses: 'يحتاج إلى تحسين اللياقة',
      scores: {
        discipline: Math.floor(Math.random() * 6) + 5, // out of 10
        physical: Math.floor(Math.random() * 8) + 8, // out of 15
        technical: Math.floor(Math.random() * 11) + 10, // out of 20
        tactical: Math.floor(Math.random() * 8) + 8, // out of 15
        matchOutput: Math.floor(Math.random() * 11) + 10, // out of 20
        instructions: Math.floor(Math.random() * 6) + 5, // out of 10
        behavior: Math.floor(Math.random() * 6) + 5, // out of 10
      }
    };
  }

  // Seed default evaluations if empty
  public seedDefaultEvaluations(memberId: number): void {
    const existing = this.getEvaluationsByMember(memberId);
    if (existing.length === 0) {
      this.saveEvaluation(this.generateTestEvaluation(memberId));
      this.saveEvaluation(this.generateTestEvaluation(memberId));
    }
  }
}
