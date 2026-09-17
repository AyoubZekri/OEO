import os

frontend_path = r"d:\MyProject\KaidNews\OlympicOEO\src\View\Screen"
decision_controller = os.path.join(frontend_path, r"Decisions\DecisionsController.ts")

decision_content = """import { useState, useEffect } from 'react';
import client from '../../../core/api/client';

export type DecisionStatus = 'pending' | 'in-progress' | 'completed';

export interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

export interface Decision {
  id: string;
  meetingId: string;
  category?: string;
  type?: 'normal' | 'checklist';
  checklistItems?: ChecklistItem[];
  text: string;
  assigneeIds: string[];
  deadline?: string;
  progress: number; // 0 to 100
}

export function useDecisionsController() {
  const [decisions, setDecisions] = useState<Decision[]>([]);

  const fetchDecisions = async () => {
    try {
      const response = await client.get('/decisions');
      const mapped = response.data.map((d: any) => ({
        ...d,
        meetingId: d.meeting_id,
        checklistItems: d.checklist_items,
        assigneeIds: d.assignee_ids
      }));
      setDecisions(mapped);
    } catch (error) {
      console.error('Error fetching decisions:', error);
    }
  };

  useEffect(() => {
    fetchDecisions();
  }, []);

  const addDecision = async (decision: Omit<Decision, 'id'>) => {
    try {
      const payload = {
        ...decision,
        meeting_id: decision.meetingId,
        checklist_items: decision.checklistItems,
        assignee_ids: decision.assigneeIds
      };
      await client.post('/decisions', payload);
      fetchDecisions();
    } catch (error) {
      console.error('Error adding decision:', error);
    }
  };

  const updateDecision = async (id: string, updatedFields: Partial<Decision>) => {
    try {
      const payload: any = { ...updatedFields };
      if (updatedFields.meetingId !== undefined) payload.meeting_id = updatedFields.meetingId;
      if (updatedFields.checklistItems !== undefined) payload.checklist_items = updatedFields.checklistItems;
      if (updatedFields.assigneeIds !== undefined) payload.assignee_ids = updatedFields.assigneeIds;
      
      await client.put(`/decisions/${id}`, payload);
      setDecisions(decisions.map(d => d.id === id ? { ...d, ...updatedFields } : d));
    } catch (error) {
      console.error('Error updating decision:', error);
    }
  };

  const deleteDecision = async (id: string) => {
    try {
      await client.delete(`/decisions/${id}`);
      setDecisions(decisions.filter(d => d.id !== id));
    } catch (error) {
      console.error('Error deleting decision:', error);
    }
  };

  const updateProgress = (id: string, newProgress: number) => {
    const clampedProgress = Math.min(100, Math.max(0, newProgress));
    updateDecision(id, { progress: clampedProgress });
  };

  return {
    decisions,
    addDecision,
    updateDecision,
    deleteDecision,
    updateProgress
  };
}
"""

with open(decision_controller, "w", encoding="utf-8", newline="\n") as f:
    f.write(decision_content)

print("DecisionsController patched successfully.")
