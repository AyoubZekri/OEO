import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

/**
 * Id of the item whose details page is open, kept in the URL (`?key=id`) so the details page is
 * still open when the user comes back from another route (e.g. the attendance page).
 * Opening details adds a browser history entry, so the phone's back button closes them (and stays on the page);
 * closing them from the page steps back over that entry. Going from one item to another replaces it.
 * The id is returned as text: compare with `String(item.id)`.
 */
export const useUrlDetails = (key: string) => {
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const id = params.get(key) || null;

  const setId = (next: number | string | null | undefined) => {
    const opening = !(next === null || next === undefined || next === '');
    const state = location.state as { urlDetails?: string } | null;

    if (!opening) {
      if (!id) return;
      // Opened here: back over the entry it added (the back button does the same)
      if (state?.urlDetails === key) {
        navigate(-1);
        return;
      }
      // Opened from a link (an alert…): just take the id out
      setParams(prev => {
        const p = new URLSearchParams(prev);
        p.delete(key);
        return p;
      }, { replace: true });
      return;
    }

    if (id === String(next)) return;
    setParams(prev => {
      const p = new URLSearchParams(prev);
      p.set(key, String(next));
      return p;
    }, { replace: Boolean(id), state: { urlDetails: key } });
  };

  return [id, setId] as const;
};
