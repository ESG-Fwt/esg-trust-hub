# ESG Trust Hub

The ESG Trust Hub is a platform for securely managing and sharing Environmental, Social, and Governance (ESG) data. It streamlines the process of ESG data submission, review, and reporting, fostering transparency and trust between organizations and their stakeholders.

## Core Features

- **Role-Based Access Control:**  The platform supports distinct roles, such as 'manager' and 'supplier', each with tailored dashboards and permissions. This ensures that users only have access to the information and functionalities relevant to their roles.
- **Guided ESG Data Submission:** A user-friendly wizard guides suppliers through the process of submitting their ESG data, ensuring that all necessary information is captured accurately and efficiently.
- **Secure Data Management:** All data is securely stored and managed using Supabase, a reliable and scalable backend-as-a-service platform.
- **Data Validation:** To maintain data integrity, the platform employs Zod for schema validation, ensuring that all submissions meet the required data standards.
- **Comprehensive Admin Dashboard:** Administrators have access to a powerful dashboard that allows them to review submissions, manage users and organizations, and monitor the overall activity on the platform.

## Tech Stack

- **Frontend:** Built with React and TypeScript, ensuring a robust and maintainable codebase.
- **UI Components:**  The user interface is crafted using Shadcn/UI, a collection of beautifully designed and accessible components.
- **Backend:** Powered by Supabase, which provides a secure database, authentication, and other backend functionalities.
- **Data Fetching:** TanStack Query is used for efficient data fetching, caching, and state management.
- **Routing:** React Router DOM handles the navigation and routing within the application.
- **Styling:** Tailwind CSS is used for styling, allowing for a highly customizable and responsive design.

## Getting Started

To get the project up and running on your local machine, follow these steps:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/ESG-Fwt/esg-trust-hub.git
   ```
2. **Navigate to the project directory:**
   ```bash
   cd esg-trust-hub
   ```
3. **Install the dependencies:**
   ```bash
   bun install
   ```
4. **Start the development server:**
   ```bash
   bun run dev
   ```
This will start the application in development mode, and you can view it in your browser at http://localhost:8080.

## Available Scripts

- `bun run dev`: Starts the development server.
- `bun run build`: Builds the application for production.
- `bun run lint`: Lints the codebase for any errors.
- `bun run preview`: Serves the production build locally for previewing.

## Project Structure
```
esg-trust-hub/
├── public/               # Static assets
├── src/                  # Source code
│   ├── assets/           # Images, fonts, etc.
│   ├── components/       # Reusable UI components
│   ├── contexts/         # React contexts
│   ├── hooks/            # Custom React hooks
│   ├── integrations/     # Third-party integrations
│   ├── lib/              # Helper functions and utilities
│   ├── pages/            # Application pages
│   ├── stores/           # State management stores
│   └── test/             # Test files
├── supabase/             # Supabase configuration and migrations
└── ...                   # Other configuration files
```

## Contributing

We welcome contributions to the ESG Trust Hub! If you have any ideas, suggestions, or bug reports, please open an issue on the GitHub repository.

## License

This project is licensed under the MIT License.

