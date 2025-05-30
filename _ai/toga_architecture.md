# Toga Project: Core Architecture Decisions

This document outlines the foundational architectural choices for the Toga project.

## 1. Core Processing Logic

- **Async Generator for Search:** The primary data retrieval and processing logic (e.g., event searching) will be encapsulated within a TypeScript `async function*` (async generator).
- **Yielding Results:** This core function will `yield` individual results (e.g., found events) as they are processed, enabling streamable output.
- **Reusability:** This design promotes reusability across different application entry points (interactive clients, background jobs).
- **Observability Integration:** The core logic will be instrumented for tracing with LangFuse, providing visibility into the execution flow, especially around external service calls (Search, LLM).

## 2. API Layer: tRPC

- **Technology:** tRPC will be utilized for client-server communication, ensuring end-to-end type safety within the TypeScript ecosystem.
- **Streaming Interactions (Subscriptions):**
  - tRPC subscriptions will serve real-time data to interactive clients (e.g., CLI, future web frontends).
  - Subscription handlers will consume the core async generator, streaming `yielded` results directly to the connected client (typically over WebSockets).
- **Standard Interactions (Queries/Mutations):**
  - tRPC queries and mutations will handle standard request-response operations, such as configuration management or initiating non-streaming tasks.

## 3. Scheduled & Background Task Processing

- **Decoupling with a Message Queue:**
  - BullMQ (a Redis frontend) will be used for decoupling task scheduling/triggering from task execution.
- **Task Triggering:**
  - BullMQ's built-in scheduler will be used to initiate periodic tasks (e.g., recurring searches for email summaries).
  - Triggers will place job messages onto the message queue.
- **Worker Processes:**
  - Dedicated worker processes will consume jobs from the message queue.
  - Workers will execute the core async generator logic.
  - Results from the generator will be collected by the worker for batch operations to compile the email summary.
- **Logging for Background Tasks:**
  - Individual results `yielded` by the core logic during background processing will be logged (e.g., to `systemd` logs) for real-time visibility and debugging.

## 4. Client Interaction Model

- **Initial Client:** A Command Line Interface (CLI) will be the primary initial client.
- **Future Extensibility:** The architecture is designed to readily support other client types, notably web frontends, by leveraging tRPC's capabilities (notably tRPC streaming with WebSockets).

## 5. Search Mechanism

- Google Custom Search Engine (CSE) integrated via the Langchain community extension.
- LLM integration (via Langchain) for relevance assessment and filtering.

## 6. Observability

- **Technology:** LangFuse will be implemented for end-to-end tracing and monitoring of LLM interactions and the overall data processing pipeline.
- **Scope:**
  - Tracing of individual steps within the core async generator.
  - Monitoring calls to external services (Google CSE, LLM provider).
  - Capturing inputs, outputs, and metadata for LLM calls to aid in debugging and performance analysis.
