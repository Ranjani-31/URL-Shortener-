import { useCallback, useEffect, useState } from "react";
import axios from "../../api/axios";
import { LinksContext } from "./linksContext";

function normalizeLink(url) {
  const code = url.shortCode ?? url.code;

  return {
    id: url._id ?? url.id ?? url.shortCode,
    code,
    shortUrl:
      url.shortUrl ??
      `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/${code}`,
    originalUrl: url.originalUrl,
    clicks: url.clickCount ?? url.clicks ?? 0,
    createdAt: url.createdAt ?? Date.now(),
    expiresAt: url.expiresAt ?? null,
    isActive: url.isActive !== false,
    date: new Date(url.createdAt ?? Date.now()).toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    }),
    status: url.expiresAt && new Date(url.expiresAt) < new Date()
      ? "Expired"
      : url.isActive === false
        ? "Inactive"
        : "Active",
  };
}

async function fetchLinks() {
  const response = await axios.get("/api/v1/urls/my");

  if (!Array.isArray(response.data?.data)) {
    throw new Error("The server returned an invalid links response.");
  }

  return response.data.data.map(normalizeLink);
}

function getLoadErrorMessage(error) {
  console.error("Unable to load links:", error);
  return (
    error.response?.data?.message ||
    error.message ||
    "Unable to load your links. Please try again."
  );
}

async function fetchCurrentUser() {
  const response = await axios.get("/api/v1/users/me");
  if (!response.data?.data?.user) {
    throw new Error("The server returned an invalid account response.");
  }
  return response.data.data.user;
}

function getAccountErrorMessage(error) {
  console.error("Unable to load account:", error);
  return (
    error.response?.data?.message ||
    error.message ||
    "Unable to load your account. Please try again."
  );
}

export function LinksProvider({ children }) {
  const [links, setLinks] = useState([]);
  const [selectedLinkForAnalytics, setSelectedLinkForAnalytics] =
    useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [isAccountLoading, setIsAccountLoading] = useState(true);
  const [accountError, setAccountError] = useState("");

  const reloadAccount = useCallback(async () => {
    setIsAccountLoading(true);
    setAccountError("");

    try {
      setCurrentUser(await fetchCurrentUser());
    } catch (error) {
      setAccountError(getAccountErrorMessage(error));
    } finally {
      setIsAccountLoading(false);
    }
  }, []);

  const reloadLinks = useCallback(async () => {
    setIsLoading(true);
    setLoadError("");

    try {
      setLinks(await fetchLinks());
    } catch (error) {
      setLoadError(getLoadErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    function refreshOnFocus() {
      if (document.visibilityState === "visible") {
        reloadLinks();
        reloadAccount();
      }
    }

    fetchLinks()
      .then((loadedLinks) => {
        if (isMounted) setLinks(loadedLinks);
      })
      .catch((error) => {
        if (isMounted) {
          setLoadError(getLoadErrorMessage(error));
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    fetchCurrentUser()
      .then((user) => {
        if (isMounted) {
          setCurrentUser(user);
          setAccountError("");
        }
      })
      .catch((error) => {
        if (isMounted) setAccountError(getAccountErrorMessage(error));
      })
      .finally(() => {
        if (isMounted) setIsAccountLoading(false);
      });
    window.addEventListener("focus", refreshOnFocus);

    return () => {
      isMounted = false;
      window.removeEventListener("focus", refreshOnFocus);
    };
  }, [reloadAccount, reloadLinks]);

  function addLink(link) {
    setLinks((currentLinks) => [normalizeLink(link), ...currentLinks]);
  }

  function updateLink(link) {
    const normalizedLink = normalizeLink(link);
    setLinks((currentLinks) =>
      currentLinks.map((currentLink) =>
        currentLink.id === normalizedLink.id ? normalizedLink : currentLink,
      ),
    );
  }

  function removeLink(id) {
    setLinks((currentLinks) =>
      currentLinks.filter((currentLink) => currentLink.id !== id),
    );
  }

  return (
    <LinksContext.Provider
      value={{
        links,
        selectedLinkForAnalytics,
        setSelectedLinkForAnalytics,
        currentUser,
        setCurrentUser,
        isAccountLoading,
        accountError,
        reloadAccount,
        addLink,
        updateLink,
        removeLink,
        isLoading,
        loadError,
        reloadLinks,
      }}
    >
      {children}
    </LinksContext.Provider>
  );
}
