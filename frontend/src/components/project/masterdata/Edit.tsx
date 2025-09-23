import { Dialog } from "@equinor/eds-core-react";
import { createFormHook } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { CoordinateSystem, Smda } from "#client";
import {
  projectGetProjectQueryKey,
  projectPatchMasterdataMutation,
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
  const queryClient = useQueryClient();
  const { mutate, isPending } = useMutation({
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

  const coordSystems = [
    { identifier: "One", uuid: "15ce3b84-766f-4c93-9050-b154861f9100" },
    { identifier: "Two", uuid: "25ce3b84-766f-4c93-9050-b154861f9100" },
    { identifier: "Three", uuid: "35ce3b84-766f-4c93-9050-b154861f9100" },
    { identifier: "Four", uuid: "45ce3b84-766f-4c93-9050-b154861f9100" },
  ] as CoordinateSystem[];
  const coordSystemsOptions = [
    emptyIdentifierUuid() as CoordinateSystem,
    ...coordSystems,
  ];

  function handleClose({ formReset }: { formReset: () => void }) {
    formReset();
    closeDialog();
  }

  const mutationCallback = ({
    formValue,
    formSubmitCallback,
    formReset,
  }: MutationCallbackProps<Smda>) => {
    mutate(
      {
        body: {
          ...masterdata,
          coordinate_system: formValue.coordinate_system,
          stratigraphic_column: formValue.coordinate_system,
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
                value={field.state.value.uuid}
                options={identifierUuidArrayToOptionsArray(coordSystemsOptions)}
                onChange={(value: string) => {
                  field.handleChange(
                    findOptionValueInIdentifierUuidArray(
                      coordSystemsOptions,
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
            <form.SubmitButton label="Save" isPending={isPending} />

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
