
# Quiet Network

**The Anti-Nextdoor.** A hyperlocal, ephemeral community platform built for calm, private neighborhood interactions.

Quiet Network fills the gap between high-noise, permanent social media and shallow, real-name-based neighborhood apps. It prioritizes **ephemerality**, **privacy**, and a **calm user experience**.

## ✨ Core Pillars

-   **Variable Ephemerality:** Posts are temporary by nature. Authors choose the "breath" of their post—48 hours for quick chats, 7 days for local news, or 30 days for community notices.
    
-   **Hyperlocal Circles:** Focus on your immediate community. The platform is launching with a pilot in **Haarlem** and **Amsterdam-West**.
    
-   **Pseudonymous Identity:** Engage with persistent display names without the privacy risks or drama associated with real-name requirements.
    
-   **Calm UX:** No follower counts, no public karma scores, and no gamification designed to trigger dopamine loops.
    
-   **Privacy-First:** EU-hosted (Frankfurt) infrastructure with no ads, no data selling, and no tracking.
    

## 🛠️ Tech Stack

Built with a modern, high-performance stack optimized for rapid iteration and scalability:

-   **Frontend:**  [React 18+](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
    
-   **Build Tool:**  [Vite](https://vitejs.dev/)
    
-   **Styling:**  [Tailwind CSS](https://tailwindcss.com/)
    
-   **UI Components:**  [shadcn/ui](https://ui.shadcn.com/)
    
-   **Backend:**  [Supabase](https://supabase.com/) (Postgres + Auth + Realtime)
    
-   **Deployment:**  [Vercel](https://vercel.com/)
    

## 🚀 Getting Started

### Prerequisites

-   Node.js (v18+)
    
-   npm or pnpm
    
-   A Supabase Project (Frankfurt region recommended for GDPR compliance)
    

### Installation

1.  **Clone the repository:**
    
    Bash
    
    ```
    git clone https://github.com/your-username/quiet-network.git
    cd quiet-network
    
    ```
    
2.  **Install dependencies:**
    
    Bash
    
    ```
    npm install
    
    ```
    
3.  **Set up environment variables:** Create a `.env.local` file with your Supabase credentials:
    
    Bash
    
    ```
    VITE_SUPABASE_URL=your-project-url
    VITE_SUPABASE_ANON_KEY=your-anon-key
    
    ```
    
4.  **Run migrations:** Push the schema to your Supabase instance:
    
    Bash
    
    ```
    npx supabase db push
    
    ```
    

### Development

Bash

```
npm run dev

```

## 🗺️ Roadmap

-   **Phase 1 (MVP):** Hyperlocal feed, variable post decay logic, and "Post Sparks" for the Haarlem pilot.
    
-   **Phase 2 (v1.1+):** Comments/threading, image attachments, and real-time feed updates.
    
-   **Phase 3 (Long-term):** "Archive mode" for persistent hobby circles and native mobile apps (React Native).
    

## ⚖️ License & Commercial Use

This project is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**.

**Why AGPL-3.0?** We believe in open community software. The AGPL ensures that if anyone uses this code to provide a service over a network, they **must** share their modifications with the community. This prevents proprietary "closed" forks of the Quiet Network.

**Commercial Future:** While the core remains open, our roadmap includes **premium features for local businesses** and verified community organizations. As the original author, I retain the right to offer commercial licenses or enterprise versions of this platform.

----------

### Pro-Tip for Monetization:

By choosing **AGPL-3.0**, you are effectively saying: _"You can use my code for free, but only if you also stay open."_ If a company wants to use your code but **not** share their changes, they would have to come to you to buy a **Commercial License**. This is how many successful companies (like MongoDB or Qt) make money from open-source projects.# Quiet Network

**The Anti-Nextdoor.** A hyperlocal, ephemeral community platform built for calm, private neighborhood interactions.

Quiet Network fills the gap between high-noise, permanent social media and shallow, real-name-based neighborhood apps. It prioritizes **ephemerality**, **privacy**, and a **calm user experience**.

## ✨ Core Pillars

-   **Variable Ephemerality:** Posts are temporary by nature. Authors choose the "breath" of their post—48 hours for quick chats, 7 days for local news, or 30 days for community notices.
    
-   **Hyperlocal Circles:** Focus on your immediate community. The platform is launching with a pilot in **Haarlem** and **Amsterdam-West**.
    
-   **Pseudonymous Identity:** Engage with persistent display names without the privacy risks or drama associated with real-name requirements.
    
-   **Calm UX:** No follower counts, no public karma scores, and no gamification designed to trigger dopamine loops.
    
-   **Privacy-First:** EU-hosted (Frankfurt) infrastructure with no ads, no data selling, and no tracking.
    

## 🛠️ Tech Stack

Built with a modern, high-performance stack optimized for rapid iteration and scalability:

-   **Frontend:**  [React 18+](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
    
-   **Build Tool:**  [Vite](https://vitejs.dev/)
    
-   **Styling:**  [Tailwind CSS](https://tailwindcss.com/)
    
-   **UI Components:**  [shadcn/ui](https://ui.shadcn.com/)
    
-   **Backend:**  [Supabase](https://supabase.com/) (Postgres + Auth + Realtime)
    
-   **Deployment:**  [Vercel](https://vercel.com/)
    

## 🚀 Getting Started

### Prerequisites

-   Node.js (v18+)
    
-   npm or pnpm
    
-   A Supabase Project (Frankfurt region recommended for GDPR compliance)
    

### Installation

1.  **Clone the repository:**
    
    Bash
    
    ```
    git clone https://github.com/your-username/quiet-network.git
    cd quiet-network
    
    ```
    
2.  **Install dependencies:**
    
    Bash
    
    ```
    npm install
    
    ```
    
3.  **Set up environment variables:** Create a `.env.local` file with your Supabase credentials:
    
    Bash
    
    ```
    VITE_SUPABASE_URL=your-project-url
    VITE_SUPABASE_ANON_KEY=your-anon-key
    
    ```
    
4.  **Run migrations:** Push the schema to your Supabase instance:
    
    Bash
    
    ```
    npx supabase db push
    
    ```
    

### Development

Bash

```
npm run dev

```

## 🗺️ Roadmap

-   **Phase 1 (MVP):** Hyperlocal feed, variable post decay logic, and "Post Sparks" for the Haarlem pilot.
    
-   **Phase 2 (v1.1+):** Comments/threading, image attachments, and real-time feed updates.
    
-   **Phase 3 (Long-term):** "Archive mode" for persistent hobby circles and native mobile apps (React Native).
    

## ⚖️ License & Commercial Use

This project is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**.

**Why AGPL-3.0?** We believe in open community software. The AGPL ensures that if anyone uses this code to provide a service over a network, they **must** share their modifications with the community. This prevents proprietary "closed" forks of the Quiet Network.

**Commercial Future:** While the core remains open, our roadmap includes **premium features for local businesses** and verified community organizations. As the original author, I retain the right to offer commercial licenses or enterprise versions of this platform.

----------

### Pro-Tip for Monetization:

By choosing **AGPL-3.0**, you are effectively saying: _"You can use my code for free, but only if you also stay open."_ If a company wants to use your code but **not** share their changes, they would have to come to you to buy a **Commercial License**. This is how many successful companies (like MongoDB or Qt) make money from open-source projects.
