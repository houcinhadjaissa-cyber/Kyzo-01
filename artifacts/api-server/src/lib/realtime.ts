import type { IncomingMessage } from "http";
import type { Socket } from "net";
import type { Server } from "http";

interface SSEClient {
  id: string;
  channel: string;
  write: (data: string) => void;
  close: () => void;
}

const clients = new Map<string, SSEClient>();

export function setupSSE(server: Server) {
  server.on("upgrade", (req: IncomingMessage, socket: Socket) => {
    socket.write("HTTP/1.1 400 Bad Request\r\n\r\n");
    socket.destroy();
  });
}

export function addSSEClient(id: string, channel: string, write: (data: string) => void, close: () => void) {
  clients.set(id, { id, channel, write, close });
}

export function removeSSEClient(id: string) {
  clients.delete(id);
}

export function broadcastEvent(channel: string, event: string, data: unknown) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of clients.values()) {
    if (client.channel === channel || channel === "*") {
      try {
        client.write(payload);
      } catch {
        clients.delete(client.id);
      }
    }
  }
}

export function getClientCount() {
  return clients.size;
}
