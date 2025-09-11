
export const isTradingHours = (): boolean => {
  // Get current time in UTC
  const now = new Date();
  
  // Convert to Taiwan time (UTC+8)
  const taiwanTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Taipei' }));

  const dayOfWeek = taiwanTime.getDay(); // Sunday = 0, Monday = 1, etc.
  const hour = taiwanTime.getHours();
  const minute = taiwanTime.getMinutes();

  // Check if it's a weekday (Monday to Friday)
  if (dayOfWeek < 1 || dayOfWeek > 5) {
    return false;
  }

  // Check if it's within trading hours (9:00 AM to 1:30 PM)
  const isAfterOpen = hour > 9 || (hour === 9 && minute >= 0);
  const isBeforeClose = hour < 13 || (hour === 13 && minute <= 30);

  return isAfterOpen && isBeforeClose;
};