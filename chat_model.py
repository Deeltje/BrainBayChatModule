#!/usr/bin/env python3
"""
Simple Hugging Face Chat Model for Brian Real Estate Assistant
"""

from transformers import AutoTokenizer, AutoModelForCausalLM
import torch
import logging

logger = logging.getLogger(__name__)


class BrianChatModel:

    def __init__(self):
        self.model = None
        self.tokenizer = None
        self.model_name = "gpt2"

    def initialize(self):
        """Load the model"""
        logger.info("Loading chat model...")
        self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)
        self.model = AutoModelForCausalLM.from_pretrained(self.model_name)
        if self.tokenizer.pad_token is None:
            self.tokenizer.pad_token = self.tokenizer.eos_token
        logger.info("✓ Model loaded")

    def get_response(self, message):
        """Generate response using Hugging Face model"""
        if self.model is None:
            self.initialize()

        # Real estate context prompt
        # prompt = f"As a real estate assistant named Brian, answer this question: {message}\nBrian says:"
        prompt = message

        # Tokenize with attention mask
        inputs = self.tokenizer(prompt, return_tensors='pt', padding=True)
        input_ids = inputs['input_ids']
        attention_mask = inputs['attention_mask']

        # Generate
        with torch.no_grad():
            outputs = self.model.generate(
                input_ids,
                attention_mask=attention_mask,
                max_length=input_ids.shape[1] + 100,
                temperature=0.8,
                #do_sample=True,
                pad_token_id=self.tokenizer.pad_token_id,
                num_return_sequences=1)

        # Decode
        response = self.tokenizer.decode(outputs[0], skip_special_tokens=True)

        # Extract Brian's response
        if "Brian says:" in response:
            result = response.split("Brian says:")[-1].strip()
        else:
            result = response[len(prompt):].strip()

        # Clean up and ensure it's useful
        if not result or len(result) < 5:
            result = "As your real estate assistant, I'm here to help with property questions, buying, selling, and investments."

        return result


def get_ai_response(user_message, conversation_history=None) -> str:
    """Get AI response"""
    brian_model = BrianChatModel()
    return brian_model.get_response(user_message)
