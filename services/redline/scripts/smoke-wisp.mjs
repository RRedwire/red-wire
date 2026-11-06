import { client as wisp } from "@mercuryworkshop/wisp-js/client";

const relay = process.argv[2] || "ws://127.0.0.1:8099/wisp/";
const host = process.argv[3] || "example.com";
const port = Number(process.argv[4] || 80);

const timeout = setTimeout(() => {
  console.error("smoke: timed out");
  process.exit(1);
}, 15000);

const conn = new wisp.ClientConnection(relay);

conn.onopen = () => {
  const stream = conn.create_stream(host, port);
  const decoder = new TextDecoder();
  let text = "";

  stream.onmessage = (chunk) => {
    text += decoder.decode(chunk);
    if (text.includes("</html>") || text.length > 8192) {
      clearTimeout(timeout);
      const status = text.split("\r\n")[0];
      const ok = /example domain/i.test(text);
      console.log(`smoke: ${status}`);
      console.log(`smoke: ${text.length} bytes over wisp`);
      console.log(`smoke: ${ok ? "ok" : "unexpected body"}`);
      conn.close();
      process.exit(ok ? 0 : 1);
    }
  };

  stream.onclose = (reason) => {
    clearTimeout(timeout);
    console.error(`smoke: stream closed early (${reason})`);
    process.exit(1);
  };

  stream.send(new TextEncoder().encode(`GET / HTTP/1.1\r\nHost: ${host}\r\nConnection: close\r\n\r\n`));
};

conn.onerror = () => {
  clearTimeout(timeout);
  console.error("smoke: websocket error");
  process.exit(1);
};
