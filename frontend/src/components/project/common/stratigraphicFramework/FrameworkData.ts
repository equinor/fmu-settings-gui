import { createContext } from "react";

import type { FrameworkData } from "./types";

export const FrameworkDataContext = createContext<FrameworkData | null>(null);
