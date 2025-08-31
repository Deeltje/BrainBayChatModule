class ChatApplication {
    constructor() {
        this.chatMessages = document.getElementById('chat-messages');
        this.messageInput = document.getElementById('message-input');
        this.sendButton = document.getElementById('send-button');
        this.sessionsList = document.getElementById('sessions-list');
        this.newChatBtn = document.getElementById('new-chat-btn');
        this.deleteAllBtn = document.getElementById('delete-all-btn');
        this.sidebar = document.getElementById('sidebar');
        this.sidebarToggle = document.getElementById('sidebar-toggle');
        this.toggleBtn = document.getElementById('toggle-btn');
        this.sidebarOverlay = document.getElementById('sidebar-overlay');
        this.isLoading = false;
        this.currentSessionId = null;
        
        this.initializeEventListeners();
        this.loadChatSessions();
        
        // Add initial welcome message if no sessions exist
        this.addWelcomeMessage();
        
        // Initialize additional properties
        this.chatForm = document.getElementById('chat-form');
        this.chatContainer = document.getElementById('chat-container');
        this.clearButton = document.getElementById('clear-chat');
        this.typingIndicator = document.getElementById('typing-indicator');
        this.charCount = document.getElementById('char-count');
    }
    
    initializeEventListeners() {
        // Send button
        this.sendButton.addEventListener('click', () => this.sendMessage());
        
        // New chat button
        this.newChatBtn.addEventListener('click', () => this.createNewChat());
        
        // Delete all button
        this.deleteAllBtn.addEventListener('click', () => this.deleteAllSessions());
        
        // Sidebar toggle
        this.sidebarToggle.addEventListener('click', () => this.toggleSidebar());
        this.toggleBtn.addEventListener('click', () => this.toggleSidebar());
        
        // Sidebar overlay click to close on mobile
        if (this.sidebarOverlay) {
            this.sidebarOverlay.addEventListener('click', () => this.closeSidebar());
        }
        
        // Enter key handling
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        // Form submission
        if (this.chatForm) {
            this.chatForm.addEventListener('submit', (e) => this.handleSubmit(e));
        }
        
        // Character count and auto-resize
        this.messageInput.addEventListener('input', () => {
            this.updateCharCount();
            this.autoResize();
        });
        
        // Clear chat
        if (this.clearButton) {
            this.clearButton.addEventListener('click', () => this.clearHistory());
        }
    }
    
    toggleSidebar() {
        // Check if we're on mobile (window width < 768px)
        const isMobile = window.innerWidth < 768;
        
        if (isMobile) {
            // On mobile, use 'open' class instead of 'collapsed'
            this.sidebar.classList.toggle('open');
            
            // Show/hide overlay based on sidebar state
            if (this.sidebarOverlay) {
                if (this.sidebar.classList.contains('open')) {
                    this.sidebarOverlay.style.display = 'block';
                } else {
                    this.sidebarOverlay.style.display = 'none';
                }
            }
        } else {
            // On desktop, use 'collapsed' class
            this.sidebar.classList.toggle('collapsed');
            
            // Hide overlay on desktop
            if (this.sidebarOverlay) {
                this.sidebarOverlay.style.display = 'none';
            }
        }
    }
    
    closeSidebar() {
        // Close sidebar by removing both classes
        this.sidebar.classList.remove('open');
        this.sidebar.classList.remove('collapsed');
        
        // Hide overlay
        if (this.sidebarOverlay) {
            this.sidebarOverlay.style.display = 'none';
        }
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Additional helper methods
    updateCharCount() {
        if (!this.charCount) return;
        const count = this.messageInput.value.length;
        this.charCount.textContent = count;
        
        if (count > 450) {
            this.charCount.style.color = '#dc3545';
        } else if (count > 400) {
            this.charCount.style.color = '#fd7e14';
        } else {
            this.charCount.style.color = '#6c757d';
        }
    }
    
    autoResize() {
        this.messageInput.style.height = 'auto';
        this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 120) + 'px';
    }
    
    handleSubmit(e) {
        e.preventDefault();
        this.sendMessage();
    }
    
    showTypingIndicator() {
        if (this.typingIndicator) {
            this.typingIndicator.style.display = 'flex';
            this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        }
    }
    
    hideTypingIndicator() {
        if (this.typingIndicator) {
            this.typingIndicator.style.display = 'none';
        }
    }
    
    addWelcomeMessage() {
        const welcomeMessage = `Hello! I'm Brian, your real estate assistant. I can help you with:
        
• Property valuations and market trends
• Mortgage advice and calculations  
• Buying and selling process guidance
• Investment property analysis
• Local market information

What would you like to know about real estate today?`;
        
        this.addMessage(welcomeMessage, 'bot');
    }
}