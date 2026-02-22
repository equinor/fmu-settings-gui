import { Card, Typography } from "@equinor/eds-core-react";

import ertLogo from "#assets/ert.png";
import fmuLogo from "#assets/fmu_logo.png";
import sumoLogo from "#assets/sumo.png";
import webvizLogo from "#assets/webviz.png";
import { PageHeader, PageText } from "#styles/common";
import { Logo, ResourceCard, ResourcesContainer } from "./Resources.style";

export function Resources() {
  return (
    <>
      <PageHeader variant="h3">Resources</PageHeader>

      <ResourcesContainer>
        <ResourceCard>
          <Card.Header>
            <Card.HeaderTitle>
              <Typography variant="h5">FMU Hub</Typography>
            </Card.HeaderTitle>
            <Logo src={fmuLogo} />
          </Card.Header>
          <Card.Content>
            <PageText>
              FMU Hub - the place for everything related to FMU. Expert or noob,
              user or developer, skeptic or believer - the site is for you and
              the rest of the amazing FMU community.
            </PageText>
          </Card.Content>
          <Card.Actions>
            <Typography
              link
              target="_blank"
              rel="noopener noreferrer"
              href="https://fmu.equinor.com/"
            >
              Homepage
            </Typography>
          </Card.Actions>
        </ResourceCard>

        <ResourceCard>
          <Card.Header>
            <Card.HeaderTitle>
              <Typography variant="h5">Sumo</Typography>
            </Card.HeaderTitle>
            <Logo src={sumoLogo} />
          </Card.Header>
          <Card.Content>
            <PageText>
              Sumo is a solution for receiving, storing and serving results
              produced by numerical predictive models of the subsurface.
            </PageText>
          </Card.Content>
          <Card.Actions>
            <Typography
              link
              target="_blank"
              rel="noopener noreferrer"
              href="https://fmu-sumo.app.radix.equinor.com/"
            >
              Homepage
            </Typography>

            <Typography
              link
              target="_blank"
              rel="noopener noreferrer"
              href="https://doc-sumo-doc-prod.radix.equinor.com/"
            >
              Documentation
            </Typography>
          </Card.Actions>
        </ResourceCard>

        <ResourceCard>
          <Card.Header>
            <Card.HeaderTitle>
              <Typography variant="h5">ERT</Typography>
            </Card.HeaderTitle>
            <Logo src={ertLogo} />
          </Card.Header>
          <Card.Content>
            <PageText>
              ERT - Ensemble based Reservoir Tool - is a tool to run
              ensemble-based reservoir models.
            </PageText>
          </Card.Content>
          <Card.Actions>
            <Typography
              link
              target="_blank"
              rel="noopener noreferrer"
              href="https://fmu-docs.equinor.com/docs/ert/index.html"
            >
              Documentation
            </Typography>
          </Card.Actions>
        </ResourceCard>

        <ResourceCard>
          <Card.Header>
            <Card.HeaderTitle>
              <Typography variant="h5">Webviz</Typography>
            </Card.HeaderTitle>
            <Logo src={webvizLogo} />
          </Card.Header>
          <Card.Content>
            <PageText>
              Webviz is a visualization tool and facilitate easy access of FMU
              modelling results.
            </PageText>
          </Card.Content>
          <Card.Actions>
            <Typography
              link
              target="_blank"
              rel="noopener noreferrer"
              href="https://webviz.fmu.equinor.com"
            >
              Documentation
            </Typography>
          </Card.Actions>
        </ResourceCard>

        <ResourceCard>
          <Card.Header>
            <Card.HeaderTitle>
              <Typography variant="h5">fmu-dataio</Typography>
            </Card.HeaderTitle>
          </Card.Header>
          <Card.Content>
            <PageText>
              fmu-dataio contains utility functions for data transfer of FMU
              data with rich metadata, for REP, Sumo, Webviz, etc.
            </PageText>
          </Card.Content>
          <Card.Actions>
            <Typography
              link
              target="_blank"
              rel="noopener noreferrer"
              href="https://fmu-dataio.readthedocs.io/en/latest/"
            >
              Documentation
            </Typography>
          </Card.Actions>
        </ResourceCard>
      </ResourcesContainer>
    </>
  );
}
