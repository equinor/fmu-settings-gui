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
import {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { toast } from "react-toastify";

import type { RmsProject, StratigraphicColumn } from "#client";
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
  createElementMappings,
  createMutationValue,
  createProjectMappingsLookup,
  handleErrorUnknownInitialValue,
  updatedElementMapping,
  useMappingData,
} from "../mapping/functions";
import { MappingDataContext } from "../mapping/MappingData";
import {
  createSpecialOptions,
  getElementMappingSmdaName,
  getElementMappingSmdaNameOptionsInitialValue,
  specialOptions,
} from "../mapping/utils";
import {
  getHorizonLineStyle,
  useFrameworkData,
} from "../stratigraphicFramework/functions";
import { StratigraphicFramework } from "../stratigraphicFramework/StratigraphicFramework";
import { createHorizonOptions, createStratUnitOptions } from "./functions";
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
import { validateSelectValue } from "./utils";

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
  mutationCallback,
  optionsIsPending,
  mutationIsPending,
  isOpen,
  closeDialog,
}: {
  elementMapping: ElementMapping | undefined;
  smdaNameOptions: OptionProps[];
  mutationCallback: (props: MutationCallbackProps<ElementMapping>) => void;
  optionsIsPending: boolean;
  mutationIsPending: boolean;
  isOpen: boolean;
  closeDialog: () => void;
}) {
  const mappingData = useMappingData();

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
      if (!mappingData.projectReadOnly) {
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
      smdaNameOptions,
      getElementMappingSmdaNameOptionsInitialValue(elementMapping),
    );
  }, [form.setFieldMeta, smdaNameOptions, elementMapping]);

  const formSubmitCallback = ({
    message,
    formReset,
  }: FormSubmitCallbackProps) => {
    toast.info(message);
    formReset();
  };

  const confirmClose = useConfirmClose({
    enable: isOpen && !mappingData.projectReadOnly,
    determineRequiresConfirmation: () =>
      !mappingData.projectReadOnly && !form.state.isDefaultValue,
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
                  options={smdaNameOptions}
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
                      disabled={
                        mappingData.projectReadOnly
                          ? true
                          : isDefaultValue
                            ? true
                            : !canSubmit
                      }
                      isPending={mutationIsPending}
                      helperTextDisabled={
                        mappingData.projectReadOnly
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
  editClick,
}: {
  elementMapping: ElementMapping;
  editClick: (elementMapping: ElementMapping) => void;
}) {
  const mappingData = useMappingData();

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
              {getElementMappingSmdaName(elementMapping)}
            </ElementName>
          </ElementInfo>
        </ElementSystem>
      </ElementSystems>

      {mappingData.canEdit && (
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

function Elements({ elementType }: { elementType: ElementType }) {
  const [activeElementMapping, setActiveElementMapping] = useState<
    ElementMapping | undefined
  >();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const frameworkData = useFrameworkData();
  const mappingData = useMappingData();

  const { data: stratigraphicUnits, isPending: stratigraphicUnitsPending } =
    useQuery({
      ...smdaPostStratUnitsOptions({
        body: {
          strat_column_identifier:
            mappingData.stratigraphicColumn?.identifier ?? "",
        },
      }),
      enabled: mappingData.canEdit,
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

  const horizonOptionsData = useMemo(() => {
    if (elementType !== "horizon" || stratigraphicUnits === undefined) {
      return { options: [], horizonNamesByUuid: {} };
    }

    return createHorizonOptions(
      activeElementMapping?.rmsName ?? "",
      frameworkData.zones,
      mappingData.elementMappings,
      stratigraphicUnits.stratigraphic_units,
    );
  }, [
    elementType,
    stratigraphicUnits,
    activeElementMapping?.rmsName,
    frameworkData.zones,
    mappingData.elementMappings,
  ]);

  const smdaNameOptions = useMemo(
    () =>
      elementType === "horizon"
        ? [
            ...createSpecialOptions(
              "horizon",
              horizonOptionsData.options.length > 0,
            ),
            ...horizonOptionsData.options,
          ]
        : [
            ...createSpecialOptions(
              "zone",
              (stratigraphicUnits?.stratigraphic_units.length ?? 0) > 0,
            ),
            ...createStratUnitOptions(
              stratigraphicUnits?.stratigraphic_units ?? [],
            ),
          ],
    [
      elementType,
      horizonOptionsData.options,
      stratigraphicUnits?.stratigraphic_units,
    ],
  );

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
    const smdaName =
      formValue.elementType === "horizon"
        ? (horizonOptionsData.horizonNamesByUuid[formValue.smdaUuid] ?? "")
        : (stratigraphicUnits?.stratigraphic_units.find(
            (unit) => unit.uuid === formValue.smdaUuid,
          )?.identifier ?? "");

    const updated = updatedElementMapping(formValue, smdaName);

    const mutationValue = createMutationValue({
      ...mappingData.elementMappings,
      ...(updated && { [formValue.rmsName]: updated }),
    });

    mappingsMutation.mutate(
      {
        path: mappingsPaths.stratigraphyRms,
        body: mutationValue,
      },
      {
        onSuccess: (data) => {
          mappingData.setElementMappings((elementMappings) => ({
            ...elementMappings,
            ...(updated && { [formValue.rmsName]: updated }),
          }));
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
          smdaNameOptions={smdaNameOptions}
          mutationCallback={mutationCallback}
          optionsIsPending={stratigraphicUnitsPending}
          mutationIsPending={mappingsMutation.isPending}
          isOpen={editDialogOpen}
          closeDialog={closeEditDialog}
        />
      )}

      {elementType === "horizon"
        ? frameworkData.horizons.map((horizon, idx) => {
            const elementMapping = mappingData.elementMappings[horizon.name];
            if (elementMapping === undefined) {
              return null;
            }

            return (
              <HorizonItem
                key={horizon.name}
                $rowStart={(idx + 1) * 3 - 2}
                $lineStyle={getHorizonLineStyle(horizon)}
              >
                <Element
                  elementMapping={elementMapping}
                  editClick={editClick}
                />
              </HorizonItem>
            );
          })
        : frameworkData.zones.map((zone) => {
            const grid = frameworkData.zoneGridPlacement.get(zone.name);
            const elementMapping = mappingData.elementMappings[zone.name];

            if (!grid || elementMapping === undefined) {
              return null;
            }

            return (
              <ZoneItem key={zone.name} $zoneGrid={grid}>
                <Element
                  elementMapping={elementMapping}
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
  stratigraphicColumn?: StratigraphicColumn | undefined;
  smdaHealthStatus: boolean;
  projectReadOnly: boolean;
  editMode: boolean;
}) {
  const { data: projectMappings } = useSuspenseQuery(
    projectGetMappingsOptions({
      path: mappingsPaths.stratigraphyRms,
    }),
  );

  const baseElementMappings = useMemo(() => {
    const lookup = createProjectMappingsLookup("stratigraphy", projectMappings);

    return {
      ...createElementMappings("horizon", rmsProject.horizons ?? [], lookup),
      ...createElementMappings("zone", rmsProject.zones ?? [], lookup),
    };
  }, [projectMappings, rmsProject.horizons, rmsProject.zones]);

  const [elementMappingsState, setElementMappingsState] = useState(() => ({
    base: baseElementMappings,
    mappings: baseElementMappings,
  }));
  const elementMappings =
    elementMappingsState.base === baseElementMappings
      ? elementMappingsState.mappings
      : baseElementMappings;
  const setElementMappings: Dispatch<SetStateAction<ElementMappings>> =
    useCallback(
      (value) => {
        setElementMappingsState((current) => {
          const currentMappings =
            current.base === baseElementMappings
              ? current.mappings
              : baseElementMappings;

          return {
            base: baseElementMappings,
            mappings:
              typeof value === "function" ? value(currentMappings) : value,
          };
        });
      },
      [baseElementMappings],
    );

  const mappingData = useMemo(() => {
    return {
      elementMappings,
      setElementMappings,
      stratigraphicColumn,
      projectReadOnly,
      canEdit:
        editMode &&
        !projectReadOnly &&
        smdaHealthStatus &&
        stratigraphicColumn !== undefined,
    };
  }, [
    elementMappings,
    projectReadOnly,
    editMode,
    smdaHealthStatus,
    stratigraphicColumn,
    setElementMappings,
  ]);

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
        <MappingDataContext value={mappingData}>
          <StratigraphicFramework
            horizons={rmsProject.horizons}
            zones={rmsProject.zones}
            enableWidthExpansion={true}
          >
            <Elements elementType="horizon" />
            <Elements elementType="zone" />
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
        </MappingDataContext>
      ) : (
        <PageSectionWidthConstrained>
          <PageText>No horizons exist.</PageText>
        </PageSectionWidthConstrained>
      )}
    </>
  );
}
