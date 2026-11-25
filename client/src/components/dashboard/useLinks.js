import { useContext } from "react";
import { LinksContext } from "./linksContext";

export function useLinks() {
  const context = useContext(LinksContext);

  if (!context) {
    throw new Error("useLinks must be used within a LinksProvider");
  }

  return context;
}
