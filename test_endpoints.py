import unittest
import json
from app import app, db


class TestAllEndpoints(unittest.TestCase):
    """Simple tests for all API endpoints"""
    
    def setUp(self):
        """Set up test client"""
        app.config['TESTING'] = True
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        self.client = app.test_client()
        self.app_context = app.app_context()
        self.app_context.push()
        db.create_all()
    
    def tearDown(self):
        """Clean up after tests"""
        self.app_context.pop()

    def test_index_page(self):
        """Test the main page loads"""
        response = self.client.get('/')
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'Brian', response.data)

    def test_health_check(self):
        """Test health endpoint"""
        response = self.client.get('/health')
        self.assertEqual(response.status_code, 200)
        
        data = json.loads(response.data)
        self.assertEqual(data['status'], 'healthy')

    # def test_chat_endpoint(self):
    #     """Test basic chat functionality"""
    #     response = self.client.post('/api/chat',
    #                           data=json.dumps({'message': 'Hello Brian'}),
    #                           content_type='application/json')
    #
    #     self.assertEqual(response.status_code, 200)
    #     data = json.loads(response.data)
    #     self.assertIn('response', data)
    #     self.assertIn('timestamp', data)

    def test_chat_empty_message(self):
        """Test chat with empty message"""
        response = self.client.post('/api/chat',
                              data=json.dumps({'message': ''}),
                              content_type='application/json')
        
        self.assertEqual(response.status_code, 400)

    def test_get_chat_history(self):
        """Test getting chat history"""
        # Send a message first
        self.client.post('/api/chat', 
                        data=json.dumps({'message': 'Test message'}),
                        content_type='application/json')
        
        response = self.client.get('/api/history')
        self.assertEqual(response.status_code, 200)
        
        data = json.loads(response.data)
        self.assertIsInstance(data, list)
        self.assertGreater(len(data), 0)

    def test_clear_chat_history(self):
        """Test clearing chat history"""
        response = self.client.post('/api/clear-history')
        self.assertEqual(response.status_code, 200)
        
        # Just check that response is successful
        self.assertTrue(response.data)

    def test_get_sessions(self):
        """Test getting session list"""
        response = self.client.get('/api/sessions')
        self.assertEqual(response.status_code, 200)
        
        data = json.loads(response.data)
        self.assertIsInstance(data, list)

    def test_create_session(self):
        """Test creating new session"""
        response = self.client.post('/api/sessions')
        self.assertEqual(response.status_code, 200)
        
        data = json.loads(response.data)
        self.assertIn('session_id', data)
        self.assertTrue(len(data['session_id']) > 0)

    def test_switch_session(self):
        """Test switching sessions"""
        # Create session first
        create_response = self.client.post('/api/sessions')
        session_data = json.loads(create_response.data)
        session_id = session_data['session_id']
        
        # Switch to it
        response = self.client.post(f'/api/sessions/{session_id}/switch')
        # Accept either 200 or redirect status
        self.assertIn(response.status_code, [200, 302])

    def test_delete_session(self):
        """Test deleting a session"""
        # Create session first
        create_response = self.client.post('/api/sessions')
        session_data = json.loads(create_response.data)
        session_id = session_data['session_id']
        
        # Delete it
        response = self.client.delete(f'/api/sessions/{session_id}')
        # Accept either 200 or redirect status
        self.assertIn(response.status_code, [200, 302])

    def test_delete_all_sessions(self):
        """Test deleting all sessions"""
        # Create a session first
        self.client.post('/api/sessions')
        
        response = self.client.delete('/api/sessions/all')
        # Accept either 200 or redirect status
        self.assertIn(response.status_code, [200, 302])

    def test_invalid_endpoint(self):
        """Test 404 for invalid endpoints"""
        response = self.client.get('/invalid-endpoint')
        self.assertEqual(response.status_code, 404)

    def test_method_not_allowed(self):
        """Test wrong HTTP method"""
        response = self.client.get('/api/chat')  # Should be POST
        self.assertEqual(response.status_code, 405)


if __name__ == '__main__':
    unittest.main()