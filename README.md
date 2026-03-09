# State Machine AMZ Portal

Web portal for monitoring and managing state-machines-amz-* implementations.

1. This web-portal powers the views directly from the database.
2. The commands are executed over REST via the `state-machine-amz-*` implementations.
3. At present, only [`state-machine-amz-gin`](https://github.com/hussainpithawala/state-machine-amz-gin) provides the necessary endpoints to run this portal. 
4. Future implementations will be provided for other frameworks.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![React](https://img.shields.io/badge/React-19-black?logo=react)

## 📖 Overview

This portal provides a comprehensive UI for monitoring state machine executions, viewing execution history, and debugging state transitions. It connects directly to the PostgreSQL database used by the [`state-machine-amz-go`](https://github.com/hussainpithawala/state-machine-amz-go) library.

## ✨ Features

- 📊 **State Machine Dashboard** - View all registered state machines
- 🔄 **Execution Monitoring** - Real-time tracking of execution status
- 📈 **Execution History** - Detailed timeline of state transitions
- 🔍 **Advanced Search** - Filter executions by status, date, state machine
- 📱 **Responsive Design** - Works on desktop and mobile devices
- 🎨 **Modern UI** - Built with Shadcn UI and Tailwind CSS
- 🚀 **Bulk Execution** - Launch multiple executions with customizable inputs
  - JSON array input or file upload (max 10MB)
  - Configurable concurrency and execution mode
  - Micro-batching support with orchestrator tracking
  - Advanced controls: pause threshold, resume strategy, timeout settings
- 🔁 **Loop Detection** - Automatic detection of repeated state patterns in execution timeline
  - Visual alerts for detected loops
  - Iteration navigation for debugging repetitive state transitions
- 🛡️ **Orchestrator Protection** - Prevent accidental execution of orchestrator state machines

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Shadcn UI
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **State Management**: Zustand (optional)
- **Icons**: Lucide React

## 📦 Prerequisites

- Node.js 24+
- PostgreSQL 14+
- npm or yarn

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/hussainpithawala/state-machine-amz-portal.git
cd state-machine-amz-portal
npm install
npm run dev
```
