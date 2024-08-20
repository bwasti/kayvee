import ollama from "ollama";

const modelfile = `
FROM qwen2:0.5b
SYSTEM "you are a casual and extremely concise ai. all lowercase and short responses."
`;
await ollama.create({ model: "kayvee", modelfile: modelfile });

const server = Bun.serve({
  fetch(req, server) {
    // Handle WebSocket upgrade first
    if (server.upgrade(req)) {
      return; // Bun automatically returns a 101 Switching Protocols if upgrade succeeds
    }

    // Handle HTTP requests if not a WebSocket upgrade
    const url = new URL(req.url);
    if (url.pathname === "/" || url.pathname === "/index.html") {
      return new Response(Bun.file("index.html"), {
        headers: { "Content-Type": "text/html" },
      });
    }

    // Handle other routes or return a 404
    return new Response("Not Found", { status: 404 });
  },
  websocket: {
    open(ws) {
      console.log("Client connected");
      ws.messageHistory = [
        { role: "user", content: "hi" },
        { role: "assistant", content: "hello" },
        {
          role: "user",
          content:
            "be terse, avoid punctuation and use lowercase going forward",
        },
        { role: "assistant", content: "ok" },
      ];
    },
    async message(ws, message) {
      let data;
      try {
        data = JSON.parse(message.toString());
      } catch (error) {
        ws.send(JSON.stringify({ type: "error", content: "Invalid JSON" }));
        return;
      }

      if (data.type === "text") {
        ws.messageHistory.push({ role: "user", content: data.content });

        try {
          const response = await ollama.chat({
            model: "kayvee",
            messages: ws.messageHistory,
            stream: true,
          });

          let accumulatedResponse = "";

          for await (const part of response) {
            accumulatedResponse += part.message.content.toLowerCase();
            ws.send(
              JSON.stringify({ type: "text", content: accumulatedResponse }),
            );
          }
          ws.messageHistory.push({
            role: "assistant",
            content: accumulatedResponse,
          });
          for (const l of ws.messageHistory) {
            console.log(l);
          }

          ws.send(
            JSON.stringify({ type: "done", content: "Response completed" }),
          );
        } catch (error) {
          ws.send(JSON.stringify({ type: "error", content: error.message }));
        }
      } else {
        ws.send(
          JSON.stringify({ type: "error", content: "Unknown request type" }),
        );
      }
    },
    close(ws) {
      console.log("Client disconnected");
    },
  },
});

console.log(`Server running at http://${server.hostname}:${server.port}`);
