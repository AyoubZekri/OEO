import { useCallback, useEffect, useState } from 'react';
import { useCan } from '../../../core/functions/useCan';
import { showSnackbar } from '../../../core/functions/Snacpar';
import { useUrlDetails } from '../../Mobile/widgets/useUrlDetails';
import { apiError, travelApi, type Travel, type TravelOptions } from './travelUtils';

/* eslint-disable @typescript-eslint/no-explicit-any -- form bodies are plain JSON */

const fail = (text: string) => showSnackbar('خطأ', text, '#ef4444');

/** The travels pages (desktop and phone): list, details, form. personal: my trips only, read only */
export const useTravelsController = ({ personal = false }: { personal?: boolean } = {}) => {
  const canDo = useCan();
  const can = useCallback((action: string) => !personal && canDo('travels', action), [canDo, personal]);

  const [travels, setTravels] = useState<Travel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [options, setOptions] = useState<TravelOptions>({ members: [], teams: [], matches: [] });

  const [detailsId, setDetailsId] = useUrlDetails('travel');
  const details = detailsId ? travels.find(t => String(t.id) === detailsId) || null : null;
  const [form, setForm] = useState<{ travel: Travel | null } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setTravels(await (personal ? travelApi.mine() : travelApi.list()));
    } catch (e) {
      setError(apiError(e, 'تعذر تحميل التنقلات'));
    } finally {
      setLoading(false);
    }
  }, [personal]);

  /* eslint-disable-next-line react-hooks/set-state-in-effect -- loading the list from the server */
  useEffect(() => { load(); }, [load]);

  /** Members and matches for the form, loaded when it opens */
  const loadOptions = async () => {
    try {
      setOptions(await travelApi.options());
    } catch (e) {
      fail(apiError(e, 'تعذر تحميل الأعضاء والمباريات'));
    }
  };

  const openForm = (travel: Travel | null = null) => {
    loadOptions();
    setForm({ travel });
  };
  const closeForm = () => setForm(null);

  /** Throws the server's message so the form can show it */
  const save = async (data: Record<string, any>) => {
    let saved: Travel;
    try {
      saved = await travelApi.save(data);
    } catch (e) {
      throw new Error(apiError(e), { cause: e });
    }
    setForm(null);
    await load();
    setDetailsId(saved.id);
  };

  const remove = async (travel: Travel) => {
    try {
      await travelApi.remove(travel.id);
      setDetailsId(null);
      await load();
    } catch (e) {
      fail(apiError(e));
    }
  };

  return {
    personal, can, travels,loading, error, reload: load, options,
    details, openTravel: (t: Travel) => setDetailsId(t.id), closeTravel: () => setDetailsId(null),
    form, openForm, closeForm, save, remove,
  };
};

export type TravelsController = ReturnType<typeof useTravelsController>;
/* eslint-enable @typescript-eslint/no-explicit-any */
