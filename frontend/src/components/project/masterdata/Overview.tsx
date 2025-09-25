import { Button } from "@equinor/eds-core-react";
import { useState } from "react";

import { Smda } from "#client";
import { Field } from "#components/project/masterdata/Field";
import { Info } from "#components/project/masterdata/Info";
import { PageSectionSpacer, PageText } from "#styles/common";
import { emptyMasterdata } from "#utils/model";
import { Edit } from "./Edit";

export function Overview({ masterdata }: { masterdata: Smda | undefined }) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  function openEditDialog() {
    setEditDialogOpen(true);
  }

  function closeEditDialog() {
    setEditDialogOpen(false);
  }

  return (
    <>
      {masterdata !== undefined ? (
        <Info masterdata={masterdata} />
      ) : (
        <PageText>No masterdata is currently stored in the project.</PageText>
      )}

      <Button onClick={openEditDialog}>Edit masterdata</Button>

      <Edit
        masterdata={masterdata ?? emptyMasterdata()}
        isOpen={editDialogOpen}
        closeDialog={closeEditDialog}
      />

      <PageSectionSpacer />

      <Field />
    </>
  );
}
