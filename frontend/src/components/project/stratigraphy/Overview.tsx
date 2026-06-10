import { Dialog, Icon, Typography } from "@equinor/eds-core-react";
import { edit, link } from "@equinor/eds-icons";
import { createFormHook } from "@tanstack/react-form";
import {
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

import type {
  InternalStratigraphyMappingsOutput,
  RmsProject,
  StratigraphicColumn,
} from "#client";
import {
  projectGetChangelogQueryKey,
  projectGetMappingsOptions,
  projectGetMappingsQueryKey,
  projectPutMappingsMutation,
  smdaPostStratUnitsOptions,
} from "#client/@tanstack/react-query.gen";
import { ConfirmCloseDialog } from "#components/common";
import { CancelButton, SubmitButton } from "#components/form/button";
import {
  ArrayTextAddItem,
  ArrayTextField,
  type OptionProps,
  Select,
} from "#components/form/field";
import {
  ArrayTextFieldContainer,
  CommonInputWrapper,
} from "#components/form/field.style";
import type {
  FormSubmitCallbackProps,
  MutationCallbackProps,
} from "#components/form/form";
import { mappingsPaths } from "#services/project";
import {
  EditDialog,
  PageSectionSpacer,
  PageSectionWidthConstrained,
  PageText,
  WarningBox,
} from "#styles/common";
import {
  HTTP_STATUS_422_UNPROCESSABLE_CONTENT,
  httpValidationErrorToString,
} from "#utils/api";
import { fieldContext, formContext } from "#utils/form";
import { useConfirmClose } from "#utils/ui";
import {
  getHorizonLineStyle,
  useFrameworkData,
} from "../stratigraphicFramework/functions";
import { StratigraphicFramework } from "../stratigraphicFramework/StratigraphicFramework";
import {
  createHorizonOptions,
  createMutationValue,
  createStratigraphyMappingsLookup,
  createStratUnitOptions,
  handleErrorUnknownInitialValue,
  updatedElementMappings,
} from "./functions";
import {
  ElementActions,
  ElementInfo,
  ElementName,
  ElementSystem,
  ElementSystemName,
  ElementSystems,
  HorizonItem,
  ZoneItem,
} from "./Overview.style";
import type { ElementMapping, ElementMappings, ElementType } from "./types";
import {
  createSpecialOptions,
  emptyElementMapping,
  emptyName,
  noHorizonName,
  noZoneName,
  specialOptions,
  validateSelectValue,
} from "./utils";

const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    ArrayTextAddItem,
    ArrayTextField,
    Select,
  },
  formComponents: { CancelButton, SubmitButton },
});

