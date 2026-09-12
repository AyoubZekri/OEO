import axios from 'axios';
import { Applink } from '../../../../LinkApi';

export interface ImprovementProgramRecord {
  id: string;
  evaluation_id: string;
  player_id: number;
  program_start: string;
  program_end: string;
  areas_to_improve: string;
  specific_goals: string;
  actions_required: string;
  next_evaluation_date: string;
  is_acknowledged: boolean;
}

export class ImprovementProgramData {
  
  // Load program for a specific evaluation
  public async getProgramByEvaluation(evaluationId: string): Promise<ImprovementProgramRecord | null> {
    try {
      const response = await axios.get(`${Applink.improvementPrograms}?evaluation_id=${evaluationId}`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
        }
      });
      
      const dataArray = response.data.data || response.data;
      if (Array.isArray(dataArray) && dataArray.length > 0) {
        const item = dataArray[0]; // Assuming one program per evaluation
        return this.mapData(item);
      }
      return null;
    } catch (e: any) {
      console.error("[getProgramByEvaluation] Failed to load program from API", e);
      return null;
    }
  }

  // Save a new program
  public async saveProgram(program: Omit<ImprovementProgramRecord, 'id'>): Promise<ImprovementProgramRecord | null> {
    try {
      const payload = {
        evaluation_id: program.evaluation_id,
        player_id: program.player_id,
        program_start: program.program_start,
        program_end: program.program_end,
        areas_to_improve: program.areas_to_improve,
        specific_goals: program.specific_goals,
        actions_required: program.actions_required,
        next_evaluation_date: program.next_evaluation_date,
        is_acknowledged: program.is_acknowledged ? 1 : 0,
      };

      const response = await axios.post(Applink.createImprovementProgram, payload, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
        }
      });
      
      if (response.data && response.data.data) {
        return this.mapData(response.data.data);
      }
      return null;
    } catch (e: any) {
      console.error("[saveProgram] Failed to save program to API", e);
      alert("Backend Error: " + (e.response?.data?.error || e.message));
      throw e;
    }
  }

  // Update an existing program
  public async updateProgram(program: ImprovementProgramRecord): Promise<ImprovementProgramRecord | null> {
    try {
      const payload = {
        id: program.id,
        evaluation_id: program.evaluation_id,
        player_id: program.player_id,
        program_start: program.program_start,
        program_end: program.program_end,
        areas_to_improve: program.areas_to_improve,
        specific_goals: program.specific_goals,
        actions_required: program.actions_required,
        next_evaluation_date: program.next_evaluation_date,
        is_acknowledged: program.is_acknowledged ? 1 : 0,
      };

      const response = await axios.post(Applink.updateImprovementProgram, payload, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
        }
      });
      
      if (response.data && response.data.data) {
        return this.mapData(response.data.data);
      }
      return program; // return original if no data returned but success
    } catch (e: any) {
      console.error("[updateProgram] Failed to update program", e);
      alert("Backend Error: " + (e.response?.data?.error || e.message));
      throw e;
    }
  }

  // Delete a program
  public async deleteProgram(id: string): Promise<boolean> {
    try {
      const payload = { id };
      const response = await axios.post(Applink.deleteImprovementProgram, payload, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
        }
      });
      return response.data?.status === 'success' || response.status === 200;
    } catch (e: any) {
      console.error("[deleteProgram] Failed to delete program", e);
      alert("Backend Error: " + (e.response?.data?.error || e.message));
      return false;
    }
  }

  private mapData(item: any): ImprovementProgramRecord {
    return {
      id: (item.id || item._id || '').toString(),
      evaluation_id: (item.evaluation_id || '').toString(),
      player_id: item.player_id || 0,
      program_start: item.program_start || '',
      program_end: item.program_end || '',
      areas_to_improve: item.areas_to_improve || '',
      specific_goals: item.specific_goals || '',
      actions_required: item.actions_required || '',
      next_evaluation_date: item.next_evaluation_date || '',
      is_acknowledged: item.is_acknowledged === 1 || item.is_acknowledged === true || item.is_acknowledged === 'true'
    };
  }
}
