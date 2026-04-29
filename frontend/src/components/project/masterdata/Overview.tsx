import { useState } from "react";

import type { Smda } from "#client";
import { GeneralButton } from "#components/form/button";
import { Info } from "#components/project/masterdata/Info";
import { PageText } from "#styles/common";
import { emptyMasterdata } from "#utils/model";
import { Edit } from "./Edit";

export function Overview({
  projectMasterdata,
  smdaHealthStatus,
  projectReadOnly,
  editMode,
}: {
  projectMasterdata: Smda | undefined;
  smdaHealthStatus: boolean;
  projectReadOnly: boolean;
  editMode: boolean;
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

      {editMode && smdaHealthStatus && (
        <GeneralButton
          label={projectMasterdata ? "Edit" : "Add"}
          onClick={openEditDialog}
          disabled={projectReadOnly}
          tooltipText={projectReadOnly ? "Project is read-only" : ""}
        />
      )}

      <Edit
        projectMasterdata={projectMasterdata ?? emptyMasterdata()}
        projectReadOnly={projectReadOnly}
        isOpen={editDialogOpen}
        closeDialog={closeEditDialog}
      />
    </>
  );
}
