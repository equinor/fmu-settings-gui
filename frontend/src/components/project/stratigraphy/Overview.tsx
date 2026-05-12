import { Dialog, Icon } from "@equinor/eds-core-react";
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
  PageText,
  WarningBox,
} from "#styles/common";
import {
  HTTP_STATUS_UNPROCESSABLE_CONTENT,
  httpValidationErrorToString,
} from "#utils/api";
import { fieldContext, formContext, useConfirmClose } from "#utils/form";
import {
  getHorizonLineStyle,
  useFrameworkData,
} from "../stratigraphicFramework/functions";
import { StratigraphicFramework } from "../stratigraphicFramework/StratigraphicFramework";
import {
  createMutationValue,
  createRmsMappingsLookup,
  createSmdaNameOptions,
  handleErrorUnknownInitialValue,
  updateZoneMappings,
} from "./functions";
import {
  ElementActions,
  ElementInfo,
  ElementName,
  ElementSystem,
  ElementSystemName,
  ElementSystems,
  HorizonItem,
  HorizonSystemName,
  ZoneItem,
} from "./Overview.style";
import type { ZoneMapping, ZoneMappings } from "./types";
import {
  emptyName,
  emptyZoneMapping,
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
  zoneMapping,
  smdaNameOptions,
  projectReadOnly,
  mutationCallback,
  mutationIsPending,
  isOpen,
  closeDialog,
}: {
  zoneMapping: ZoneMapping | undefined;
  smdaNameOptions: OptionProps[];
  projectReadOnly: boolean;
  mutationCallback: (props: MutationCallbackProps<ZoneMapping>) => void;
  mutationIsPending: boolean;
  isOpen: boolean;
  closeDialog: () => void;
}) {
  const form = useAppForm({
    defaultValues: {
      ...zoneMapping,
      ...(zoneMapping?.unmappable && {
        smdaUuid: specialOptions.unmappableZone.value,
      }),
    } as ZoneMapping,
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
      smdaNameOptions,
      {
        value: zoneMapping?.unmappable
          ? specialOptions.unmappableZone.value
          : (zoneMapping?.smdaUuid ?? "") === ""
            ? specialOptions.empty.value
            : (zoneMapping?.smdaUuid ?? ""),
        label: zoneMapping?.smdaName ?? "",
      },
    );
  }, [
    form.setFieldMeta,
    zoneMapping?.unmappable,
    zoneMapping?.smdaName,
    zoneMapping?.smdaUuid,
    smdaNameOptions,
  ]);

  const formSubmitCallback = ({
    message,
    formReset,
  }: FormSubmitCallbackProps) => {
    toast.info(message);
    formReset();
  };

  const {
    confirmCloseDialogOpen,
    handleCloseRequest,
    handleConfirmCloseDecision,
  } = useConfirmClose({
    formContext: form,
    isOpen,
    closeDialog,
    isReadOnly: projectReadOnly,
  });

  if (zoneMapping === undefined) {
    return null;
  }

  return (
    <>
      <ConfirmCloseDialog
        isOpen={confirmCloseDialogOpen}
        handleConfirmCloseDecision={handleConfirmCloseDecision}
      />

      <EditDialog
        open={isOpen}
        isDismissable={true}
        onClose={handleCloseRequest}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            void form.handleSubmit();
          }}
        >
          <Dialog.Header>Edit zone: {zoneMapping.rmsName}</Dialog.Header>

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
                        handleCloseRequest();
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

