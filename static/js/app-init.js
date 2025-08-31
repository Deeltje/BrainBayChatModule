// Application initialization
let app; // Make app globally accessible for session management

document.addEventListener('DOMContentLoaded', function() {
    // Icons are now Font Awesome - no replacement needed
    
    // Initialize the chat application
    app = new ChatApplication();
    
    console.log('Chat application initialized');
});