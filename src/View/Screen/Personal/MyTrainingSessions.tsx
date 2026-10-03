import React from 'react';
import TrainingSessions from '../TrainingSessions/TrainingSessions';

/**
 * Personal space: the training sessions of my category, with the same design as the management page,
 * read only, with my own attendance in each session.
 */
export const MyTrainingSessions: React.FC = () => <TrainingSessions personal />;
