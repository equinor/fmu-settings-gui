import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import fmuLogo from "../assets/fmu_logo_full.svg";
import "../main.css";
import { v1V1HealthCheckOptions } from "../client/@tanstack/react-query.gen";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { data } = useQuery({
    ...v1V1HealthCheckOptions(),
  });

  return (
    <>
      <div>
        <img src={fmuLogo} className="logo" alt="FMU logo" />
      </div>
      <h1>FMU Settings</h1>

      <p>Health: {data?.status}</p>
    </>
  );
}
