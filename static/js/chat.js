class ChatApplication {
    constructor() {
        this.messageInput = document.getElementById('message-input');
        this.sendButton = document.getElementById('send-button');
        this.chatMessages = document.getElementById('chat-messages');
        this.chatContainer = document.getElementById('chat-container');
        this.chatForm = document.getElementById('chat-form');
        this.clearButton = document.getElementById('clear-chat');
        this.statusIndicator = document.getElementById('status-indicator');
        this.typingIndicator = document.getElementById('typing-indicator');
        this.charCount = document.getElementById('char-count');
        this.errorModal = new bootstrap.Modal(document.getElementById('error-modal'));
        this.errorMessage = document.getElementById('error-message');
        
        this.isLoading = false;
        this.sessionId = null;
    }

    init() {
        this.setupEventListeners();
        this.checkModelStatus();
        this.loadChatHistory();
        this.focusInput();
    }

    setupEventListeners() {
        // Form submission
        this.chatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.sendMessage();
        });

        // Input changes
        this.messageInput.addEventListener('input', () => {
            this.updateCharCount();
            this.updateSendButton();
        });

        // Clear chat
        this.clearButton.addEventListener('click', () => {
            this.clearChat();
        });

        // Auto-resize input
        this.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
    }

    updateCharCount() {
        const count = this.messageInput.value.length;
        this.charCount.textContent = count;
        
        if (count > 450) {
            this.charCount.parentElement.classList.add('text-warning');
        } else {
            this.charCount.parentElement.classList.remove('text-warning');
        }
    }

    updateSendButton() {
        const hasText = this.messageInput.value.trim().length > 0;
        this.sendButton.disabled = !hasText || this.isLoading;
    }

    async checkModelStatus() {
        try {
            const response = await fetch('/api/status');
            const data = await response.json();
            
            if (data.model_loaded) {
                this.statusIndicator.innerHTML = '<i class="fas fa-check-circle"></i> Ready';
                this.statusIndicator.className = 'badge bg-success me-2';
                this.messageInput.disabled = false;
                this.updateSendButton();
            } else {
                this.statusIndicator.innerHTML = '<i class="fas fa-times-circle"></i> Model Error';
                this.statusIndicator.className = 'badge bg-danger me-2';
                this.showError('The system is currently unavailable. Please refresh the page.');
            }
            
            // Icons are now Font Awesome - no replacement needed
        } catch (error) {
            console.error('Status check failed:', error);
            this.statusIndicator.innerHTML = '<i class="fas fa-wifi"></i> Offline';
            this.statusIndicator.className = 'badge bg-danger me-2';
            // Icons are now Font Awesome - no replacement needed
        }
    }

    async loadChatHistory() {
        try {
            const response = await fetch('/api/history');
            const data = await response.json();
            
            if (data.messages && data.messages.length > 0) {
                // Clear welcome message
                this.chatMessages.innerHTML = '';
                
                // Add historical messages
                data.messages.forEach(msg => {
                    this.addMessage(msg.message, msg.is_user, new Date(msg.timestamp));
                });
                
                this.scrollToBottom();
            }
        } catch (error) {
            console.error('Failed to load chat history:', error);
        }
    }

    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message || this.isLoading) return;

        // Add user message to chat
        this.addMessage(message, true);
        this.messageInput.value = '';
        this.updateCharCount();
        this.updateSendButton();
        
        // Show loading state
        this.setLoadingState(true);
        this.showTypingIndicator();
        
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: message })
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to get response');
            }

            // Add bot response
            this.addMessage(data.response, false);
            this.sessionId = data.session_id;
            
        } catch (error) {
            console.error('Send message failed:', error);
            this.addMessage(
                'Sorry, I encountered an error processing your message. Please try again.',
                false
            );
            this.showError(error.message);
        } finally {
            this.hideTypingIndicator();
            this.setLoadingState(false);
            this.focusInput();
        }
    }

    addMessage(text, isUser, timestamp = new Date()) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message-container ${isUser ? 'user-message' : 'bot-message'}`;
        
        const timeString = this.formatTime(timestamp);
        
        messageDiv.innerHTML = `
            <div class="message-avatar">
                <i class="fas ${isUser ? 'fa-user' : 'fa-robot'}"></i>
            </div>
            <div class="message-content">
                <div class="message-text">${this.escapeHtml(text)}</div>
                <div class="message-time">${timeString}</div>
            </div>
        `;
        
        this.chatMessages.appendChild(messageDiv);
        feather.replace();
        this.scrollToBottom();
    }

    showTypingIndicator() {
        this.typingIndicator.classList.remove('d-none');
        feather.replace();
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        this.typingIndicator.classList.add('d-none');
    }

    setLoadingState(loading) {
        this.isLoading = loading;
        this.updateSendButton();
        
        if (loading) {
            this.sendButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        } else {
            this.sendButton.innerHTML = '<i class="fas fa-paper-plane"></i>';
        }
        
        feather.replace();
    }

    async clearChat() {
        if (!confirm('Are you sure you want to clear the chat history?')) {
            return;
        }

        try {
            const response = await fetch('/api/clear', { method: 'POST' });
            
            if (response.ok) {
                // Clear messages and show welcome message
                this.chatMessages.innerHTML = `
                    <div class="message-container bot-message">
                        <div class="message-avatar">
                            <i class="fas fa-robot"></i>
                        </div>
                        <div class="message-content">
                            <div class="message-text">
                                Hello! I'm Brian, your real estate assistant. How can I help you today?
                            </div>
                            <div class="message-time">
                                Just now
                            </div>
                        </div>
                    </div>
                `;
                // Icons are now Font Awesome - no replacement needed
                this.scrollToBottom();
                this.focusInput();
            } else {
                throw new Error('Failed to clear chat');
            }
        } catch (error) {
            console.error('Clear chat failed:', error);
            this.showError('Failed to clear chat history');
        }
    }

    scrollToBottom() {
        setTimeout(() => {
            this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
        }, 100);
    }

    focusInput() {
        if (!this.messageInput.disabled) {
            this.messageInput.focus();
        }
    }

    formatTime(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
        
        return date.toLocaleDateString();
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showError(message) {
        this.errorMessage.textContent = message;
        this.errorModal.show();
    }
}
