export type WellboreMappingRow = {
  rmsWellboreName: string;
  planned: boolean;
  simulatorName: string;
  smdaName: string;
  smdaUuid: string;
  unmappable: boolean;
};

export type WellboreMappingFormValue = {
  simulatorName: string;
  smdaUuid: string;
};
