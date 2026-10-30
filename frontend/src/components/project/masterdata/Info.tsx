import type React from "react";

import type { Smda } from "#client";
import { ElementName } from "#components/common";
import { ElementNamesContainer } from "#styles/common";
import { stringCompare } from "#utils/string";
import { MasterdataInfoBox } from "./Info.style";

export function Info({ masterdata }: { masterdata: Smda }) {
  return (
    <MasterdataInfoBox>
      <table>
        <tbody>
          <tr>
            <th>Field</th>
            <td>
              <ElementNamesContainer>
                {masterdata.field
                  .sort((a, b) => stringCompare(a.identifier, b.identifier))
                  .map<React.ReactNode>((field) => (
                    <ElementName key={field.uuid} system="smda">
                      {field.identifier}
                    </ElementName>
                  ))}
              </ElementNamesContainer>
            </td>
          </tr>
          <tr>
            <th>Country</th>
            <td>
              <ElementNamesContainer>
                {masterdata.country
                  .sort((a, b) => stringCompare(a.identifier, b.identifier))
                  .map<React.ReactNode>((country) => (
                    <ElementName key={country.uuid} system="smda">
                      {country.identifier}
                    </ElementName>
                  ))}
              </ElementNamesContainer>
            </td>
          </tr>
          <tr>
            <th>Coordinate system</th>
            <td>
              <ElementName system="smda">
                {masterdata.coordinate_system.identifier}
              </ElementName>
            </td>
          </tr>
          <tr>
            <th>Stratigraphic column</th>
            <td>
              <ElementName system="smda">
                {masterdata.stratigraphic_column.identifier}
              </ElementName>
            </td>
          </tr>
          <tr>
            <th>Discoveries</th>
            <td>
              <ElementNamesContainer>
                {masterdata.discovery
                  .sort((a, b) =>
                    stringCompare(a.short_identifier, b.short_identifier),
                  )
                  .map<React.ReactNode>((discovery) => (
                    <ElementName key={discovery.uuid} system="smda">
                      {discovery.short_identifier}
                    </ElementName>
                  ))}
              </ElementNamesContainer>
            </td>
          </tr>
        </tbody>
      </table>
    </MasterdataInfoBox>
  );
}
