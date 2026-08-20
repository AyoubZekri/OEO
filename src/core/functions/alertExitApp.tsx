export const alertExitApp = (): Promise<boolean> => {
  const confirmExit = window.confirm("هل تريد الخروج من التطبيق");
  if (confirmExit) {
    window.close();
  }
  return Promise.resolve(true);
};
