# PERN Task Management App

A simple task management app built with PostgreSQL, Express, React, and Node.js.

## Features
- Add, edit, complete, and delete tasks
- Persistent storage with PostgreSQL
- Responsive React UI

## Getting started
1. Install PostgreSQL and create a database named `taskdb`.
2. Create a `.env` file in the server folder with:
   ```env
   PORT=5000
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/taskdb
   ```
3. Install dependencies:
   ```bash
   npm run install:all
   ```
4. Start the app:
   ```bash
   npm run dev
   ```
5. Open the client at http://localhost:5173 and the API at http://localhost:5000.