function Edit({
  elementMapping,
  smdaNameOptions,
  projectReadOnly,
  mutationCallback,
  optionsIsPending,
  mutationIsPending,
  isOpen,
  closeDialog,
}: {
  elementMapping: ElementMapping | undefined;
  smdaNameOptions: Record<ElementType, OptionProps[]>;
  projectReadOnly: boolean;
  mutationCallback: (props: MutationCallbackProps<ElementMapping>) => void;
  optionsIsPending: boolean;
  mutationIsPending: boolean;
  isOpen: boolean;
  closeDialog: () => void;
}) {
  const form = useAppForm({
    defaultValues: {
      ...elementMapping,
      ...(elementMapping?.unmappable && {
        smdaUuid:
          elementMapping.elementType === "horizon"
            ? specialOptions.unmappableHorizon.value
            : specialOptions.unmappableZone.value,
      }),
    } as ElementMapping,
    onSubmit: ({ formApi, value }) => {
      if (!projectReadOnly) {
        mutationCallback({
          formValue: value,
          formSubmitCallback,
          formReset: formApi.reset,
        });
      }
    },
  });

  useEffect(() => {
    handleErrorUnknownInitialValue(
      form.setFieldMeta,
      "smdaUuid",
      elementMapping?.elementType
        ? smdaNameOptions[elementMapping.elementType]
        : [],
      {
        value: elementMapping?.unmappable
          ? elementMapping.elementType === "horizon"
            ? specialOptions.unmappableHorizon.value
            : specialOptions.unmappableZone.value
          : (elementMapping?.smdaUuid ?? "") === ""
            ? specialOptions.empty.value
            : (elementMapping?.smdaUuid ?? ""),
        label: elementMapping?.smdaName ?? "",
      },
    );
  }, [
    form.setFieldMeta,
    elementMapping?.elementType,
    elementMapping?.unmappable,
    elementMapping?.smdaUuid,
    elementMapping?.smdaName,
    smdaNameOptions,
  ]);

  const formSubmitCallback = ({
    message,
    formReset,
  }: FormSubmitCallbackProps) => {
    toast.info(message);
    formReset();
  };

  const confirmClose = useConfirmClose({
    enable: isOpen && !projectReadOnly,
    determineRequiresConfirmation: () =>
      !projectReadOnly && !form.state.isDefaultValue,
    onCloseConfirmed: () => {
      form.reset();
      closeDialog();
    },
  });

  if (elementMapping === undefined) {
    return null;
  }

  return (
    <>
      <ConfirmCloseDialog
        isOpen={confirmClose.confirmCloseDialogOpen}
        handleConfirmCloseDecision={confirmClose.handleDecision}
      />

      <EditDialog
        open={isOpen}
        isDismissable={true}
        onClose={confirmClose.handleCloseRequest}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            void form.handleSubmit();
          }}
        >
          <Dialog.Header>
            Edit {elementMapping.elementType}: {elementMapping.rmsName}
          </Dialog.Header>

          <Dialog.CustomContent>
            <form.AppField
              name="smdaUuid"
              validators={{
                onChange: ({ value }) => validateSelectValue(value),
              }}
            >
              {(field) => (
                <field.Select
                  label="SMDA name"
                  value={field.state.value}
                  options={
                    elementMapping.elementType
                      ? smdaNameOptions[elementMapping.elementType]
                      : []
                  }
                  loadingOptions={optionsIsPending}
                  onChange={(value) => {
                    field.handleChange(value);
                  }}
                />
              )}
            </form.AppField>

            <PageSectionSpacer />

            <form.AppField name="aliases" mode="array">
              {(field) => (
                <CommonInputWrapper label="Aliases for RMS name">
                  <ArrayTextFieldContainer>
                    {field.state.value.map((val, idx) => (
                      <form.AppField
                        // eslint-disable-next-line react-x/no-array-index-key
                        key={`${idx}-${val}`}
                        name={`aliases[${idx}]`}
                      >
                        {() => (
                          <field.ArrayTextField
                            removeValue={() => {
                              field.removeValue(idx);
                            }}
                          />
                        )}
                      </form.AppField>
                    ))}
                    <field.ArrayTextAddItem
                      emptyText="No aliases defined"
                      pushEmpty={() => {
                        field.pushValue("");
                      }}
                    />
                  </ArrayTextFieldContainer>
                </CommonInputWrapper>
              )}
            </form.AppField>
          </Dialog.CustomContent>

          <Dialog.Actions>
            <form.AppForm>
              <form.Subscribe
                selector={(state) => [state.isDefaultValue, state.canSubmit]}
              >
                {([isDefaultValue, canSubmit]) => (
                  <>
                    <form.SubmitButton
                      label="Save"
                      disabled={isDefaultValue || !canSubmit || projectReadOnly}
                      isPending={mutationIsPending}
                      helperTextDisabled={
                        projectReadOnly
                          ? "Project is read-only"
                          : "Form can be saved when the values have changed"
                      }
                    />

                    <form.CancelButton
                      onClick={(e) => {
                        e.preventDefault();
                        confirmClose.handleCloseRequest();
                      }}
                    />
                  </>
                )}
              </form.Subscribe>
            </form.AppForm>
          </Dialog.Actions>
        </form>
      </EditDialog>
    </>
  );
}

