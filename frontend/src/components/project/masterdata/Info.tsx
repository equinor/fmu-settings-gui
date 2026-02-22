import type React from "react";

import type { Smda } from "#client";
import { ChipsContainer, InfoBox, InfoChip, PageText } from "#styles/common";
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
                <ChipsContainer>
                  {masterdata.field
                    .sort((a, b) => stringCompare(a.identifier, b.identifier))
                    .map<React.ReactNode>((field) => (
                      <InfoChip key={field.uuid}>{field.identifier}</InfoChip>
                    ))}
                </ChipsContainer>
              </td>
            </tr>
            <tr>
              <th>Country</th>
              <td>
                <ChipsContainer>
                  {masterdata.country
                    .sort((a, b) => stringCompare(a.identifier, b.identifier))
                    .map<React.ReactNode>((country) => (
                      <InfoChip key={country.uuid}>
                        {country.identifier}
                      </InfoChip>
                    ))}
                </ChipsContainer>
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
              <td>
                <ChipsContainer>
                  {masterdata.discovery
                    .sort((a, b) =>
                      stringCompare(a.short_identifier, b.short_identifier),
                    )
                    .map<React.ReactNode>((discovery) => (
                      <InfoChip key={discovery.uuid}>
                        {discovery.short_identifier}
                      </InfoChip>
                    ))}
                </ChipsContainer>
              </td>
            </tr>
          </tbody>
        </table>
      </InfoBox>
    </>
  );
}
