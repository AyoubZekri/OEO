// Letter shown when a club has no logo
export const clubInitial = (club: { name: string; symbol?: string }) =>
  (club.symbol || club.name).trim().charAt(0).toUpperCase();
