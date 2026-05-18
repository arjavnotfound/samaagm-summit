import { useState, useEffect, useCallback, useRef } from "react";

async function compressImageToBase64(
  file: File,
  maxWidth = 1200,
  quality = 0.8,
): Promise<{ base64: string; mimeType: string }> {
  if (file.type === "application/pdf") {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const b64 = (reader.result as string).split(",")[1];
        resolve({ base64: b64, mimeType: "application/pdf" });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("Canvas not supported")); return; }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      const dataUrl = canvas.toDataURL("image/jpeg", quality);
      resolve({ base64: dataUrl.split(",")[1], mimeType: "image/jpeg" });
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Image load failed")); };
    img.src = url;
  });
}
import {
  fetchRegistrations,
  approveRegistration as approveApi,
  bulkApprove as bulkApproveApi,
  resendEmail as resendEmailApi,
  manualRegister as manualRegisterApi,
  getSetting as getSettingApi,
  setSetting as setSettingApi,
  testEmail as testEmailApi,
  Registration,
} from "@/lib/devApi";

interface Toast {
  id: string;
  message: string;
  type: "success" | "error";
}

interface DevPanelProps {
  onClose: () => void;
}

type Section = "review" | "manual" | "settings";

const EMPTY_MANUAL = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  school: "",
  grade: "",
  munExp: "",
  munCount: "",
  potterhead: "",
  note: "",
};

const EMPTY_BYPASS = {
  duplicateEmail: false,
  screenshot: false,
  phone: false,
  all: false,
};

