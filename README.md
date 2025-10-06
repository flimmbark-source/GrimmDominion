# Grimm Dominion Repository Guide

This repository contains the browser-based vertical slice for Grimm Dominion. The prototype is
implemented with a TypeScript/Phaser stack and is intended to run entirely in the browser, making it
easy to iterate inside GitHub Codespaces or a local development environment. Follow the steps below
to get the web build running.

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
