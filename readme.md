# Chatly - Anonymous Chat Platform

## Overview

**Chatly** is a project I developed as I was practising the implementation
of socket.io and redis.This project basically allows users to chat with Anonymous
users who are currently online.

## Table of Contents

1. [Features](#features)
2. [Technologies Used](#technologies-used)
3. [Setup and Installation](#setup-and-installation)
4. [Environment Variables](#environment-variables)
5. [Database Design](#database-design)
6. [API Documentation](#api-documentation)
7. [Project Structure](#project-structure)
8. [Testing](#testing)
9. [Deployment](#deployment)
10. [Contributing](#contributing)
11. [License](#license)

---

## Features

- No Logins Required.
- Cookies Assigned to each device used as an authentication.
- Socket.io used to update message sent and received in realtime.
- Redis used to store data.

---

## Technologies Used

- **Language:** [TypeScript]
- **Framework and Packages:** [Express.ts, Node.ts, Socket.io]
- **Database:** [Redis]
- **Authentication:** [Cookies]
- **Other Tools:**
  - Logging: [Morgan]
  - Environment Configuration: [dotenv]
  - API Documentation: [Postman]

---

## Setup and Installation

### Prerequisites

1. Install [Node.js](https://nodejs.org/) and npm.
2. Clone the repository:
   ```bash
   git clone https://github.com/PritamU/chatly_backend
   cd your-repo
   ```

### Installation

1. Install dependencies:

   ```bash
   npm install
   ```

2. Set up environment variables (see [Environment Variables](#environment-variables)).

3. Start the application:

   - Development:
     ```bash
     npm run dev
     ```
   - Production:
     ```bash
     npm run start
     ```

4. Access the application at [http://localhost:PORT](http://localhost:PORT).

---

## Environment Variables

Create a `.env` file in the root of the project and configure the following variables:

```plaintext
PORT=The Port Where the application runs
ENV=The Environment (dev and prod)
CORS_DOMAIN=Domains allowed by cors seperated by comma (domain1.com,domain2.com)
COOKIE_DOMAIN=Domain Allowed to set cookie
REDIS_URL = URL of Redis Database
```

---

## Database Design

### Schema

[Provide an overview of the database schema, including the tables and relationships. Optionally, include a diagram.]

#### Example Models:

1. **Users**

   - `id` (Primary Key)
   - `name` (Name of the user assigned randomly)
   - `isOnline` (Boolean if user is online)
   - `unreadMessages` (array of strings of id of users from whom messages have been received but not yet read )
   - `currentSocketId` (currently active socket id)

2. **Messages**
   - `id` (Primary Key)
   - `message` (The message)
   - `initiatorUserId` (ID of the user who texted first)
   - `sender` (The one who sent this message)
   - `receiver` (The one who received this message)
   - `createdAt` (Message Creation time)

---

## API Documentation

API documentation is available at Postman Collection.

#### Example Endpoints:

1. **User Management**

   - `GET /user/auth`: Check User Auth
   - `GET /user/get-user/:userId`: Fetch user details

---

## Project Structure

```plaintext
src/
├── config/             # Configuration files (e.g., interface, socket and redis config)
├── controllers/        # Route controllers
├── middleware/         # Custom middleware (e.g., auth, logging)
├── constants/          # Const values
├── models/             # Database models (e.g., Sequelize, Mongoose)
├── routes/             # API routes
├── utils/              # Utility functions
├── index.ts            # Main application entry point and server setup
```

---

### Hosting Platform

- Render (https://chatlyapi.pritamupadhya.site)
- Netlify (For Frontend - https://chatly.pritamupadhya.site)

---

## Contributing

Contributions are welcome! Please follow these steps:

1. Contributions are not accepted currently.

---

## License

This project is not really licensed to be honest.

---

## Contact

For questions or support, reach out to:

- **Name**: [Pritam Upadhya]
- **Email**: [contactpritam2@gmail.com]
- **GitHub**: [https://github.com/PritamU]
- **Portfolio**: [https://pritamupadhya.site]
