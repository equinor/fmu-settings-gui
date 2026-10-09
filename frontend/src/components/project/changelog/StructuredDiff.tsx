import type { ListUpdatedEntry } from "#client/types.gen";
import { GenericInnerBox } from "#styles/common";
import {
  ChangeDetailsDiffGroup,
  ChangeDetailsDiffStack,
  ChangeDetailsFieldHeader,
  ChangeDetailsValueGrid,
  ChangeDetailsValuePanel,
} from "./Changelog.style";
import {
  type DiffKind,
  formatFieldPath,
  formatInlineValue,
  formatUpdatedItemLabel,
  getListItemKey,
  getScalarDiffKind,
  isListFieldDiff,
  type StructuredDiffEntry,
} from "./utils";

function ReadableValue({ value }: { value: unknown }) {
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

  if (typeof value === "object" && value !== null) {
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

function ListFieldGroup({
  kind,
  title,
  values,
}: {
  kind: DiffKind;
  title: string;
  values: Array<Record<string, unknown>>;
}) {
  if (values.length === 0) return null;

  return (
    <ChangeDetailsDiffGroup $kind={kind}>
      <ChangeDetailsFieldHeader>
        <strong>
          {title} ({String(values.length)})
        </strong>
      </ChangeDetailsFieldHeader>
      <ChangeDetailsDiffStack>
        {values.map((item, index) => (
          <ChangeDetailsValuePanel
            key={`${title}-${String(index)}-${getListItemKey(item)}`}
          >
            <ReadableValue value={item} />
          </ChangeDetailsValuePanel>
        ))}
      </ChangeDetailsDiffStack>
    </ChangeDetailsDiffGroup>
  );
}

function UpdatedFieldGroup({ updated }: { updated: Array<ListUpdatedEntry> }) {
  if (updated.length === 0) return null;

  return (
    <ChangeDetailsDiffGroup $kind="updated">
      <ChangeDetailsFieldHeader>
        <strong>Updated ({String(updated.length)})</strong>
      </ChangeDetailsFieldHeader>
      <ChangeDetailsDiffStack>
        {updated.map((item, index) => (
          <GenericInnerBox
            key={`updated-${String(index)}-${formatInlineValue(item.key)}`}
          >
            <ChangeDetailsFieldHeader>
              <strong>{formatUpdatedItemLabel(item.key)}</strong>
            </ChangeDetailsFieldHeader>
            <ChangeDetailsValueGrid>
              <ChangeDetailsValuePanel>
                <strong>Before change</strong>
                <ReadableValue value={item.before} />
              </ChangeDetailsValuePanel>
              <ChangeDetailsValuePanel>
                <strong>After change</strong>
                <ReadableValue value={item.after} />
              </ChangeDetailsValuePanel>
            </ChangeDetailsValueGrid>
          </GenericInnerBox>
        ))}
      </ChangeDetailsDiffStack>
    </ChangeDetailsDiffGroup>
  );
}

function DiffEntryCard({ diff }: { diff: StructuredDiffEntry }) {
  if (isListFieldDiff(diff)) {
    return (
      <GenericInnerBox>
        <ChangeDetailsFieldHeader>
          <strong>{formatFieldPath(diff.field_path)}</strong>
        </ChangeDetailsFieldHeader>
        <ChangeDetailsDiffStack>
          <ListFieldGroup kind="added" title="Added" values={diff.added} />
          <ListFieldGroup
            kind="removed"
            title="Removed"
            values={diff.removed}
          />
          <UpdatedFieldGroup updated={diff.updated} />
        </ChangeDetailsDiffStack>
      </GenericInnerBox>
    );
  }

  const kind = getScalarDiffKind(diff);

  return (
    <GenericInnerBox>
      <ChangeDetailsFieldHeader>
        <strong>{formatFieldPath(diff.field_path)}</strong>
      </ChangeDetailsFieldHeader>
      <ChangeDetailsDiffGroup $kind={kind}>
        <ChangeDetailsFieldHeader>
          <strong>{kind.charAt(0).toUpperCase() + kind.slice(1)} (1)</strong>
        </ChangeDetailsFieldHeader>
        <ChangeDetailsValueGrid>
          <ChangeDetailsValuePanel>
            <strong>Before change</strong>
            <ReadableValue value={diff.before} />
          </ChangeDetailsValuePanel>
          <ChangeDetailsValuePanel>
            <strong>After change</strong>
            <ReadableValue value={diff.after} />
          </ChangeDetailsValuePanel>
        </ChangeDetailsValueGrid>
      </ChangeDetailsDiffGroup>
    </GenericInnerBox>
  );
}

export function StructuredDiff({
  entries,
}: {
  entries: StructuredDiffEntry[];
}) {
  return (
    <ChangeDetailsDiffStack>
      {entries.map((diff, index) => (
        <DiffEntryCard
          key={`${diff.field_path}-${String(index)}-${isListFieldDiff(diff) ? "list" : "scalar"}`}
          diff={diff}
        />
      ))}
    </ChangeDetailsDiffStack>
  );
}
