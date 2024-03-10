export const generateDate = (day: number): Date => {
  return new Date(new Date().getTime() + day * 24 * 60 * 60 * 1000);
};
