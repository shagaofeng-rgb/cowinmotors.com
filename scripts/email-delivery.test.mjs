import assert from "node:assert/strict";
import net from "node:net";
import { test } from "node:test";

test("SMTP uses authenticated sender and routes inquiry to the public inbox", async () => {
  const commands = [];
  const server = net.createServer((socket) => {
    let buffer = "";
    let stage = "command";
    let authStep = 0;
    socket.write("220 Mock SMTP ready\r\n");
    socket.on("data", (chunk) => {
      buffer += chunk.toString();
      while (buffer.includes("\r\n")) {
        const end = buffer.indexOf("\r\n");
        const line = buffer.slice(0, end);
        buffer = buffer.slice(end + 2);
        if (stage === "data") {
          if (line === ".") {
            stage = "command";
            socket.write("250 Accepted\r\n");
          }
          continue;
        }
        commands.push(line);
        if (line.startsWith("EHLO")) socket.write("250 Hello\r\n");
        else if (line === "AUTH LOGIN") { authStep = 1; socket.write("334 Username\r\n"); }
        else if (authStep === 1) { authStep = 2; socket.write("334 Password\r\n"); }
        else if (authStep === 2) { authStep = 0; socket.write("235 Authenticated\r\n"); }
        else if (line.startsWith("MAIL FROM:")) socket.write(line === "MAIL FROM:<smtp-account@example.com>" ? "250 Sender OK\r\n" : "501 Sender must match auth\r\n");
        else if (line.startsWith("RCPT TO:")) socket.write("250 Recipient OK\r\n");
        else if (line === "DATA") { stage = "data"; socket.write("354 End with dot\r\n"); }
        else if (line === "QUIT") socket.write("221 Bye\r\n");
      }
    });
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const previous = Object.fromEntries(["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASSWORD", "SMTP_FROM", "INQUIRY_TO_EMAIL", "SMTP_STARTTLS", "RESEND_API_KEY"].map((key) => [key, process.env[key]]));
  Object.assign(process.env, {
    SMTP_HOST: "127.0.0.1",
    SMTP_PORT: String(address.port),
    SMTP_USER: "smtp-account@example.com",
    SMTP_PASSWORD: "mock-password",
    SMTP_FROM: "info@cowinmotors.com",
    INQUIRY_TO_EMAIL: "wrong-recipient@example.com",
    SMTP_STARTTLS: "false",
    RESEND_API_KEY: "",
  });
  try {
    const { sendInquiryEmail } = await import("../lib/email.ts");
    const result = await sendInquiryEmail({
      source: "test", name: "SMTP transport test", email: "customer@example.com", phone: "+1 555 0100",
      country: "", productType: "", product: "", vehicleInfo: "", quantity: "", requirement: "", createdAt: new Date().toISOString(),
    });
    assert.equal(result.sent, true);
    assert.ok(commands.includes("MAIL FROM:<smtp-account@example.com>"));
    assert.ok(commands.includes("RCPT TO:<info@cowinmotors.com>"));
    assert.ok(!commands.some((command) => command.includes("wrong-recipient@example.com")));
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    await new Promise((resolve) => server.close(resolve));
  }
});
