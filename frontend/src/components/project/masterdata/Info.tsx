import React from "react";

import { Smda } from "#client";
import { InfoBox, InfoChip, PageText } from "#styles/common";
import { stringCompare } from "#utils/string";

export function Info({ masterdata }: { masterdata: Smda }) {
  return (
    <>
      <PageText>The following masterdata is stored in the project:</PageText>

      <InfoBox>
        <table>
          <tbody>
            <tr>
              <th>Field</th>
              <td>
                {masterdata.field
                  .sort((a, b) => stringCompare(a.identifier, b.identifier))
                  .map<React.ReactNode>((field) => (
                    <React.Fragment key={field.uuid}>
                      {field.identifier}
                    </React.Fragment>
                  ))
                  .reduce((prev, curr) => [prev, ", ", curr])}
              </td>
            </tr>
            <tr>
              <th>Country</th>
              <td>
                {masterdata.country
                  .sort((a, b) => stringCompare(a.identifier, b.identifier))
                  .map<React.ReactNode>((country) => (
                    <span key={country.uuid}>{country.identifier}</span>
                  ))
                  .reduce((prev, curr) => [prev, ", ", curr])}
              </td>
            </tr>
            <tr>
              <th>Coordinate system</th>
              <td>{masterdata.coordinate_system.identifier}</td>
            </tr>
            <tr>
              <th>Stratigraphic column</th>
              <td>{masterdata.stratigraphic_column.identifier}</td>
            </tr>
            <tr>
              <th>Discoveries</th>
              <td className="chips">
                {masterdata.discovery
                  .sort((a, b) =>
                    stringCompare(a.short_identifier, b.short_identifier),
                  )
                  .map<React.ReactNode>((discovery) => (
                    <InfoChip key={discovery.uuid}>
                      {discovery.short_identifier}
                    </InfoChip>
                  ))}
              </td>
            </tr>
          </tbody>
        </table>
      </InfoBox>
    </>
  );
}
