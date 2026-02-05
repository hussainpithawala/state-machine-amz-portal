# State Machine AMZ Portal

Web portal for monitoring and managing AWS Step Functions compatible state machines implemented in Go.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![React](https://img.shields.io/badge/React-18-black?logo=react)

## 📖 Overview

This portal provides a comprehensive UI for monitoring state machine executions, viewing execution history, and debugging state transitions. It connects directly to the PostgreSQL database used by the [`state-machine-amz-go`](https://github.com/hussainpithawala/state-machine-amz-go) library.

## ✨ Features

- 📊 **State Machine Dashboard** - View all registered state machines
- 🔄 **Execution Monitoring** - Real-time tracking of execution status
- 📈 **Execution History** - Detailed timeline of state transitions
- 🔍 **Advanced Search** - Filter executions by status, date, state machine
- 📱 **Responsive Design** - Works on desktop and mobile devices
- 🎨 **Modern UI** - Built with Shadcn UI and Tailwind CSS

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
