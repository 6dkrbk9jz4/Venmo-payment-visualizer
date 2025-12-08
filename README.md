# Venmo Payment Visualizer

A web application to visualize your Venmo transaction history, helping you understand where your money goes.

![Venmo Payment Visualizer Screenshot](readme/Screen%20Shot%202025-12-08%20at%206.40.51%20PM.png)

## Description

This tool allows you to upload your Venmo transaction history CSV file and generates a Sankey diagram to visualize the flow of your payments to different recipients. It also provides a filterable table view of your transactions and some summary statistics.

## Features

- **CSV Upload:** Easily upload your Venmo transaction history.
- **Sankey Diagram:** Visualize your payment flows.
- **Transaction Table:** View, sort, and filter your raw transaction data.
- **Date Range Filter:** Narrow down the transactions to a specific period.
- **Summary Stats:** Get a quick overview of your spending.
- **Alias Management:** Group different recipient names under a single alias for clearer visualization.
- **Export:** Export the cleaned and aggregated data.
- **Theme Toggle:** Switch between light and dark modes.

## Tech Stack

- **Frontend:**
  - [React](https://reactjs.org/)
  - [Vite](https://vitejs.dev/)
  - [TypeScript](https://www.typescriptlang.org/)
  - [Tailwind CSS](https://tailwindcss.com/)
  - [Shadcn/ui](https://ui.shadcn.com/) (for UI components)
- **Data Visualization:**
  - [D3.js](httpss://d3js.org/) (specifically `d3-sankey`)
  - [Recharts](https://recharts.org/)
- **Parsing:**
  - [Papaparse](https://www.papaparse.com/) (for CSV parsing)

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm

### Installation

1.  Clone the repository:
    ```bash
    git clone <repository-url>
    ```
2.  Navigate to the project directory:
    ```bash
    cd Venmo-payment-visualizer
    ```
3.  Install the dependencies:
    ```bash
    npm install
    ```

### Running the Development Server

This project is a client-side application built with Vite. To run the development server, use the following command:

```bash
npx vite
```

This will start the development server for the frontend. The `npm run dev` script in `package.json` is configured for a backend server which is not present in this version of the project.

## Usage

1.  **Download your Venmo Transaction History:**
    - Go to your Venmo account settings.
    - Request your transaction history as a CSV file.
2.  **Launch the Application:**
    - Open your web browser and navigate to the local development server's address (usually `http://localhost:5173`).
3.  **Upload the CSV:**
    - Click on the "File Upload" area and select the CSV file you downloaded from Venmo.
4.  **Explore your Data:**
    - The Sankey diagram will automatically update to visualize your payments.
    - You can use the other panels to view the raw data, manage aliases, and see summary statistics.
