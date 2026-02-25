import {
  Autocomplete,
  Button,
  Dialog,
  ListItem,
} from "@equinor/eds-core-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

import {
  projectGetCacheDiffOptions,
  projectGetCacheOptions,
  projectGetCacheQueryKey,
  projectGetProjectQueryKey,
  projectPostCacheRestoreMutation,
} from "#client/@tanstack/react-query.gen";
import type {
  CacheResource,
  ListFieldDiff,
  ListUpdatedEntry,
  ScalarFieldDiff,
} from "#client/types.gen";
import { GeneralButton } from "#components/form/button";
import {
  GenericDialog,
  GenericInnerBox,
  PageList,
  PageText,
} from "#styles/common";
import { ReadableValue } from "./ReadableValue";
import type { CacheEntry } from "./types";
import {
  formatCacheDateTime,
  formatFieldPath,
  formatInlineValue,
  getListItemKey,
  getScalarDiffKind,
  getSnapshotLabel,
  isListFieldDiff,
  RESOURCE_LABELS,
  RESOURCE_OPTIONS,
} from "./utils";
import {
  CacheInfoBox,
  CardStack,
  ChangeValueGrid,
  DiffDialogContent,
  DiffFieldHeader,
  DiffGroup,
  type DiffKind,
  DiffLegend,
  ValuePanel,
  ViewerContainer,
} from "./Viewer.style";

function ListFieldGroup({
  kind,
  title,
  values,
}: {
  kind: DiffKind;
  title: string;
  values: Array<Record<string, unknown>>;
}) {
  if (values.length === 0) {
    return null;
  }

  return (
    <DiffGroup $kind={kind}>
      <DiffFieldHeader>
        <strong>
          {title} ({String(values.length)})
        </strong>
      </DiffFieldHeader>

      <CardStack>
        {values.map((item, idx) => (
          <ValuePanel key={`${title}-${String(idx)}-${getListItemKey(item)}`}>
            <ReadableValue value={item} />
          </ValuePanel>
        ))}
      </CardStack>
    </DiffGroup>
  );
}

function UpdatedFieldGroup({ updated }: { updated: Array<ListUpdatedEntry> }) {
  if (updated.length === 0) {
    return null;
  }

  return (
    <DiffGroup $kind="updated">
      <DiffFieldHeader>
        <strong>Updated ({String(updated.length)})</strong>
      </DiffFieldHeader>

      <CardStack>
        {updated.map((item, idx) => (
          <GenericInnerBox
            key={`updated-${String(idx)}-${formatInlineValue(item.key)}`}
          >
            <ChangeValueGrid>
              <ValuePanel>
                <strong>Before restore</strong>
                <ReadableValue value={item.before} />
              </ValuePanel>
              <ValuePanel>
                <strong>After restore</strong>
                <ReadableValue value={item.after} />
              </ValuePanel>
            </ChangeValueGrid>
          </GenericInnerBox>
        ))}
      </CardStack>
    </DiffGroup>
  );
}

function DiffEntryCard({ diff }: { diff: ScalarFieldDiff | ListFieldDiff }) {
  if (isListFieldDiff(diff)) {
    return (
      <GenericInnerBox>
        <DiffFieldHeader>
          <strong>{formatFieldPath(diff.field_path)}</strong>
        </DiffFieldHeader>

        <CardStack>
          <ListFieldGroup kind="added" title="Added" values={diff.added} />
          <ListFieldGroup
            kind="removed"
            title="Removed"
            values={diff.removed}
          />
          <UpdatedFieldGroup updated={diff.updated} />
        </CardStack>
      </GenericInnerBox>
    );
  }

  const kind = getScalarDiffKind(diff);

  return (
    <GenericInnerBox>
      <DiffFieldHeader>
        <strong>{formatFieldPath(diff.field_path)}</strong>
      </DiffFieldHeader>

      <DiffGroup $kind={kind}>
        <DiffFieldHeader>
          <strong>{kind.charAt(0).toUpperCase() + kind.slice(1)} (1)</strong>
        </DiffFieldHeader>

        <ChangeValueGrid>
          <ValuePanel>
            <strong>Before restore</strong>
            <ReadableValue value={diff.before} />
          </ValuePanel>
          <ValuePanel>
            <strong>After restore</strong>
            <ReadableValue value={diff.after} />
          </ValuePanel>
        </ChangeValueGrid>
      </DiffGroup>
    </GenericInnerBox>
  );
}

function CacheRow({
  entry,
  isSelected,
  onViewDetails,
}: {
  entry: CacheEntry;
  isSelected: boolean;
  onViewDetails: (cache: string) => void;
}) {
  return (
    <CacheInfoBox $selected={isSelected} $isAutoBackup={entry.isAutoBackup}>
      <div>
        <div>
          <strong>{entry.label}</strong>
        </div>
        <div style={{ marginTop: "0.5em" }}>{entry.dateTimeLabel}</div>
      </div>

      <Button
        onClick={() => {
          onViewDetails(entry.cacheId);
        }}
      >
        View details
      </Button>
    </CacheInfoBox>
  );
}

