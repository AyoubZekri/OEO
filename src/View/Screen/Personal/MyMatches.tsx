import React from 'react';
import { Matches } from '../Matches/Matches';

/**
 * Personal space: the matches of my category, with the same design as the management page,
 * read only, with my call-up, goals, cards, rating and attendance in each match.
 */
export const MyMatches: React.FC = () => <Matches personal />;
