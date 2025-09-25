import { Dialog } from "@equinor/eds-core-react";
import { createFormHook } from "@tanstack/react-form";
import { useMutation, useQueries, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import { CoordinateSystem, Smda, SmdaMasterdataResult } from "#client";
import {
  projectGetProjectQueryKey,
  projectPatchMasterdataMutation,
  smdaPostMasterdataOptions,
} from "#client/@tanstack/react-query.gen";
import { CancelButton, SubmitButton } from "#components/form/button";
import { Select } from "#components/form/field";
import {
  FormSubmitCallbackProps,
  MutationCallbackProps,
} from "#components/form/form";
import { EditDialog } from "#styles/common";
import {
  HTTP_STATUS_UNPROCESSABLE_CONTENT,
  httpValidationErrorToString,
} from "#utils/api";
import {
  fieldContext,
  findOptionValueInIdentifierUuidArray,
  formContext,
  identifierUuidArrayToOptionsArray,
} from "#utils/form";
import { emptyIdentifierUuid } from "#utils/model";
import { stringCompare } from "#utils/string";

type SmdaMasterdataResultGrouped = Record<string, SmdaMasterdataResult>;

type SmdaReferenceData = {
  coordinateSystems: Array<CoordinateSystem>;
};

const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { Select },
  formComponents: { CancelButton, SubmitButton },
});

export function Edit({
  masterdata,
  isOpen,
  closeDialog,
}: {
  masterdata: Smda;
  isOpen: boolean;
  closeDialog: () => void;
}) {
  const [smdaFields, setSmdaFields] = useState<Array<string>>([]);
  const [smdaReferenceData, setSmdaReferenceData] = useState<SmdaReferenceData>(
    {
      coordinateSystems: [],
    },
  );
  const queryClient = useQueryClient();

  const masterdataMutation = useMutation({
    ...projectPatchMasterdataMutation(),
    onSuccess: () => {
      void queryClient.refetchQueries({
        queryKey: projectGetProjectQueryKey(),
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
      errorPrefix: "Error saving masterdata",
      preventDefaultErrorHandling: [HTTP_STATUS_UNPROCESSABLE_CONTENT],
    },
  });

  const smdaMasterdata = useQueries({
    queries: smdaFields.map((field) =>
      smdaPostMasterdataOptions({ body: [{ identifier: field }] }),
    ),
    combine: (results) => ({
      data: results.reduce<SmdaMasterdataResultGrouped>((acc, curr, idx) => {
        if (curr.data !== undefined) {
          const field =
            (curr.data.field.length && curr.data.field[0].identifier) ||
            `index-${String(idx)}`;
          acc[field] = curr.data;
        }
        return acc;
      }, {}),
      isPending: results.some((result) => result.isPending),
    }),
  });

  useEffect(() => {
    if (isOpen) {
      setSmdaFields(masterdata.field.map((field) => field.identifier));
    }
  }, [isOpen, masterdata]);

  useEffect(() => {
    if (Object.keys(smdaMasterdata.data).length) {
      const field = Object.values(smdaMasterdata.data)[0];
      setSmdaReferenceData({
        coordinateSystems: field.coordinate_systems.sort((a, b) =>
          stringCompare(a.identifier, b.identifier),
        ),
      });
    }
  }, [smdaMasterdata.data]);

  function handleClose({ formReset }: { formReset: () => void }) {
    formReset();
    closeDialog();
  }

  const mutationCallback = ({
    formValue,
    formSubmitCallback,
    formReset,
  }: MutationCallbackProps<Smda>) => {
    masterdataMutation.mutate(
      {
        body: {
          ...masterdata,
          coordinate_system: formValue.coordinate_system,
        },
      },
      {
        onSuccess: (data) => {
          formSubmitCallback({ message: data.message, formReset });
          closeDialog();
        },
      },
    );
  };

  const formSubmitCallback = ({
    message,
    formReset,
  }: FormSubmitCallbackProps) => {
    toast.info(message);
    formReset();
  };

  const form = useAppForm({
    defaultValues: masterdata,
    onSubmit: ({ formApi, value }) => {
      mutationCallback({
        formValue: value,
        formSubmitCallback,
        formReset: formApi.reset,
      });
    },
  });

  return (
    <EditDialog open={isOpen}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void form.handleSubmit();
        }}
      >
        <Dialog.Header>Edit masterdata</Dialog.Header>

        <Dialog.CustomContent>
          <form.AppField name="coordinate_system">
            {(field) => (
              <field.Select
                label="Coordinate system"
                helperText={
                  smdaMasterdata.isPending ? "Loading options..." : undefined
                }
                value={field.state.value.uuid}
                options={identifierUuidArrayToOptionsArray([
                  emptyIdentifierUuid() as CoordinateSystem,
                  ...smdaReferenceData.coordinateSystems,
                ])}
                onChange={(value: string) => {
                  field.handleChange(
                    findOptionValueInIdentifierUuidArray(
                      smdaReferenceData.coordinateSystems,
                      value,
                    ) ?? (emptyIdentifierUuid() as CoordinateSystem),
                  );
                }}
              ></field.Select>
            )}
          </form.AppField>
        </Dialog.CustomContent>

        <Dialog.Actions>
          <form.AppForm>
            <form.SubmitButton
              label="Save"
              isPending={masterdataMutation.isPending}
            />

            <form.CancelButton
              onClick={() => {
                handleClose({ formReset: form.reset });
              }}
            />
          </form.AppForm>
        </Dialog.Actions>
      </form>
    </EditDialog>
  );
}
