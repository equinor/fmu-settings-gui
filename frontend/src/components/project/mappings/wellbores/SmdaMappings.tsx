import { Autocomplete, Checkbox, Dialog } from "@equinor/eds-core-react";
import { type ColumnDef, EdsDataGrid } from "@equinor/eds-data-grid-react";
import { useMutation } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useCallback, useMemo, useRef, useState } from "react";

import { matchPostMatchMutation } from "#client/@tanstack/react-query.gen";
import { ConfirmCloseDialog } from "#components/common";
import { CancelButton, GeneralButton } from "#components/form/button";
import type { ElementMappings } from "#components/project/common/mapping/types";
import { emptyName } from "#components/project/common/mapping/utils";
import { applicationLocale } from "#config";
import type { SaveWellboreMappings } from "#services/mappings";
import type { SmdaWellHeaders } from "#services/smda";
import { PageText, ParametersBox, WarningBox } from "#styles/common";
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
  MappingDialog,
  MappingHelp,
  MappingParametersRow,
  MappingSummary,
  MatchingResultsContainer,
  PrefixSelector,
} from "./SmdaMappings.style";
import type { AutomaticMatchProposal, DisplayedMatchQuality } from "./types";

type ColumnFilters = Array<{ id: string; value: unknown }>;

const MATCH_QUALITY_ORDER: Record<DisplayedMatchQuality, number> = {
  Low: -1,
  Medium: 0,
  High: 1,
  Exact: 2,
};
const AUTOMATIC_MAPPING_GRID_MAX_HEIGHT = 391;
const coverageFormatter = new Intl.NumberFormat(applicationLocale, {
  style: "percent",
  maximumFractionDigits: 1,
});

const COUNTRY_PREFIX_OPTION = "Country prefixes";
const COUNTRY_PREFIXES = ["NO", "BR", "CA", "US", "GB"];
const KNOWN_PREFIX_OPTIONS = [COUNTRY_PREFIX_OPTION, "RFT", "MLW"];

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

function AutomaticMappingParameters({
  projectReadOnly,
  isSaving,
  isGenerating,
  runMapping,
  prefixOptions,
  selectedPrefixes,
  setSelectedPrefixes,
  addPrefix,
  hasSuggestions,
}: {
  projectReadOnly: boolean;
  isSaving: boolean;
  isGenerating: boolean;
  runMapping: () => void;
  prefixOptions: string[];
  selectedPrefixes: string[];
  setSelectedPrefixes: (value: string[]) => void;
  addPrefix: (value: string) => void;
  hasSuggestions: boolean;
}) {
  const disabled = projectReadOnly || isSaving || isGenerating;

  return (
    <ParametersBox>
      <MappingParametersRow>
        <PrefixSelector>
          <Autocomplete
            multiple
            autoWidth
            label="Prefixes to ignore"
            placeholder="Select or enter a prefix"
            options={prefixOptions}
            selectedOptions={selectedPrefixes}
            disabled={disabled}
            onOptionsChange={({ selectedItems }) => {
              setSelectedPrefixes(selectedItems);
            }}
            onAddNewOption={addPrefix}
            optionComponent={(option) =>
              option === COUNTRY_PREFIX_OPTION
                ? `${option} (${COUNTRY_PREFIXES.join(", ")})`
                : option
            }
            helperText="Country prefixes are selected by default"
          />
        </PrefixSelector>
        <GeneralButton
          label={hasSuggestions ? "Update suggestions" : "Generate suggestions"}
          disabled={disabled}
          isPending={isGenerating}
          variant={hasSuggestions ? "outlined" : "contained"}
          tooltipText={
            isGenerating
              ? "SMDA name suggestions are being generated"
              : isSaving
                ? "Wellbore mappings are being saved"
                : projectReadOnly
                  ? "Project is read-only"
                  : undefined
          }
          onClick={runMapping}
        />
      </MappingParametersRow>

      <MappingHelp>
        <summary>About prefix rules</summary>

        <PageText>
          RMS and SMDA can use different prefixes for the same wellbore, so
          ignoring them can help find similar names. Select known prefixes or
          add your own.
        </PageText>

        <PageText>
          For example, ignoring RFT and NO lets{" "}
          <span className="emphasis">RFT_55_33-A-2</span> match{" "}
          <span className="emphasis">NO 55/33-A-2</span>. Only the comparison is
          affected. The complete SMDA name is still saved.
        </PageText>

        <PageText>
          Your selections and deselections are kept when the same SMDA wellbore
          is suggested again.
        </PageText>
      </MappingHelp>
    </ParametersBox>
  );
}

