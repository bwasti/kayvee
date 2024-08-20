# kayvee

### Setup

Download ollama, qwen2 and bun

```
curl -fsSL https://ollama.com/install.sh | sh # if linux, mac has a UI version
ollama pull qwen2:0.5b
curl -fsSL https://bun.sh/install | bash 
bun add ollama
```

If you're running locally on Android, 
you can install ollama with [this guide](https://davidefornelli.com/posts/posts/LLM%20on%20Android.html).

### Run

```
bun server.ts
```
