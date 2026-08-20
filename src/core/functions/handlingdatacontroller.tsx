import { Statusrequest } from '../class/Statusrequest';

export function handlingData(response: any) {
  if (Object.values(Statusrequest).includes(response)) {
    return response;
  } else {
    return Statusrequest.success;
  }
}
