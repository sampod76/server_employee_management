import dayjs from 'dayjs';
export const DateToDateGetHours = (
  dateTime1: string | Date,
  dateTime2: string | Date,
): number => {
  const date1: Date = new Date(dateTime1);
  const date2: Date = new Date(dateTime2);

  // Calculate the difference in milliseconds and cast to number
  const diffInMillis: number = Number(date2) - Number(date1);

  // Convert milliseconds to hours
  const diffInHours: number = diffInMillis / (1000 * 60 * 60);

  return diffInHours;
};

export const DateFormatByDayJs = (date: string | Date, format: string) => {
  return dayjs(date).format(format);
};
