import { useEffect } from "react";

export function usePageTitle(pageTitle) {
  useEffect(() => {
    if (pageTitle) document.title = `${pageTitle} - Elitea Admin`;
    else document.title = "Elitea Admin";

    return () => {
      document.title = "Elitea Admin";
    };
  }, [pageTitle]);
}