function AutomaticMappingDialog({
  mappingProposals,
  unmappedRmsWellboreCount,
  projectReadOnly,
  isSaving,
  isGenerating,
  hasGenerationError,
  closeDialog,
  applyProposals,
  toggleProposal,
  runMapping,
  prefixOptions,
  selectedPrefixes,
  setSelectedPrefixes,
  addPrefix,
  ignoredPrefixes,
}: {
  mappingProposals: AutomaticMatchProposal[] | null;
  unmappedRmsWellboreCount: number;
  projectReadOnly: boolean;
  isSaving: boolean;
  isGenerating: boolean;
  hasGenerationError: boolean;
  closeDialog: () => void;
  applyProposals: () => void;
  toggleProposal: (rmsWellboreName: string) => void;
  runMapping: () => void;
  prefixOptions: string[];
  selectedPrefixes: string[];
  setSelectedPrefixes: (value: string[]) => void;
  addPrefix: (value: string) => void;
  ignoredPrefixes: string[];
}) {
  const proposals = useMemo(() => mappingProposals ?? [], [mappingProposals]);
  const hasSuggestions = mappingProposals !== null;
  const isBusy = isSaving || isGenerating;
  const prefixesChanged =
    hasSuggestions &&
    (selectedPrefixes.length !== ignoredPrefixes.length ||
      selectedPrefixes.some((prefix) => !ignoredPrefixes.includes(prefix)));
  const formatCoverage = (count: number) =>
    coverageFormatter.format(
      unmappedRmsWellboreCount === 0 ? 0 : count / unmappedRmsWellboreCount,
    );
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
    determineRequiresConfirmation: () => proposals.length > 0,
    onCloseConfirmed: closeDialog,
  });
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
              disabled={projectReadOnly || isBusy}
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
      },
      {
        accessorKey: "smdaName",
        header: "Suggested SMDA",
        enableColumnFilter: false,
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
    [toggleProposal, projectReadOnly, isBusy],
  );
  const emptyMessage = !hasSuggestions
    ? isGenerating
      ? "Generating suggestions..."
      : "No suggestions generated yet."
    : proposals.length === 0
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
          "Closing this review will discard its suggestions and your " +
          "selections and deselections."
        }
        question="Do you want to discard the suggestions?"
        confirmLabel="Keep reviewing"
        cancelLabel="Discard suggestions"
      />

      <MappingDialog
        open={true}
        isDismissable={!confirmClose.confirmCloseDialogOpen && !isBusy}
        onClose={confirmClose.handleCloseRequest}
        $width="54em"
        $maxWidth="calc(100vw - 2.5rem)"
      >
        <Dialog.Header>Suggest SMDA names</Dialog.Header>

        <Dialog.CustomContent>
          <PageText>
            Find suggested SMDA names for unmapped non-planned RMS wellbores.
          </PageText>

          <AutomaticMappingParameters
            projectReadOnly={projectReadOnly}
            isSaving={isSaving}
            isGenerating={isGenerating}
            runMapping={runMapping}
            prefixOptions={prefixOptions}
            selectedPrefixes={selectedPrefixes}
            setSelectedPrefixes={setSelectedPrefixes}
            addPrefix={addPrefix}
            hasSuggestions={hasSuggestions}
          />

          <PageText>
            Review each suggestion before saving. Name similarity does not
            verify that the RMS and SMDA names refer to the same wellbore.
          </PageText>

          <MappingHelp>
            <summary>About name similarity</summary>

            <PageText>
              <span className="emphasis">Exact</span> means a 100&nbsp;% name
              match after normalization and any selected prefix removal. Exact
              matches are selected automatically unless you previously
              deselected that match. The same SMDA name can be selected for more
              than one RMS wellbore.
            </PageText>
          </MappingHelp>

          {prefixesChanged && !isGenerating && (
            <WarningBox>
              <PageText $marginBottom="0">
                Prefix rules changed. Click <i>Update suggestions</i> to apply
                them.
              </PageText>
            </WarningBox>
          )}

          <MappingSummary>
            {isGenerating ? (
              <PageText>
                {hasSuggestions
                  ? "Updating suggestions. Previous results are shown below."
                  : "Generating suggestions..."}
              </PageText>
            ) : hasGenerationError ? (
              <PageText>
                {hasSuggestions
                  ? "Could not update suggestions. Previous results and choices are unchanged."
                  : "Could not generate suggestions. Try again."}
              </PageText>
            ) : null}

            <table>
              <tbody>
                {hasSuggestions && (
                  <tr>
                    <th scope="row">Ignored prefixes</th>
                    <td>{ignoredPrefixes.join(", ") || "None"}</td>
                  </tr>
                )}
                <tr>
                  <th scope="row">Suggestions found</th>
                  <td>
                    {hasSuggestions ? proposals.length : "-"} of{" "}
                    {unmappedRmsWellboreCount}
                    {hasSuggestions && ` (${formatCoverage(proposals.length)})`}
                  </td>
                </tr>
                <tr>
                  <th scope="row">Selected suggestions</th>
                  <td>
                    {selectedCount} ({formatCoverage(selectedCount)})
                  </td>
                </tr>
              </tbody>
            </table>
          </MappingSummary>

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
              width="100%"
              height={dataGridHeight(
                filteredProposalCount,
                AUTOMATIC_MAPPING_GRID_MAX_HEIGHT,
              )}
              rows={visibleProposals}
              columns={columns}
              getRowId={(row) => row.rmsWellboreName}
              headerClass={(column) =>
                column.id === "useSuggestion"
                  ? "centered-column-header"
                  : column.id === "rmsWellboreName" || column.id === "smdaName"
                    ? "name-column"
                    : ""
              }
              cellClass={(_row, columnId) =>
                columnId === "rmsWellboreName" || columnId === "smdaName"
                  ? "name-column"
                  : ""
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
            disabled={projectReadOnly || isBusy || selectedCount === 0}
            isPending={isSaving}
            tooltipText={
              isSaving
                ? "Wellbore mappings are being saved"
                : isGenerating
                  ? "SMDA name suggestions are being generated"
                  : projectReadOnly
                    ? "Project is read-only"
                    : selectedCount === 0
                      ? "Select at least one suggestion to save"
                      : undefined
            }
            onClick={applyProposals}
          />
          <CancelButton
            disabled={isBusy}
            onClick={confirmClose.handleCloseRequest}
          />
        </Dialog.Actions>
      </MappingDialog>
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
  const [automaticMappingProposals, setAutomaticMappingProposals] = useState<
    AutomaticMatchProposal[] | null
  >(null);
  const [automaticMappingOpen, setAutomaticMappingOpen] = useState(false);
  const [selectedPrefixes, setSelectedPrefixes] = useState<string[]>([
    COUNTRY_PREFIX_OPTION,
  ]);
  const [prefixOptions, setPrefixOptions] = useState(KNOWN_PREFIX_OPTIONS);
  const [reviewPrefixes, setReviewPrefixes] = useState<string[]>([]);
  const reviewChoices = useRef(new Map<string, boolean>());
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

  const closeAutomaticMapping = () => {
    matchMutation.reset();
    reviewChoices.current.clear();
    setAutomaticMappingOpen(false);
    setAutomaticMappingProposals(null);
    setReviewPrefixes([]);
  };

  const addPrefix = (value: string) => {
    const prefix = value
      .replace(/[_.\-/]/g, " ")
      .trim()
      .replace(/\s+/g, " ")
      .toUpperCase();
    if (!prefix) {
      return;
    }

    const option =
      prefixOptions.find((item) => item.toUpperCase() === prefix) ?? prefix;
    setPrefixOptions((options) =>
      options.includes(option) ? options : [...options, option],
    );
    setSelectedPrefixes((options) =>
      options.includes(option) ? options : [...options, option],
    );
  };

  const startAutomaticMapping = () => {
    if (suggestionsBlocked || matchMutation.isPending || isSaving) {
      return;
    }

    const prefixes = prefixOptions.filter((prefix) =>
      selectedPrefixes.includes(prefix),
    );
    const smdaWellboreNames = wellHeaders.smdaHeaders.map(
      (header) => header.unique_wellbore_identifier,
    );

    matchMutation.mutate(
      {
        body: {
          sources: rmsWellboreNamesMissingSmda,
          targets: smdaWellboreNames,
          prefixes_to_remove: [
            ...new Set(
              prefixes.flatMap((prefix) =>
                prefix === COUNTRY_PREFIX_OPTION ? COUNTRY_PREFIXES : [prefix],
              ),
            ),
          ],
        },
      },
      {
        onSuccess: (results) => {
          const proposals = createAutomaticMatchProposals(
            results,
            wellHeaders.smdaHeaders,
          );
          setReviewPrefixes(prefixes);
          setAutomaticMappingProposals(
            proposals.map((proposal) => ({
              ...proposal,
              selected:
                reviewChoices.current.get(
                  JSON.stringify([proposal.rmsWellboreName, proposal.smdaUuid]),
                ) ?? proposal.selected,
            })),
          );
        },
      },
    );
  };

  const toggleProposal = useCallback(
    (rmsWellboreName: string) => {
      const proposal = automaticMappingProposals?.find(
        (item) => item.rmsWellboreName === rmsWellboreName,
      );
      if (!proposal) {
        return;
      }

      reviewChoices.current.set(
        JSON.stringify([proposal.rmsWellboreName, proposal.smdaUuid]),
        !proposal.selected,
      );
      setAutomaticMappingProposals((proposals) =>
        proposals === null
          ? null
          : toggleMatchProposal(proposals, rmsWellboreName),
      );
    },
    [automaticMappingProposals],
  );

  const saveAutomaticMappings = () => {
    if (
      projectReadOnly ||
      isSaving ||
      matchMutation.isPending ||
      !automaticMappingProposals?.some((proposal) => proposal.selected)
    ) {
      return;
    }

    saveMappings(
      applyAutomaticMatchProposals(elementMappings, automaticMappingProposals),
      {
        successMessage: "Selected SMDA names saved",
        onSuccess: closeAutomaticMapping,
      },
    );
  };

  return (
    <>
      {automaticMappingOpen && (
        <AutomaticMappingDialog
          mappingProposals={automaticMappingProposals}
          unmappedRmsWellboreCount={rmsWellboreNamesMissingSmda.length}
          projectReadOnly={projectReadOnly}
          isSaving={isSaving}
          isGenerating={matchMutation.isPending}
          hasGenerationError={matchMutation.isError}
          closeDialog={closeAutomaticMapping}
          runMapping={startAutomaticMapping}
          prefixOptions={prefixOptions}
          selectedPrefixes={selectedPrefixes}
          setSelectedPrefixes={setSelectedPrefixes}
          addPrefix={addPrefix}
          ignoredPrefixes={reviewPrefixes}
          applyProposals={saveAutomaticMappings}
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
          disabled={
            Boolean(suggestionsBlocked) || matchMutation.isPending || isSaving
          }
          isPending={matchMutation.isPending}
          tooltipText={
            isSaving ? "Wellbore mappings are being saved" : suggestionsBlocked
          }
          onClick={() => {
            setAutomaticMappingOpen(true);
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
