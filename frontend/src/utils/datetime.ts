export function displayDateTime(datetime: string): string {
  const parsedTimestamp = Date.parse(datetime);
  if (parsedTimestamp) {
    const parsedDateTime = new Date(parsedTimestamp);

    return parsedDateTime.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "medium",
    });
  } else {
    return "(unknown)";
  }
}

export function displayTimestamp(timestamp: number): string {
  if (timestamp) {
    const date = new Date(timestamp * 1000); // Convert seconds to milliseconds

    return date.toUTCString();
  } else {
    return "(unknown)";
  }
}
