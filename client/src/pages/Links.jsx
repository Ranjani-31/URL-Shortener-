import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import {
  BarChart3,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  ExternalLink,
  Link2,
  Pencil,
  Plus,
  QrCode,
  Search,
  Trash2,
  X,
} from "lucide-react";
import axios from "../api/axios";
import { useLinks } from "../components/dashboard/useLinks";

const PAGE_SIZE = 10;

function dateInputValue(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

function expiryDateValue(value) {
  return value ? new Date(`${value}T23:59:59`).toISOString() : null;
}

function Links() {
  const navigate = useNavigate();
  const {
    links,
    currentUser,
    addLink,
    setCurrentUser,
    updateLink,
    removeLink,
    isLoading,
    loadError,
    reloadLinks,
    setSelectedLinkForAnalytics,
  } = useLinks();
  const canCustomizeLinks = ["pro", "premium"].includes(
    currentUser?.plan?.toLowerCase(),
  );
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [copyingId, setCopyingId] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [destination, setDestination] = useState("");
  const [alias, setAlias] = useState("");
  const [expiresOn, setExpiresOn] = useState("");
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [editingLink, setEditingLink] = useState(null);
  const [editDestination, setEditDestination] = useState("");
  const [editExpiresOn, setEditExpiresOn] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);
  const [qrLink, setQrLink] = useState(null);

  const filteredLinks = useMemo(() => {
    const query = search.trim().toLowerCase();
    return links.filter((link) => {
      const matchesSearch =
        !query ||
        link.code.toLowerCase().includes(query) ||
        link.originalUrl.toLowerCase().includes(query);
      return matchesSearch && (statusFilter === "All" || link.status === statusFilter);
    });
  }, [links, search, statusFilter]);
  const totalPages = Math.max(1, Math.ceil(filteredLinks.length / PAGE_SIZE));
  const pageNumber = Math.min(currentPage, totalPages);
  const pageLinks = filteredLinks.slice((pageNumber - 1) * PAGE_SIZE, pageNumber * PAGE_SIZE);
  const totalClicks = links.reduce((total, link) => total + link.clicks, 0);

  function showAnalytics(link) {
    console.log("showAnalytics", link);
    setSelectedLinkForAnalytics(link.id);
    navigate(`/analytics/${encodeURIComponent(link.code)}`);
  }

  async function copyLink(link) {
    try {
      await navigator.clipboard.writeText(link.shortUrl);
      setCopyingId(link.id);
      window.setTimeout(() => setCopyingId(null), 1800);
    } catch (error) {
      console.error("Unable to copy short URL:", error);
      setFormError("Unable to copy the link. Check your browser permissions.");
    }
  }

  async function createLink(event) {
    event.preventDefault();
    setFormError("");
    setIsSaving(true);
    try {
      const payload = { originalUrl: destination.trim() };
      if (canCustomizeLinks) {
        if (alias.trim()) payload.alias = alias.trim();
        if (expiresOn) payload.expiresAt = expiryDateValue(expiresOn);
      }
      const response = await axios.post("/api/v1/urls/shorten", payload);
      const rawLink = response.data.data;
      addLink(rawLink);
      setCurrentUser((user) => user ? { ...user, linksUsed: user.linksUsed + 1 } : user);
      setDestination("");
      setAlias("");
      setExpiresOn("");
      setIsCreateOpen(false);
      setCurrentPage(1);
    } catch (error) {
      console.error("Unable to create short URL:", error);
      setFormError(error.response?.data?.message || error.message || "Unable to create this link.");
    } finally {
      setIsSaving(false);
    }
  }

  function openEdit(link) {
    setEditingLink(link);
    setEditDestination(link.originalUrl);
    setEditExpiresOn(dateInputValue(link.expiresAt));
    setEditIsActive(link.isActive);
    setFormError("");
  }

  async function saveEdit(event) {
    event.preventDefault();
    if (!editingLink) return;
    setFormError("");
    setIsSaving(true);
    try {
      const payload = {
        originalUrl: editDestination.trim(),
        expiresAt: expiryDateValue(editExpiresOn),
        isActive: editIsActive,
      };
      const response = await axios.put(`/api/urls/${editingLink.id}`, payload);
      updateLink(response.data.data);
      setEditingLink(null);
    } catch (error) {
      console.error("Unable to update short URL:", error);
      setFormError(error.response?.data?.message || error.message || "Unable to update this link.");
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteLink(link) {
    if (!window.confirm(`Delete the short link /${link.code}?`)) return;
    try {
      await axios.delete(`/api/urls/${link.id}`);
      removeLink(link.id);
      const createdAt = new Date(link.createdAt);
      const now = new Date();
      if (
        createdAt.getFullYear() === now.getFullYear() &&
        createdAt.getMonth() === now.getMonth()
      ) {
        setCurrentUser((user) => user ? { ...user, linksUsed: Math.max(0, user.linksUsed - 1) } : user);
      }
    } catch (error) {
      console.error("Unable to delete short URL:", error);
      setFormError(error.response?.data?.message || error.message || "Unable to delete this link.");
    }
  }

  function downloadQr() {
    const svg = document.getElementById("short-link-qr");
    if (!svg || !qrLink) return;
    const source = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const downloadUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = downloadUrl;
    anchor.download = `${qrLink.code}-qr.svg`;
    anchor.click();
    URL.revokeObjectURL(downloadUrl);
  }

  function openCreate() {
    setFormError("");
    setIsCreateOpen(true);
  }

  function closeModal() {
    setIsCreateOpen(false);
    setEditingLink(null);
    setQrLink(null);
    setFormError("");
  }

  const modalLink = isCreateOpen || editingLink;
  const isModalOpen = Boolean(modalLink || qrLink);

  useEffect(() => {
    if (!isModalOpen) return undefined;
    function handleEscape(event) {
      if (event.key === "Escape") {
        setIsCreateOpen(false);
        setEditingLink(null);
        setQrLink(null);
        setFormError("");
      }
    }
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isModalOpen]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {loadError && (
        <div role="alert" className="flex flex-col justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:flex-row sm:items-center">
          <span>{loadError}</span>
          <button type="button" onClick={reloadLinks} className="self-start font-semibold underline sm:self-auto">Retry</button>
        </div>
      )}
      {formError && !isModalOpen && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</p>
      )}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">My links</h1>
          <p className="mt-1 text-sm text-slate-500">Organize, share, and track your shortened URLs.</p>
        </div>
        <button type="button" onClick={openCreate} disabled={isLoading} className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60">
          <Plus size={17} /> Create new link
        </button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100">
          <Search size={17} className="shrink-0 text-slate-400" />
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by alias or destination URL..."
            aria-label="Search links"
            className="min-w-0 flex-1 py-2.5 text-sm outline-none placeholder:text-slate-400"
          />
        </label>
        <select
          value={statusFilter}
          onChange={(event) => {
            setStatusFilter(event.target.value);
            setCurrentPage(1);
          }}
          aria-label="Filter by status"
          className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-400"
        >
          <option>All</option>
          <option>Active</option>
          <option>Inactive</option>
          <option>Expired</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <Link2 size={17} className="text-slate-400" />
            <span className="text-sm font-semibold text-slate-800">All links</span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">{filteredLinks.length}</span>
          </div>
          <span className="text-xs text-slate-500">{totalClicks.toLocaleString()} total clicks</span>
        </div>
        <div className="divide-y divide-slate-100">
          {isLoading ? (
            <p className="px-5 py-12 text-center text-sm text-slate-500">Loading your links…</p>
          ) : pageLinks.map((link) => (
            <article key={link.id} className="flex flex-col gap-4 px-4 py-4 transition hover:bg-slate-50/70 sm:px-5 sm:py-5">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <a href={link.shortUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700">
                      /{link.code}<ExternalLink size={13} />
                    </a>
                    <button type="button" onClick={() => copyLink(link)} aria-label={`Copy /${link.code}`} className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition ${copyingId === link.id ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-500 hover:text-slate-800"}`}>
                      {copyingId === link.id ? <Check size={13} /> : <Copy size={13} />}
                      {copyingId === link.id ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <p title={link.originalUrl} className="mt-1.5 max-w-3xl truncate text-sm text-slate-500">{link.originalUrl}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-400">
                    <span>{link.date}</span>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 font-medium ${link.status === "Active" ? "bg-emerald-50 text-emerald-700" : link.status === "Expired" ? "bg-red-50 text-red-600" : "bg-slate-100 text-slate-600"}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${link.status === "Active" ? "bg-emerald-500" : link.status === "Expired" ? "bg-red-500" : "bg-slate-400"}`} />
                      {link.status}{link.status === "Expired" && link.expiresAt ? ` · ${new Date(link.expiresAt).toLocaleDateString()}` : ""}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  <button type="button" onClick={() => showAnalytics(link)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-700">
                    <BarChart3 size={15} /> {link.clicks.toLocaleString()} clicks
                  </button>
                  <button type="button" onClick={() => setQrLink(link)} title="Show QR code" aria-label={`QR code for /${link.code}`} className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"><QrCode size={16} /></button>
                  <button type="button" onClick={() => openEdit(link)} title="Edit link" aria-label={`Edit /${link.code}`} className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"><Pencil size={16} /></button>
                  <button type="button" onClick={() => deleteLink(link)} title="Delete link" aria-label={`Delete /${link.code}`} className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"><Trash2 size={16} /></button>
                </div>
              </div>
            </article>
          ))}
          {!isLoading && !pageLinks.length && (
            <div className="px-5 py-14 text-center">
              <Link2 className="mx-auto text-slate-300" size={28} />
              <p className="mt-3 text-sm font-medium text-slate-700">No links found</p>
              <p className="mt-1 text-sm text-slate-400">{search ? "Try another search or filter." : "Create your first short link to get started."}</p>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <p className="text-xs text-slate-500">
            Showing {filteredLinks.length ? (pageNumber - 1) * PAGE_SIZE + 1 : 0}–{Math.min(pageNumber * PAGE_SIZE, filteredLinks.length)} of {filteredLinks.length} links
          </p>
          <div className="flex items-center gap-1">
            <button type="button" disabled={pageNumber === 1} onClick={() => setCurrentPage(pageNumber - 1)} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft size={14} /> Previous</button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, index) => {
              const firstVisiblePage = Math.min(Math.max(pageNumber - 2, 1), Math.max(totalPages - 4, 1));
              const page = firstVisiblePage + index;
              return <button key={page} type="button" aria-current={page === pageNumber ? "page" : undefined} onClick={() => setCurrentPage(page)} className={`h-8 min-w-8 rounded-lg px-2 text-xs font-semibold ${page === pageNumber ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}>{page}</button>;
            })}
            <button type="button" disabled={pageNumber >= totalPages} onClick={() => setCurrentPage(pageNumber + 1)} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">Next <ChevronRight size={14} /></button>
          </div>
        </div>
      </div>

      {(modalLink || qrLink) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">
          <button type="button" aria-label="Close dialog" onClick={closeModal} className="fixed inset-0 bg-slate-950/45 backdrop-blur-[2px]" />
          <section role="dialog" aria-modal="true" aria-labelledby="modal-title" className="relative z-10 w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 id="modal-title" className="text-lg font-semibold text-slate-900">{qrLink ? "Your link QR code" : editingLink ? "Edit link" : "Create a short link"}</h2>
                <p className="mt-1 text-sm text-slate-500">{qrLink ? `Scan to visit /${qrLink.code}` : editingLink ? "Update the destination and expiration date." : "Turn a long URL into a link that's easy to share."}</p>
              </div>
              <button type="button" onClick={closeModal} aria-label="Close dialog" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X size={19} /></button>
            </div>
            {qrLink ? (
              <div className="flex flex-col items-center">
                <div className="rounded-2xl border border-slate-100 bg-white p-5"><QRCodeSVG id="short-link-qr" value={qrLink.shortUrl} size={220} level="H" includeMargin /></div>
                <p className="mt-3 max-w-full truncate text-sm font-medium text-blue-600">{qrLink.shortUrl}</p>
                <button type="button" onClick={downloadQr} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"><Download size={16} /> Download SVG</button>
              </div>
            ) : (
              <form onSubmit={editingLink ? saveEdit : createLink} className="space-y-4">
                <label className="block text-sm font-medium text-slate-700">
                  Destination URL
                  <input type="url" required autoFocus value={editingLink ? editDestination : destination} onChange={(event) => editingLink ? setEditDestination(event.target.value) : setDestination(event.target.value)} placeholder="https://example.com/your-page" className="mt-1.5 w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                </label>
                {editingLink ? (
                  <>
                    {canCustomizeLinks && (
                      <label className="block text-sm font-medium text-slate-700">
                        Short alias <span className="ml-1 font-normal text-slate-400">Locked</span>
                        <input readOnly value={`/${editingLink.code}`} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-500" />
                      </label>
                    )}
                    <fieldset>
                      <legend className="text-sm font-medium text-slate-700">Link status</legend>
                      <div className="mt-1.5 inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
                        {[true, false].map((isActive) => (
                          <button
                            key={String(isActive)}
                            type="button"
                            aria-pressed={editIsActive === isActive}
                            onClick={() => setEditIsActive(isActive)}
                            className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                              editIsActive === isActive
                                ? isActive
                                  ? "bg-white text-emerald-700 shadow-sm"
                                  : "bg-white text-slate-700 shadow-sm"
                                : "text-slate-500 hover:text-slate-700"
                            }`}
                          >
                            {isActive ? "Active" : "Inactive"}
                          </button>
                        ))}
                      </div>
                    </fieldset>
                    {canCustomizeLinks && (
                      <label className="block text-sm font-medium text-slate-700">
                        Expiration date
                        <input type="date" value={editExpiresOn} onChange={(event) => setEditExpiresOn(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                      </label>
                    )}
                  </>
                ) : (
                  <>
                    {canCustomizeLinks && (
                      <>
                        <label className="block text-sm font-medium text-slate-700">
                          Custom alias <span className="font-normal text-slate-400">(optional)</span>
                          <div className="mt-1.5 flex items-center rounded-lg border border-slate-200 px-3.5 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
                            <span className="text-sm text-slate-400">/</span>
                            <input value={alias} onChange={(event) => setAlias(event.target.value.replace(/^\/+/, ""))} placeholder="my-link" className="min-w-0 flex-1 py-2.5 pl-1 text-sm outline-none" />
                          </div>
                        </label>
                        <label className="block text-sm font-medium text-slate-700">
                          Expiration date <span className="font-normal text-slate-400">(optional)</span>
                          <input type="date" min={new Date().toISOString().slice(0, 10)} value={expiresOn} onChange={(event) => setExpiresOn(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                        </label>
                      </>
                    )}
                  </>
                )}
                {formError && <p role="alert" className="text-sm text-red-600">{formError}</p>}
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={closeModal} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
                  <button type="submit" disabled={isSaving || isLoading} className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">{isLoading ? "Loading links…" : isSaving ? "Saving…" : editingLink ? "Save changes" : "Create link"}</button>
                </div>
              </form>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

export default Links;
