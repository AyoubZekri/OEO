import client from '../../../core/api/client';

/** A match's report: a picture or a PDF of the paper report */
export interface MatchReportImage {
  match_id: number;
  image_path: string | null;
}

export const reportImageApi = {
  /** The one already uploaded (null: none yet) */
  get: async (matchId: number): Promise<string | null> => (await client.get(`/administrative-reports/${matchId}`)).data.data?.image_path ?? null,
  /** Uploads it (another one replaces it) */
  save: async (matchId: number, image: File): Promise<MatchReportImage> => {
    const form = new FormData();
    form.append('match_id', String(matchId));
    form.append('image', image);
    return (await client.post('/administrative-reports/image', form, { headers: { 'Content-Type': 'multipart/form-data' } })).data.data;
  },
};
