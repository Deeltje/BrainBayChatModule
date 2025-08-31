// Chat history functionality
ChatApplication.prototype.loadChatHistory = async function() {
    try {
        const response = await fetch('/api/history');
        if (!response.ok) return;
        
        const messages = await response.json();
        
        // Clear existing messages
        this.clearChatDisplay();
        
        // Add welcome message if no messages exist
        if (messages.length === 0) {
            this.addWelcomeMessage();
        } else {
            // Add historical messages
            messages.forEach(msg => {
                this.addMessage(msg.message_text, msg.is_user ? 'user' : 'bot');
            });
        }
        
    } catch (error) {
        console.log('Could not load chat history:', error);
    }
};

ChatApplication.prototype.clearHistory = async function() {
    if (!confirm('Are you sure you want to clear the chat history? This cannot be undone.')) {
        return;
    }
    
    try {
        const response = await fetch('/api/clear-history', {
            method: 'POST'
        });
        
        if (response.ok) {
            this.clearChatDisplay();
        }
    } catch (error) {
        console.error('Error clearing history:', error);
    }
};