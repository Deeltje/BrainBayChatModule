// Message handling functionality
ChatApplication.prototype.sendMessage = async function() {
    const message = this.messageInput.value.trim();
    if (!message || this.isLoading) return;
    
    this.isLoading = true;
    this.sendButton.disabled = true;
    this.showTypingIndicator();
    
    // Clear input and reset height
    this.messageInput.value = '';
    this.messageInput.style.height = 'auto';
    this.updateCharCount();
    
    // Add user message to chat
    this.addMessage(message, 'user');
    
    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: message })
        });
        
        if (response.ok) {
            const data = await response.json();
            this.addMessage(data.response, 'bot');
            // Refresh sessions to update last message preview
            await this.loadChatSessions();
        } else {
            this.addMessage("I'm sorry, I encountered an issue. Please try again.", 'bot');
        }
    } catch (error) {
        console.error('Error sending message:', error);
        this.addMessage("I'm sorry, I'm having trouble connecting. Please try again.", 'bot');
    } finally {
        this.hideTypingIndicator();
        this.isLoading = false;
        this.sendButton.disabled = false;
        this.messageInput.focus();
    }
};

ChatApplication.prototype.addMessage = function(content, sender) {
    const messageContainer = document.createElement('div');
    messageContainer.className = `message-container ${sender}-message`;
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    
    if (sender === 'user') {
        avatar.innerHTML = '<i class="fas fa-user"></i>';
    } else {
        avatar.innerHTML = '<i class="fas fa-robot"></i>';
    }
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    
    const messageText = document.createElement('div');
    messageText.className = 'message-text';
    messageText.innerHTML = this.formatMessage(content);
    
    messageContent.appendChild(messageText);
    
    const timestamp = document.createElement('div');
    timestamp.className = 'message-timestamp';
    timestamp.textContent = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    messageContainer.appendChild(avatar);
    messageContainer.appendChild(messageContent);
    messageContainer.appendChild(timestamp);
    
    this.chatMessages.appendChild(messageContainer);
    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
};

ChatApplication.prototype.formatMessage = function(message) {
    return message
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>');
};

ChatApplication.prototype.clearChatDisplay = function() {
    // Clear all messages - welcome message will be re-added by history loading or initial setup
    this.chatMessages.innerHTML = '';
};