function Element({
  elementMapping,
  unmappableName,
  canEdit,
  editClick,
}: {
  elementMapping: ElementMapping;
  unmappableName: string;
  canEdit: boolean;
  editClick: (elementMapping: ElementMapping) => void;
}) {
  const isMissingValue =
    elementMapping.smdaName === "" && !elementMapping.unmappable;
  const aliasCount = elementMapping.aliases.length;

  return (
    <>
      <ElementSystems>
        <ElementSystem>
          <ElementInfo>
            <ElementSystemName $elementType={elementMapping.elementType}>
              RMS
            </ElementSystemName>
            <ElementName>
              {elementMapping.rmsName}
              {aliasCount > 0 && (
                <Icon
                  className="aliases"
                  data={link}
                  title={`${aliasCount === 1 ? "Alias" : "Aliases"}: ${elementMapping.aliases.join(", ")}`}
                  size={16}
                />
              )}
            </ElementName>
          </ElementInfo>
        </ElementSystem>

        <ElementSystem>
          <ElementInfo $isTargetSystem={true}>
            <ElementSystemName
              $elementType={elementMapping.elementType}
              $isMissingvalue={isMissingValue}
            >
              SMDA
            </ElementSystemName>
            <ElementName
              $isTargetSystem={true}
              $isUnmappable={elementMapping.unmappable}
              $isMissingvalue={isMissingValue}
            >
              {elementMapping.smdaName !== ""
                ? elementMapping.smdaName
                : elementMapping.unmappable
                  ? unmappableName
                  : emptyName}
            </ElementName>
          </ElementInfo>
        </ElementSystem>
      </ElementSystems>

      {canEdit && (
        <ElementActions>
          <Icon
            data={edit}
            title="Edit"
            size={16}
            onClick={() => {
              editClick(elementMapping);
            }}
          />
        </ElementActions>
      )}
    </>
  );
}

