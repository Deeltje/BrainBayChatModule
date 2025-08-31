#!/usr/bin/env python3
"""
Simple Chat Application with Flask-like structure
A web-based chat interface for real estate assistance
"""

import os
import logging
from datetime import datetime

from flask import Flask, request, jsonify, session
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase

# Import AI chat model
from chat_model import get_ai_response
import re

# Database setup
class Base(DeclarativeBase):
    pass

db = SQLAlchemy(model_class=Base)

# Database Models
class ChatSession(db.Model):
    __tablename__ = 'chat_sessions'
    
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.String(255), nullable=False, unique=True, index=True)
    session_name = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    last_activity = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationship to messages
    messages = db.relationship('ChatMessage', backref='session', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        message_count = len(self.messages)
        last_message = self.messages[-1] if self.messages else None
        
        # Create a more subtle preview with just the time
        time_preview = self.last_activity.strftime('%H:%M') if self.last_activity else ''
        
        return {
            'id': self.id,
            'session_id': self.session_id,
            'session_name': self.session_name,
            'created_at': self.created_at.isoformat(),
            'last_activity': self.last_activity.isoformat(),
            'message_count': message_count,
            'last_message_preview': time_preview
        }

class ChatMessage(db.Model):
    __tablename__ = 'chat_messages'
    
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.String(255), db.ForeignKey('chat_sessions.session_id'), nullable=False, index=True)
    message_text = db.Column(db.Text, nullable=False)
    is_user = db.Column(db.Boolean, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    def to_dict(self):
        return {
            'id': self.id,
            'session_id': self.session_id,
            'message_text': self.message_text,
            'is_user': self.is_user,
            'timestamp': self.timestamp.isoformat()
        }

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# Flask application
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "dev-secret-key")

# Database configuration
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL", "sqlite:///chat_history.db")
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_recycle": 300,
    "pool_pre_ping": True,
}

# Initialize database
db.init_app(app)

def generate_contextual_session_name(user_message):
    """Generate a contextual session name based on the user's first message"""
    # Clean the message - remove extra whitespace and normalize
    cleaned_message = re.sub(r'\s+', ' ', user_message.strip())
    
    # Real estate keywords and patterns to create meaningful names
    real_estate_keywords = {
        r'\bbuy|buying|purchase\b': 'Buying Property',
        r'\bsell|selling|sale\b': 'Selling Property',
        r'\brent|rental|renting\b': 'Rental Inquiry',
        r'\binvest|investment|investing\b': 'Investment Advice',
        r'\bmarket|price|value|appraisal\b': 'Market Analysis',
        r'\bmortgage|loan|financing\b': 'Financing Help',
        r'\bcondo|apartment|house|home\b': 'Property Search',
        r'\bneighborhood|area|location\b': 'Location Guide',
        r'\bcommercial|office|retail\b': 'Commercial Real Estate',
        r'\bfirst.time|first time\b': 'First-Time Buyer'
    }
    
    # Check for real estate patterns
    for pattern, category in real_estate_keywords.items():
        if re.search(pattern, cleaned_message, re.IGNORECASE):
            return f"{category} - {datetime.now().strftime('%m/%d %H:%M')}"
    
    # If no specific patterns, use first few words
    words = cleaned_message.split()
    if len(words) >= 3:
        topic = ' '.join(words[:4])  # First 4 words
        if len(topic) > 25:
            topic = topic[:22] + "..."
        return f"{topic} - {datetime.now().strftime('%m/%d %H:%M')}"
    elif len(words) >= 1:
        topic = ' '.join(words[:2])  # First 2 words
        return f"{topic} - {datetime.now().strftime('%m/%d %H:%M')}"
    else:
        # Fallback to generic name
        return f"Chat - {datetime.now().strftime('%m/%d %H:%M')}"

