# Project Synopsis — CampusBazaar

**Project Title:** CampusBazaar: A Peer-to-Peer University Marketplace and Campus Community Platform
**Course:** Full-Stack Development II (FSD-2)

---

## 1. Abstract

CampusBazaar is a cloud-ready full-stack web application designed to help university students buy, sell, rent, exchange, and give away academic and hostel essentials within their campus community. Built with a **React 18 + Vite + Tailwind CSS + Redux Toolkit** frontend (deployed on **Vercel**) and a **Spring Boot 3 + Spring Security (JWT) + Spring Data MongoDB** backend (deployed on **Render** and backed by **MongoDB Atlas**), the platform brings marketplace discovery, seller inventory management, direct buyer–seller chat, university-scoped Lost & Found notices, and role-based moderation into one cohesive application.

---

## 2. Problem Statement & Motivation

1. **High Cost of Semester Essentials:** Engineering textbooks, lab equipment, and calculators are expensive to buy new for a single semester.
2. **End-of-Semester Hostel Clearance:** Final-year students vacating hostels need a fast, trusted way to pass on study tables, lamps, kettles, and mattresses to juniors on the same campus.
3. **Scattered Campus Notices:** Lost ID cards, calculators, water bottles, and hackathon team calls frequently get buried in informal chat groups.
4. **Trust & Privacy:** Students prefer meeting verified peers at familiar campus landmarks (Central Library, academic blocks, hostel gates) without exposing personal phone numbers publicly.

---

## 3. Core Objectives

- Build a responsive marketplace with server-side search, category hierarchy, condition and budget filters, transaction types (`SALE`, `RENT`, `EXCHANGE`, `GIVEAWAY`), sorting, and pagination.
- Provide a dedicated **Seller Studio (`/sell`)** and **My Listings (`/my-listings`)** dashboard where authenticated students can upload item photos, tag **Student Deals** or **Hostel Clearance** items, edit listings, and toggle items between **Available** and **Sold**.
- Enable private, listing-linked buyer–seller chat (`Conversation` and `ChatMessage`) with unread message notifications (`UserNotification`) and 1-click quick-inquiry prompts.
- Implement a university-scoped **Campus Board (`/campus-board`)** for **Lost**, **Found**, and **Announcement** posts.
- Enforce stateless JWT authentication, password hashing (`BCrypt`), student ID masking, ownership verification, and an **Admin Dashboard (`/admin`)** for student verification, account moderation, and listing report review.

---

## 4. System Architecture & Technology Stack

| Layer | Technology | Role in Application |
| :--- | :--- | :--- |
| **Frontend (Vercel)** | React 18, Vite, Tailwind CSS | Responsive SPA with `vercel.json` rewrite rules for client-side routing |
| **State & Routing** | Redux Toolkit, React Router v6 | Auth session persistence, local wishlist synchronization, and SPA navigation |
| **API Client** | Axios | REST communication, automatic JWT Bearer header injection, and base URL normalization |
| **Backend (Render)** | Java 17, Spring Boot 3.3, Docker | REST controllers, DTO validation, and multi-stage Alpine Docker container |
| **Security** | Spring Security 6, OAuth2 JWT (HS256) | Stateless token issuing/verification, CORS pattern matching (`*.vercel.app`), and role guards |
| **Database (Cloud)** | MongoDB Atlas + Spring Data MongoDB | Document collections (`users`, `universities`, `categories`, `listings`, `conversations`, `chat_messages`, `user_notifications`, `listing_reports`, `campus_posts`, `database_sequences`) |
| **Testing** | JUnit 5, MockMvc, Flapdoodle Mongo, Vitest | End-to-end backend API integration tests and frontend component unit tests |

---

## 5. MongoDB Atlas Collections & Data Model

1. **`universities` (`University`)** — Active partner campuses (Chitkara University, Panjab University, PEC, Thapar, IIT Ropar).
2. **`users` (`User`)** — Student and Admin accounts with `BCrypt` password hashes, masked student IDs, university reference, hostel, and verification status.
3. **`categories` (`Category`)** — Two-level category hierarchy (`Academic`, `Hostel`, `Electronics`, `Fashion`, `Sports & Fitness`, `Appliances`, `Gaming` + subcategories).
4. **`listings` (`Listing`)** — Marketplace items with `Decimal128` price, condition (`LIKE_NEW`, `GOOD`, `FAIR`), transaction type (`SALE`, `RENT`, `EXCHANGE`, `GIVEAWAY`), status (`AVAILABLE`, `SOLD`, `REMOVED`), image data/URL, and deal flags.
5. **`conversations` & `chat_messages` (`Conversation`, `ChatMessage`)** — Participant-scoped buyer–seller threads and message history.
6. **`user_notifications` (`UserNotification`)** — Unread and read message alerts linked to conversations.
7. **`campus_posts` (`CampusPost`)** — University-scoped `LOST`, `FOUND`, and `ANNOUNCEMENT` notices.
8. **`listing_reports` (`ListingReport`)** — User-submitted moderation reports reviewed by administrators.
9. **`database_sequences` (`DatabaseSequence`)** — Atomic sequence counters (`findAndModify` with `$inc`) providing clean sequential numeric IDs across all MongoDB collections.
