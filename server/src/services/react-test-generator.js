/**
 * React Test Case Generator
 * Generates React coding test cases organized by difficulty levels
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Generate React test cases based on difficulty levels
 * @param {Array} difficulties - Array of difficulty levels to include
 * @param {number} count - Number of test cases per difficulty level
 * @returns {Array} Array of test cases
 */
export const generateReactTestCases = (difficulties = ['basic', 'intermediate', 'advanced', 'expert'], count = 5) => {
  const testCases = [];
  
  // Generate test cases for each difficulty level
  difficulties.forEach(difficulty => {
    const cases = getTestCasesByDifficulty(difficulty, count);
    testCases.push(...cases);
  });
  
  return testCases;
};

/**
 * Get test cases for a specific difficulty level
 * @param {string} difficulty - Difficulty level
 * @param {number} count - Number of test cases to generate
 * @returns {Array} Array of test cases
 */
const getTestCasesByDifficulty = (difficulty, count) => {
  // Get all available test cases for the difficulty level
  const availableCases = ALL_TEST_CASES[difficulty] || [];
  
  // If count is greater than available cases, return all available cases
  if (count >= availableCases.length) {
    return availableCases.map(testCase => ({
      ...testCase,
      id: uuidv4(),
      difficulty
    }));
  }
  
  // Otherwise, select a random subset of test cases
  const selectedCases = [];
  const indices = new Set();
  
  while (selectedCases.length < count) {
    const randomIndex = Math.floor(Math.random() * availableCases.length);
    
    if (!indices.has(randomIndex)) {
      indices.add(randomIndex);
      selectedCases.push({
        ...availableCases[randomIndex],
        id: uuidv4(),
        difficulty
      });
    }
  }
  
  return selectedCases;
};

/**
 * All available test cases organized by difficulty level
 */
