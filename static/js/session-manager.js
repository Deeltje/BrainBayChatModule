// Session management functionality
ChatApplication.prototype.loadChatSessions = async function() {
    try {
        const response = await fetch('/api/sessions');
        if (!response.ok) return;
        
        const sessions = await response.json();
        
        // If no sessions exist, create one automatically
        if (sessions.length === 0) {
            await this.createNewChat();
            return;
        }
        
        // Set current session to the first one if not set and load its history
        if (!this.currentSessionId && sessions.length > 0) {
            // Find the current session from server data
            const currentSession = sessions.find(s => s.is_current);
            if (currentSession) {
                this.currentSessionId = currentSession.session_id;
            } else {
                this.currentSessionId = sessions[0].session_id;
            }
            await this.loadChatHistory();
        }
        
        this.renderSessions(sessions);
    } catch (error) {
        console.log('Could not load chat sessions:', error);
        // If sessions fail to load, at least load the current chat history
        await this.loadChatHistory();
    }
};

ChatApplication.prototype.renderSessions = function(sessions) {
    this.sessionsList.innerHTML = '';
    
    sessions.forEach(session => {
        // Update current session based on server info
        const currentSessionActive = session.session_id === this.currentSessionId;
        
        const sessionElement = document.createElement('div');
        sessionElement.className = `session-item ${currentSessionActive ? 'active' : ''}`;
        sessionElement.dataset.sessionId = session.session_id;
        
        sessionElement.innerHTML = `
            <div class="session-content">
                <div class="session-name">
                    ${session.is_current ? '<i class="fas fa-comment-dots me-2"></i>' : ''}
                    ${this.escapeHtml(session.session_name)}
                </div>
                <div class="session-preview">${this.escapeHtml(session.last_message_preview)}</div>
            </div>
            <div class="session-actions">
                <button class="session-delete" onclick="app.deleteSession('${session.session_id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        sessionElement.addEventListener('click', (e) => {
            if (!e.target.closest('.session-actions')) {
                this.switchToSession(session.session_id);
            }
        });
        
        this.sessionsList.appendChild(sessionElement);
    });

};

ChatApplication.prototype.createNewChat = async function() {
    try {
        const response = await fetch('/api/sessions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({})
        });
        
        if (response.ok) {
            const newSession = await response.json();
            this.currentSessionId = newSession.session_id;
            this.clearChatDisplay();
            
            // Add welcome message for new session
            this.addWelcomeMessage();
            
            // Refresh session list
            await this.loadChatSessions();
        } else {
            console.error('Failed to create new chat:', response.status, response.statusText);
        }
    } catch (error) {
        console.error('Error creating new chat:', error);
    }
};

ChatApplication.prototype.switchToSession = async function(sessionId) {
    try {
        const response = await fetch(`/api/sessions/${sessionId}/switch`, {
            method: 'POST'
        });
        
        if (response.ok) {
            this.currentSessionId = sessionId;
            this.clearChatDisplay();
            
            // Add a small delay to ensure server session is updated
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Load chat history for the switched session
            await this.loadChatHistory();
            
            // Update session list to show current active session
            await this.loadChatSessions();
        }
    } catch (error) {
        console.error('Error switching session:', error);
    }
};

ChatApplication.prototype.deleteSession = async function(sessionId) {
    if (!confirm('Are you sure you want to delete this chat session?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/sessions/${sessionId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            // If we deleted the current session, switch to another one
            if (sessionId === this.currentSessionId) {
                this.currentSessionId = null;
                this.clearChatDisplay();
            }
            await this.loadChatSessions();
        }
    } catch (error) {
        console.error('Error deleting session:', error);
    }
};

ChatApplication.prototype.deleteAllSessions = async function() {
    if (!confirm('Are you sure you want to delete ALL chat sessions? This cannot be undone.')) {
        return;
    }
    
    try {
        const response = await fetch('/api/sessions/all', {
            method: 'DELETE'
        });
        
        if (response.ok) {
            this.currentSessionId = null;
            this.clearChatDisplay();
            this.addWelcomeMessage();
            await this.loadChatSessions();
        }
    } catch (error) {
        console.error('Error deleting all sessions:', error);
    }
};