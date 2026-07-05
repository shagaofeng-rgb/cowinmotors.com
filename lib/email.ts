import net from "node:net";
import tls from "node:tls";
import type { InquiryRecord } from "@/lib/adminData";

const defaultTo = "davidsha@cowinmotors.com";
const defaultCc = "racheljiang@cowinmotors.com";

function env(name: string) {
  return String(process.env[name] || "").trim();
}

function htmlEscape(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[char] || char);
}

function buildInquiryEmail(record: InquiryRecord) {
  const rows = [
    ["Source", record.source],
    ["Name", record.name],
    ["Email", record.email],
    ["Phone / WhatsApp", record.phone],
    ["Country", record.country],
    ["Product Type", record.productType],
    ["Product / Model", record.product],
    ["Vehicle Info", record.vehicleInfo],
    ["Quantity", record.quantity],
    ["Requirement", record.requirement],
    ["Submitted At", record.createdAt],
  ];

  const text = rows.map(([label, value]) => `${label}: ${value || "-"}`).join("\n");
  const htmlRows = rows
    .map(([label, value]) => `<tr><th align="left">${htmlEscape(label)}</th><td>${htmlEscape(value || "-")}</td></tr>`)
    .join("");

  return {
    subject: `[Cowinmotors RFQ] ${record.product || record.productType || "Model request"} - ${record.name}`,
    text,
    html: `<table cellpadding="8" cellspacing="0" border="1" style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px">${htmlRows}</table>`,
  };
}

async function sendViaResend(record: InquiryRecord) {
  const apiKey = env("RESEND_API_KEY");
  if (!apiKey) return null;

  const message = buildInquiryEmail(record);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env("RESEND_FROM_EMAIL") || env("SMTP_FROM") || "Cowinmotors <onboarding@resend.dev>",
      to: [env("INQUIRY_TO_EMAIL") || defaultTo],
      cc: [env("INQUIRY_CC_EMAIL") || defaultCc],
      reply_to: record.email,
      subject: message.subject,
      text: message.text,
      html: message.html,
    }),
  });

  if (!response.ok) {
    throw new Error(`Resend email failed: ${response.status}`);
  }

  return { provider: "resend" };
}

function smtpRead(socket: net.Socket | tls.TLSSocket) {
  return new Promise<string>((resolve, reject) => {
    let buffer = "";
    const onData = (chunk: Buffer) => {
      buffer += chunk.toString("utf8");
      const lines = buffer.split(/\r?\n/).filter(Boolean);
      const last = lines[lines.length - 1] || "";
      if (/^\d{3}\s/.test(last)) {
        cleanup();
        resolve(buffer);
      }
    };
    const onError = (error: Error) => {
      cleanup();
      reject(error);
    };
    const cleanup = () => {
      socket.off("data", onData);
      socket.off("error", onError);
    };
    socket.on("data", onData);
    socket.on("error", onError);
  });
}

async function smtpCommand(socket: net.Socket | tls.TLSSocket, command: string, expected: number[]) {
  socket.write(`${command}\r\n`);
  const response = await smtpRead(socket);
  const code = Number(response.slice(0, 3));
  if (!expected.includes(code)) {
    throw new Error(`SMTP command failed: ${command} -> ${response}`);
  }
  return response;
}

function connectSmtp(host: string, port: number, secure: boolean) {
  return new Promise<net.Socket | tls.TLSSocket>((resolve, reject) => {
    const socket = secure
      ? tls.connect({ host, port, servername: host })
      : net.connect({ host, port });
    socket.once(secure ? "secureConnect" : "connect", () => resolve(socket));
    socket.once("error", reject);
  });
}

function upgradeToTls(socket: net.Socket, host: string) {
  return new Promise<tls.TLSSocket>((resolve, reject) => {
    const secureSocket = tls.connect({ socket, servername: host });
    secureSocket.once("secureConnect", () => resolve(secureSocket));
    secureSocket.once("error", reject);
  });
}

function mimeMessage(record: InquiryRecord, from: string, to: string, cc: string) {
  const message = buildInquiryEmail(record);
  const boundary = `cowinmotors-${Date.now()}`;
  const headers = [
    `From: ${from}`,
    `To: ${to}`,
    `Cc: ${cc}`,
    `Reply-To: ${record.email}`,
    `Subject: ${message.subject}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
  ];
  const body = [
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: 8bit",
    "",
    message.text,
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    "Content-Transfer-Encoding: 8bit",
    "",
    message.html,
    `--${boundary}--`,
  ];
  return [...headers, "", ...body].join("\r\n").replace(/\r?\n\./g, "\r\n..");
}

async function sendViaSmtp(record: InquiryRecord) {
  const host = env("SMTP_HOST");
  const user = env("SMTP_USER");
  const password = env("SMTP_PASSWORD") || env("SMTP_PASS");
  if (!host || !user || !password) return null;

  const port = Number(env("SMTP_PORT") || 587);
  const secure = env("SMTP_SECURE") === "true" || port === 465;
  const from = env("SMTP_FROM") || env("INQUIRY_FROM_EMAIL") || user;
  const to = env("INQUIRY_TO_EMAIL") || defaultTo;
  const cc = env("INQUIRY_CC_EMAIL") || defaultCc;
  let socket = await connectSmtp(host, port, secure);

  await smtpRead(socket);
  await smtpCommand(socket, `EHLO ${env("SMTP_HELO") || "cowinmotors.com"}`, [250]);

  if (!secure && env("SMTP_STARTTLS") !== "false") {
    await smtpCommand(socket, "STARTTLS", [220]);
    socket = await upgradeToTls(socket as net.Socket, host);
    await smtpCommand(socket, `EHLO ${env("SMTP_HELO") || "cowinmotors.com"}`, [250]);
  }

  await smtpCommand(socket, "AUTH LOGIN", [334]);
  await smtpCommand(socket, Buffer.from(user).toString("base64"), [334]);
  await smtpCommand(socket, Buffer.from(password).toString("base64"), [235]);
  await smtpCommand(socket, `MAIL FROM:<${from.replace(/^.*<|>$/g, "")}>`, [250]);
  for (const recipient of [to, cc]) {
    await smtpCommand(socket, `RCPT TO:<${recipient}>`, [250, 251]);
  }
  await smtpCommand(socket, "DATA", [354]);
  await smtpCommand(socket, `${mimeMessage(record, from, to, cc)}\r\n.`, [250]);
  await smtpCommand(socket, "QUIT", [221, 250]);

  return { provider: "smtp" };
}

export async function sendInquiryEmail(record: InquiryRecord) {
  const resend = await sendViaResend(record);
  if (resend) return { sent: true, ...resend };

  const smtp = await sendViaSmtp(record);
  if (smtp) return { sent: true, ...smtp };

  return {
    sent: false,
    provider: "none",
    reason: "Email provider is not configured. Configure SMTP_* or RESEND_API_KEY in Vercel.",
  };
}