function Horizons({
  smdaHealthStatus,
  projectReadOnly,
  editMode,
}: {
  smdaHealthStatus: boolean;
  projectReadOnly: boolean;
  editMode: boolean;
}) {
  const frameworkData = useFrameworkData();
  const aliasCount = frameworkData.horizons.length;

  const canEdit = useMemo(
    () => editMode && !projectReadOnly && smdaHealthStatus,
    // && stratigraphicColumn !== undefined
    [editMode, projectReadOnly, smdaHealthStatus],
  );

  return frameworkData.horizons.map((horizon, idx) => {
    return (
      <HorizonItem
        key={horizon.name}
        $rowStart={(idx + 1) * 3 - 2}
        $lineStyle={getHorizonLineStyle(horizon)}
      >
        <ElementSystems>
          <ElementSystem>
            <ElementInfo>
              <HorizonSystemName>RMS</HorizonSystemName>
              <ElementName>
                {horizon.name}
                {aliasCount > 0 && (
                  <Icon
                    className="aliases"
                    data={link}
                    // title={`${aliasCount === 1 ? "Alias" : "Aliases"}: ${zoneMappings[zone.name].aliases.join(", ")}`}
                    title={`${aliasCount === 1 ? "Alias" : "Aliases"}: ${["Alias1", "Alias2"].join(", ")}`}
                    size={16}
                  />
                )}
              </ElementName>
            </ElementInfo>
          </ElementSystem>

          <ElementSystem>
            <ElementInfo $targetSystem={true}>
              <HorizonSystemName>SMDA</HorizonSystemName>
              <ElementName $targetSystem={true} $missingvalue={false}>
                {horizon.name}
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
              // onClick={() => {
              //   editClick(zoneMappings[zone.name]);
              // }}
            />
          </ElementActions>
        )}
      </HorizonItem>
    );
  });
}