const ALL_TEST_CASES = {
  // BASIC LEVEL TEST CASES
  basic: [
    {
      name: "Simple Greeting Component",
      category: "component-creation",
      prompt: "Create a simple React component called Greeting that displays 'Hello, World!' in an h1 tag.",
      expectedOutput: "A React component that renders an h1 with 'Hello, World!'",
    },
    {
      name: "Props Display Component",
      category: "props-handling",
      prompt: "Create a React component called UserProfile that accepts 'name' and 'email' props and displays them in a div with appropriate labels.",
      expectedOutput: "A React component that accepts and displays name and email props",
    },
    {
      name: "List Rendering",
      category: "list-rendering",
      prompt: "Create a React component called FruitList that takes an array of fruits as a prop and renders them as an unordered list (ul with li elements).",
      expectedOutput: "A React component that renders an array of items as a list",
    },
    {
      name: "Conditional Rendering",
      category: "conditional-rendering",
      prompt: "Create a React component called LoginStatus that accepts an 'isLoggedIn' prop and displays 'Welcome back!' if true, or 'Please log in' if false.",
      expectedOutput: "A React component that conditionally renders different content based on props",
    },
    {
      name: "Button Component",
      category: "event-handling",
      prompt: "Create a React button component called ClickButton that displays 'Click me!' and shows an alert with the message 'Button clicked!' when clicked.",
      expectedOutput: "A React component with a button that shows an alert when clicked",
    },
    {
      name: "Styling Component",
      category: "styling",
      prompt: "Create a React component called ColoredBox that renders a div with a width and height of 100px, a background color of blue, and rounded corners (10px border radius).",
      expectedOutput: "A React component with a styled div",
    },
    {
      name: "Image Display",
      category: "media-handling",
      prompt: "Create a React component called ProfileImage that accepts an 'src' prop for the image URL and an 'alt' prop for the alt text, and displays the image with a border.",
      expectedOutput: "A React component that displays an image with props",
    }
  ],
  
  // INTERMEDIATE LEVEL TEST CASES
  intermediate: [
    {
      name: "Counter with useState",
      category: "state-management",
      prompt: "Create a React component called Counter that uses the useState hook to implement a counter. Include buttons to increment and decrement the count, and display the current count.",
      expectedOutput: "A React component with useState that manages a counter with increment/decrement buttons",
    },
    {
      name: "Form with Controlled Components",
      category: "forms",
      prompt: "Create a React form component called UserForm with controlled inputs for 'name' and 'email'. Include form validation that checks if the email contains '@' and display an error message if it doesn't. On form submission, log the form data to the console.",
      expectedOutput: "A React form with controlled components and basic validation",
    },
    {
      name: "Data Fetching with useEffect",
      category: "data-fetching",
      prompt: "Create a React component called UserList that fetches user data from 'https://jsonplaceholder.typicode.com/users' using the useEffect hook and displays the names in a list. Show a loading state while fetching data.",
      expectedOutput: "A React component that fetches and displays data with loading state",
    },
    {
      name: "Toggle Component",
      category: "state-management",
      prompt: "Create a React component called ThemeToggle that uses useState to toggle between 'light' and 'dark' themes. The component should display the current theme and a button to toggle it. Apply different background and text colors based on the theme.",
      expectedOutput: "A React component with theme toggling functionality",
    },
    {
      name: "Search Filter",
      category: "filtering",
      prompt: "Create a React component called SearchableList that displays a list of items and includes a search input. As the user types in the search input, filter the displayed items to only show those that match the search term.",
      expectedOutput: "A React component with search filtering functionality",
    },
    {
      name: "Tabs Component",
      category: "navigation",
      prompt: "Create a React component called TabsContainer that implements a basic tabs interface. It should have at least 3 tabs with different content, and clicking on a tab should display its associated content.",
      expectedOutput: "A React component with tabs functionality",
    },
    {
      name: "Local Storage with useEffect",
      category: "persistence",
      prompt: "Create a React component called NotesApp that allows users to write and save notes. Use useState for the note content and useEffect to save the notes to localStorage whenever they change. Load saved notes when the component mounts.",
      expectedOutput: "A React component that persists data to localStorage",
    }
  ],
  
  // ADVANCED LEVEL TEST CASES
  advanced: [
    {
      name: "Custom Form Hook",
      category: "custom-hooks",
      prompt: "Create a custom React hook called useForm that manages form state, handles input changes, and provides validation. Then create a component that uses this hook to create a registration form with fields for name, email, and password.",
      expectedOutput: "A custom form hook and a component that uses it",
    },
    {
      name: "Context for Theme Management",
      category: "context-api",
      prompt: "Create a React theme context that provides theme values (colors, font sizes) to components. Implement a ThemeProvider component and a useTheme hook. Then create a component that uses the theme context to style itself.",
      expectedOutput: "A theme context implementation with provider and consumer components",
    },
    {
      name: "Reducer for Complex State",
      category: "reducers",
      prompt: "Create a React component called TaskManager that uses useReducer to manage a list of tasks. Implement actions for adding, toggling completion, editing, and removing tasks. Include appropriate UI for each action.",
      expectedOutput: "A React component using useReducer for complex state management",
    },
    {
      name: "Optimized Rendering",
      category: "performance",
      prompt: "Create a React component called ExpensiveList that renders a list of 1000 items. Use useMemo to optimize the filtering of this list based on a search term, and useCallback to optimize event handlers. Demonstrate how you would prevent unnecessary re-renders.",
      expectedOutput: "A React component with optimized rendering using useMemo and useCallback",
    },
    {
      name: "Modal with Portal",
      category: "portals",
      prompt: "Create a React modal component using createPortal that renders its content outside the normal DOM hierarchy. The modal should have open/close functionality and include a backdrop that closes the modal when clicked.",
      expectedOutput: "A React modal component using createPortal",
    },
    {
      name: "Custom Debounce Hook",
      category: "custom-hooks",
      prompt: "Create a custom React hook called useDebounce that debounces a value by a specified delay. Then create a search component that uses this hook to debounce search input, only triggering the search after the user stops typing.",
      expectedOutput: "A custom debounce hook and a component that uses it",
    },
    {
      name: "Infinite Scroll",
      category: "performance",
      prompt: "Create a React component called InfiniteScroll that implements infinite scrolling. It should load more items when the user scrolls to the bottom of the page. Use the Intersection Observer API or a scroll event listener.",
      expectedOutput: "A React component with infinite scrolling functionality",
    }
  ],
  
  // EXPERT LEVEL TEST CASES
  expert: [
    {
      name: "Data Fetching Hook with Caching",
      category: "advanced-hooks",
      prompt: "Create a custom React hook called useFetchWithCache that fetches data from an API and implements a caching mechanism. The hook should handle loading and error states, cache responses, and provide a way to invalidate the cache.",
      expectedOutput: "A custom data fetching hook with caching functionality",
    },
    {
      name: "Complex Form with Dynamic Fields",
      category: "advanced-forms",
      prompt: "Create a React component for a dynamic form builder that allows users to add, remove, and rearrange form fields of different types (text, number, select, etc.). Implement validation for each field type and form submission.",
      expectedOutput: "A React component for building dynamic forms with validation",
    },
    {
      name: "Virtualized List Component",
      category: "performance",
      prompt: "Create a React component called VirtualizedList that implements a virtualized list rendering only the items currently visible in the viewport. The list should efficiently handle thousands of items without performance issues.",
      expectedOutput: "A React component with virtualized list rendering",
    },
    {
      name: "Advanced Animation System",
      category: "animations",
      prompt: "Create a React animation system that handles complex transitions between components. Implement enter/exit animations, list item animations, and page transitions. Use CSS transitions or a library like Framer Motion.",
      expectedOutput: "A React animation system with various transition types",
    },
    {
      name: "State Management Library Integration",
      category: "state-management",
      prompt: "Create a React application that demonstrates integration with a state management library (Redux, Zustand, Jotai, etc.). Implement a feature that requires global state, actions/reducers, and connects multiple components.",
      expectedOutput: "A React application with state management library integration",
    },
    {
      name: "Custom Renderer",
      category: "advanced-patterns",
      prompt: "Create a custom React renderer that takes a JSON configuration and renders React components based on that configuration. The renderer should support nested components, props passing, and event handling.",
      expectedOutput: "A custom React renderer for JSON configurations",
    },
    {
      name: "GraphQL Client Implementation",
      category: "data-fetching",
      prompt: "Create a custom React hook that implements a simple GraphQL client. The hook should handle queries, mutations, loading states, and caching. Demonstrate its use with a component that fetches and displays data.",
      expectedOutput: "A custom GraphQL client hook and a component that uses it",
    }
  ]
};

export default {
  generateReactTestCases
};