with app.app_context():
    db.create_all()
    
    @app.route('/')
    def index():
        """Serve the main chat interface - serve static HTML file"""
        try:
            with open('index.html', 'r', encoding='utf-8') as f:
                return f.read()
        except FileNotFoundError:
            return "Error: index.html file not found"
    
    @app.route('/api/chat', methods=['POST'])
    def chat():
        """Handle chat messages"""
        try:
            data = request.get_json()
            user_message = data.get('message', '').strip()
            
            if not user_message:
                return jsonify({'error': 'Message is required'}), 400
            
            # Generate or get session ID
            if 'session_id' not in session:
                import uuid
                session['session_id'] = str(uuid.uuid4())
                
                # Create new session in database with contextual name
                contextual_name = generate_contextual_session_name(user_message)
                new_session = ChatSession(
                    session_id=session['session_id'],
                    session_name=contextual_name
                )
                db.session.add(new_session)
                db.session.commit()
            
            # Update session activity and name if needed
            chat_session = ChatSession.query.filter_by(session_id=session['session_id']).first()
            if chat_session:
                chat_session.last_activity = datetime.utcnow()
                
                # Update session name if it's still using the placeholder "New Chat" format
                if chat_session.session_name.startswith("New Chat -"):
                    contextual_name = generate_contextual_session_name(user_message)
                    chat_session.session_name = contextual_name
                
                db.session.commit()
            
            # Save user message to database
            user_msg = ChatMessage(
                session_id=session['session_id'],
                message_text=user_message,
                is_user=True
            )
            db.session.add(user_msg)
            
            # Get conversation history for context
            # recent_messages = ChatMessage.query.filter_by(
            #     session_id=session['session_id']
            # ).order_by(ChatMessage.timestamp.desc()).limit(10).all()
            
            # Convert to format expected by AI model
            # conversation_history = [msg.to_dict() for msg in reversed(recent_messages)]
            
            # Get AI response
            bot_response = get_ai_response(user_message)
            
            # Save bot response to database
            bot_msg = ChatMessage(
                session_id=session['session_id'],
                message_text=bot_response,
                is_user=False
            )
            db.session.add(bot_msg)
            db.session.commit()
            
            return jsonify({
                'response': bot_response,
                'session_id': session['session_id']
            })
            
        except Exception as e:
            logger.error(f"Chat error: {e}")
            return jsonify({
                'error': 'Internal server error'
            }), 500
    
    @app.route('/api/history')
    def get_chat_history():
        """Get chat history for current session"""
        try:
            if 'session_id' not in session:
                return jsonify([])
            
            messages = ChatMessage.query.filter_by(
                session_id=session['session_id']
            ).order_by(ChatMessage.timestamp.asc()).all()
            
            return jsonify([msg.to_dict() for msg in messages])
        except Exception as e:
            logger.error(f"History error: {e}")
            return jsonify([]), 500
    
    @app.route('/api/clear-history', methods=['POST'])
    def clear_chat_history():
        """Clear chat history for current session"""
        try:
            if 'session_id' not in session:
                return jsonify({'success': True})
            
            ChatMessage.query.filter_by(session_id=session['session_id']).delete()
            db.session.commit()
            return jsonify({'success': True})
        except Exception as e:
            logger.error(f"Clear history error: {e}")
            return jsonify({'error': 'Failed to clear history'}), 500
    
    @app.route('/api/sessions')
    def get_chat_sessions():
        """Get all chat sessions"""
        try:
            sessions = ChatSession.query.order_by(ChatSession.last_activity.desc()).all()
            return jsonify([s.to_dict() for s in sessions])
        except Exception as e:
            logger.error(f"Sessions error: {e}")
            return jsonify([]), 500
    
    @app.route('/api/sessions', methods=['POST'])
    def create_chat_session():
        """Create a new chat session"""
        try:
            import uuid
            new_session_id = str(uuid.uuid4())
            
            # Create new session with placeholder name (will be updated on first message)
            new_session = ChatSession(
                session_id=new_session_id,
                session_name=f"New Chat - {datetime.now().strftime('%m/%d %H:%M')}"
            )
            db.session.add(new_session)
            db.session.commit()
            
            # Switch to new session
            session['session_id'] = new_session_id
            
            return jsonify({
                'success': True,
                'session_id': new_session_id,
                'session': new_session.to_dict()
            })
        except Exception as e:
            logger.error(f"Create session error: {e}")
            return jsonify({'error': 'Failed to create session'}), 500
    
    @app.route('/api/sessions/<session_id>/switch', methods=['POST'])
    def switch_chat_session(session_id):
        """Switch to a different chat session"""
        try:
            # Verify session exists
            chat_session = ChatSession.query.filter_by(session_id=session_id).first()
            if not chat_session:
                return jsonify({'error': 'Session not found'}), 404
            
            # Switch to session
            session['session_id'] = session_id
            
            # Update last activity
            chat_session.last_activity = datetime.utcnow()
            db.session.commit()
            
            return jsonify({'success': True})
        except Exception as e:
            logger.error(f"Switch session error: {e}")
            return jsonify({'error': 'Failed to switch session'}), 500
    
    @app.route('/api/sessions/<session_id>', methods=['DELETE'])
    def delete_chat_session(session_id):
        """Delete a chat session and all its messages"""
        try:
            chat_session = ChatSession.query.filter_by(session_id=session_id).first()
            if not chat_session:
                return jsonify({'error': 'Session not found'}), 404
            
            # Delete session (messages will be deleted due to cascade)
            db.session.delete(chat_session)
            db.session.commit()
            
            # If this was the current session, clear it
            if session.get('session_id') == session_id:
                session.pop('session_id', None)
            
            return jsonify({'success': True})
        except Exception as e:
            logger.error(f"Delete session error: {e}")
            return jsonify({'error': 'Failed to delete session'}), 500
    
    @app.route('/api/sessions/all', methods=['DELETE'])
    def delete_all_chat_sessions():
        """Delete all chat sessions and messages"""
        try:
            ChatMessage.query.delete()
            ChatSession.query.delete()
            db.session.commit()
            
            # Clear current session
            session.pop('session_id', None)
            
            return jsonify({'success': True})
        except Exception as e:
            logger.error(f"Delete all sessions error: {e}")
            return jsonify({'error': 'Failed to delete sessions'}), 500
    
    @app.route('/health')
    def health():
        """Health check endpoint"""
        return jsonify({'status': 'healthy'})

if __name__ == '__main__':
    def run_app():
        """Run the Flask application"""
        port = int(os.environ.get('PORT', 5000))
        app.run(host='0.0.0.0', port=port, debug=True)
    
    run_app()