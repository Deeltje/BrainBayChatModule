# Introduction
This is my Application Assignment: Chat Model Integration Develop a chat application with a Huggingface model as the backend by Dalian Moll.

# Brian - Real Estate Assistant
A professional real-time chat application designed for real estate consultation and assistance. Built for Brainbay B.V. with custom branding and specialized real estate expertise.

## Features

- **Real Estate Expertise**: Specialized knowledge in property investment, market trends, and real estate consultation
- **Multi-Session Management**: Handle multiple chat conversations with session switching
- **Real-time Communication**: Instant messaging interface with professional branding
- **Persistent Chat History**: All conversations are saved and can be accessed later
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Professional Branding**: Custom Brainbay B.V. colors, logo, and typography
- **Session Management**: Create new chats, switch between conversations, and delete sessions

## Technology Stack

### Backend
- **Flask**: Web framework and REST API server
- **SQLAlchemy**: Database ORM for chat history and session management
- **SQLite/PostgreSQL**: Database for persistent storage

### Frontend
- **HTML5**: Semantic markup with accessibility features
- **Bootstrap 5**: Responsive CSS framework with custom Brainbay theming
- **Vanilla JavaScript**: Modular client-side functionality
- **Font Awesome**: Professional icon library
- **Rubik Font**: Modern typography matching brand guidelines

### Database
- **Development**: SQLite for local development
- **Production**: PostgreSQL with environment-based configuration

## Installation and Setup

### Prerequisites
- Python 3.8 or higher
- pip package manager

### Installation Steps Docker

1. **Run the Application**
    Open a terminal in the main folder of the project (where docker-compose.yml is located) and run the following command:
   ```bash
   docker-compose up --build
   ```
   This command builds the Docker image, starts the application, and the associated database service.

2. **Access the Application**
   Open your browser and navigate to: `http://localhost:5000`
3. 
### Installation Steps Alternative (Without Docker)

1. **Install Dependencies**
   ```bash
   pip install requirements.txt
   ```

2. **Set Environment Variables (Optional)**
   ```bash
   export SESSION_SECRET="your-secure-secret-key"
   export DATABASE_URL="sqlite:///chat.db"  # or PostgreSQL URL for production
   ```

3. **Run the Application**
   ```bash
   # Development
   python app.py
   ```

## Usage

### Chat Interface
1. **Start New Conversation**: Click "New Chat" to begin a fresh consultation
2. **Send Messages**: Type your real estate questions and press Enter or click send
3. **Professional Responses**: Receive expert advice on properties, markets, and investments
4. **Session Management**: Switch between different conversations using the sidebar

### Session Management
- **Create Sessions**: New chat creates a unique session with topic-based naming
- **Switch Sessions**: Click on any session in the sidebar to switch conversations
- **Delete Sessions**: Remove individual sessions or clear all conversations
- **Persistent History**: All conversations are automatically saved

## API Endpoints

### Chat Operations
- `GET /` - Main chat interface
- `POST /api/chat` - Send message and receive consultation response
- `GET /api/history` - Retrieve chat history for current session

### Session Management
- `POST /api/sessions/new` - Create new chat session
- `POST /api/sessions/{id}/switch` - Switch to specific session
- `DELETE /api/sessions/{id}` - Delete specific session
- `DELETE /api/sessions/all` - Delete all sessions
- `GET /api/sessions` - List all sessions

### System
- `GET /api/status` - Check system health and status

## Development

### Running Tests
```bash
# Run all tests
python run_tests.py
```

## Note on styling:
The application’s styling was based on the BrainBay website to give it a clean and user-friendly interface similar to that website.