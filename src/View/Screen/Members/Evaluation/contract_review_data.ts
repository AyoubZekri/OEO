import axios from 'axios';
import { Applink } from '../../../../LinkApi';

export interface ContractReviewRecord {
  id: string;
  player_id: number;
  evaluation_id: string;
  club_representative_id?: number | null;
  meeting_date: string;
  discussed_topics: string;
  club_proposal: string;
  player_position: string;
  outcome: string;
  requires_official_avenant: boolean;
  player_signature: boolean;
}

export class ContractReviewData {
  
  // Load review for a specific evaluation
  public async getReviewByEvaluation(evaluationId: string): Promise<ContractReviewRecord | null> {
    try {
      const response = await axios.get(`${Applink.contractReviews}?evaluation_id=${evaluationId}`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
        }
      });
      
      const dataArray = response.data.data || response.data;
      if (Array.isArray(dataArray) && dataArray.length > 0) {
        const item = dataArray[0]; // Assuming one review per evaluation
        return this.mapData(item);
      }
      return null;
    } catch (e: any) {
      console.error("[getReviewByEvaluation] Failed to load review from API", e);
      return null;
    }
  }

  // Save a new review
  public async saveReview(review: Omit<ContractReviewRecord, 'id'>): Promise<ContractReviewRecord | null> {
    try {
      const payload = {
        player_id: review.player_id,
        evaluation_id: review.evaluation_id,
        club_representative_id: review.club_representative_id,
        meeting_date: review.meeting_date,
        discussed_topics: review.discussed_topics,
        club_proposal: review.club_proposal,
        player_position: review.player_position,
        outcome: review.outcome,
        requires_official_avenant: review.requires_official_avenant ? 1 : 0,
        player_signature: review.player_signature ? 1 : 0,
      };

      const response = await axios.post(Applink.createContractReview, payload, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
        }
      });
      
      if (response.data && response.data.data) {
        return this.mapData(response.data.data);
      }
      return null;
    } catch (e: any) {
      console.error("[saveReview] Failed to save review to API", e);
      throw e;
    }
  }

  // Update an existing review
  public async updateReview(review: ContractReviewRecord): Promise<ContractReviewRecord | null> {
    try {
      const payload = {
        id: review.id,
        player_id: review.player_id,
        evaluation_id: review.evaluation_id,
        club_representative_id: review.club_representative_id,
        meeting_date: review.meeting_date,
        discussed_topics: review.discussed_topics,
        club_proposal: review.club_proposal,
        player_position: review.player_position,
        outcome: review.outcome,
        requires_official_avenant: review.requires_official_avenant ? 1 : 0,
        player_signature: review.player_signature ? 1 : 0,
      };

      const response = await axios.post(Applink.updateContractReview, payload, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
        }
      });
      
      if (response.data && response.data.data) {
        return this.mapData(response.data.data);
      }
      return review;
    } catch (e: any) {
      console.error("[updateReview] Failed to update review", e);
      throw e;
    }
  }

  public async deleteReview(id: string): Promise<boolean> {
    try {
      await axios.post(Applink.deleteContractReview, { id }, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
        }
      });
      return true;
    } catch (e: any) {
      console.error("[deleteReview] Failed to delete review", e);
      return false;
    }
  }

  private mapData(item: any): ContractReviewRecord {
    return {
      id: (item.id || item._id || '').toString(),
      player_id: item.player_id || 0,
      evaluation_id: (item.evaluation_id || '').toString(),
      club_representative_id: item.club_representative_id || 0,
      meeting_date: item.meeting_date || '',
      discussed_topics: item.discussed_topics || '',
      club_proposal: item.club_proposal || '',
      player_position: item.player_position || '',
      outcome: item.outcome || '',
      requires_official_avenant: item.requires_official_avenant === 1 || item.requires_official_avenant === true || item.requires_official_avenant === 'true',
      player_signature: item.player_signature === 1 || item.player_signature === true || item.player_signature === 'true'
    };
  }
}
