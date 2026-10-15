import type { ListUpdatedEntry } from "#client/types.gen";
import { GenericInnerBox } from "#styles/common";
import { displayDateTime } from "#utils/datetime";
import {
  DiffFieldHeader,
  DiffGroup,
  DiffMultilineValue,
  DiffSpecialValue,
  DiffStack,
  DiffValueGrid,
  DiffValueHeader,
  DiffValuePanel,
} from "./StructuredDiff.style";
import {
  type DiffKind,
  formatFieldPath,
  formatInlineValue,
  formatPropertyLabel,
  formatPropertyValue,
  formatUpdatedItemLabel,
  getListItemKey,
  getScalarDiffKind,
  getVisibleListFieldDiff,
  getVisibleRecordEntries,
  groupStructuredDiffEntries,
  isListFieldDiff,
  isRecord,
  type StructuredDiffEntry,
} from "./utils";

type ValuePanelKind = "added" | "removed" | "before" | "after";

function ReadableValue({
  value,
  kind,
  counterpart,
  itemKey,
}: {
  value: unknown;
  kind: ValuePanelKind;
  counterpart?: unknown;
  itemKey?: unknown;
}) {
  if (Array.isArray(value)) {
    if (
      value.length > 0 &&
      value.every((item): item is string => typeof item === "string")
    ) {
      return <DiffMultilineValue>{value.join("\n")}</DiffMultilineValue>;
    }

    return value.length === 0 ? (
      <DiffSpecialValue>{formatInlineValue(value).text}</DiffSpecialValue>
    ) : (
      <ul>
        {value.map((item: unknown, index) => (
          <li key={`${String(index)}-${formatInlineValue(item).text}`}>
            <ReadableValue value={item} kind={kind} />
          </li>
        ))}
      </ul>
    );
  }

  if (isRecord(value)) {
    const counterpartRecord = isRecord(counterpart) ? counterpart : undefined;
    const entries = getVisibleRecordEntries({
      value,
      kind,
      ...(counterpartRecord ? { counterpart: counterpartRecord } : {}),
      ...(itemKey === undefined ? {} : { itemKey }),
    });

    return entries.length === 0 ? (
      <DiffSpecialValue>(empty object)</DiffSpecialValue>
    ) : (
      <table>
        <tbody>
          {entries.map(([key, entryValue]) => (
            <tr key={key}>
              <th>
                {formatPropertyLabel({
                  key,
                  value,
                  ...(counterpartRecord
                    ? { counterpart: counterpartRecord }
                    : {}),
                  ...(itemKey === undefined ? {} : { itemKey }),
                })}
              </th>
              <td>
                <ReadableValue
                  value={formatPropertyValue({
                    key,
                    value: entryValue,
                    ...(itemKey === undefined ? {} : { itemKey }),
                  })}
                  kind={kind}
                  counterpart={counterpartRecord?.[key]}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  const { text, isSpecialValue } = formatInlineValue(value);

  return isSpecialValue ? (
    <DiffSpecialValue>{text}</DiffSpecialValue>
  ) : (
    <p>{text}</p>
  );
}

function ListFieldGroup({
  kind,
  title,
  values,
}: {
  kind: Exclude<DiffKind, "updated">;
  title: string;
  values: Array<Record<string, unknown>>;
}) {
  if (values.length === 0) return null;

  return (
    <DiffGroup $kind={kind}>
      <DiffFieldHeader>
        <strong>
          {title} ({String(values.length)})
        </strong>
      </DiffFieldHeader>

      <DiffStack>
        {values.map((item, index) => (
          <DiffValuePanel
            key={`${title}-${String(index)}-${getListItemKey(item)}`}
          >
            <ReadableValue value={item} kind={kind} />
          </DiffValuePanel>
        ))}
      </DiffStack>
    </DiffGroup>
  );
}

function UpdatedFieldGroup({
  updated,
  beforeLabel,
  afterLabel,
}: {
  updated: Array<ListUpdatedEntry>;
  beforeLabel: string;
  afterLabel: string;
}) {
  if (updated.length === 0) return null;

  return (
    <DiffGroup $kind="updated">
      <DiffFieldHeader>
        <strong>Updated ({String(updated.length)})</strong>
      </DiffFieldHeader>

      <DiffStack>
        {updated.map((item, index) => (
          <GenericInnerBox
            key={`updated-${String(index)}-${formatInlineValue(item.key).text}`}
          >
            <DiffFieldHeader>
              <strong>{formatUpdatedItemLabel(item.key)}</strong>
            </DiffFieldHeader>

            <DiffValueGrid>
              <DiffValuePanel>
                <DiffValueHeader>{beforeLabel}</DiffValueHeader>
                <ReadableValue
                  value={item.before}
                  kind="before"
                  counterpart={item.after}
                  itemKey={item.key}
                />
              </DiffValuePanel>
              <DiffValuePanel>
                <DiffValueHeader>{afterLabel}</DiffValueHeader>
                <ReadableValue
                  value={item.after}
                  kind="after"
                  counterpart={item.before}
                  itemKey={item.key}
                />
              </DiffValuePanel>
            </DiffValueGrid>
          </GenericInnerBox>
        ))}
      </DiffStack>
    </DiffGroup>
  );
}

function DiffEntryCard({
  diff,
  beforeLabel,
  afterLabel,
  resource,
}: {
  diff: StructuredDiffEntry;
  beforeLabel: string;
  afterLabel: string;
  resource: string;
}) {
  if (isListFieldDiff(diff)) {
    const visibleDiff = getVisibleListFieldDiff(diff);
    if (
      visibleDiff.added.length === 0 &&
      visibleDiff.removed.length === 0 &&
      visibleDiff.updated.length === 0
    ) {
      return null;
    }

    return (
      <GenericInnerBox>
        <DiffFieldHeader>
          <strong>{formatFieldPath(resource, diff.field_path)}</strong>
        </DiffFieldHeader>

        <DiffStack>
          <ListFieldGroup
            kind="added"
            title="Added"
            values={visibleDiff.added}
          />
          <ListFieldGroup
            kind="removed"
            title="Removed"
            values={visibleDiff.removed}
          />
          <UpdatedFieldGroup
            updated={visibleDiff.updated}
            beforeLabel={beforeLabel}
            afterLabel={afterLabel}
          />
        </DiffStack>
      </GenericInnerBox>
    );
  }

  const kind = getScalarDiffKind(diff);
  const isDateTimeField =
    diff.field_path.split(".").at(-1) === "last_validated_at";
  const formatValue = (value: unknown): unknown =>
    isDateTimeField && typeof value === "string"
      ? displayDateTime(value)
      : value;
  const beforeValue = formatValue(diff.before);
  const afterValue = formatValue(diff.after);

  return (
    <GenericInnerBox>
      <DiffFieldHeader>
        <strong>{formatFieldPath(resource, diff.field_path)}</strong>
      </DiffFieldHeader>

      <DiffGroup $kind={kind}>
        <DiffFieldHeader>
          <strong>{kind.charAt(0).toUpperCase() + kind.slice(1)} (1)</strong>
        </DiffFieldHeader>

        <DiffValueGrid>
          <DiffValuePanel>
            <DiffValueHeader>{beforeLabel}</DiffValueHeader>
            <ReadableValue
              value={beforeValue}
              kind="before"
              counterpart={afterValue}
            />
          </DiffValuePanel>
          <DiffValuePanel>
            <DiffValueHeader>{afterLabel}</DiffValueHeader>
            <ReadableValue
              value={afterValue}
              kind="after"
              counterpart={beforeValue}
            />
          </DiffValuePanel>
        </DiffValueGrid>
      </DiffGroup>
    </GenericInnerBox>
  );
}

export function StructuredDiff({
  entries,
  beforeLabel,
  afterLabel,
  resource,
}: {
  entries: StructuredDiffEntry[];
  beforeLabel: string;
  afterLabel: string;
  resource: string;
}) {
  const groupedEntries = groupStructuredDiffEntries(resource, entries);

  return (
    <DiffStack>
      {groupedEntries.map((diff, index) => (
        <DiffEntryCard
          key={`${diff.field_path}-${String(index)}-${isListFieldDiff(diff) ? "list" : "scalar"}`}
          diff={diff}
          beforeLabel={beforeLabel}
          afterLabel={afterLabel}
          resource={resource}
        />
      ))}
    </DiffStack>
  );
}