export function Viewer({ projectReadOnly }: { projectReadOnly: boolean }) {
  const queryClient = useQueryClient();
  const [resource, setResource] = useState<CacheResource>("config.json");
  const [selectedCacheId, setSelectedCacheId] = useState<string | null>(null);
  const [isDiffDialogOpen, setIsDiffDialogOpen] = useState(false);
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
  const [lastRestoredCacheId, setLastRestoredCacheId] = useState<string | null>(
    null,
  );

  const cachesQuery = useQuery({
    ...projectGetCacheOptions({ query: { resource } }),
    // Cache revisions can change outside this page (after editing config for example)
    refetchOnMount: "always",
    meta: { errorPrefix: "Error loading cache history" },
  });

  const allCaches: string[] = useMemo(
    () => [...(cachesQuery.data?.revisions ?? [])].reverse(),
    [cachesQuery.data?.revisions],
  );

  const cacheEntries = useMemo<CacheEntry[]>(
    () =>
      allCaches.map((cacheId, index) => {
        const isAutoBackup = lastRestoredCacheId !== null && index === 0;

        return {
          cacheId,
          label: isAutoBackup
            ? `${getSnapshotLabel(index)} (pre-restore)`
            : getSnapshotLabel(index),
          dateTimeLabel: formatCacheDateTime(cacheId),
          isAutoBackup,
        };
      }),
    [allCaches, lastRestoredCacheId],
  );

  const selectedCacheEntry = cacheEntries.find(
    (entry) => entry.cacheId === selectedCacheId,
  );

  useEffect(() => {
    if (allCaches.length === 0) {
      setSelectedCacheId(null);

      return;
    }

    if (selectedCacheId === null || !allCaches.includes(selectedCacheId)) {
      setSelectedCacheId(allCaches[0]);
    }
  }, [allCaches, selectedCacheId]);

  const diffQuery = useQuery({
    ...projectGetCacheDiffOptions({
      path: { revision_id: selectedCacheId ?? "" },
      query: { resource },
    }),
    enabled: isDiffDialogOpen && selectedCacheId !== null,
    staleTime: 0, // Force a fresh fetch whenever a diff is opened.
    refetchOnMount: "always", // Diffs depend on current state, avoid stale dialog data.
    meta: { errorPrefix: "Error loading cache details" },
  });

  const restoreMutation = useMutation({
    ...projectPostCacheRestoreMutation(),
    meta: { errorPrefix: "Error restoring cache" },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: projectGetProjectQueryKey(),
      });
      void queryClient.invalidateQueries({
        queryKey: projectGetCacheQueryKey({
          query: { resource: variables.query.resource },
        }),
      });
      // Invalidate all diff queries for this resource after a restore.
      // Restoring from one snapshot changes the current state, so diffs for
      // every snapshot of the same resource must be recomputed.
      void queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey[0] as
            | { _id?: string; query?: { resource?: unknown } }
            | undefined;

          return (
            key?._id === "projectGetCacheDiff" &&
            key.query?.resource === variables.query.resource
          );
        },
      });
      toast.info(
        "Restore successful. An auto-backup of your previous state has been saved at the top of the list.",
      );
      setLastRestoredCacheId(variables.path.revision_id);
      setIsRestoreDialogOpen(false);
      setSelectedCacheId(null);
    },
  });

  function openDiffDialog(cacheId: string) {
    setSelectedCacheId(cacheId);
    setIsDiffDialogOpen(true);
  }

  function openRestoreDialog(cacheId: string) {
    setSelectedCacheId(cacheId);
    setIsRestoreDialogOpen(true);
  }

  function openRestoreDialogFromDiff() {
    setIsDiffDialogOpen(false);
    if (selectedCacheId) {
      openRestoreDialog(selectedCacheId);
    }
  }

  function restoreSelectedCache() {
    if (!selectedCacheId) {
      return;
    }

    restoreMutation.mutate({
      path: { revision_id: selectedCacheId },
      query: { resource },
    });
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: Reset pre-restore state when resource changes.
  useEffect(() => {
    setLastRestoredCacheId(null);
  }, [resource]);

  return (
    <ViewerContainer>
      <PageText $marginBottom="0">
        Choose a resource to view its snapshots, listed from newest to oldest.
      </PageText>
      <PageText $marginBottom="0">
        Use <strong>"View details"</strong> to see what changed between the
        current version and a snapshot, and to <strong>restore</strong> from it.
      </PageText>
      {projectReadOnly && (
        <PageText $marginBottom="0">
          Project is read-only. Restore is disabled until the project is opened
          for editing.
        </PageText>
      )}

      <div style={{ maxWidth: "15em" }}>
        <Autocomplete
          label="Resource"
          optionLabel={(option) => option.label}
          options={RESOURCE_OPTIONS.map((option) => ({
            value: option,
            label: RESOURCE_LABELS[option],
          }))}
          selectedOptions={[
            {
              value: resource,
              label: RESOURCE_LABELS[resource],
            },
          ]}
          onOptionsChange={(changes) => {
            if (changes.selectedItems.length > 0) {
              setResource(changes.selectedItems[0].value);
            }
          }}
          autoWidth
        />
      </div>

      {cachesQuery.isPending && <PageText>Loading snapshots...</PageText>}

      {cachesQuery.isError && (
        <PageText>Unable to load snapshot history.</PageText>
      )}

      {!cachesQuery.isPending &&
        !cachesQuery.isError &&
        allCaches.length === 0 && (
          <PageText>
            No snapshots found for {RESOURCE_LABELS[resource]}.
          </PageText>
        )}

      {cacheEntries.length > 0 && (
        <CardStack>
          {cacheEntries.map((entry) => (
            <CacheRow
              key={entry.cacheId}
              entry={entry}
              isSelected={selectedCacheId === entry.cacheId}
              onViewDetails={openDiffDialog}
            />
          ))}
        </CardStack>
      )}

      <GenericDialog open={isDiffDialogOpen} $maxWidth="56em">
        <Dialog.Header>
          <Dialog.Title>
            {RESOURCE_LABELS[resource]} -{" "}
            {selectedCacheEntry?.dateTimeLabel ?? "Unknown date"}
          </Dialog.Title>
        </Dialog.Header>

        <Dialog.CustomContent>
          <DiffDialogContent>
            {diffQuery.data && diffQuery.data.length > 0 && (
              <DiffLegend>
                <PageText>
                  These changes show what will happen if you restore this
                  snapshot.
                </PageText>
                <PageList>
                  <ListItem>
                    <strong>Added:</strong> Values that will be added to the
                    current resource
                  </ListItem>
                  <ListItem>
                    <strong>Removed:</strong> Values that will be removed from
                    the current resource
                  </ListItem>
                  <ListItem>
                    <strong>Updated:</strong> Values that will be replaced in
                    the current resource
                  </ListItem>
                </PageList>
              </DiffLegend>
            )}

            {diffQuery.isPending && (
              <PageText $marginBottom="0">Loading differences...</PageText>
            )}

            {diffQuery.isError && (
              <PageText $marginBottom="0">
                Unable to load differences for this cache.
              </PageText>
            )}

            {diffQuery.data?.length === 0 && (
              <PageText $marginBottom="0">
                No differences found between current state and this snapshot.
              </PageText>
            )}

            <CardStack>
              {diffQuery.data?.map((diff, index) => (
                <DiffEntryCard
                  key={`${diff.field_path}-${String(index)}-${isListFieldDiff(diff) ? "list" : "scalar"}`}
                  diff={diff}
                />
              ))}
            </CardStack>
          </DiffDialogContent>
        </Dialog.CustomContent>

        <Dialog.Actions>
          <GeneralButton
            label="Restore"
            isPending={restoreMutation.isPending}
            disabled={
              projectReadOnly ||
              restoreMutation.isPending ||
              selectedCacheId === null ||
              diffQuery.isPending ||
              diffQuery.data?.length === 0
            }
            tooltipText={
              projectReadOnly
                ? "Project is read-only"
                : diffQuery.data?.length === 0
                  ? "No differences to restore"
                  : undefined
            }
            onClick={openRestoreDialogFromDiff}
          />
          <Button
            variant="outlined"
            onClick={() => {
              setIsDiffDialogOpen(false);
            }}
          >
            Close
          </Button>
        </Dialog.Actions>
      </GenericDialog>

      <GenericDialog open={isRestoreDialogOpen} $maxWidth="36em">
        <Dialog.Header>
          <Dialog.Title>Restore from snapshot</Dialog.Title>
        </Dialog.Header>

        <Dialog.Content>
          <PageText>
            This will overwrite the current
            <span className="emphasis"> {RESOURCE_LABELS[resource]}</span> with
            <span className="emphasis">
              {" "}
              {selectedCacheEntry?.label ?? "this snapshot"}
            </span>
            .
          </PageText>
          <GenericInnerBox>
            <div>
              <div>
                <strong>
                  {selectedCacheEntry?.label ?? "Selected snapshot"}
                </strong>
              </div>
              <div style={{ marginTop: "0.5em" }}>
                {selectedCacheEntry?.dateTimeLabel ?? "Unknown date"}
              </div>
            </div>
          </GenericInnerBox>
        </Dialog.Content>

        <Dialog.Actions>
          <GeneralButton
            label="Restore"
            isPending={restoreMutation.isPending}
            disabled={
              projectReadOnly ||
              restoreMutation.isPending ||
              selectedCacheId === null
            }
            tooltipText={projectReadOnly ? "Project is read-only" : undefined}
            onClick={restoreSelectedCache}
          />
          <Button
            variant="outlined"
            onClick={() => {
              setIsRestoreDialogOpen(false);
            }}
          >
            Cancel
          </Button>
        </Dialog.Actions>
      </GenericDialog>
    </ViewerContainer>
  );
}
