function pad(num, size = 2) {
  return String(Math.floor(Math.abs(num))).padStart(size, '0');
}

export function formatLocalISO(date = new Date()) {
  if (!date || Number.isNaN(new Date(date).getTime())) return null;
  const d = date instanceof Date ? date : new Date(date);

  const offset = -d.getTimezoneOffset();
  const sign = offset >= 0 ? '+' : '-';
  const offsetHours = pad(offset / 60);
  const offsetMinutes = pad(offset % 60);

  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  const seconds = pad(d.getSeconds());
  const millis = pad(d.getMilliseconds(), 3);

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${millis}${sign}${offsetHours}:${offsetMinutes}`;
}

export function formatLocalDateTime(date = new Date()) {
  if (!date || Number.isNaN(new Date(date).getTime())) return null;
  const d = date instanceof Date ? date : new Date(date);

  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  const seconds = pad(d.getSeconds());

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

Date.prototype.toJSON = function () {
  return formatLocalISO(this);
};
