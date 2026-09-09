import { Checkbox, Dialog } from "@equinor/eds-core-react";
import { type ColumnDef, EdsDataGrid } from "@equinor/eds-data-grid-react";
import { useMutation } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";

import type { MatchReplacementRule } from "#client";
import { matchPostMatchMutation } from "#client/@tanstack/react-query.gen";
import { ConfirmCloseDialog } from "#components/common";
import { CancelButton, GeneralButton } from "#components/form/button";
import type { ElementMappings } from "#components/project/common/mapping/types";
import { emptyName } from "#components/project/common/mapping/utils";
import { applicationLocale } from "#config";
import type { SaveWellboreMappings } from "#services/mappings";
import type { SmdaWellHeaders } from "#services/smda";
import { EditDialog, InfoBox, PageText } from "#styles/common";
import {
  DataGridFilterContainer,
  DataGridSearch,
  dataGridHeight,
} from "#styles/dataGrid";
import { useConfirmClose } from "#utils/ui";
import {
  applyAutomaticMatchProposals,
  createAutomaticMatchProposals,
  removeSmdaMappings,
  toggleMatchProposal,
} from "./functions";
import { MappingAction } from "./MappingAction";
import { RemoveMappingsAction } from "./RemoveMappingsAction";
import {
  ConfidenceBadge,
  MatchingResultsContainer,
} from "./SmdaMappings.style";
import type { AutomaticMatchProposal, DisplayedMatchQuality } from "./types";

type ColumnFilters = Array<{ id: string; value: unknown }>;

const MATCH_QUALITY_ORDER: Record<DisplayedMatchQuality, number> = {
  Low: -1,
  Medium: 0,
  High: 1,
  Exact: 2,
};
const AUTOMATIC_MATCHING_GRID_MAX_HEIGHT = 391;

function createWellPrefixReplacements(
  wellboreNames: string[],
): MatchReplacementRule[] {
  const prefixes = new Set<string>();

  wellboreNames.forEach((wellboreName) => {
    const firstNumberIndex = wellboreName.search(/\d/);
    if (firstNumberIndex <= 0) {
      return;
    }

    const prefix = wellboreName
      .slice(0, firstNumberIndex)
      .toLocaleLowerCase(applicationLocale)
      .replace(/[_.\-/]/g, " ")
      .trim()
      .replace(/\s+/g, " ");
    if (prefix) {
      prefixes.add(prefix);
    }
  });

  return [...prefixes]
    .sort((prefixA, prefixB) => prefixB.length - prefixA.length)
    .map((original) => ({ original, replacement: "" }));
}

function displayedMatchQuality(
  proposal: AutomaticMatchProposal,
): DisplayedMatchQuality {
  if (proposal.candidate.score === 100) {
    return "Exact";
  }

  switch (proposal.candidate.confidence) {
    case "high":
      return "High";
    case "medium":
      return "Medium";
    case "low":
      return "Low";
  }
}

function matchesNameSimilarityFilter(
  proposal: AutomaticMatchProposal,
  columnFilters: ColumnFilters,
) {
  const nameSimilarityFilter = columnFilters.find(
    (filter) => filter.id === "nameSimilarity",
  );
  const filterValues = (
    Array.isArray(nameSimilarityFilter?.value)
      ? nameSimilarityFilter.value
      : [nameSimilarityFilter?.value]
  ).filter(Boolean);

  return (
    filterValues.length === 0 ||
    filterValues.includes(displayedMatchQuality(proposal))
  );
}

