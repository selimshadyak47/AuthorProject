#!/usr/bin/env python3
"""
Run the smart simulation API server
"""
import uvicorn
from test_api_v0 import app

if __name__ == "__main__":
    print("🚀 Starting AuthAI Smart Simulation API...")
    print("📊 This API provides realistic approval rates based on form completeness")
    print("🔗 API will be available at: http://localhost:8000")
    print("📖 API docs at: http://localhost:8000/docs")
    print("=" * 50)
    
    uvicorn.run(
        "test_api_v0:app", 
        host="0.0.0.0", 
        port=8000, 
        reload=True,
        log_level="info"
    )
