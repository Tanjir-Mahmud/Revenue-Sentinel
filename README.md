# 🛡️ Revenue Sentinel

**Revenue Sentinel** is a high-stakes Customer Success & Revenue Protection Agent. This autonomous system monitors real-time customer usage logs and support tickets indexed in Elasticsearch to prevent churn and identify high-value expansion opportunities.

![Dashboard Preview](https://raw.githubusercontent.com/Tanjir-Mahmud/Revenue-Sentinel/main/preview.png) *(Note: Placeholder for actual screenshot)*

## 🚀 Overview

The agent executes a multi-step reasoning pipeline without human intervention:
1.  **Monitor**: Pulls real-time data from Elasticsearch (usage logs and support tickets).
2.  **Reason**: Identifies "Critical Risk" patterns (declining API calls, recurring 500-errors) vs. "Expansion" patterns (approaching tier limits).
3.  **Execute**: Triggers automated workflows (Jira tickets, Slack alerts to AMs, or Salesforce opportunities for Sales).

## 🏗️ Software Architecture

Revenue Sentinel is built with a modern full-stack architecture:

-   **Frontend**: React (Vite) + Recharts for data visualization. Uses a "Glassmorphism" design system for a premium enterprise feel.
-   **Backend**: Node.js & Express.
-   **Data Pipe**: Direct integration with **Elasticsearch Observability**.
-   **Real-time Streaming**: Server-Sent Events (SSE) provide a live "thinking" log as the agent processes each customer.

### Multi-Step Pipeline
-   **Phase 1 (Data Retrieval)**: Uses the `search_usage_logs` and `search_support_tickets` tools.
-   **Phase 2 (Quantitative Analysis)**: Invokes `calculate_health_score` using ES|QL logic.
-   **Phase 3 (Contextual Search)**: Performs a Vector Similarity search via `vector_search_remedies` for at-risk customers to find historical fixes.
-   **Phase 4 (Execution)**: Triggers either `at_risk_workflow` or `expansion_workflow`.

## 🛠️ Getting Started

### Prerequisites
- Node.js (v18+)
- An Elasticsearch instance (Elastic Cloud recommended)

### Installation

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/Tanjir-Mahmud/Revenue-Sentinel.git
    cd Revenue-Sentinel
    ```

2.  **Setup Backend**:
    ```bash
    cd server
    npm install
    ```
    Create a `.env` file in the `server` directory:
    ```env
    ES_URL=your_elasticsearch_url
    ES_API_KEY=your_api_key
    PORT=3001
    ```

3.  **Setup Frontend**:
    ```bash
    cd ../client
    npm install
    ```

### Running the App

1.  **Start API**: In the `server` directory: `npm run start`
2.  **Start Dashboard**: In the `client` directory: `npm run dev`
3.  **Open Browser**: Visit `http://localhost:5173`

## 📊 Demo Data
To seed the synthetic demo data into your Elasticsearch cluster, run:
```bash
cd server
node scripts/seed_es.js
```

## 📜 License
This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

---
Built for the **Elasticsearch Hackathon 2026**.
