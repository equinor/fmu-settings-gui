import {
  Button,
  Dialog,
  ListItem,
  NativeSelect,
} from "@equinor/eds-core-react";
import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

import {
  projectGetCacheDiffOptions,
  projectGetCacheOptions,
  projectGetCacheQueryKey,
  projectGetChangelogQueryKey,
  projectGetProjectQueryKey,
  projectPatchCacheMaxRevisionsMutation,
  projectPostCacheRestoreMutation,
} from "#client/@tanstack/react-query.gen";
import type {
  CacheResource,
  ListFieldDiff,
  ListUpdatedEntry,
  ScalarFieldDiff,
} from "#client/types.gen";
import { CancelButton, GeneralButton } from "#components/form/button";
import {
  GenericDialog,
  GenericInnerBox,
  PageList,
  PageText,
} from "#styles/common";
import {
  queryKeyProjectGetCache,
  queryKeyProjectGetCacheDiff,
} from "#utils/query";
import { ReadableValue } from "./ReadableValue";
import {
  CacheInfoBox,
  CardStack,
  ChangeValueGrid,
  DiffDialogContent,
  DiffFieldHeader,
  DiffGroup,
  DiffLegend,
  MaxSnapshotsControls,
  ScrollableCardStack,
  SelectorRow,
  SnapshotInfo,
  ValuePanel,
} from "./SnapshotHistory.style";
import type { CacheEntry, DiffKind, SnapshotDeletionImpact } from "./types";
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
      <SnapshotInfo>
        <div>
          <strong>{entry.label}</strong>
        </div>
        <div>{entry.dateTimeLabel}</div>
      </SnapshotInfo>

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

