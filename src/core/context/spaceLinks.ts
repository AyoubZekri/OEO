import { Approutes } from '../constant/routes';

/**
 * The personal space's pages now in the management space, for who may open it (their own records are there: all of
 * them with the page's permission, theirs only without). The personal space keeps them only for who has no other.
 */
const MOVED: [personal: string, management: string][] = [
  [Approutes.MyTasks, Approutes.Tasks],
  [Approutes.MyTrainingSessions, Approutes.TrainingSessions],
  [Approutes.MyMatches, Approutes.Matches],
  [Approutes.MyMeetings, Approutes.Meetings],
  [Approutes.MyTravels, Approutes.Travels],
  [Approutes.MyFeedback, Approutes.Feedback],
  // The same pages, in the management space («غياباتي», «إجراءاتي», «تقاريري الطبية»)
  [Approutes.MyAbsences, Approutes.MyAbsences],
  [Approutes.MyDisciplinary, Approutes.MyDisciplinary],
  [Approutes.MyMedical, Approutes.MyMedical],
];

/**
 * A personal-space link (a notification's) in the management space: its page there, with what it points to
 * (?match=, ?session=, ?absence=…). null: a page the personal space keeps.
 */
export const managementLink = (link: string): string | null => {
  const [path, query = ''] = link.split('?');
  const moved = MOVED.find(([personal]) => personal === path);
  if (!moved) return null;
  return query ? `${moved[1]}?${query}` : moved[1];
};
