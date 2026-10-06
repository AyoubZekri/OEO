import client from '../../../core/api/client';

/* eslint-disable @typescript-eslint/no-explicit-any -- the lists come untyped from the API */

interface Wanted {
  path: string;
  resolve: (r: { data: any }) => void;
  reject: (e: unknown) => void;
}

/**
 * The alerts' lists in one request: `get` collects them (same use as client.get), `flush` asks the server
 * for all of them at once (/alerts/all). A server without /alerts/all yet: they are asked one by one.
 */
export const createAlertsBatch = () => {
  const wanted = new Map<string, Wanted>();

  return {
    get(path: string, config?: { params?: Record<string, string> }): Promise<{ data: any }> {
      const query = config?.params ? `?${new URLSearchParams(config.params).toString()}` : '';
      return new Promise((resolve, reject) => { wanted.set(`k${wanted.size}`, { path: path + query, resolve, reject }); });
    },

    async flush() {
      const entries = [...wanted.entries()];
      if (entries.length === 0) return;
      try {
        const p = JSON.stringify(Object.fromEntries(entries.map(([key, w]) => [key, w.path])));
        const res = await client.get('/alerts/all', { params: { p } });
        entries.forEach(([key, w]) => {
          const one = res.data?.[key];
          if (one && one.status === 200) w.resolve({ data: one.data });
          else w.reject(new Error(`alerts list ${w.path}: ${one?.status}`));
        });
      } catch (e: any) {
        if (e?.response?.status === 404) {
          // The server is not updated yet: the old way
          entries.forEach(([, w]) => { client.get(w.path).then(w.resolve, w.reject); });
        } else {
          // The server is down: every list keeps its last alerts
          entries.forEach(([, w]) => w.reject(e));
        }
      }
    },
  };
};
