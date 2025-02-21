Below is a detailed plan for building the Clockwork Natural Language Search prototype in iterative, test-driven stages, followed by a series of code-generation prompts that can be fed into an LLM. The plan prioritizes:
• Small, incremental steps
• Early and thorough testing
• Building on previous steps (no orphaned or unused code)

1. High-Level Blueprint

   1. Initialize Project & Boilerplate
      • Create a new Next.js app (using the App Router).
      • Integrate TailwindCSS & shadcn/ui for styling.
      • Set up a basic file structure.
   2. Basic Auth Setup (Local Storage)
      • Create a page or modal to capture firmSlug, firmApiKey, clockworkApiKey, and clockworkApiSecret.
      • Store credentials in local storage.
      • Display a gear icon to update these credentials and reset the session.
   3. Search UI
      • A center-aligned search box on the main page.
      • A sidebar that will display the search history in a chat-like format.
   4. API Routes / CORS Handling
      • Create Next.js API routes to proxy requests to OpenAI and Clockwork, avoiding CORS issues.
   5. OpenAI Integration
      • Send user’s natural language queries to GPT-4o via a proxy route.
      • Receive structured query suggestions.
   6. Clockwork Integration
      • Use the GPT-4o suggestions to call the Clockwork search endpoint through the Next.js API proxy.
      • Return results to the frontend.
   7. Results Display
      • Show candidate cards with name, current position, and location.
      • Up arrow linking directly to the candidate’s Clockwork profile (https://{firm_slug}.clockworkrecruiting.com/firm/people#id:{id}).
      • Clicking a candidate card expands a panel with full details.
   8. No Results & Broader Searches
      • Detect when no results are returned.
      • Suggest three broader searches (dropping or loosening filters).
      • Let users click to retry with broader criteria.
   9. Search History & Cancel/Retry
      • Track each search in the sidebar (chat-style).
      • Allow canceling an in-progress search; mark it “Canceled.”
      • Allow editing and re-running canceled or past searches.
   10. Error Handling & Rate Limits
       • Retry once if a request times out or hits rate limits.
       • Display inline error messages in the sidebar.
   11. Find Similar People
       • From a candidate’s card, allow “Find Similar People.”
       • Calls OpenAI to generate a new refined query.
   12. Testing & Iteration
       • Ensure each step has unit tests or integration tests.
       • Incrementally expand coverage.

2. First Iteration of Breakdown

Iteration A: Initial Setup 1. Create Next.js project with TypeScript. 2. Integrate TailwindCSS and configure it. 3. Add shadcn/ui for consistent UI components. 4. Confirm environment is working (Hello World page).

Iteration B: Basic Auth & Credential Storage 1. Implement a minimal UI (gear icon + modal) for storing credentials in local storage. 2. Validate the credentials form logic with jest/react-testing-library. 3. Reset session and clear local storage when credentials are updated.

Iteration C: Core Search UI 1. Implement the center-aligned search box. 2. Implement the sidebar for displaying search history. 3. Provide a placeholder text as specified.

Iteration D: Next.js API Routes for Proxy 1. Create /api/clockwork-search to handle Clockwork requests. 2. Create /api/openai-search to handle GPT-4o requests. 3. Add minimal tests verifying these routes respond correctly and avoid CORS.

Iteration E: Sending Search Queries to OpenAI 1. From the search box, call /api/openai-search with user input. 2. Return structured queries (mock or real GPT-4o). 3. Test that the response from /api/openai-search is displayed in the sidebar.

Iteration F: Clockwork Search 1. Take the structured query from OpenAI and call /api/clockwork-search. 2. Retrieve results from Clockwork, display them in the sidebar and main area. 3. Test success/failure states (including handling errors).

Iteration G: Display Candidates 1. Show candidate name, current position, location, and relevant details. 2. Add the up arrow with the Clockwork link. 3. Clicking on a card opens a panel with full details. 4. Test UI with mock data.

Iteration H: Handling No Results & Broader Searches 1. Detect empty results. 2. Show suggested broader search options. 3. Implement logic to “loosen” query by dropping or reducing filters. 4. Test each scenario end-to-end.

Iteration I: Search History & Cancel/Retry 1. Store each search in a sidebar chat list. 2. Allow canceling an in-progress request. 3. Mark canceled items and allow editing/retry. 4. Test each edge case (e.g., multiple cancellations, concurrent searches).

Iteration J: Error Handling & Rate Limits 1. Retry once on failure/timeout with a spinner. 2. Display inline error messages in the sidebar. 3. Ensure tests cover both success and failure flows.

Iteration K: Find Similar People 1. Add a button in candidate card or detail panel for “Find Similar People.” 2. On click, call /api/openai-search with candidate details to get a new query. 3. Re-run the Clockwork search with that new query. 4. Test correctness of “similar” results logic.

Iteration L: Final Cleanup & Integration Tests 1. Ensure each module is integrated well. 2. Run end-to-end tests verifying the entire search flow. 3. Fix UI or performance issues as needed.

3. Second Iteration: Breaking Down Further

Below is the same plan, but each iteration is broken into smaller, test-driven steps.

Iteration A: Initial Setup 1. A1: Initialize Next.js App
• Use npx create-next-app@latest with TypeScript.
• Confirm the dev server runs and a sample page loads. 2. A2: Integrate TailwindCSS
• Install TailwindCSS, configure tailwind.config.js.
• Add basic global styles.
• Test: verify a Tailwind utility (e.g., text-red-500) renders properly on a sample page. 3. A3: Integrate shadcn/ui
• Install shadcn/ui.
• Import a simple component (e.g., Button) to confirm styling.
• Test: a minimal page that displays a shadcn/ui Button is rendered and interactive.

Iteration C: Core Search UI 1. C1: Center-Aligned Search Box
• Create a SearchBar component with placeholder text.
• Test: ensure the component shows the placeholder and captures user input. 2. C2: Sidebar for Search History
• Create a Sidebar component.
• Test: ensure the sidebar can render a list of mock searches (e.g., “Find product managers”). 3. C3: Connect Search Box to State
• On submit, store the search input in a searches array (in the sidebar).
• Test: type into the search box, click “Submit,” and verify the sidebar updates.

Iteration D: Next.js API Routes for Proxy 1. D1: Create /api/clockwork-search
• Basic POST handler that echoes the data.
• Test: call it with mock data and verify the response structure. 2. D2: Create /api/openai-search
• Basic POST handler that echoes or returns a mock query string.
• Test: same approach—call with mock input, verify output. 3. D3: Verify No CORS Issues
• Attempt to call these routes from the client.
• Test: ensure no CORS errors in the browser console.

Iteration E: Sending Search Queries to OpenAI 1. E1: Frontend -> /api/openai-search
• On search submit, call /api/openai-search with the user’s query.
• Test: stub a response (“Find Senior Product Managers in Fintech”). 2. E2: Display OpenAI’s Structured Query
• Show the user’s natural language prompt + the structured query in the sidebar.
• Test: snapshot or DOM test ensuring both appear. 3. E3: Integration with Real GPT-4o (Optional if you have access)
• Use the official OpenAI library in the Next.js route.
• Test: actual call with a small prompt, confirm 200 response.

Iteration F: Clockwork Search 1. F1: Send GPT-4o’s Query to /api/clockwork-search
• Parse the structured query, call the Clockwork endpoint.
• Test: mock the fetch to Clockwork, confirm the correct URL and headers. 2. F2: Return and Display Results
• For each result, show minimal data in the main results area.
• Test: verify the results are rendered in the UI. 3. F3: Error Handling (Network Fail)
• If the Clockwork request fails, display an error in the sidebar.
• Test: mock a 500 response, ensure an error message is shown.

Iteration G: Display Candidates 1. G1: Candidate Card Layout
• Name, current position, location.
• Up arrow linking to Clockwork profile.
• Test: verify each field renders, link points to the correct URL. 2. G2: Expand Card for Full Details
• On click, open a panel with the candidate’s entire record (positions, addresses, etc.).
• Test: snapshot or DOM test verifying the expanded details. 3. G3: Highlight Matching Keywords & Show Relevance
• If the query was “AI experience,” highlight relevant text.
• Display a placeholder relevance score (from GPT or local logic).
• Test: confirm highlighted text.

Iteration H: Handling No Results & Broader Searches 1. H1: Detect Empty Results
• If Clockwork returns zero candidates, show “No Results.”
• Test: confirm behavior when an empty array is returned. 2. H2: Generate Broader Search Options
• Show three clickable suggestions (drop filter, loosen role, drop industry).
• Test: confirm the UI displays these suggestions. 3. H3: Retry with Broader Query
• Clicking a suggestion calls /api/openai-search or modifies the query locally, then re-calls /api/clockwork-search.
• Test: verify each suggestion triggers a new search.

Iteration I: Search History & Cancel/Retry 1. I1: Maintain Search History in State
• Each new search is appended to the list.
• Test: confirm items appear in correct order. 2. I2: Cancel In-Progress Search
• Provide a cancel button next to any loading indicator.
• Test: ensure the state is updated to “Canceled” and the request is aborted if possible. 3. I3: Edit/Retry Past Searches
• Clicking a past search re-runs it.
• Canceled search can be edited before re-submitting.
• Test: confirm the UI updates to show old input in the search bar.

Iteration J: Error Handling & Rate Limits 1. J1: Retry Once on Failure/Timeout
• If the first request fails, show a spinner “Retrying…” then attempt once more.
• Test: mock a failure scenario, ensure it retries exactly one time. 2. J2: Inline Error Messages
• If the second attempt fails or the error is critical, display an inline message in the sidebar.
• Test: ensure the error message is displayed and the UI is consistent.

Iteration K: Find Similar People 1. K1: “Find Similar” Button
• Add a small button in each candidate card or detail panel.
• Test: ensure the button is visible and clickable. 2. K2: Generate & Run Similar Query
• On click, pass the candidate’s details to /api/openai-search for a refined query.
• Then run the returned query through Clockwork.
• Test: confirm the sequence in an integration test (OpenAI -> Clockwork -> UI display). 3. K3: Show Results & Add to History
• Display the new “similar candidates” results in the main area.
• Add an entry in the sidebar.
• Test: ensure the new search appears in the history.

Iteration L: Final Cleanup & Integration 1. L1: End-to-End Test
• Start from entering credentials, to searching, to seeing results, to “Find Similar People.”
• Possibly use Cypress or Playwright for end-to-end. 2. L2: Code Review & Refactoring
• Clean up any duplication or inefficiencies.
• Ensure consistent code style. 3. L3: Potential Performance Tweaks
• Optimize repeated calls or large data sets.
• Not essential for the prototype, but can be considered if needed.

4. Final Iteration: Prompts for a Code-Generating LLM

Below, each prompt is enclosed in triple backticks with text syntax. This ensures the LLM sees them as text. You can feed each prompt step-by-step into the code-generation model. The instructions in these prompts expect a test-driven approach—they specify when to write tests, how to handle data, etc.

    Note: The content of each prompt references the iteration steps above. You’d typically supply the code generated by each prompt into your repository before moving on.

Prompt 1: Initialize Project & Tailwind Setup

You are a code-generation assistant. Please:

1. Create a new Next.js project (using the App Router and TypeScript).
2. Integrate TailwindCSS (with a minimal config).
3. Install and set up shadcn/ui.
4. Provide unit tests (if applicable) to confirm the Tailwind and shadcn/ui are working (snapshot or minimal).

Ensure we can run `npm run dev` and see a page with a shadcn/ui button styled by Tailwind.

Prompt 2: Basic Auth & Local Storage

Building on the previous code:

1. Create a settings modal triggered by a gear icon in the header.
2. The modal should capture:
   - firmSlug
   - firmApiKey
   - clockworkApiKey
   - clockworkApiSecret
3. Save these values to localStorage on submit.
4. Write a test verifying the modal appears, fields exist, and localStorage is updated.

Ensure that updating credentials clears any stored search history in React state (though the history is not built yet, just stub it).

Prompt 3: Core Search UI

Add the main search interface:

1. A centered SearchBar component with placeholder text: "Search by role, industry, skills, or keywords..."
2. A Sidebar component that will eventually hold search history.
3. On pressing Enter or clicking Search, store the query in an in-memory array (simulating search history).
4. Write tests ensuring the search input is captured and displayed in a mock list on the Sidebar.

We should still see the gear icon and settings modal from the previous step.

Prompt 4: Next.js API Routes (Proxy)

Implement two Next.js API routes to avoid CORS issues:

1. /api/clockwork-search
   - Accepts POST with { query, apiKey, firmApiKey, firmSlug } and returns a mock JSON response.
2. /api/openai-search
   - Accepts POST with { userInput, clockworkContext? } and returns a mock structured query.

Write minimal tests to confirm these routes are reachable and respond with JSON.

Prompt 5: Integrate OpenAI for Query Generation

Now we integrate the search bar with /api/openai-search:

1. On submitting the search, call /api/openai-search with the user’s text.
2. Display the returned "structured query" in the sidebar alongside the original query.
3. Write a test ensuring the correct POST body is sent and the sidebar updates with both the natural prompt and structured query.

Mock the OpenAI call for testing, but keep the route in place for future real calls.

Prompt 6: Integrate Clockwork Search

Use the structured query from /api/openai-search to call /api/clockwork-search:

1. After receiving the structured query, call /api/clockwork-search with it.
2. Store and display the results in the main area (e.g., a simple list of candidate names).
3. Write a test mocking the Clockwork endpoint response. Confirm the UI shows the returned candidate names.

Ensure error states (mock 500) are handled gracefully, e.g., showing an error in the sidebar.

Prompt 7: Candidate Cards & Linking to Clockwork

Enhance the results display:

1. For each candidate, create a card with:
   - Name
   - Current position
   - Location
   - Up arrow linking to https://{firmSlug}.clockworkrecruiting.com/firm/people#id:{id}
2. Clicking the card opens a panel with the full candidate data (positions, addresses, etc.).
3. Include tests verifying each field, link, and panel expansion.

Prompt 8: Handle No Results & Broader Searches

Add logic for no results:

1. If /api/clockwork-search returns an empty array, display a “No results found” message.
2. Show 3 clickable suggestions for broader queries:
   - Remove the least common filter
   - Loosen strict criteria
   - Drop non-essential filters
3. When a user clicks one, call /api/openai-search again with a broader prompt, then /api/clockwork-search, etc.
4. Test that the suggestions appear with no results and that clicking them triggers a new search flow.

Prompt 9: Search History, Cancel, & Retry

Implement the search history logic in the sidebar:

1. Each submitted search is added to the history with status: "Searching", "Completed", or "Canceled".
2. Provide a "Cancel" button for any ongoing search. On click, abort the request if possible, mark it "Canceled".
3. Allow re-running a past or canceled search by clicking on it. This re-submits the text to OpenAI then Clockwork.
4. Write tests covering:
   - The states of each search
   - Cancel flow
   - Retry flow

Prompt 10: Error Handling & Rate Limits

Refine error handling:

1. If a request times out or returns an error, show "Retrying..." once before failing.
2. Display an inline error message if the second attempt fails or if any critical error occurs.
3. Write tests mocking timeouts, verifying one retry, and ensuring the error message is displayed after that.

Prompt 11: “Find Similar People” Feature

Enable "Find Similar People":

1. Add a button in each candidate card or expanded panel labeled "Find Similar People".
2. On click, send the candidate’s details to /api/openai-search to generate a new query, then /api/clockwork-search.
3. Display the new search results in the main area. Add an entry to the sidebar for the new search.
4. Test the entire flow with a mock candidate: ensures the "similar" query is generated and new results appear.

Prompt 12: Final Integration & E2E Testing

Combine everything and finalize:

1. Perform an end-to-end test (using Cypress/Playwright or a similar tool) starting from:
   - Entering credentials
   - Searching for a role
   - Handling no results
   - Broadening the search
   - Finding a candidate
   - Using "Find Similar People"
2. Ensure all tests pass. Fix any integration bugs.
3. Clean up code, remove console logs, finalize README.

Deliver the final code base in a stable, test-passing state.

5. Conclusion

Following these iterative prompts will guide a code-generation LLM to produce a fully integrated, test-driven implementation of the Clockwork Natural Language Search prototype. Each step builds upon the previous, ensuring:
• No orphaned code
• Thorough unit and integration tests
• Incremental yet meaningful progress

You can now copy these prompts (one at a time) into your code-generation environment, review the output, integrate it into your repository, and proceed until all steps are completed.

I'll outline the steps to implement this architecture change:

1 Setup Phase:

• Add Upstash Redis to the project  
 • Create necessary environment variables for Upstash connection  
 • Create types for user sessions and stored credentials

2 User Management:

• When credentials are submitted in settings form:  
 • Generate a unique user ID  
 • Create a session token  
 • Store credentials in Redis with the user ID as key  
 • Return the session token to the client  
 • Store session token in localStorage (not cookies)

3 Session Management:

• Create middleware to:  
 • Check for session token in request headers  
 • Validate session token against Redis  
 • Add user context to request  
 • Handle expired/invalid sessions

4 Token Service Updates:

• Modify TokenService to:  
 • Accept session token as parameter  
 • Retrieve credentials from Redis using session token  
 • Cache credentials temporarily to reduce Redis calls  
 • Handle token expiration and renewal

5 API Route Updates:

• Modify all API routes to:  
 • Expect session token in headers  
 • Use updated TokenService  
 • Return appropriate errors for missing/invalid sessions

6 Frontend Updates:

• Update settings dialog to:  
 • Handle session token storage  
 • Include session token in all API calls  
 • Handle session expiration  
 • Provide logout functionality

7 Security Considerations:

• Implement token rotation  
 • Set appropriate TTL for Redis keys  
 • Encrypt sensitive data in Redis  
 • Implement rate limiting  
 • Add audit logging

Would you like me to elaborate on any of these steps or move forward with implementing a  
specific part?
