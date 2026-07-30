const dateFormatter = new Intl.DateTimeFormat('zh-CN', {
  day: 'numeric',
  month: 'long',
  timeZone: 'Asia/Shanghai',
});

const timeFormatter = new Intl.DateTimeFormat('zh-CN', {
  hour: '2-digit',
  hour12: false,
  minute: '2-digit',
  timeZone: 'Asia/Shanghai',
});

export function formatPresenceTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return `${dateFormatter.format(date)} ${timeFormatter.format(date)}`;
}

export function formatPresenceCount(count: number): string {
  return new Intl.NumberFormat('zh-CN').format(count);
}