function Zones({
  stratigraphyMappings,
  stratigraphicColumn,
  smdaHealthStatus,
  projectReadOnly,
  editMode,
}: {
  stratigraphyMappings: InternalStratigraphyMappingsOutput;
  stratigraphicColumn?: StratigraphicColumn;
  smdaHealthStatus: boolean;
  projectReadOnly: boolean;
  editMode: boolean;
}) {
  const [zoneMappings, setZoneMappings] = useState<ZoneMappings>({});
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [activeZoneMapping, setActiveZoneMapping] = useState<
    ZoneMapping | undefined
  >();
  const [smdaNameOptions, setSmdaNameOptions] = useState<OptionProps[]>([]);
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

  const { data: stratigraphicUnits } = useQuery({
    ...smdaPostStratUnitsOptions({
      body: { strat_column_identifier: stratigraphicColumn?.identifier ?? "" },
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
    },
    onError: (error) => {
      if (error.response?.status === HTTP_STATUS_UNPROCESSABLE_CONTENT) {
        const message = httpValidationErrorToString(error);
        console.error(message);
        toast.error(message);
      }
    },
    meta: {
      errorPrefix: "Error saving stratigraphy mapping",
      preventDefaultErrorHandling: [HTTP_STATUS_UNPROCESSABLE_CONTENT],
    },
  });

  useEffect(() => {
    const lookup = createRmsMappingsLookup(stratigraphyMappings);
    const zoneMappings: ZoneMappings = {};

    frameworkData.zones.forEach((rmsZone) => {
      zoneMappings[rmsZone.name] = lookup[rmsZone.name] ?? {
        ...emptyZoneMapping(),
        rmsName: rmsZone.name,
      };
    });

    setZoneMappings(zoneMappings);
  }, [frameworkData.zones, stratigraphyMappings]);

  useEffect(() => {
    if (stratigraphicUnits !== undefined) {
      setSmdaNameOptions([
        specialOptions.empty,
        specialOptions.unmappableZone,
        specialOptions.divider,
        ...createSmdaNameOptions(stratigraphicUnits.stratigraphic_units),
      ]);
    }
  }, [stratigraphicUnits]);

  const editClick = (zoneMapping: ZoneMapping) => {
    setActiveZoneMapping(zoneMapping);
    setEditDialogOpen(true);
  };

  function closeEditDialog() {
    setEditDialogOpen(false);
    setActiveZoneMapping(undefined);
  }

  const mutationCallback = ({
    formValue,
    formSubmitCallback,
    formReset,
  }: MutationCallbackProps<ZoneMapping>) => {
    const stratUnit = stratigraphicUnits?.stratigraphic_units.find(
      (unit) => unit.uuid === formValue.smdaUuid,
    );

    const mutationValue = createMutationValue(
      updateZoneMappings(zoneMappings, formValue, stratUnit),
    );

    mappingsMutation.mutate(
      {
        path: mappingsPaths.stratigraphyRms,
        body: mutationValue,
      },
      {
        onSuccess: (data) => {
          setZoneMappings((zoneMappings) =>
            updateZoneMappings(zoneMappings, formValue, stratUnit),
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
          zoneMapping={activeZoneMapping}
          smdaNameOptions={smdaNameOptions}
          projectReadOnly={projectReadOnly}
          mutationIsPending={mappingsMutation.isPending}
          mutationCallback={mutationCallback}
          isOpen={editDialogOpen}
          closeDialog={closeEditDialog}
        />
      )}

      {frameworkData.zones.map((zone) => {
        const grid = frameworkData.zoneGridPlacement.get(zone.name);

        if (!grid) {
          return null;
        }

        const hasSmdaName =
          zone.name in zoneMappings && zoneMappings[zone.name].smdaName !== "";
        const isUnmappable =
          zone.name in zoneMappings && zoneMappings[zone.name].unmappable;
        const aliasCount =
          zone.name in zoneMappings
            ? zoneMappings[zone.name].aliases.length
            : 0;

        return (
          <ZoneItem key={zone.name} $zoneGrid={grid}>
            <ElementSystems>
              <ElementSystem>
                <ElementInfo>
                  <ElementSystemName>RMS</ElementSystemName>
                  <ElementName>
                    {zone.name}
                    {aliasCount > 0 && (
                      <Icon
                        className="aliases"
                        data={link}
                        title={`${aliasCount === 1 ? "Alias" : "Aliases"}: ${zoneMappings[zone.name].aliases.join(", ")}`}
                        size={16}
                      />
                    )}
                  </ElementName>
                </ElementInfo>
              </ElementSystem>

              <ElementSystem>
                <ElementInfo $targetSystem={true}>
                  <ElementSystemName>SMDA</ElementSystemName>
                  <ElementName
                    $targetSystem={true}
                    $missingvalue={!hasSmdaName || isUnmappable}
                  >
                    {hasSmdaName
                      ? zoneMappings[zone.name].smdaName
                      : isUnmappable
                        ? noZoneName
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
                    editClick(zoneMappings[zone.name]);
                  }}
                />
              </ElementActions>
            )}
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
      <PageText>
        The following are the mappings for horizons and zones, showing the names
        in RMS and SMDA.
      </PageText>

      {rmsProject.horizons !== undefined &&
      rmsProject.horizons !== null &&
      rmsProject.zones !== undefined &&
      rmsProject.zones !== null ? (
        <>
          <StratigraphicFramework
            horizons={rmsProject.horizons}
            zones={rmsProject.zones}
          >
            <Horizons
              smdaHealthStatus={smdaHealthStatus}
              projectReadOnly={projectReadOnly}
              editMode={editMode}
            />
            <Zones
              stratigraphyMappings={mappings.stratigraphy ?? []}
              stratigraphicColumn={stratigraphicColumn}
              smdaHealthStatus={smdaHealthStatus}
              projectReadOnly={projectReadOnly}
              editMode={editMode}
            />
          </StratigraphicFramework>

          {editMode && smdaHealthStatus && !stratigraphicColumn && (
            <WarningBox>
              <PageText $marginBottom="0">
                No stratigraphic column is set in the masterdata.{" "}
                <Link to="/project/masterdata">Set this value</Link> to enable
                editing of stratigraphy mappings.
              </PageText>
            </WarningBox>
          )}
        </>
      ) : (
        <PageText>No horizons exist.</PageText>
      )}
    </>
  );
}
