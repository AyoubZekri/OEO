import axios, { type AxiosInstance } from 'axios';
import client from './client';
import { Applink } from '../../LinkApi';

/**
 * "Something was saved": fired after every successful change sent to the server (add, edit, delete, reply…),
 * so what depends on the data (the alerts) refreshes at once, without reloading the page.
 */
export const DATA_CHANGED = 'app:data-changed';

const notify = () => window.dispatchEvent(new Event(DATA_CHANGED));

const isChange = (method?: string) => Boolean(method) && method!.toUpperCase() !== 'GET';

const watch = (instance: AxiosInstance) => {
  instance.interceptors.response.use(response => {
    if (isChange(response.config?.method)) notify();
    return response;
  });
};

let installed = false;

/** Watches the app's requests (axios, the api client, and fetch for the Crud class); installed once at start */
export const watchDataChanges = () => {
  if (installed) return;
  installed = true;
  watch(axios);
  watch(client);

  const realFetch = window.fetch.bind(window);
  window.fetch = async (input, init) => {
    const response = await realFetch(input, init);
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const method = init?.method || (input instanceof Request ? input.method : 'GET');
    if (response.ok && isChange(method) && url.startsWith(Applink.server) && !url.endsWith('/logout')) notify();
    return response;
  };
};
