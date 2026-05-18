const TSS_URL =
  "https://script.google.com/macros/s/AKfycbxkwz04fVFCsyfOLzj-LpUVlgUs0QCbkS_M1ugA7rwMed4U4IEoh2eOInwNFc-ZyRylAw/exec";

const AB_URL =
  "https://script.google.com/macros/s/AKfycbyOWV_rrX30sGFin2kzQqWT_aVtUMqT38oCRhYVwMjN00bJzJtkNwCXUzM1gt7qtfYc1A/exec";

let _cachedSenderUrl: string | null = null;

const _senderInit: Promise<void> = (async () => {
  try {
    const res = await fetch(
      `${TSS_URL}?action=getSetting&key=${encodeURIComponent("Active Sender")}`,
    );
    const d = await res.json();
    _cachedSenderUrl = d.value === "AB" ? AB_URL : TSS_URL;
  } catch {
    _cachedSenderUrl = TSS_URL;
  }
})();

async function activeSenderUrl(): Promise<string> {
  if (_cachedSenderUrl !== null) return _cachedSenderUrl;
  await _senderInit;
  return _cachedSenderUrl ?? TSS_URL;
}

async function sendEmailStep(payload: Record<string, unknown>): Promise<void> {
  const url = await activeSenderUrl();
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify(payload),
  });
}

export async function testEmail(
  to: string,
  emailType: "confirmation" | "approval" | "hostedBy" | "hostNotification",
): Promise<{ senderUrl: string; senderLabel: string }> {
  if (!to || !to.trim()) throw new Error("Email address is required.");

  const url = await activeSenderUrl();
  const senderLabel = url === AB_URL ? "AB (Arjav)" : "TSS";

  const commonData = {
    action:        "sendEmail",
    emailType,
    firstName:     "Test",
    lastName:      "Wizard",
    email:         to.trim().toLowerCase(),
    tokenId:       "P934-TEST-001-ABCD",
    hostFirstName: "Arjav",
    hostLastName:  "Badjatya",
    hostFullName:  "Arjav Badjatya",
    hostEmail:     to.trim().toLowerCase(),
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify(commonData),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status} from ${senderLabel}`);

  let result: { success?: boolean; error?: string } | null = null;
  try { result = await res.json(); } catch { /* non-JSON treated as success */ }
  if (result && result.success === false) {
    throw new Error(result.error || `${senderLabel} returned failure`);
  }

  return { senderUrl: url, senderLabel };
}

export interface Registration {
  rowIndex: number;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  school: string;
  grade: string;
  munExp: string;
  munsAttended: string;
  potterhead: string;
  note: string;
  screenshotUrl: string;
  referral: string;
  status: string;
  tokenId: string;
  approvedAt: string;
  isSpecial: string;
  ticketType: string;
  hostedByEmail: string;
  hostedByRow: string;
  specialNote: string;
}

export async function fetchRegistrations(): Promise<Registration[]> {
  const res = await fetch(`${TSS_URL}?action=getRegistrations`);
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error("Unexpected response format");
  return data as Registration[];
}

export async function approveRegistration(
  rowIndex: number,
): Promise<{ tokenId: string; approvedAt: string }> {
  const res = await fetch(TSS_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify({ action: "approveRegistration", rowIndex }),
  });
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || "Approval failed");

  await sendEmailStep({
    action:    "sendEmail",
    emailType: "approval",
    firstName: data.firstName,
    lastName:  data.lastName,
    email:     data.email,
    tokenId:   data.tokenId,
  });

  return { tokenId: data.tokenId, approvedAt: data.approvedAt };
}

export async function bulkApprove(rowIndexes: number[]): Promise<{
  results: Array<{ rowIndex: number; tokenId: string; approvedAt: string }>;
}> {
  const res = await fetch(TSS_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify({ action: "bulkApprove", rowIndexes }),
  });
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || "Bulk approval failed");

  const results: Array<{ rowIndex: number; tokenId: string; approvedAt: string }> =
    data.results ?? [];

  await Promise.allSettled(
    results.map((r: { rowIndex: number; tokenId: string; approvedAt: string; firstName?: string; lastName?: string; email?: string }) =>
      sendEmailStep({
        action:    "sendEmail",
        emailType: "approval",
        firstName: r.firstName ?? "",
        lastName:  r.lastName  ?? "",
        email:     r.email     ?? "",
        tokenId:   r.tokenId,
      }),
    ),
  );

  return { results };
}

export async function resendEmail(rowIndex: number): Promise<void> {
  const res = await fetch(TSS_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify({ action: "resendEmail", rowIndex }),
  });
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || "Resend failed");

  await sendEmailStep({
    action:    "sendEmail",
    emailType: "approval",
    firstName: data.firstName,
    lastName:  data.lastName,
    email:     data.email,
    tokenId:   data.tokenId,
  });
}

export async function getSetting(key: string): Promise<string> {
  const res = await fetch(
    `${TSS_URL}?action=getSetting&key=${encodeURIComponent(key)}`,
  );
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || "getSetting failed");
  return data.value as string;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const res = await fetch(TSS_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify({ action: "setSetting", key, value }),
  });
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || "setSetting failed");
}

export async function manualRegister(payload: {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  school?: string;
  grade?: string;
  munExp?: string;
  munCount?: string;
  potterhead?: string;
  note?: string;
  referral?: string;
  ticketType?: "Complimentary" | "Hosted By" | "";
  hostedByEmail?: string;
  hostedByRow?: number;
  specialNote?: string;
  bypassDuplicateEmail?: boolean;
  bypassScreenshot?: boolean;
  bypassPhoneValidation?: boolean;
  screenshotBase64?: string;
  screenshotMimeType?: string;
  screenshotFileName?: string;
}): Promise<{ success: boolean; tokenId?: string; approvedAt?: string; error?: string }> {
  const res = await fetch(TSS_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify({ action: "manualRegister", ...payload }),
  });
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  const data = await res.json();

  if (data.success) {
    const isHostedBy =
      data.ticketType === "Hosted By" && data.hostEmail;

    if (isHostedBy) {
      await sendEmailStep({
        action:        "sendEmail",
        emailType:     "hostedBy",
        firstName:     data.firstName,
        lastName:      data.lastName,
        email:         data.email,
        tokenId:       data.tokenId,
        hostFirstName: data.hostFirstName,
        hostLastName:  data.hostLastName,
        hostFullName:  data.hostFullName,
        hostEmail:     data.hostEmail,
      });
      await sendEmailStep({
        action:        "sendEmail",
        emailType:     "hostNotification",
        firstName:     data.firstName,
        lastName:      data.lastName,
        email:         data.email,
        tokenId:       data.tokenId,
        hostFirstName: data.hostFirstName,
        hostLastName:  data.hostLastName,
        hostFullName:  data.hostFullName,
        hostEmail:     data.hostEmail,
      });
    } else {
      await sendEmailStep({
        action:    "sendEmail",
        emailType: "approval",
        firstName: data.firstName,
        lastName:  data.lastName,
        email:     data.email,
        tokenId:   data.tokenId,
      });
    }
  }

  return data;
}