function Elements({
  elementType,
  stratigraphyMappings,
  stratigraphicColumn,
  smdaHealthStatus,
  projectReadOnly,
  editMode,
}: {
  elementType: ElementType;
  stratigraphyMappings: InternalStratigraphyMappingsOutput;
  stratigraphicColumn?: StratigraphicColumn;
  smdaHealthStatus: boolean;
  projectReadOnly: boolean;
  editMode: boolean;
}) {
  const [elementMappings, setElementMappings] = useState<ElementMappings>({});
  const [activeElementMapping, setActiveElementMapping] = useState<
    ElementMapping | undefined
  >();
  const [smdaNameOptions, setSmdaNameOptions] = useState<
    Record<ElementType, OptionProps[]>
  >({
    horizon: [...createSpecialOptions("horizon", false)],
    zone: [...createSpecialOptions("zone", false)],
  } as Record<ElementType, OptionProps[]>);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const frameworkData = useFrameworkData();

  const canEdit = useMemo(
    () =>
      editMode &&
      !projectReadOnly &&
      smdaHealthStatus &&
      stratigraphicColumn !== undefined,
    [editMode, projectReadOnly, smdaHealthStatus, stratigraphicColumn],
  );

  const { data: stratigraphicUnits, isPending: stratigraphicUnitsPending } =
    useQuery({
      ...smdaPostStratUnitsOptions({
        body: {
          strat_column_identifier: stratigraphicColumn?.identifier ?? "",
        },
      }),
      enabled: canEdit,
    });

  const mappingsMutation = useMutation({
    ...projectPutMappingsMutation(),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: projectGetMappingsQueryKey({
          path: mappingsPaths.stratigraphyRms,
        }),
      });
      void queryClient.invalidateQueries({
        queryKey: projectGetChangelogQueryKey(),
      });
    },
    onError: (error) => {
      if (error.response?.status === HTTP_STATUS_422_UNPROCESSABLE_CONTENT) {
        const message = httpValidationErrorToString(error);
        console.error(message);
        toast.error(message, { autoClose: false });
      }
    },
    meta: {
      errorPrefix: "Error saving stratigraphy mapping",
      preventDefaultErrorHandling: [HTTP_STATUS_422_UNPROCESSABLE_CONTENT],
    },
  });

  useEffect(() => {
    const lookup = createStratigraphyMappingsLookup(stratigraphyMappings);
    const elementMappings: ElementMappings = {};

    frameworkData.horizons.forEach((rmsHorizon) => {
      elementMappings[rmsHorizon.name] = {
        ...(lookup[rmsHorizon.name] ?? {
          ...emptyElementMapping(),
          rmsName: rmsHorizon.name,
        }),
        elementType: "horizon",
      };
    });

    frameworkData.zones.forEach((rmsZone) => {
      elementMappings[rmsZone.name] = {
        ...(lookup[rmsZone.name] ?? {
          ...emptyElementMapping(),
          rmsName: rmsZone.name,
        }),
        elementType: "zone",
      };
    });

    setElementMappings(elementMappings);
  }, [frameworkData.horizons, frameworkData.zones, stratigraphyMappings]);

  useEffect(() => {
    if (stratigraphicUnits !== undefined) {
      setSmdaNameOptions((options) => ({
        ...options,
        zone: [
          ...createSpecialOptions(
            "zone",
            stratigraphicUnits.stratigraphic_units.length > 0,
          ),
          ...createStratUnitOptions(stratigraphicUnits.stratigraphic_units),
        ],
      }));
    }
  }, [stratigraphicUnits]);

  const editSmdaNameOptions = useMemo(() => {
    if (
      activeElementMapping?.elementType !== "horizon" ||
      stratigraphicUnits === undefined
    ) {
      return smdaNameOptions;
    }

    const horizon = createHorizonOptions(
      activeElementMapping.rmsName,
      frameworkData.zones,
      elementMappings,
      stratigraphicUnits.stratigraphic_units,
    );

    return {
      ...smdaNameOptions,
      horizon: [
        ...createSpecialOptions("horizon", horizon.length > 0),
        ...horizon,
      ],
    };
  }, [
    activeElementMapping,
    elementMappings,
    frameworkData.zones,
    smdaNameOptions,
    stratigraphicUnits,
  ]);

  const editClick = (elementMapping: ElementMapping) => {
    setActiveElementMapping(elementMapping);
    setEditDialogOpen(true);
  };

  function closeEditDialog() {
    setEditDialogOpen(false);
    setActiveElementMapping(undefined);
  }

  const mutationCallback = ({
    formValue,
    formSubmitCallback,
    formReset,
  }: MutationCallbackProps<ElementMapping>) => {
    const stratUnit = stratigraphicUnits?.stratigraphic_units.find(
      (unit) => unit.uuid === formValue.smdaUuid,
    );

    const mutationValue = createMutationValue(
      updatedElementMappings(
        elementMappings,
        formValue,
        editSmdaNameOptions,
        stratUnit,
      ),
    );

    mappingsMutation.mutate(
      {
        path: mappingsPaths.stratigraphyRms,
        body: mutationValue,
      },
      {
        onSuccess: (data) => {
          setElementMappings((elementMappings) =>
            updatedElementMappings(
              elementMappings,
              formValue,
              editSmdaNameOptions,
              stratUnit,
            ),
          );
          formSubmitCallback({ message: data.message, formReset });
          closeEditDialog();
        },
      },
    );
  };

  return (
    <>
      {editDialogOpen && (
        <Edit
          elementMapping={activeElementMapping}
          smdaNameOptions={editSmdaNameOptions}
          projectReadOnly={projectReadOnly}
          mutationCallback={mutationCallback}
          optionsIsPending={stratigraphicUnitsPending}
          mutationIsPending={mappingsMutation.isPending}
          isOpen={editDialogOpen}
          closeDialog={closeEditDialog}
        />
      )}

      {elementType === "horizon"
        ? frameworkData.horizons.map((horizon, idx) => {
            if (!(horizon.name in elementMappings)) {
              return null;
            }

            return (
              <HorizonItem
                key={horizon.name}
                $rowStart={(idx + 1) * 3 - 2}
                $lineStyle={getHorizonLineStyle(horizon)}
              >
                <Element
                  elementMapping={elementMappings[horizon.name]}
                  unmappableName={noHorizonName}
                  canEdit={canEdit}
                  editClick={editClick}
                />
              </HorizonItem>
            );
          })
        : frameworkData.zones.map((zone) => {
            const grid = frameworkData.zoneGridPlacement.get(zone.name);

            if (!(grid && zone.name in elementMappings)) {
              return null;
            }

            return (
              <ZoneItem key={zone.name} $zoneGrid={grid}>
                <Element
                  elementMapping={elementMappings[zone.name]}
                  unmappableName={noZoneName}
                  canEdit={canEdit}
                  editClick={editClick}
                />
              </ZoneItem>
            );
          })}
    </>
  );
}