function DiffDetailsDialog({
  isOpen,
  resourceLabel,
  selectedCacheEntry,
  diffEntries,
  isDiffPending,
  isDiffError,
  isRestorePending,
  isRestoreDisabled,
  restoreTooltipText,
  onRestore,
  onClose,
}: {
  isOpen: boolean;
  resourceLabel: string;
  selectedCacheEntry?: CacheEntry;
  diffEntries?: Array<ScalarFieldDiff | ListFieldDiff>;
  isDiffPending: boolean;
  isDiffError: boolean;
  isRestorePending: boolean;
  isRestoreDisabled: boolean;
  restoreTooltipText?: string;
  onRestore: () => void;
  onClose: () => void;
}) {
  return (
    <GenericDialog open={isOpen} $maxWidth="56em">
      <Dialog.Header>
        <Dialog.Title>
          {resourceLabel} -{" "}
          {selectedCacheEntry?.dateTimeLabel ?? "Unknown date"}
        </Dialog.Title>
      </Dialog.Header>

      <Dialog.CustomContent>
        <DiffDialogContent>
          {diffEntries && diffEntries.length > 0 && (
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
                  <strong>Removed:</strong> Values that will be removed from the
                  current resource
                </ListItem>
                <ListItem>
                  <strong>Updated:</strong> Values that will be replaced in the
                  current resource
                </ListItem>
              </PageList>
            </DiffLegend>
          )}

          {isDiffPending && (
            <PageText $marginBottom="0">Loading differences...</PageText>
          )}

          {isDiffError && (
            <PageText $marginBottom="0">
              Unable to load differences for this snapshot.
            </PageText>
          )}

          {diffEntries?.length === 0 && (
            <PageText $marginBottom="0">
              No differences found between current version and this snapshot.
            </PageText>
          )}

          <CardStack>
            {diffEntries?.map((diff, index) => (
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
          isPending={isRestorePending}
          disabled={isRestoreDisabled}
          tooltipText={restoreTooltipText}
          onClick={onRestore}
        />
        <Button variant="outlined" onClick={onClose}>
          Close
        </Button>
      </Dialog.Actions>
    </GenericDialog>
  );
}

function RestoreSnapshotDialog({
  isOpen,
  resourceLabel,
  selectedCacheEntry,
  isRestorePending,
  isRestoreDisabled,
  restoreTooltipText,
  onRestore,
  onCancel,
}: {
  isOpen: boolean;
  resourceLabel: string;
  selectedCacheEntry?: CacheEntry;
  isRestorePending: boolean;
  isRestoreDisabled: boolean;
  restoreTooltipText?: string;
  onRestore: () => void;
  onCancel: () => void;
}) {
  return (
    <GenericDialog open={isOpen} $maxWidth="36em">
      <Dialog.Header>
        <Dialog.Title>Restore from snapshot</Dialog.Title>
      </Dialog.Header>

      <Dialog.Content>
        <PageText>
          This will overwrite the current
          <span className="emphasis"> {resourceLabel}</span> with
          <span className="emphasis">
            {" "}
            {selectedCacheEntry?.label ?? "this snapshot"}
          </span>
          .
        </PageText>
        <GenericInnerBox>
          <SnapshotInfo>
            <div>
              <strong>
                {selectedCacheEntry?.label ?? "Selected snapshot"}
              </strong>
            </div>
            <div>{selectedCacheEntry?.dateTimeLabel ?? "Unknown date"}</div>
          </SnapshotInfo>
        </GenericInnerBox>
      </Dialog.Content>

      <Dialog.Actions>
        <GeneralButton
          label="Restore"
          isPending={isRestorePending}
          disabled={isRestoreDisabled}
          tooltipText={restoreTooltipText}
          onClick={onRestore}
        />
        <CancelButton onClick={onCancel} />
      </Dialog.Actions>
    </GenericDialog>
  );
}

function ConfirmMaxSnapshotsDialog({
  isOpen,
  maxRevisions,
  affectedResources,
  totalDeleteCount,
  isSavePending,
  onConfirm,
  onCancel,
}: {
  isOpen: boolean;
  maxRevisions?: number;
  affectedResources: SnapshotDeletionImpact[];
  totalDeleteCount: number;
  isSavePending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <GenericDialog open={isOpen} $maxWidth="36em">
      <Dialog.Header>
        <Dialog.Title>Save max snapshots</Dialog.Title>
      </Dialog.Header>

      <Dialog.Content>
        <PageText>
          Reducing max snapshots to
          <span className="emphasis">
            {" "}
            {maxRevisions !== undefined ? String(maxRevisions) : "this value"}
          </span>{" "}
          will delete the
          <span className="emphasis"> {String(totalDeleteCount)} </span>
          oldest {totalDeleteCount === 1 ? "snapshot" : "snapshots"} from disk.
        </PageText>

        {affectedResources.length > 0 && (
          <PageList>
            {affectedResources.map((item) => (
              <ListItem key={item.resource}>
                {item.label}: {String(item.deleteCount)}{" "}
                {item.deleteCount === 1 ? "snapshot" : "snapshots"}
              </ListItem>
            ))}
          </PageList>
        )}

        <PageText $marginBottom="0">This cannot be undone.</PageText>
      </Dialog.Content>

      <Dialog.Actions>
        <GeneralButton
          label="Save"
          isPending={isSavePending}
          disabled={isSavePending}
          onClick={onConfirm}
        />
        <CancelButton onClick={onCancel} />
      </Dialog.Actions>
    </GenericDialog>
  );
}

export function SnapshotHistory({
  hasProject,
  projectReadOnly,
  cacheMaxRevisions,
}: {
  hasProject: boolean;
  projectReadOnly: boolean;
  cacheMaxRevisions?: number;
}) {
  const queryClient = useQueryClient();
  const [resource, setResource] = useState<CacheResource>("config.json");
  const [selectedCacheId, setSelectedCacheId] = useState<string | null>(null);
  const [isDiffDialogOpen, setIsDiffDialogOpen] = useState(false);
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
  const [isMaxRevisionsDialogOpen, setIsMaxRevisionsDialogOpen] =
    useState(false);
  const [lastRestoredCacheId, setLastRestoredCacheId] = useState<string | null>(
    null,
  );
  const [maxRevisions, setMaxRevisions] = useState<number | undefined>(
    cacheMaxRevisions,
  );

  useEffect(() => {
    setMaxRevisions(cacheMaxRevisions);
  }, [cacheMaxRevisions]);

  const cacheQueries = useQueries({
    queries: RESOURCE_OPTIONS.map((cacheResource) => ({
      ...projectGetCacheOptions({ query: { resource: cacheResource } }),
      // Cache revisions can change outside this page (after editing config for example)
      refetchOnMount: "always" as const,
      enabled: hasProject,
      meta: {
        errorPrefix: `Error loading ${RESOURCE_LABELS[cacheResource]} snapshot history`,
      },
    })),
  });

  const selectedResourceIndex = RESOURCE_OPTIONS.indexOf(resource);
  const cachesQuery = cacheQueries[selectedResourceIndex];

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
  const resourceLabel = RESOURCE_LABELS[resource];
  const isReducingMaxRevisions =
    maxRevisions !== undefined &&
    cacheMaxRevisions !== undefined &&
    maxRevisions < cacheMaxRevisions;
  const isSnapshotImpactPending =
    isReducingMaxRevisions &&
    cacheQueries.some((query) => query.isPending || query.isFetching);
  const isSnapshotImpactError =
    isReducingMaxRevisions && cacheQueries.some((query) => query.isError);

  const snapshotDeletionImpact = (() => {
    const nextMaxRevisions = maxRevisions;

    if (!isReducingMaxRevisions || nextMaxRevisions === undefined) {
      return [];
    }

    return RESOURCE_OPTIONS.reduce<SnapshotDeletionImpact[]>(
      (impact, cacheResource, index) => {
        const revisionCount = cacheQueries[index]?.data?.revisions.length ?? 0;
        const deleteCount = Math.max(0, revisionCount - nextMaxRevisions);

        if (deleteCount > 0) {
          impact.push({
            resource: cacheResource,
            label: RESOURCE_LABELS[cacheResource],
            deleteCount,
          });
        }

        return impact;
      },
      [],
    );
  })();

  const totalSnapshotDeleteCount = snapshotDeletionImpact.reduce(
    (total, item) => total + item.deleteCount,
    0,
  );

  const maxRevisionOptions = useMemo(() => {
    const options = [5, 10, 15, 20];

    if (
      cacheMaxRevisions !== undefined &&
      cacheMaxRevisions >= 5 &&
      !options.includes(cacheMaxRevisions)
    ) {
      options.push(cacheMaxRevisions);
      options.sort((a, b) => a - b);
    }

    return options;
  }, [cacheMaxRevisions]);

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
    enabled: hasProject && isDiffDialogOpen && selectedCacheId !== null,
    staleTime: 0, // Force a fresh fetch whenever a diff is opened.
    refetchOnMount: "always", // Diffs depend on current version, avoid stale dialog data.
    meta: { errorPrefix: "Error loading snapshot details" },
  });

  const restoreMutation = useMutation({
    ...projectPostCacheRestoreMutation(),
    meta: { errorPrefix: "Error restoring snapshot" },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: projectGetProjectQueryKey(),
      });
      void queryClient.invalidateQueries({
        queryKey: projectGetChangelogQueryKey(),
      });
      void queryClient.invalidateQueries({
        queryKey: projectGetCacheQueryKey({
          query: { resource: variables.query.resource },
        }),
      });
      // Invalidate all diff queries for this resource after a restore.
      // Restoring from one snapshot changes the current version, so diffs for
      // every snapshot of the same resource must be recomputed.
      void queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey[0] as
            | { _id?: string; query?: { resource?: unknown } }
            | undefined;

          return (
            key?._id === queryKeyProjectGetCacheDiff &&
            key.query?.resource === variables.query.resource
          );
        },
      });
      toast.info(
        "Restore successful. An auto-backup of your previous state has been saved at the top of the list",
      );
      setLastRestoredCacheId(variables.path.revision_id);
      setIsRestoreDialogOpen(false);
      setSelectedCacheId(null);
    },
  });

  const maxRevisionsMutation = useMutation({
    ...projectPatchCacheMaxRevisionsMutation(),
    meta: { errorPrefix: "Error saving max snapshots" },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: projectGetProjectQueryKey(),
      });
      void queryClient.invalidateQueries({
        queryKey: projectGetChangelogQueryKey(),
      });
      void queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey[0] as { _id?: string } | undefined;

          return key?._id === queryKeyProjectGetCache;
        },
      });
      toast.info("Max snapshots saved");
      setIsMaxRevisionsDialogOpen(false);
    },
  });

  function saveMaxRevisions() {
    if (maxRevisions === undefined) {
      return;
    }

    maxRevisionsMutation.mutate({
      body: { cache_max_revisions: maxRevisions },
    });
  }

  function handleSaveMaxRevisions() {
    if (maxRevisions === undefined) {
      return;
    }

    if (totalSnapshotDeleteCount > 0) {
      setIsMaxRevisionsDialogOpen(true);

      return;
    }

    saveMaxRevisions();
  }

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

  useEffect(() => {
    if (!hasProject) {
      setIsDiffDialogOpen(false);
      setIsRestoreDialogOpen(false);
      setIsMaxRevisionsDialogOpen(false);
      setSelectedCacheId(null);
    }
  }, [hasProject]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: Reset pre-restore state when resource changes.
  useEffect(() => {
    setLastRestoredCacheId(null);
  }, [resource]);

  return (
    <>
      <DiffDetailsDialog
        isOpen={isDiffDialogOpen}
        resourceLabel={resourceLabel}
        selectedCacheEntry={selectedCacheEntry}
        diffEntries={diffQuery.data}
        isDiffPending={diffQuery.isPending}
        isDiffError={diffQuery.isError}
        isRestorePending={restoreMutation.isPending}
        isRestoreDisabled={
          projectReadOnly ||
          restoreMutation.isPending ||
          selectedCacheId === null ||
          diffQuery.isPending ||
          diffQuery.data?.length === 0
        }
        restoreTooltipText={
          projectReadOnly
            ? "Project is read-only"
            : diffQuery.data?.length === 0
              ? "No differences to restore"
              : undefined
        }
        onRestore={openRestoreDialogFromDiff}
        onClose={() => {
          setIsDiffDialogOpen(false);
        }}
      />

      <RestoreSnapshotDialog
        isOpen={isRestoreDialogOpen}
        resourceLabel={resourceLabel}
        selectedCacheEntry={selectedCacheEntry}
        isRestorePending={restoreMutation.isPending}
        isRestoreDisabled={
          projectReadOnly ||
          restoreMutation.isPending ||
          selectedCacheId === null
        }
        restoreTooltipText={
          projectReadOnly ? "Project is read-only" : undefined
        }
        onRestore={restoreSelectedCache}
        onCancel={() => {
          setIsRestoreDialogOpen(false);
        }}
      />

      <ConfirmMaxSnapshotsDialog
        isOpen={isMaxRevisionsDialogOpen}
        maxRevisions={maxRevisions}
        affectedResources={snapshotDeletionImpact}
        totalDeleteCount={totalSnapshotDeleteCount}
        isSavePending={maxRevisionsMutation.isPending}
        onConfirm={saveMaxRevisions}
        onCancel={() => {
          setIsMaxRevisionsDialogOpen(false);
        }}
      />

      {hasProject ? (
        <>
          <PageText>
            Choose a settings type to view its snapshots, listed from newest to
            oldest.
          </PageText>

          <PageText>
            Use <strong>View details</strong> to see what has changed between
            the snapshot and the current version.{" "}
            {projectReadOnly ? (
              <>
                The project is currently read-only, so restore of the snapshot
                is not possible.
              </>
            ) : (
              <>
                You can also <strong>restore</strong> from the snapshot.
              </>
            )}
          </PageText>

          <PageText>
            Use <strong>Max snapshots</strong> to control how many snapshots are
            kept on disk for this project.
          </PageText>

          <SelectorRow>
            <div>
              <NativeSelect
                id="history-resource"
                label="Settings type"
                value={resource}
                onChange={(e) => {
                  setResource(e.target.value as CacheResource);
                }}
              >
                {RESOURCE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {RESOURCE_LABELS[option]}
                  </option>
                ))}
              </NativeSelect>
            </div>

            <MaxSnapshotsControls>
              <div>
                <NativeSelect
                  id="history-max-snapshots"
                  label="Max snapshots"
                  value={maxRevisions?.toString() ?? ""}
                  disabled={projectReadOnly || maxRevisionsMutation.isPending}
                  onChange={(e) => {
                    setMaxRevisions(
                      e.target.value === ""
                        ? undefined
                        : Number(e.target.value),
                    );
                  }}
                >
                  <option value="">(not set)</option>
                  {maxRevisionOptions.map((option) => (
                    <option key={option} value={String(option)}>
                      {String(option)}
                    </option>
                  ))}
                </NativeSelect>
              </div>

              <GeneralButton
                label="Save"
                isPending={maxRevisionsMutation.isPending}
                disabled={
                  projectReadOnly ||
                  maxRevisionsMutation.isPending ||
                  maxRevisions === undefined ||
                  maxRevisions === cacheMaxRevisions ||
                  isSnapshotImpactPending ||
                  isSnapshotImpactError
                }
                tooltipText={
                  projectReadOnly
                    ? "Project is read-only"
                    : maxRevisions === undefined
                      ? "Select a max snapshots value to save"
                      : maxRevisions === cacheMaxRevisions
                        ? "No changes to save"
                        : isSnapshotImpactPending
                          ? "Checking whether snapshots will be deleted"
                          : isSnapshotImpactError
                            ? "Unable to check snapshot deletion impact"
                            : undefined
                }
                onClick={handleSaveMaxRevisions}
              />
            </MaxSnapshotsControls>
          </SelectorRow>

          {cachesQuery.isPending && <PageText>Loading snapshots...</PageText>}

          {cachesQuery.isError && (
            <PageText>Unable to load snapshot history.</PageText>
          )}

          {!cachesQuery.isPending &&
            !cachesQuery.isError &&
            allCaches.length === 0 && (
              <PageText>No snapshots found for {resourceLabel}.</PageText>
            )}

          {cacheEntries.length > 0 && (
            <ScrollableCardStack>
              {cacheEntries.map((entry) => (
                <CacheRow
                  key={entry.cacheId}
                  entry={entry}
                  isSelected={selectedCacheId === entry.cacheId}
                  onViewDetails={openDiffDialog}
                />
              ))}
            </ScrollableCardStack>
          )}
        </>
      ) : (
        <PageText>
          Project not set. Select a project to view and restore snapshots.
        </PageText>
      )}
    </>
  );
}