function AutomaticMatchingSetupDialog({
  disabled,
  isPending,
  closeDialog,
  runMatching,
}: {
  disabled: boolean;
  isPending: boolean;
  closeDialog: () => void;
  runMatching: (ignorePrefixes: boolean) => void;
}) {
  const [ignorePrefixes, setIgnorePrefixes] = useState(true);

  const submitMatching = () => {
    runMatching(ignorePrefixes);
  };
  const confirmClose = useConfirmClose({
    enable: true,
    determineRequiresConfirmation: () => !ignorePrefixes,
    onCloseConfirmed: closeDialog,
  });

  return (
    <>
      <ConfirmCloseDialog
        isOpen={confirmClose.confirmCloseDialogOpen}
        handleConfirmCloseDecision={confirmClose.handleDecision}
      />

      <EditDialog
        open={true}
        isDismissable={true}
        onClose={confirmClose.handleCloseRequest}
        $width="42em"
      >
        <Dialog.Header>Suggest SMDA names</Dialog.Header>

        <Dialog.CustomContent>
          <PageText>
            This compares each unmapped RMS wellbore name with the available
            SMDA wellbore names and suggests the most similar SMDA name. You can
            review every suggestion before anything is saved.
          </PageText>

          <Checkbox
            label="Ignore prefixes before the first wellbore number (recommended)"
            checked={ignorePrefixes}
            onChange={(event) => {
              setIgnorePrefixes(event.target.checked);
            }}
          />

          <PageText $marginBottom="0">
            RMS and SMDA wellbore names can begin with prefixes such as{" "}
            <code>RFT</code> or <code>NO</code>. These prefixes are ignored when
            the names are compared. The complete SMDA name, including the
            country prefix, is still saved.
          </PageText>
        </Dialog.CustomContent>

        <Dialog.Actions>
          <GeneralButton
            label="Generate suggestions"
            disabled={disabled}
            isPending={isPending}
            tooltipText={
              disabled
                ? isPending
                  ? "SMDA name suggestions are being generated"
                  : "Project is read-only"
                : undefined
            }
            onClick={submitMatching}
          />
          <CancelButton onClick={confirmClose.handleCloseRequest} />
        </Dialog.Actions>
      </EditDialog>
    </>
  );
}

