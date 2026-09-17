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
