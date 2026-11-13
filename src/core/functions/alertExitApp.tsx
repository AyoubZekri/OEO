import { askConfirm } from '../../View/shared/appDialog';
export const alertExitApp = async (): Promise<boolean> => {
  const confirmExit = await askConfirm('هل تريد الخروج من التطبيق؟', { confirmLabel: 'خروج' });
  if (confirmExit) {
    window.close();
  }
  return true;
};
