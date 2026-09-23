import { useState, useEffect } from 'react';
import client from '../../../core/api/client';
import type { Decision, DecisionStatus, ChecklistItem } from './decision_model';

export function useDecisionsController() {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDecisions = async () => {
    try {
      setIsLoading(true);
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
    } finally {
      setIsLoading(false);
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
    } catch (error: any) {
      console.error('Error adding decision:', error);
      if (error.response) {
        console.error('Backend validation error:', error.response.data);
      }
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
    } catch (error: any) {
      console.error('Error updating decision:', error);
      if (error.response) {
        console.error('Backend validation error:', error.response.data);
      }
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
    isLoading,
    addDecision,
    updateDecision,
    deleteDecision,
    updateProgress
  };
}
