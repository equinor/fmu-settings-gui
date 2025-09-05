import { Smda } from "#client";
import { Field } from "#components/project/masterdata/Field";
import { Info } from "#components/project/masterdata/Info";
import { PageSectionSpacer, PageText } from "#styles/common";

export function Overview({ masterdata }: { masterdata?: Smda }) {
  return (
    <>
      {masterdata !== undefined ? (
        <Info masterdata={masterdata} />
      ) : (
        <PageText>No masterdata is currently stored in the project.</PageText>
      )}

      <PageSectionSpacer />

      <Field />
    </>
  );
}
