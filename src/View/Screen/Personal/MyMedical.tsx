import React from 'react';
import { ReadOnlyContext } from '../../../core/functions/useCan';
import { Medical } from '../Medical/Medical';

/**
 * Personal space: my medical files, with the same design as the management page, read only
 * (every add / edit / delete is hidden); the confidential diagnosis stays with the medical staff.
 */
export const MyMedical: React.FC = () => (
  <ReadOnlyContext.Provider value={true}>
    <Medical personal />
  </ReadOnlyContext.Provider>
);
