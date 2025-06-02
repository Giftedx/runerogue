FROM python:3.9-slim

# Set working directory
WORKDIR /app

# Copy only requirements first to leverage Docker cache
COPY agents/mcp/requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application code
COPY . .

# Set environment variables
ENV PYTHONPATH=/app
ENV MCP_SECRET_KEY=your-secret-key-here
ENV MCP_ACCESS_TOKEN_EXPIRE_MINUTES=30
ENV MCP_CORS_ORIGINS=*"

# Expose the port the app runs on
EXPOSE 8001

# Command to run the application
CMD ["python", "-m", "agents.mcp.main", "--host", "0.0.0.0", "--port", "8001"]