export function DevPanel({ onClose }: DevPanelProps) {
  const [activeSection, setActiveSection] = useState<Section>("review");

  /* ── Review section state ── */
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "reviewed">("all");
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [confirmTarget, setConfirmTarget] = useState<Registration | null>(null);
  const [bulkConfirming, setBulkConfirming] = useState(false);
  const [approvingRows, setApprovingRows] = useState<Set<number>>(new Set());
  const [resendingRows, setResendingRows] = useState<Set<number>>(new Set());
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  /* ── Manual registration state ── */
  const [manualForm, setManualForm] = useState(EMPTY_MANUAL);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [bypasses, setBypasses] = useState(EMPTY_BYPASS);
  const [ticketType, setTicketType] = useState<"" | "Complimentary" | "Hosted By">("");
  const [hostSearch, setHostSearch] = useState("");
  const [selectedHost, setSelectedHost] = useState<Registration | null>(null);
  const [specialNote, setSpecialNote] = useState("");
  const [manualSubmitting, setManualSubmitting] = useState(false);
  const [showHostDropdown, setShowHostDropdown] = useState(false);
  const [manualScreenshot, setManualScreenshot] = useState<File | null>(null);
  const [manualScreenshotName, setManualScreenshotName] = useState("");
  const screenshotInputRef = useRef<HTMLInputElement>(null);

  /* ── Settings state ── */
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsError, setSettingsError] = useState("");
  const [activeSender, setActiveSender] = useState<"TSS" | "AB">("TSS");
  const [registrationOpen, setRegistrationOpen] = useState(true);
  const [eventStage, setEventStage] = useState<"Auto" | "Pre-Event" | "Live" | "Post-Event">("Auto");
  const [settingsSaving, setSettingsSaving] = useState(false);

  /* ── Test Email state ── */
  const [testEmailAddr, setTestEmailAddr] = useState("");
  const [testEmailType, setTestEmailType] = useState<"confirmation" | "approval" | "hostedBy" | "hostNotification">("confirmation");
  const [testEmailSending, setTestEmailSending] = useState(false);
  const [testEmailResult, setTestEmailResult] = useState<{ ok: boolean; msg: string } | null>(null);

  /* ── Toasts ── */
  const [toasts, setToasts] = useState<Toast[]>([]);

  const loadSettings = useCallback(async () => {
    setSettingsLoading(true);
    setSettingsError("");
    try {
      const [senderVal, regVal, stageVal] = await Promise.all([
        getSettingApi("Active Sender"),
        getSettingApi("Registration Status"),
        getSettingApi("Event Stage").catch(() => "Auto"),
      ]);
      setActiveSender(senderVal === "AB" ? "AB" : "TSS");
      setRegistrationOpen(regVal !== "closed");
      if (["Auto", "Pre-Event", "Live", "Post-Event"].includes(stageVal)) {
        setEventStage(stageVal as "Auto" | "Pre-Event" | "Live" | "Post-Event");
      } else {
        setEventStage("Auto");
      }
    } catch {
      setSettingsError("Failed to load settings. Check the GAS deployment.");
    } finally {
      setSettingsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeSection === "settings") {
      loadSettings();
    }
  }, [activeSection, loadSettings]);

  async function saveSetting(key: string, value: string, label: string) {
    setSettingsSaving(true);
    try {
      await setSettingApi(key, value);
      addToast(`${label} updated successfully.`);
    } catch {
      addToast(`Failed to save ${label}.`, "error");
    } finally {
      setSettingsSaving(false);
    }
  }

  const loadRegistrations = useCallback(async () => {
    setLoading(true);
    setFetchError("");
    try {
      const data = await fetchRegistrations();
      setRegistrations(data);
    } catch {
      setFetchError("Failed to load registrations. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRegistrations();
  }, [loadRegistrations]);

  function addToast(message: string, type: "success" | "error" = "success") {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }

  /* ── Review section ── */
  const filtered = registrations.filter((r) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      r.fullName.toLowerCase().includes(q) ||
      r.email.toLowerCase().includes(q) ||
      r.school.toLowerCase().includes(q);
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "pending" && r.status !== "Reviewed") ||
      (statusFilter === "reviewed" && r.status === "Reviewed");
    return matchesSearch && matchesStatus;
  });

  const pendingFiltered = filtered.filter((r) => r.status !== "Reviewed");
  const allPendingSelected =
    pendingFiltered.length > 0 &&
    pendingFiltered.every((r) => selectedRows.has(r.rowIndex));

  function toggleSelect(rowIndex: number) {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(rowIndex)) next.delete(rowIndex);
      else next.add(rowIndex);
      return next;
    });
  }

  function toggleSelectAllPending() {
    if (allPendingSelected) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(pendingFiltered.map((r) => r.rowIndex)));
    }
  }

  async function doApprove(reg: Registration) {
    setConfirmTarget(null);
    setApprovingRows((prev) => new Set([...prev, reg.rowIndex]));
    try {
      const { tokenId, approvedAt } = await approveApi(reg.rowIndex);
      setRegistrations((prev) =>
        prev.map((r) =>
          r.rowIndex === reg.rowIndex
            ? { ...r, status: "Reviewed", tokenId, approvedAt }
            : r,
        ),
      );
      addToast(`${reg.firstName} approved ✓`);
    } catch {
      addToast(`Failed to approve ${reg.firstName}`, "error");
    } finally {
      setApprovingRows((prev) => {
        const next = new Set(prev);
        next.delete(reg.rowIndex);
        return next;
      });
    }
  }

  async function doBulkApprove() {
    setBulkConfirming(false);
    const indices = Array.from(selectedRows);
    setApprovingRows(new Set(indices));
    setSelectedRows(new Set());
    try {
      const { results } = await bulkApproveApi(indices);
      setRegistrations((prev) =>
        prev.map((r) => {
          const res = results.find((x) => x.rowIndex === r.rowIndex);
          if (res) return { ...r, status: "Reviewed", tokenId: res.tokenId, approvedAt: res.approvedAt };
          return r;
        }),
      );
      addToast(`${results.length} registrations approved ✓`);
    } catch {
      addToast("Bulk approval failed", "error");
    } finally {
      setApprovingRows(new Set());
    }
  }

  async function doResend(reg: Registration) {
    setResendingRows((prev) => new Set([...prev, reg.rowIndex]));
    try {
      await resendEmailApi(reg.rowIndex);
      addToast(`Email resent to ${reg.firstName} ✓`);
    } catch {
      addToast(`Failed to resend to ${reg.firstName}`, "error");
    } finally {
      setResendingRows((prev) => {
        const next = new Set(prev);
        next.delete(reg.rowIndex);
        return next;
      });
    }
  }

  function copyToken(tokenId: string) {
    navigator.clipboard.writeText(tokenId).then(() => {
      setCopiedToken(tokenId);
      setTimeout(() => setCopiedToken(null), 2000);
    });
  }

  function formatApprovedAt(str: string) {
    if (!str) return "—";
    try {
      const d = new Date(str);
      return d.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return str;
    }
  }

  const selectedRegs = registrations.filter((r) => selectedRows.has(r.rowIndex));
  const totalPending = registrations.filter((r) => r.status !== "Reviewed").length;
  const totalReviewed = registrations.filter((r) => r.status === "Reviewed").length;

  /* ── Manual registration ── */
  function setMField(key: keyof typeof EMPTY_MANUAL, value: string) {
    setManualForm((f) => ({ ...f, [key]: value }));
  }

  function handleBypassChange(key: keyof typeof EMPTY_BYPASS, value: boolean) {
    if (key === "all") {
      setBypasses({ duplicateEmail: value, screenshot: value, phone: value, all: value });
    } else {
      setBypasses((prev) => {
        const next = { ...prev, [key]: value };
        next.all = next.duplicateEmail && next.screenshot && next.phone;
        return next;
      });
    }
  }

  const filteredHosts = registrations.filter((r) => {
    if (!hostSearch.trim()) return true;
    const q = hostSearch.toLowerCase();
    return r.fullName.toLowerCase().includes(q) || r.email.toLowerCase().includes(q);
  });

  async function handleManualSubmit() {
    const { firstName, lastName, phone, email } = manualForm;
    if (!firstName.trim()) { addToast("First name is required", "error"); return; }
    if (!lastName.trim()) { addToast("Last name is required", "error"); return; }
    if (!email.trim()) { addToast("Email is required", "error"); return; }
    if (!bypasses.phone && !phone.trim()) { addToast("Phone number is required (or bypass phone validation)", "error"); return; }
    if (ticketType === "Hosted By" && !selectedHost) { addToast("Select a host from the list", "error"); return; }

    setManualSubmitting(true);
    try {
      let screenshotBase64 = "";
      let screenshotMimeType = "";
      let screenshotFileName = "";
      if (manualScreenshot) {
        const compressed = await compressImageToBase64(manualScreenshot);
        screenshotBase64 = compressed.base64;
        screenshotMimeType = compressed.mimeType;
        screenshotFileName = `payment_${firstName.trim()}_${lastName.trim()}_${Date.now()}`;
      }

      const result = await manualRegisterApi({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        school: manualForm.school.trim() || undefined,
        grade: manualForm.grade.trim() || undefined,
        munExp: manualForm.munExp || undefined,
        munCount: manualForm.munCount || undefined,
        potterhead: manualForm.potterhead || undefined,
        note: manualForm.note.trim() || undefined,
        ticketType: ticketType || "",
        hostedByEmail: selectedHost?.email || undefined,
        hostedByRow: selectedHost?.rowIndex || undefined,
        specialNote: specialNote.trim() || undefined,
        bypassDuplicateEmail: bypasses.duplicateEmail,
        bypassScreenshot: bypasses.screenshot,
        bypassPhoneValidation: bypasses.phone,
        screenshotBase64: screenshotBase64 || undefined,
        screenshotMimeType: screenshotMimeType || undefined,
        screenshotFileName: screenshotFileName || undefined,
      });
      if (!result.success) {
        addToast(result.error || "Registration failed", "error");
        return;
      }
      addToast("Registration created and approved. Ticket sent.");
      setManualForm(EMPTY_MANUAL);
      setShowAdvanced(false);
      setBypasses(EMPTY_BYPASS);
      setTicketType("");
      setSelectedHost(null);
      setHostSearch("");
      setSpecialNote("");
      setManualScreenshot(null);
      setManualScreenshotName("");
      if (screenshotInputRef.current) screenshotInputRef.current.value = "";
      await loadRegistrations();
    } catch (err: unknown) {
      addToast(err instanceof Error ? err.message : "Unexpected error", "error");
    } finally {
      setManualSubmitting(false);
    }
  }

  async function handleSendTestEmail() {
    if (!testEmailAddr.trim()) return;
    setTestEmailSending(true);
    setTestEmailResult(null);
    try {
      const { senderLabel } = await testEmailApi(testEmailAddr, testEmailType);
      setTestEmailResult({
        ok: true,
        msg: `Sent via ${senderLabel} to ${testEmailAddr.trim().toLowerCase()}. Check the inbox (and spam).`,
      });
    } catch (err: unknown) {
      setTestEmailResult({
        ok: false,
        msg: err instanceof Error ? err.message : "Unknown error — check the GAS deployment.",
      });
    } finally {
      setTestEmailSending(false);
    }
  }

  return (
    <div className="devp-overlay">
      {/* Toasts */}
      <div className="devp-toasts">
        {toasts.map((t) => (
          <div key={t.id} className={`devp-toast devp-toast--${t.type}`}>
            {t.message}
          </div>
        ))}
      </div>

      {/* Single confirm popup */}
      {confirmTarget && (
        <div className="devp-confirm-bg" onClick={() => setConfirmTarget(null)}>
          <div className="devp-confirm-box" onClick={(e) => e.stopPropagation()}>
            <p className="devp-confirm-title">
              Approve {confirmTarget.firstName} {confirmTarget.lastName}?
            </p>
            <p className="devp-confirm-body">
              This will generate their Token ID and send them their official ticket email. This cannot be undone.
            </p>
            <div className="devp-confirm-btns">
              <button className="devp-confirm-cancel" onClick={() => setConfirmTarget(null)}>
                Cancel
              </button>
              <button className="devp-confirm-ok" onClick={() => doApprove(confirmTarget)}>
                Yes, Approve →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk confirm popup */}
      {bulkConfirming && (
        <div className="devp-confirm-bg" onClick={() => setBulkConfirming(false)}>
          <div className="devp-confirm-box" onClick={(e) => e.stopPropagation()}>
            <p className="devp-confirm-title">
              Approve {selectedRows.size} registration{selectedRows.size !== 1 ? "s" : ""}?
            </p>
            <div className="devp-confirm-names">
              {selectedRegs.map((r) => (
                <div key={r.rowIndex} className="devp-confirm-name">
                  · {r.fullName}
                </div>
              ))}
            </div>
            <p className="devp-confirm-body">
              Each will receive a Token ID and official ticket email. This cannot be undone.
            </p>
            <div className="devp-confirm-btns">
              <button className="devp-confirm-cancel" onClick={() => setBulkConfirming(false)}>
                Cancel
              </button>
              <button className="devp-confirm-ok" onClick={doBulkApprove}>
                Yes, Approve All →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Panel */}
      <div className="devp-panel">
        {/* Header */}
        <div className="devp-header">
          <div className="devp-header-left">
            <span className="devp-header-tag">TSS · INTERNAL</span>
            <span className="devp-title">Developer Mode</span>
          </div>
          <button className="devp-close" onClick={onClose}>
            ✕ Logout
          </button>
        </div>

        {/* Section nav */}
        <div className="devp-nav">
          {(["review", "manual", "settings"] as Section[]).map((s) => (
            <button
              key={s}
              className={`devp-nav-btn${activeSection === s ? " devp-nav-btn--active" : ""}`}
              onClick={() => setActiveSection(s)}
            >
              {s === "review" ? "Review Registrations" : s === "manual" ? "Manual Registration" : "⚙ Settings"}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="devp-body">

          {/* ═══ REVIEW SECTION ═══ */}
          {activeSection === "review" && (
            <>
              <div className="devp-section-head">Review Registrations</div>

              <div className="devp-controls">
                <input
                  className="devp-search"
                  placeholder="Search by name, email, or school..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="devp-filter-row">
                  <div className="devp-tabs">
                    {(["all", "pending", "reviewed"] as const).map((f) => (
                      <button
                        key={f}
                        className={`devp-tab${statusFilter === f ? " devp-tab--active" : ""}`}
                        onClick={() => setStatusFilter(f)}
                      >
                        {f === "all" ? "All" : f === "pending" ? "Pending" : "Reviewed"}
                        <span className="devp-tab-count">
                          {f === "all"
                            ? registrations.length
                            : f === "pending"
                              ? totalPending
                              : totalReviewed}
                        </span>
                      </button>
                    ))}
                  </div>
                  <button className="devp-refresh" onClick={loadRegistrations} title="Refresh">
                    ↻ Refresh
                  </button>
                </div>
              </div>

              {loading && <div className="devp-state">Loading registrations…</div>}
              {fetchError && <div className="devp-state devp-state--error">{fetchError}</div>}

              {!loading && !fetchError && (
                <div className="devp-table-wrap">
                  <table className="devp-table">
                    <thead>
                      <tr>
                        <th className="devp-th-check">
                          <input
                            type="checkbox"
                            className="devp-check"
                            checked={allPendingSelected}
                            onChange={toggleSelectAllPending}
                            title="Select all pending"
                          />
                        </th>
                        <th>#</th>
                        <th>Full Name</th>
                        <th>Email</th>
                        <th>School / College</th>
                        <th>Approval Time</th>
                        <th>Token ID</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((r, idx) => {
                        const isPending = r.status !== "Reviewed";
                        const isApproving = approvingRows.has(r.rowIndex);
                        const isResending = resendingRows.has(r.rowIndex);
                        return (
                          <tr
                            key={r.rowIndex}
                            className={`devp-row${isPending ? "" : " devp-row--reviewed"}${selectedRows.has(r.rowIndex) ? " devp-row--selected" : ""}`}
                          >
                            <td className="devp-td-check">
                              {isPending && (
                                <input
                                  type="checkbox"
                                  className="devp-check"
                                  checked={selectedRows.has(r.rowIndex)}
                                  onChange={() => toggleSelect(r.rowIndex)}
                                />
                              )}
                            </td>
                            <td className="devp-td-num">{idx + 1}</td>
                            <td className="devp-td-name">
                              {r.fullName || "—"}
                              {r.isSpecial === "TRUE" && r.ticketType === "Complimentary" && (
                                <span className="devp-badge devp-badge--comp">COMP</span>
                              )}
                              {r.isSpecial === "TRUE" && r.ticketType === "Hosted By" && (
                                <span className="devp-badge devp-badge--hosted">HOSTED</span>
                              )}
                            </td>
                            <td className="devp-td-email">{r.email || "—"}</td>
                            <td className="devp-td-school">{r.school || "—"}</td>
                            <td className="devp-td-time">{formatApprovedAt(r.approvedAt)}</td>
                            <td className="devp-td-token">
                              {r.tokenId ? (
                                <button
                                  className="devp-token-btn"
                                  onClick={() => copyToken(r.tokenId)}
                                  title="Click to copy"
                                >
                                  {r.tokenId}
                                  <span className="devp-copy-icon">
                                    {copiedToken === r.tokenId ? "✓" : "⧉"}
                                  </span>
                                </button>
                              ) : (
                                <span className="devp-td-empty">—</span>
                              )}
                            </td>
                            <td className="devp-td-status">
                              {isPending ? (
                                <button
                                  className="devp-status-btn devp-status-btn--pending"
                                  onClick={() => setConfirmTarget(r)}
                                  disabled={isApproving}
                                >
                                  {isApproving ? "Approving…" : "Pending Review"}
                                </button>
                              ) : (
                                <div className="devp-reviewed-cell">
                                  <span className="devp-status-btn devp-status-btn--reviewed">
                                    Reviewed ✓
                                  </span>
                                  <button
                                    className="devp-resend-btn"
                                    onClick={() => doResend(r)}
                                    disabled={isResending}
                                  >
                                    {isResending ? "Sending…" : "Resend Email"}
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      {filtered.length === 0 && (
                        <tr>
                          <td colSpan={8} className="devp-empty">
                            No registrations match your filter.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {/* ═══ MANUAL REGISTRATION SECTION ═══ */}
          {activeSection === "manual" && (
            <div className="devp-manual-wrap">
              <div className="devp-section-head">Manual Registration</div>

              <div className="devp-manual-form">
                {/* Required fields */}
                <div className="devp-form-grid">
                  <div className="devp-form-group">
                    <label className="devp-form-label">First Name *</label>
                    <input
                      className="devp-form-input"
                      value={manualForm.firstName}
                      onChange={(e) => setMField("firstName", e.target.value)}
                      placeholder="e.g. Harry"
                    />
                  </div>
                  <div className="devp-form-group">
                    <label className="devp-form-label">Last Name *</label>
                    <input
                      className="devp-form-input"
                      value={manualForm.lastName}
                      onChange={(e) => setMField("lastName", e.target.value)}
                      placeholder="e.g. Potter"
                    />
                  </div>
                  <div className="devp-form-group">
                    <label className="devp-form-label">Phone Number {bypasses.phone ? "" : "*"}</label>
                    <input
                      className="devp-form-input"
                      value={manualForm.phone}
                      onChange={(e) => setMField("phone", e.target.value)}
                      placeholder="+91 98765 43210"
                    />
                  </div>
                  <div className="devp-form-group">
                    <label className="devp-form-label">Email Address *</label>
                    <input
                      className="devp-form-input"
                      type="email"
                      value={manualForm.email}
                      onChange={(e) => setMField("email", e.target.value)}
                      placeholder="wizard@hogwarts.edu"
                    />
                  </div>
                </div>

                {/* Payment Screenshot (optional) */}
                <div className="devp-form-group devp-form-group--full devp-screenshot-group">
                  <label className="devp-form-label">Payment Screenshot <span className="devp-form-optional">(optional)</span></label>
                  <div
                    className={`devp-screenshot-drop${manualScreenshotName ? " devp-screenshot-drop--has-file" : ""}`}
                    onClick={() => screenshotInputRef.current?.click()}
                  >
                    <input
                      ref={screenshotInputRef}
                      type="file"
                      accept="image/*,application/pdf"
                      style={{ display: "none" }}
                      onChange={(e) => {
                        const file = e.target.files?.[0] ?? null;
                        if (file && file.size > 10 * 1024 * 1024) {
                          addToast("File is too large — maximum size is 10 MB", "error");
                          e.target.value = "";
                          return;
                        }
                        setManualScreenshot(file);
                        setManualScreenshotName(file?.name ?? "");
                      }}
                    />
                    {manualScreenshotName ? (
                      <>
                        <span className="devp-screenshot-icon">📎</span>
                        <span className="devp-screenshot-filename">{manualScreenshotName}</span>
                        <button
                          className="devp-screenshot-clear"
                          onClick={(e) => {
                            e.stopPropagation();
                            setManualScreenshot(null);
                            setManualScreenshotName("");
                            if (screenshotInputRef.current) screenshotInputRef.current.value = "";
                          }}
                        >
                          ✕
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="devp-screenshot-icon">↑</span>
                        <span className="devp-screenshot-hint">Click to upload screenshot or PDF</span>
                        <span className="devp-screenshot-sub">Max 10 MB · Image or PDF</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Advanced Settings */}
                <div className="devp-advanced-toggle" onClick={() => setShowAdvanced((v) => !v)}>
                  Advanced Settings {showAdvanced ? "▴" : "▾"}
                </div>
                {showAdvanced && (
                  <div className="devp-advanced-body">
                    <div className="devp-form-grid">
                      <div className="devp-form-group">
                        <label className="devp-form-label">School / College</label>
                        <input
                          className="devp-form-input"
                          value={manualForm.school}
                          onChange={(e) => setMField("school", e.target.value)}
                          placeholder="Hogwarts School of Witchcraft…"
                        />
                      </div>
                      <div className="devp-form-group">
                        <label className="devp-form-label">Grade / Year</label>
                        <input
                          className="devp-form-input"
                          value={manualForm.grade}
                          onChange={(e) => setMField("grade", e.target.value)}
                          placeholder="e.g. 11th / 2nd Year"
                        />
                      </div>
                      <div className="devp-form-group">
                        <label className="devp-form-label">MUN Experience</label>
                        <select
                          className="devp-form-select"
                          value={manualForm.munExp}
                          onChange={(e) => setMField("munExp", e.target.value)}
                        >
                          <option value="">Select…</option>
                          <option value="yes">Yes — attended MUNs</option>
                          <option value="heard">I've heard of it</option>
                          <option value="no">Not really</option>
                        </select>
                      </div>
                      <div className="devp-form-group">
                        <label className="devp-form-label">MUNs Attended</label>
                        <input
                          className="devp-form-input"
                          type="number"
                          min="0"
                          value={manualForm.munCount}
                          onChange={(e) => setMField("munCount", e.target.value)}
                          placeholder="0"
                        />
                      </div>
                      <div className="devp-form-group">
                        <label className="devp-form-label">Potterhead?</label>
                        <select
                          className="devp-form-select"
                          value={manualForm.potterhead}
                          onChange={(e) => setMField("potterhead", e.target.value)}
                        >
                          <option value="">Select…</option>
                          <option value="mainly-hp">Potterhead — mainly for HP activities</option>
                          <option value="hp-rave">Potterhead — and hyped for the rave</option>
                          <option value="just-rave">Not really, just here for the rave</option>
                          <option value="friends">Just hanging out with friends</option>
                        </select>
                      </div>
                    </div>
                    <div className="devp-form-group devp-form-group--full">
                      <label className="devp-form-label">Note</label>
                      <textarea
                        className="devp-form-textarea"
                        value={manualForm.note}
                        onChange={(e) => setMField("note", e.target.value)}
                        placeholder="Any internal notes…"
                        rows={3}
                      />
                    </div>
                  </div>
                )}

                {/* Bypass Rules */}
                <div className="devp-section-label">Bypass Rules</div>
                <div className="devp-bypass-group">
                  <label className="devp-bypass-row">
                    <input
                      type="checkbox"
                      className="devp-check"
                      checked={bypasses.all}
                      onChange={(e) => handleBypassChange("all", e.target.checked)}
                    />
                    <span className="devp-bypass-label">
                      <strong>Bypass all validation</strong>
                      <span className="devp-bypass-desc">Master toggle — enables all bypasses below</span>
                    </span>
                  </label>
                  <label className="devp-bypass-row">
                    <input
                      type="checkbox"
                      className="devp-check"
                      checked={bypasses.duplicateEmail}
                      onChange={(e) => handleBypassChange("duplicateEmail", e.target.checked)}
                    />
                    <span className="devp-bypass-label">
                      Bypass duplicate email check
                      <span className="devp-bypass-desc">Allows re-registering an existing email</span>
                    </span>
                  </label>
                  <label className="devp-bypass-row">
                    <input
                      type="checkbox"
                      className="devp-check"
                      checked={bypasses.screenshot}
                      onChange={(e) => handleBypassChange("screenshot", e.target.checked)}
                    />
                    <span className="devp-bypass-label">
                      Bypass payment screenshot requirement
                      <span className="devp-bypass-desc">Registers without a screenshot</span>
                    </span>
                  </label>
                  <label className="devp-bypass-row">
                    <input
                      type="checkbox"
                      className="devp-check"
                      checked={bypasses.phone}
                      onChange={(e) => handleBypassChange("phone", e.target.checked)}
                    />
                    <span className="devp-bypass-label">
                      Bypass phone validation
                      <span className="devp-bypass-desc">Skips phone number format check</span>
                    </span>
                  </label>
                </div>

                {/* Special Ticket */}
                <div className="devp-section-label">Special Ticket</div>
                <div className="devp-form-group">
                  <label className="devp-form-label">Ticket Type</label>
                  <select
                    className="devp-form-select"
                    value={ticketType}
                    onChange={(e) => {
                      setTicketType(e.target.value as "" | "Complimentary" | "Hosted By");
                      setSelectedHost(null);
                      setHostSearch("");
                      setSpecialNote("");
                    }}
                  >
                    <option value="">None — Standard Entry</option>
                    <option value="Complimentary">Complimentary Entry</option>
                    <option value="Hosted By">Hosted By Existing Registrant</option>
                  </select>
                </div>

                {ticketType === "Complimentary" && (
                  <div className="devp-form-group devp-form-group--full">
                    <label className="devp-form-label">Special Note</label>
                    <input
                      className="devp-form-input"
                      value={specialNote}
                      onChange={(e) => setSpecialNote(e.target.value)}
                      placeholder="e.g. Invited speaker, Media guest…"
                    />
                  </div>
                )}

                {ticketType === "Hosted By" && (
                  <>
                    <div className="devp-form-group devp-form-group--full" style={{ position: "relative" }}>
                      <label className="devp-form-label">Host — Search Existing Registrant</label>
                      {selectedHost ? (
                        <div className="devp-host-selected">
                          <span>{selectedHost.fullName} — {selectedHost.email}</span>
                          <button
                            className="devp-host-clear"
                            onClick={() => { setSelectedHost(null); setHostSearch(""); }}
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <>
                          <input
                            className="devp-form-input"
                            value={hostSearch}
                            onChange={(e) => { setHostSearch(e.target.value); setShowHostDropdown(true); }}
                            onFocus={() => setShowHostDropdown(true)}
                            placeholder="Search by name or email…"
                          />
                          {showHostDropdown && (
                            <div className="devp-host-dropdown">
                              {filteredHosts.length === 0 && (
                                <div className="devp-host-option devp-host-option--empty">No registrants found</div>
                              )}
                              {filteredHosts.slice(0, 20).map((r) => (
                                <div
                                  key={r.rowIndex}
                                  className="devp-host-option"
                                  onClick={() => {
                                    setSelectedHost(r);
                                    setHostSearch("");
                                    setShowHostDropdown(false);
                                  }}
                                >
                                  <span className="devp-host-name">{r.fullName}</span>
                                  <span className="devp-host-email">{r.email}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    <div className="devp-form-group devp-form-group--full">
                      <label className="devp-form-label">Special Note</label>
                      <input
                        className="devp-form-input"
                        value={specialNote}
                        onChange={(e) => setSpecialNote(e.target.value)}
                        placeholder="e.g. Guest of the host…"
                      />
                    </div>
                  </>
                )}

                {/* Submit */}
                <div className="devp-manual-submit-row">
                  <button
                    className="devp-manual-submit"
                    onClick={handleManualSubmit}
                    disabled={manualSubmitting}
                  >
                    {manualSubmitting ? "Submitting…" : "Register & Approve →"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ═══ SETTINGS SECTION ═══ */}
          {activeSection === "settings" && (
            <div className="devp-settings">
              <div className="devp-section-head">Settings</div>

              {settingsLoading ? (
                <div className="devp-loading">Loading settings…</div>
              ) : settingsError ? (
                <div className="devp-error-banner">{settingsError}</div>
              ) : (
                <>
                  {/* Email Sender */}
                  <div className="devp-settings-card">
                    <div className="devp-settings-card-title">Email Sender</div>
                    <p className="devp-settings-card-desc">
                      Choose which Gmail account sends all confirmation and ticket emails.
                      <br />
                      <strong>TSS</strong> — thesamaagmsummit@gmail.com (default)
                      <br />
                      <strong>AB</strong> — arjavbadjatya1026@gmail.com (relay via AB.gs)
                    </p>
                    <div className="devp-settings-row">
                      <label className="devp-settings-label">Active Sender</label>
                      <div className="devp-settings-toggle-group">
                        {(["TSS", "AB"] as const).map((opt) => (
                          <button
                            key={opt}
                            className={`devp-settings-toggle-btn${activeSender === opt ? " devp-settings-toggle-btn--active" : ""}`}
                            disabled={settingsSaving}
                            onClick={async () => {
                              setActiveSender(opt);
                              await saveSetting("Active Sender", opt, "Active Sender");
                            }}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="devp-settings-hint">
                      Current: <strong>{activeSender === "AB" ? "AB (Arjav Badjatya)" : "TSS (The Samaagm Summit)"}</strong>
                    </div>
                  </div>

                  {/* Registration Status */}
                  <div className="devp-settings-card">
                    <div className="devp-settings-card-title">Registration Status</div>
                    <p className="devp-settings-card-desc">
                      Control whether the public can submit new registrations on the Register page.
                      When <strong>Closed</strong>, visitors see a banner and a modal directing them to walk-in or contact.
                    </p>
                    <div className="devp-settings-row">
                      <label className="devp-settings-label">Status</label>
                      <div className="devp-settings-toggle-group">
                        {([true, false] as const).map((isOpen) => (
                          <button
                            key={String(isOpen)}
                            className={`devp-settings-toggle-btn${registrationOpen === isOpen ? " devp-settings-toggle-btn--active" + (isOpen ? "" : " devp-settings-toggle-btn--danger") : ""}`}
                            disabled={settingsSaving}
                            onClick={async () => {
                              setRegistrationOpen(isOpen);
                              await saveSetting("Registration Status", isOpen ? "open" : "closed", "Registration Status");
                            }}
                          >
                            {isOpen ? "Open" : "Closed"}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="devp-settings-hint">
                      Current: <strong>{registrationOpen ? "Open — new registrations accepted" : "Closed — walk-in / contact only"}</strong>
                    </div>
                  </div>

                  {/* Event Stage */}
                  <div className="devp-settings-card">
                    <div className="devp-settings-card-title">Event Stage</div>
                    <p className="devp-settings-card-desc">
                      Override the time-based countdown logic on the Platform 9¾ page.
                      <br />
                      <strong>Auto</strong> — uses real time to determine the stage (default).
                      <br />
                      <strong>Pre-Event</strong> — forces the countdown timer display.
                      <br />
                      <strong>Live</strong> — forces the live event display.
                      <br />
                      <strong>Post-Event</strong> — forces the ended / "Mischief Managed" display.
                    </p>
                    <div className="devp-settings-row">
                      <label className="devp-settings-label">Stage</label>
                      <div className="devp-settings-toggle-group">
                        {(["Auto", "Pre-Event", "Live", "Post-Event"] as const).map((opt) => (
                          <button
                            key={opt}
                            className={`devp-settings-toggle-btn${eventStage === opt ? " devp-settings-toggle-btn--active" : ""}`}
                            disabled={settingsSaving}
                            onClick={async () => {
                              setEventStage(opt);
                              await saveSetting("Event Stage", opt, "Event Stage");
                            }}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="devp-settings-hint">
                      Current: <strong>{eventStage === "Auto" ? "Auto — driven by real time" : `${eventStage} (manual override)`}</strong>
                    </div>
                  </div>

                  {/* Test Email */}
                  <div className="devp-settings-card devp-test-email-card">
                    <div className="devp-settings-card-title">Test Email Sender</div>
                    <p className="devp-settings-card-desc">
                      Fire a real test email through the <strong>currently active sender</strong> ({activeSender === "AB" ? "AB — Arjav Badjatya" : "TSS — The Samaagm Summit"}).
                      Useful to verify the sender is deployed and working correctly.
                    </p>

                    <div className="devp-test-email-row">
                      <label className="devp-settings-label">Email Type</label>
                      <select
                        className="devp-test-email-select"
                        value={testEmailType}
                        disabled={testEmailSending}
                        onChange={(e) => {
                          setTestEmailType(e.target.value as typeof testEmailType);
                          setTestEmailResult(null);
                        }}
                      >
                        <option value="confirmation">confirmation — Payment received, pending review</option>
                        <option value="approval">approval — Ticket confirmed + QR code</option>
                        <option value="hostedBy">hostedBy — Hosted-by guest ticket</option>
                        <option value="hostNotification">hostNotification — Host notification</option>
                      </select>
                    </div>

                    <div className="devp-test-email-row">
                      <label className="devp-settings-label">Send to</label>
                      <div className="devp-test-email-input-group">
                        <input
                          className="devp-test-email-input"
                          type="email"
                          placeholder="test@example.com"
                          value={testEmailAddr}
                          disabled={testEmailSending}
                          onChange={(e) => {
                            setTestEmailAddr(e.target.value);
                            setTestEmailResult(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !testEmailSending && testEmailAddr.trim()) {
                              void handleSendTestEmail();
                            }
                          }}
                        />
                        <button
                          className={`devp-test-email-btn${testEmailSending ? " devp-test-email-btn--loading" : ""}`}
                          disabled={testEmailSending || !testEmailAddr.trim()}
                          onClick={handleSendTestEmail}
                        >
                          {testEmailSending ? "Sending…" : "Send Test →"}
                        </button>
                      </div>
                    </div>

                    {testEmailResult && (
                      <div className={`devp-test-email-result${testEmailResult.ok ? " devp-test-email-result--ok" : " devp-test-email-result--err"}`}>
                        {testEmailResult.ok ? "✓" : "✕"} {testEmailResult.msg}
                      </div>
                    )}
                  </div>

                  {/* Refresh */}
                  <div className="devp-settings-refresh-row">
                    <button
                      className="devp-settings-refresh-btn"
                      disabled={settingsLoading || settingsSaving}
                      onClick={loadSettings}
                    >
                      ↻ Refresh settings
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Bulk approve floating bar */}
      {activeSection === "review" && selectedRows.size > 0 && (
        <div className="devp-bulk-bar">
          <span className="devp-bulk-count">
            {selectedRows.size} selected
          </span>
          <button
            className="devp-bulk-approve"
            onClick={() => setBulkConfirming(true)}
          >
            Approve {selectedRows.size} selected →
          </button>
          <button
            className="devp-bulk-clear"
            onClick={() => setSelectedRows(new Set())}
            title="Clear selection"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
