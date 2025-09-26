export function displayDateTime(datetime: string): string {
  const parsedTimestamp = Date.parse(datetime);
  if (parsedTimestamp) {
    const parsedDateTime = new Date(parsedTimestamp);

    return parsedDateTime.toUTCString();
  } else {
    return "(unknown)";
  }
}
