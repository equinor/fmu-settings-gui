import { useState } from "react";

import type { FieldItem, Smda } from "#client";
import { GeneralButton } from "#components/form/button";
import { Info } from "#components/project/masterdata/Info";
import { PageCode, PageText } from "#styles/common";
import { emptyMasterdata } from "#utils/model";
import { Edit } from "./Edit";

export function Overview({
  projectMasterdata,
  associatedFields,
  smdaHealthStatus,
  projectReadOnly,
  editMode,
}: {
  projectMasterdata: Smda | undefined;
  associatedFields: Array<FieldItem>;
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
      <PageText>
        The following is the SMDA masterdata stored in the project.
      </PageText>

      {projectMasterdata !== undefined ? (
        <Info masterdata={projectMasterdata} />
      ) : (
        <PageCode>No masterdata is currently stored in the project.</PageCode>
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
        associatedFields={associatedFields}
        projectReadOnly={projectReadOnly}
        isOpen={editDialogOpen}
        closeDialog={closeEditDialog}
      />
    </>
  );
}
