import { useState } from "react";

import { Smda } from "#client";
import { GeneralButton } from "#components/form/button";
import { Info } from "#components/project/masterdata/Info";
import { PageText } from "#styles/common";
import { emptyMasterdata } from "#utils/model";
import { Edit } from "./Edit";

export function Overview({
  projectMasterdata,
  projectReadOnly,
}: {
  projectMasterdata: Smda | undefined;
  projectReadOnly: boolean;
}) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  function openEditDialog() {
    setEditDialogOpen(true);
  }

  function closeEditDialog() {
    setEditDialogOpen(false);
  }

  return (
    <>
      {projectMasterdata !== undefined ? (
        <Info masterdata={projectMasterdata} />
      ) : (
        <PageText>No masterdata is currently stored in the project.</PageText>
      )}

      <GeneralButton
        label="Edit"
        disabled={projectReadOnly}
        tooltipText={projectReadOnly ? "Project is read-only" : ""}
        onClick={openEditDialog}
      />

      <Edit
        projectMasterdata={projectMasterdata ?? emptyMasterdata()}
        projectReadOnly={projectReadOnly}
        isOpen={editDialogOpen}
        closeDialog={closeEditDialog}
      />
    </>
  );
}