export function Overview({
  rmsProject,
  smdaHealthStatus,
  stratigraphicColumn,
  projectReadOnly,
  editMode,
}: {
  rmsProject: RmsProject;
  stratigraphicColumn?: StratigraphicColumn;
  smdaHealthStatus: boolean;
  projectReadOnly: boolean;
  editMode: boolean;
}) {
  const { data: mappings } = useSuspenseQuery(
    projectGetMappingsOptions({
      path: mappingsPaths.stratigraphyRms,
    }),
  );

  return (
    <>
      <PageSectionWidthConstrained>
        <PageText>
          The following are the mappings for horizons and zones, showing the
          names in RMS and SMDA.
        </PageText>

        <PageText>
          SMDA (Subsurface Master Data) is the storage system for masterdata in
          Equinor. In FMU Settings, SMDA is used as the reference for mapping
          RMS horizons and zones. Learn more at{" "}
          <Typography
            link
            target="_blank"
            rel="noopener noreferrer"
            href="https://smda.equinor.com/"
          >
            smda.equinor.com
          </Typography>
          .
        </PageText>
      </PageSectionWidthConstrained>

      {rmsProject.horizons !== undefined &&
      rmsProject.horizons !== null &&
      rmsProject.zones !== undefined &&
      rmsProject.zones !== null ? (
        <>
          <StratigraphicFramework
            horizons={rmsProject.horizons}
            zones={rmsProject.zones}
            enableWidthExpansion={true}
          >
            <Elements
              elementType="horizon"
              stratigraphyMappings={mappings.stratigraphy ?? []}
              stratigraphicColumn={stratigraphicColumn}
              smdaHealthStatus={smdaHealthStatus}
              projectReadOnly={projectReadOnly}
              editMode={editMode}
            />
            <Elements
              elementType="zone"
              stratigraphyMappings={mappings.stratigraphy ?? []}
              stratigraphicColumn={stratigraphicColumn}
              smdaHealthStatus={smdaHealthStatus}
              projectReadOnly={projectReadOnly}
              editMode={editMode}
            />
          </StratigraphicFramework>

          {editMode && !projectReadOnly && smdaHealthStatus && (
            <PageSectionWidthConstrained>
              {stratigraphicColumn ? (
                <PageText>
                  💡 Set SMDA names for zones first. When a zone directly above
                  or below a horizon is mapped, its horizons are listed at the
                  top of that horizon's options for easier selection.
                </PageText>
              ) : (
                <WarningBox>
                  <PageText $marginBottom="0">
                    No stratigraphic column is set in the masterdata.{" "}
                    <Link to="/project/masterdata">Set this value</Link> to
                    enable editing of stratigraphy mappings.
                  </PageText>
                </WarningBox>
              )}
            </PageSectionWidthConstrained>
          )}
        </>
      ) : (
        <PageSectionWidthConstrained>
          <PageText>No horizons exist.</PageText>
        </PageSectionWidthConstrained>
      )}
    </>
  );
}
