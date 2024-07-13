import { AssetsData } from "./Assets";

export interface ClientEndpointType {
  github: string;
  vercel: string;
  local: string;
}

export interface DefaultData {
  asset: AssetsData[];
}
