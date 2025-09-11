# Agent UI

A modern chat interface for AgentOS built with Next.js, Tailwind CSS, and TypeScript. This template provides a ready-to-use UI for connecting to and interacting with your AgentOS instances through the Agno platform.

<img src="https://github.com/user-attachments/assets/7765fae5-a813-46cb-993b-904af9bc1672" alt="agent-ui" style="border-radius: 10px; width: 100%; max-width: 800px;" />

## Features

- 🔗 **AgentOS Integration**: Seamlessly connect to local and live AgentOS instances
- 💬 **Modern Chat Interface**: Clean design with real-time streaming support
- 🧩 **Tool Calls Support**: Visualizes agent tool calls and their results
- 🧠 **Reasoning Steps**: Displays agent reasoning process (when available)
- 📚 **References Support**: Show sources used by the agent
- 🖼️ **Multi-modality Support**: Handles various content types including images, video, and audio
- 🎨 **Customizable UI**: Built with Tailwind CSS for easy styling
- 🧰 **Built with Modern Stack**: Next.js, TypeScript, shadcn/ui, Framer Motion, and more

## Version Support

- **Main Branch**: Supports AgentOS v2.0 (recommended)
- **v1.1 Branch**: Supports AgentOS v1.x for legacy compatibility

## Getting Started

### Prerequisites

Before setting up Agent UI, you need a running AgentOS instance. If you haven't created one yet, check out our [Creating Your First OS](/agent-os/creating-your-first-os) guide.

> **Note**: Agent UI connects to AgentOS instances through the Agno platform. Make sure your AgentOS is running before attempting to connect.

### Installation

### Automatic Installation (Recommended)

```bash
npx create-agent-ui@latest
```

### Manual Installation

1. Clone the repository:

```bash
git clone https://github.com/agno-agi/agent-ui.git
cd agent-ui
```

2. Install dependencies:

```bash
pnpm install
```

3. Start the development server:

```bash
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Connecting to Your AgentOS

Agent UI connects directly to your AgentOS instance, allowing you to interact with your agents through a modern chat interface.

> **Prerequisites**: You need a running AgentOS instance before you can connect Agent UI to it. If you haven't created one yet, check out our [Creating Your First OS](https://docs.agno.com/agent-os/creating-your-first-os) guide.

## Step-by-Step Connection Process

### 1. Configure the Endpoint

By default, Agent UI connects to `http://localhost:7777`. You can easily change this by:

1. Hovering over the endpoint URL in the left sidebar
2. Clicking the edit option to modify the connection settings

### 2. Choose Your Environment

- **Local Development**: Use `http://localhost:7777` (default) or your custom local port
- **Production**: Enter your production AgentOS HTTPS URL

> **Warning**: Make sure your AgentOS is actually running on the specified endpoint before attempting to connect.

### 3. Test the Connection

Once you've configured the endpoint:

1. The Agent UI will automatically attempt to connect to your AgentOS
2. If successful, you'll see your agents available in the chat interface
3. If there are connection issues, check that your AgentOS is running and accessible. Check out the troubleshooting guide [here](https://docs.agno.com/faq/agentos-connection)



## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution guidelines.

## License

This project is licensed under the [MIT License](./LICENSE).
