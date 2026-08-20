
export const checkInternet = async (): Promise<boolean> => {
    return navigator.onLine;
};