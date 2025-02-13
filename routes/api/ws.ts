import { HandlerContext } from "$fresh/server.ts";

interface Client {
  id: string;
  ws: WebSocket;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
}

const clients = new Map<string, Client>();

interface WSMessage {
  type: "position" | "rotation" | "interaction";
  clientId: string;
  data: any;
}

export const handler = async (req: Request, ctx: HandlerContext): Promise<Response> => {
  const { socket, response } = Deno.upgradeWebSocket(req);
  const clientId = crypto.randomUUID();

  socket.onopen = () => {
    console.log(`Client connected: ${clientId}`);
    clients.set(clientId, {
      id: clientId,
      ws: socket,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
    });

    // 新しいクライアントに現在の接続者情報を送信
    const clientsData = Array.from(clients.values()).map(client => ({
      id: client.id,
      position: client.position,
      rotation: client.rotation,
    }));
    
    socket.send(JSON.stringify({
      type: "init",
      clients: clientsData,
      yourId: clientId,
    }));

    // 他のクライアントに新しいプレイヤーの参加を通知
    broadcastToOthers(clientId, {
      type: "playerJoined",
      clientId,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
    });
  };

  socket.onmessage = (e) => {
    try {
      const message: WSMessage = JSON.parse(e.data);
      const client = clients.get(message.clientId);
      
      if (!client) return;

      switch (message.type) {
        case "position":
          client.position = message.data;
          broadcastToOthers(clientId, {
            type: "playerMoved",
            clientId,
            position: message.data,
          });
          break;

        case "rotation":
          client.rotation = message.data;
          broadcastToOthers(clientId, {
            type: "playerRotated",
            clientId,
            rotation: message.data,
          });
          break;

        case "interaction":
          broadcastToOthers(clientId, {
            type: "playerInteraction",
            clientId,
            data: message.data,
          });
          break;
      }
    } catch (err) {
      console.error("WebSocket message error:", err);
    }
  };

  socket.onclose = () => {
    console.log(`Client disconnected: ${clientId}`);
    clients.delete(clientId);
    broadcastToOthers(clientId, {
      type: "playerLeft",
      clientId,
    });
  };

  return response;
};

function broadcastToOthers(senderId: string, message: any) {
  for (const [clientId, client] of clients.entries()) {
    if (clientId !== senderId) {
      try {
        client.ws.send(JSON.stringify(message));
      } catch (err) {
        console.error(`Failed to send to client ${clientId}:`, err);
      }
    }
  }
}