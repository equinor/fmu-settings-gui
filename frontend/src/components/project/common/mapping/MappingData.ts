import { createContext } from "react";

import type { MappingData } from "./types";

export const MappingDataContext = createContext<MappingData | null>(null);
