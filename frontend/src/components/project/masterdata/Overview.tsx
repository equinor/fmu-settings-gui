import { Button } from "@equinor/eds-core-react";
import { useState } from "react";

import { Smda } from "#client";
import { Info } from "#components/project/masterdata/Info";
import { PageText } from "#styles/common";
import { emptyMasterdata } from "#utils/model";
import { Edit } from "./Edit";

export function Overview({
  projectMasterdata,
}: {
  projectMasterdata: Smda | undefined;
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

      <Button onClick={openEditDialog}>Edit masterdata</Button>

      <Edit
        projectMasterdata={projectMasterdata ?? emptyMasterdata()}
        isOpen={editDialogOpen}
        closeDialog={closeEditDialog}
      />
    </>
  );
}
