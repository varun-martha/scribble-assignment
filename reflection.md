# Project Reflection

## What did the starter app already have?
The starter application provided a very helpful foundation. This meant the basic structure of the app was already set up and ready to use. Here is exactly what was included from the beginning:

- **Frontend & Backend Foundations**: The project started with a React (Vite) client for the user interface and a Node.js (Express) server for the backend. Both were already configured to use TypeScript.
- **Basic Screens & Navigation**: Several basic web pages were already created. This included the Start page, the Create Room page, the Join Room page, the Lobby, and the main Game page. These pages had basic styling and colors already applied.
- **Visual Placeholders**: The main Game page was mostly empty, but it had visual placeholders showing exactly where the drawing canvas, the guess input box, the scoreboard, and the final results would eventually go.
- **Starter Server Setup**: The backend server came with a very basic in-memory room system. It included simple API endpoints to check the server health (`GET /health`), create a new room (`POST /rooms`), join a room using a code (`POST /rooms/:code/join`), and get basic room information (`GET /rooms/:code`).
- **Initial Game Data**: The starter code included a small, built-in list of secret words (like rocket, pizza, and castle) and defined the basic player roles (drawer and guesser).

## What did I add?
The missing features outlined in the project instructions were fully built from scratch. Everything was implemented using standard HTTP polling to keep the game in sync, and all game data was stored directly in the server's memory.

Here is a detailed breakdown of exactly what was added to finish the game:

- **Spec Kit Documentation**: A project Constitution was added to establish strict engineering rules. A new `discovery.md` artifact was created to document the project scaffold and architectural constraints. Before writing any actual code, detailed specifications, step-by-step implementation plans, and organized task lists were created for every single feature.
- **Room Setup & Lobby Features**: Logic was added to track who the "host" of the room is, granting them special permissions like the ability to start the game. A rule was enforced requiring at least two players to start. Explicit UI error handling was added to validate room codes (preventing empty or malformed codes). Automatic background polling (running every ~2 seconds) was also added so the lobby screen constantly updates.
- **Game Start & Drawer Logic**: The complete flow for starting a game was built. This includes deterministically choosing the second player to be the "drawer" (if available) and offering a consistent set of 3 secret words to choose from. Rules were added to ensure the secret word is only ever shown on the drawer's screen.
- **Gameplay (Drawing & Guessing)**: 
  - **Drawing Mechanics**: An interactive drawing canvas was built for the drawer to use. A "clear canvas" button was added, and the app was programmed to instantly send the drawing strokes to all other players in the room so they can see the drawing happen live.
  - **Guessing Mechanics**: A chat box was added so non-drawing players can submit guesses. The app automatically checks if their guess matches the secret word (ignoring capital letters), and broadcasts a history of all guesses to everyone's screen.
- **Scoring & Final Results**: A deterministic scoring system was added, awarding exactly 100 points to players who guess the word correctly and 0 points to incorrect guesses. A final results screen was built so all players can see the correct word, the final scores, and the complete history of guesses when the round ends.
- **Clean Restart Flow**: A restart button was added exclusively for the host. When clicked, it seamlessly returns everyone in the room back to the lobby screen. This keeps all the players connected together but completely clears out the drawing and scoring data from the previous round so a new game can begin.
