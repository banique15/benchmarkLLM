# LLM Benchmark

A web application for benchmarking Large Language Models (LLMs) using the OpenRouter API and LangChain.

## Features

- Compare multiple LLMs across various tasks
- Measure response quality, speed, token usage, and cost
- Visualize benchmark results with interactive charts
- Save and share benchmark configurations and results
- Export results in multiple formats
- Real-time benchmarking with actual API calls to OpenRouter
- API key validation and testing
- Advanced prompt management with LangChain templates
- Sophisticated evaluation of model outputs
- Standardized model interface via LangChain

## Project Structure

- `client/` - React frontend application
- `server/` - Node.js/Express backend API
- `shared/` - Shared code between frontend and backend
- `supabase/` - Supabase database configuration

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- OpenRouter API key
- Modern web browser with localStorage enabled (cookies and site data saving must be allowed)
- Docker and Docker Compose (optional, for containerized setup)
- LangChain dependencies (installed automatically with `npm install`)

### Installation

#### Standard Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Set up environment variables:
   - Copy `.env.example` to `.env` in the root directory
   - Copy `client/.env.example` to `client/.env`
   - Fill in the required values:
     - `SUPABASE_URL`: Your Supabase project URL
     - `SUPABASE_ANON_KEY`: Your Supabase anonymous key
     - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key
     - `OPENROUTER_API_KEY`: Your OpenRouter API key (optional, can be set in the app)

4. Start the development server:
   ```
   npm run dev
   ```

#### Docker Setup

1. Clone the repository
2. Set up environment variables:
   - Copy `.env.example` to `.env` in the root directory
   - Fill in the required values as described above

3. Start the application using Docker Compose:
   ```
   docker-compose up
   ```

### Supabase Setup

1. Create a new Supabase project
2. Set up the database schema:
   - Option 1: Run the SQL migrations in the Supabase SQL editor:
     - Copy the contents of `supabase/migrations/20250303_initial_schema.sql` and run it in the SQL editor
   - Option 2: Use the Supabase CLI to apply migrations:
     ```
     supabase link --project-ref YOUR_PROJECT_REF
     supabase db push
     ```

3. (Optional) Seed the database with sample data:
   - Copy the contents of `supabase/seed.sql` and run it in the SQL editor
## Usage

1. Open the application in your browser (http://localhost:5173)
   - Ensure your browser allows cookies and site data saving for the application
   - The application uses localStorage to store your API key and preferences
2. Go to the Settings page and enter your OpenRouter API key
   - Use the "Test API Key" button to verify your API key is valid
   - The application will securely store your API key in your browser's localStorage
   - The application will securely store your API key in your browser's localStorage
3. Create a new benchmark configuration:
   - Add test cases with prompts
   - Select models to benchmark
   - Configure model parameters (temperature, max tokens, etc.)
4. Run the benchmark
   - The application will make real API calls to OpenRouter
   - You can monitor the progress in real-time
5. View and analyze the results
   - Compare model performance across different metrics
   - View detailed results for each model and test case
   - Export results for further analysis
## API Key Handling & Security

The LLM Benchmark application takes security seriously, especially when handling API keys:

- Your OpenRouter API key is stored only in your browser's localStorage
- The key is never sent to our servers or stored in any database
- All API calls to OpenRouter are made through our backend proxy for added security
- You can test your API key's validity before using it for benchmarks
- The application masks your API key by default, showing only the first and last few characters
- You can clear your API key from localStorage at any time

### Browser Storage Requirements

For the application to function properly:

- Your browser must have localStorage enabled
- Cookies and site data saving must be allowed for the application domain
- If you're using private/incognito browsing mode, you'll need to re-enter your API key each session
- If you clear your browser data, you'll need to re-enter your API key

To check if localStorage is enabled in your browser, you can open the developer console and type:
```javascript
localStorage.setItem('test', 'test');
console.log(localStorage.getItem('test'));
localStorage.removeItem('test');
```

If this returns "test" without errors, localStorage is working correctly.
- You can clear your API key from localStorage at any time

## LangChain Integration

The application now includes LangChain integration for enhanced benchmarking capabilities:

- **Standardized Model Interface**: Unified API for working with different LLM providers
- **Enhanced Prompt Management**: Structured prompting with templates for different task types
- **Evaluation Chains**: Sophisticated evaluation of model outputs based on multiple criteria
- **Future Extensibility**: Foundation for adding agents, memory, and document loaders

For more details on the LangChain integration, see [LANGCHAIN.md](LANGCHAIN.md).

## Development

### Client

The client is a React application built with:
- Vite
- React Router
- React Query
- TailwindCSS
- Recharts for data visualization

To start the client in development mode:
```
cd client
npm run dev
```

### Server

The server is a Node.js/Express application that:
- Proxies requests to the OpenRouter API
- Provides LangChain-based model interactions
- Interacts with the Supabase database
- Processes benchmark results
- Handles API key validation and testing
- Evaluates model outputs using LangChain

To start the server in development mode:
```
cd server
npm run dev
```

### Full Stack Development

To start both the client and server in development mode:
```
npm run dev
```

## License

MIT