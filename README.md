# Grimm Dominion Repository Guide

This repository contains both the Unity prototype assets and the browser-based vertical slice that
runs in GitHub Codespaces. Follow the steps below to get the web build running.

## Quick Start in Codespaces
1. Install dependencies from the repository root:
   ```bash
   npm install
   ```
   The root manifest proxies installation to the `web/` workspace so the required packages are
   downloaded automatically.
2. Start the development server (bind to all interfaces for Codespaces):
   ```bash
   npm run dev
   ```
3. Open the forwarded port (default `5173`) to interact with the prototype.

For more details about the browser build, including available npm scripts and folder structure, see
[`web/README.md`](web/README.md).