function AutomaticMatchingDialog({
  proposals,
  unmappedRmsWellboreCount,
  disabled,
  isPending,
  closeDialog,
  applyProposals,
  toggleProposal,
}: {
  proposals: AutomaticMatchProposal[];
  unmappedRmsWellboreCount: number;
  disabled: boolean;
  isPending: boolean;
  closeDialog: () => void;
  applyProposals: () => void;
  toggleProposal: (rmsWellboreName: string) => void;
}) {
  const [sorting, setSorting] = useState<Array<{ id: string; desc: boolean }>>([
    { id: "nameSimilarity", desc: true },
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFilters>([]);
  const [wellboreFilter, setWellboreFilter] = useState("");
  const selectedCount = proposals.filter(
    (proposal) => proposal.selected,
  ).length;
  const confirmClose = useConfirmClose({
    enable: true,
    determineRequiresConfirmation: () => selectedCount > 0,
    onCloseConfirmed: closeDialog,
  });
  const remainingCount = unmappedRmsWellboreCount - selectedCount;
  const normalizedWellboreFilter = wellboreFilter
    .trim()
    .toLocaleLowerCase(applicationLocale);
  const visibleProposals = useMemo(
    () =>
      normalizedWellboreFilter
        ? proposals.filter((proposal) =>
            proposal.rmsWellboreName
              .toLocaleLowerCase(applicationLocale)
              .includes(normalizedWellboreFilter),
          )
        : proposals,
    [normalizedWellboreFilter, proposals],
  );
  const filteredProposalCount = useMemo(
    () =>
      visibleProposals.filter((proposal) =>
        matchesNameSimilarityFilter(proposal, columnFilters),
      ).length,
    [columnFilters, visibleProposals],
  );
  const columns: ColumnDef<AutomaticMatchProposal>[] = useMemo(
    () => [
      {
        id: "useSuggestion",
        accessorKey: "selected",
        header: "Use",
        enableColumnFilter: false,
        size: 80,
        cell: ({ row }) => {
          const proposal = row.original;

          return (
            <Checkbox
              checked={proposal.selected}
              onChange={() => {
                toggleProposal(proposal.rmsWellboreName);
              }}
            />
          );
        },
        sortingFn: (rowA, rowB) =>
          Number(rowA.original.selected) - Number(rowB.original.selected),
      },
      {
        accessorKey: "rmsWellboreName",
        header: "RMS",
        enableColumnFilter: false,
        size: 195,
      },
      {
        accessorKey: "smdaName",
        header: "Suggested SMDA",
        enableColumnFilter: false,
        size: 236,
        cell: ({ row }) => row.original.smdaName || emptyName,
      },
      {
        id: "nameSimilarity",
        accessorFn: displayedMatchQuality,
        header: "Name similarity",
        size: 225,
        sortingFn: (rowA, rowB) => {
          const qualityA =
            rowA.getValue<DisplayedMatchQuality>("nameSimilarity");
          const qualityB =
            rowB.getValue<DisplayedMatchQuality>("nameSimilarity");

          return MATCH_QUALITY_ORDER[qualityA] - MATCH_QUALITY_ORDER[qualityB];
        },
        cell: ({ getValue }) => {
          const quality = getValue<DisplayedMatchQuality>();

          return (
            <ConfidenceBadge $confidence={quality}>{quality}</ConfidenceBadge>
          );
        },
      },
    ],
    [toggleProposal],
  );
  const emptyMessage =
    proposals.length === 0
      ? "No medium or higher similarity suggestions were found."
      : normalizedWellboreFilter && visibleProposals.length === 0
        ? "No wellbores match the filter."
        : "No suggestions match the current filters.";

  return (
    <>
      <ConfirmCloseDialog
        isOpen={confirmClose.confirmCloseDialogOpen}
        handleConfirmCloseDecision={confirmClose.handleDecision}
        title="Discard suggestions"
        description={
          "The selected SMDA names have not been saved. If the review is " +
          "cancelled, the suggestions will be lost."
        }
        question="Do you want to discard the suggestions?"
        confirmLabel="Keep reviewing"
        cancelLabel="Discard suggestions"
      />

      <EditDialog
        open={true}
        isDismissable={true}
        onClose={confirmClose.handleCloseRequest}
        $width="48em"
      >
        <Dialog.Header>Review suggested SMDA names</Dialog.Header>

        <Dialog.CustomContent>
          <PageText>
            Review each suggestion before saving. Name similarity does not
            verify that the RMS and SMDA names refer to the same wellbore.
            Suggestions with low name similarity are not shown.
          </PageText>

          <PageText>
            <span className="emphasis">Exact</span> means a 100% name match and
            is selected by default. The same SMDA name can be selected for more
            than one RMS wellbore.
          </PageText>

          <InfoBox>
            <table>
              <tbody>
                <tr>
                  <th>Suggestions found</th>
                  <td>
                    <span className="emphasis">{proposals.length}</span> of{" "}
                    {unmappedRmsWellboreCount} unmapped non-planned wellbores
                  </td>
                </tr>
                <tr>
                  <th>Selected suggestions</th>
                  <td className="emphasis">{selectedCount}</td>
                </tr>
                <tr>
                  <th>Need manual mapping</th>
                  <td className="emphasis">{remainingCount}</td>
                </tr>
              </tbody>
            </table>
          </InfoBox>

          {proposals.length > 0 && (
            <DataGridFilterContainer>
              <DataGridSearch
                placeholder="Filter wellbores"
                value={wellboreFilter}
                onChange={(event) => {
                  setWellboreFilter(event.target.value);
                }}
              />
              {normalizedWellboreFilter && (
                <PageText $marginBottom="0">
                  Filter is showing{" "}
                  <span className="emphasis">{filteredProposalCount}</span> of{" "}
                  {proposals.length} suggestions.
                </PageText>
              )}
            </DataGridFilterContainer>
          )}

          <MatchingResultsContainer>
            <EdsDataGrid
              stickyHeader
              enableVirtual
              height={dataGridHeight(
                filteredProposalCount,
                AUTOMATIC_MATCHING_GRID_MAX_HEIGHT,
              )}
              rows={visibleProposals}
              columns={columns}
              getRowId={(row) => row.rmsWellboreName}
              headerClass={(column) =>
                column.id === "useSuggestion" ? "centered-column-header" : ""
              }
              enableSorting
              enableColumnFiltering
              columnFiltersState={columnFilters}
              onColumnFiltersChange={setColumnFilters}
              sortingState={sorting}
              onSortingChange={setSorting}
              emptyMessage={emptyMessage}
            />
          </MatchingResultsContainer>
        </Dialog.CustomContent>

        <Dialog.Actions>
          <GeneralButton
            label="Save selected SMDA names"
            disabled={disabled || selectedCount === 0}
            isPending={isPending}
            tooltipText={
              isPending
                ? "Wellbore mappings are being saved"
                : disabled
                  ? "Project is read-only"
                  : selectedCount === 0
                    ? "Select at least one suggestion to save"
                    : undefined
            }
            onClick={applyProposals}
          />
          <CancelButton onClick={confirmClose.handleCloseRequest} />
        </Dialog.Actions>
      </EditDialog>
    </>
  );
}

const smdaUnavailableReason = "SMDA is not available";

function suggestionsBlockedReason({
  projectReadOnly,
  elementMappings,
  nonPlannedRmsWellboreNames,
  rmsWellboreNamesMissingSmda,
  smdaHealthStatus,
  wellHeaders,
}: {
  projectReadOnly: boolean;
  elementMappings: ElementMappings;
  nonPlannedRmsWellboreNames: string[];
  rmsWellboreNamesMissingSmda: string[];
  smdaHealthStatus: boolean;
  wellHeaders: SmdaWellHeaders;
}) {
  if (projectReadOnly) {
    return "Project is read-only";
  }
  if (!Object.keys(elementMappings).length) {
    return "Select RMS wellbores to store in the project configuration before generating SMDA name suggestions";
  }
  if (!nonPlannedRmsWellboreNames.length) {
    return (
      "SMDA mapping is not available because all RMS wellbores stored in " +
      "the project configuration are planned"
    );
  }
  if (!rmsWellboreNamesMissingSmda.length) {
    return "All non-planned RMS wellbores already have an SMDA mapping";
  }
  if (!wellHeaders.hasFields) {
    return "Project masterdata must contain a field";
  }
  if (!smdaHealthStatus) {
    return smdaUnavailableReason;
  }
  if (wellHeaders.isError) {
    return "Some SMDA wellbore names could not be loaded";
  }
  if (wellHeaders.isLoading) {
    return "Loading SMDA wellbore names...";
  }
  if (!wellHeaders.smdaHeaders.length) {
    return "No SMDA wellbore names are available";
  }

  return undefined;
}

export function SmdaMappings({
  elementMappings,
  nonPlannedRmsWellboreNames,
  wellHeaders,
  smdaHealthStatus,
  projectReadOnly,
  isSaving,
  saveMappings,
}: {
  elementMappings: ElementMappings;
  nonPlannedRmsWellboreNames: string[];
  wellHeaders: SmdaWellHeaders;
  smdaHealthStatus: boolean;
  projectReadOnly: boolean;
  isSaving: boolean;
  saveMappings: SaveWellboreMappings;
}) {
  const [automaticMatchProposals, setAutomaticMatchProposals] = useState<
    AutomaticMatchProposal[] | null
  >(null);
  const [automaticMatchingSetupOpen, setAutomaticMatchingSetupOpen] =
    useState(false);
  const matchMutation = useMutation({
    ...matchPostMatchMutation(),
    meta: { errorPrefix: "Could not generate SMDA name suggestions" },
  });
  const { hasSmdaMappings, rmsWellboreNamesMissingSmda } = useMemo(() => {
    const mappedRmsWellboreNames = new Set(
      Object.values(elementMappings)
        .filter((elementMapping) => {
          const smdaTarget = elementMapping.targets.smda;

          return (
            smdaTarget !== undefined &&
            (smdaTarget.unmappable || smdaTarget.uuid !== "")
          );
        })
        .map((elementMapping) => elementMapping.name),
    );

    return {
      hasSmdaMappings: mappedRmsWellboreNames.size > 0,
      rmsWellboreNamesMissingSmda: nonPlannedRmsWellboreNames.filter(
        (rmsWellboreName) => !mappedRmsWellboreNames.has(rmsWellboreName),
      ),
    };
  }, [elementMappings, nonPlannedRmsWellboreNames]);
  const suggestionsBlocked = suggestionsBlockedReason({
    projectReadOnly,
    elementMappings,
    nonPlannedRmsWellboreNames,
    rmsWellboreNamesMissingSmda,
    smdaHealthStatus,
    wellHeaders,
  });

  const startAutomaticMatching = (ignorePrefixes: boolean) => {
    const smdaWellboreNames = wellHeaders.smdaHeaders.map(
      (header) => header.unique_wellbore_identifier,
    );

    matchMutation.mutate(
      {
        body: {
          sources: rmsWellboreNamesMissingSmda,
          targets: smdaWellboreNames,
          replacements: ignorePrefixes
            ? createWellPrefixReplacements([
                ...rmsWellboreNamesMissingSmda,
                ...smdaWellboreNames,
              ])
            : [],
        },
      },
      {
        onSuccess: (results) => {
          const proposals = createAutomaticMatchProposals(
            results,
            wellHeaders.smdaHeaders,
          );
          setAutomaticMatchingSetupOpen(false);
          setAutomaticMatchProposals(proposals);
        },
      },
    );
  };

  const toggleProposal = useCallback((rmsWellboreName: string) => {
    setAutomaticMatchProposals((proposals) =>
      proposals === null
        ? null
        : toggleMatchProposal(proposals, rmsWellboreName),
    );
  }, []);

  const applyAutomaticMatches = () => {
    if (automaticMatchProposals === null) {
      return;
    }

    saveMappings(
      applyAutomaticMatchProposals(elementMappings, automaticMatchProposals),
      {
        successMessage: "Selected SMDA names saved",
        onSuccess: () => {
          setAutomaticMatchProposals(null);
        },
      },
    );
  };

  return (
    <>
      {automaticMatchingSetupOpen && (
        <AutomaticMatchingSetupDialog
          disabled={projectReadOnly || matchMutation.isPending}
          isPending={matchMutation.isPending}
          closeDialog={() => {
            setAutomaticMatchingSetupOpen(false);
          }}
          runMatching={startAutomaticMatching}
        />
      )}

      {automaticMatchProposals !== null && (
        <AutomaticMatchingDialog
          proposals={automaticMatchProposals}
          unmappedRmsWellboreCount={rmsWellboreNamesMissingSmda.length}
          disabled={projectReadOnly || isSaving}
          isPending={isSaving}
          closeDialog={() => {
            setAutomaticMatchProposals(null);
          }}
          applyProposals={applyAutomaticMatches}
          toggleProposal={toggleProposal}
        />
      )}

      <MappingAction
        title="SMDA names"
        description={
          "Get suggested SMDA names for non-planned RMS wellbores that " +
          "are not yet mapped."
        }
      >
        <GeneralButton
          label="Suggest SMDA names"
          disabled={Boolean(suggestionsBlocked) || matchMutation.isPending}
          isPending={matchMutation.isPending}
          tooltipText={suggestionsBlocked}
          onClick={() => {
            setAutomaticMatchingSetupOpen(true);
          }}
        />
        {hasSmdaMappings && (
          <RemoveMappingsAction
            targetSystem="smda"
            mappingsAfterRemoval={() => removeSmdaMappings(elementMappings)}
            projectReadOnly={projectReadOnly}
            isSaving={isSaving}
            saveMappings={saveMappings}
          />
        )}
      </MappingAction>

      {suggestionsBlocked === smdaUnavailableReason && (
        <PageText>
          💡 To suggest SMDA names,{" "}
          <Link to="/project/mappings/wellbores" hash="smda-connection-details">
            review the SMDA connection requirements below.
          </Link>
        </PageText>
      )}
    </>
  );
}
