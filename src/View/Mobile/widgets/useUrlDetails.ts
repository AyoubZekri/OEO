import { useSearchParams } from 'react-router-dom';

/**
 * Id of the item whose details page is open, kept in the URL (`?key=id`) so the details page is
 * still open when the user comes back from another route (e.g. the attendance page).
 * Uses `replace`, so opening details adds no browser history entry.
 * The id is returned as text: compare with `String(item.id)`.
 */
export const useUrlDetails = (key: string) => {
  const [params, setParams] = useSearchParams();
  const id = params.get(key) || null;
  const setId = (next: number | string | null | undefined) => setParams(prev => {
    const p = new URLSearchParams(prev);
    if (next === null || next === undefined || next === '') p.delete(key);
    else p.set(key, String(next));
    return p;
  }, { replace: true });
  return [id, setId] as const;
};
