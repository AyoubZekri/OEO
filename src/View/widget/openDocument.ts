/** Opens a document in the app's viewer (<DocViewerHost />), never in another tab */
export const OPEN_EVENT = 'app:open-document';

export interface OpenedDoc { url: string; title: string }

export const openDocument = (url: string | null | undefined, title = 'عرض الوثيقة') => {
  if (!url) return;
  window.dispatchEvent(new CustomEvent<OpenedDoc>(OPEN_EVENT, { detail: { url, title } }));
};
