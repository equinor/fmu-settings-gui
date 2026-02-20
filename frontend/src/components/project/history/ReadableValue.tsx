import { formatInlineValue, isRecord } from "./utils";

export function ReadableValue({ value }: { value: unknown }) {
  if (Array.isArray(value)) {
    return value.length === 0 ? (
      <p>(empty list)</p>
    ) : (
      <ul>
        {value.map((item, index) => (
          <li key={`${String(index)}-${formatInlineValue(item)}`}>
            {formatInlineValue(item)}
          </li>
        ))}
      </ul>
    );
  }

  if (isRecord(value)) {
    const entries = Object.entries(value);

    return entries.length === 0 ? (
      <p>(empty object)</p>
    ) : (
      <table>
        <tbody>
          {entries.map(([key, entryValue]) => (
            <tr key={key}>
              <th>{key}</th>
              <td>{formatInlineValue(entryValue)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  return <p>{formatInlineValue(value)}</p>;
}
