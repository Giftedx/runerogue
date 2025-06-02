"""
MCP Server implementation for RuneRogue.

This module implements the Model Context Protocol (MCP) server that enables
GitHub Copilot Agents to interact with RuneRogue's tooling and services.
"""

from fastapi.responses import JSONResponse
from fastapi import Request, HTTPException
from starlette.types import ASGIApp, Receive, Scope, Send
from typing import Callable, Awaitable, Any, Dict, Optional, List
import asyncio
import json
import logging
import os
import re
import uuid
import time
from datetime import datetime, timezone, timedelta
from functools import wraps
from typing import Any, Dict, List, Optional, Type, TypeVar, Union, Callable, Awaitable, cast
from datetime import datetime, timedelta
from pathlib import Path
import os
import logging
import uuid

from fastapi import (
    Depends,
    FastAPI,
    HTTPException,
    Request,
    Response,
    status,
    BackgroundTasks,
    Security,
    APIRouter,
    Query,
    Body,
    Path as FPath,
)
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm, HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security.api_key import APIKeyHeader
from fastapi.security.utils import get_authorization_scheme_param
from fastapi.openapi.models import OAuth2 as OAuth2Model, OAuthFlows as OAuthFlowsModel
from fastapi.param_functions import Form
from fastapi.openapi.utils import get_openapi
from pydantic import BaseModel, Field, ValidationError, validator
from jose import JWTError, jwt
from passlib.context import CryptContext
from starlette.status import HTTP_401_UNAUTHORIZED, HTTP_403_FORBIDDEN, HTTP_404_NOT_FOUND, HTTP_429_TOO_MANY_REQUESTS
from starlette.requests import Request as StarletteRequest
from starlette.responses import JSONResponse, Response as StarletteResponse
from starlette.types import ASGIApp, Message, Receive, Scope, Send
from starlette.exceptions import HTTPException as StarletteHTTPException

# Type aliases
JSONType = Union[Dict[str, Any], List[Any], str, int, float, bool, None]
ToolName = str
ToolInput = Dict[str, Any]
ToolOutput = Dict[str, Any]

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Security configuration


class SecurityConfigUpdate(BaseModel):
    rate_limit_enabled: Optional[bool] = None
    allowed_ips: Optional[List[str]] = None


# API Key security
api_key_header = HTTPBearer(auto_error=False)

# User model for authentication


class User(BaseModel):
    username: str
    email: Optional[str] = None
    full_name: Optional[str] = None
    disabled: Optional[bool] = None
    is_admin: bool = False

# User in DB model


class UserInDB(User):
    hashed_password: str


# Fake user database for demo
fake_users_db = {
    "admin": {
        "username": "admin",
        "email": "admin@example.com",
        "full_name": "Admin User",
        "hashed_password": "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW",  # "secret"
        "disabled": False,
        "is_admin": True,
    },
    "user": {
        "username": "user",
        "email": "user@example.com",
        "full_name": "Regular User",
        "hashed_password": "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW",  # "secret"
        "disabled": False,
        "is_admin": False,
    },
}


def get_user(db, username: str):
    if username in db:
        user_dict = db[username]
        return UserInDB(**user_dict)
    return None


def authenticate_user(db, username: str, password: str):
    user = get_user(db, username)
    if not user or password != "secret":  # In real app, verify hashed password
        return False
    return user


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    # In a real app, use proper JWT token creation
    return f"fake-jwt-token-{uuid.uuid4()}"


async def get_current_user(token: str = Depends(api_key_header)) -> User:
    # In a real app, validate JWT token
    if token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    # For demo, just return a user
    return UserInDB(**fake_users_db["admin"])


async def get_current_active_user(
        current_user: User = Depends(get_current_user)) -> User:
    if current_user.disabled:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

# Rate limiting configuration
RATE_LIMIT = "100/minute"  # Default rate limit
TOKEN_RATE_LIMIT = "10/minute"  # Stricter limit for token endpoint

# Security settings
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
SECRET_KEY = os.getenv(
    "MCP_SECRET_KEY",
    "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7")

# Define types for better type checking


class DummyLimiter:
    """Dummy limiter when slowapi is not available."""

    def limit(self, *args, **kwargs):
        def decorator(func):
            return func
        return decorator


class RateLimitExceeded(HTTPException):
    """Dummy RateLimitExceeded exception when slowapi is not available."""

    def __init__(
            self,
            detail: str = "Rate limit exceeded",
            retry_after: int = 60):
        super().__init__(status_code=429, detail=detail)
        self.detail = detail
        self.retry_after = retry_after


def get_remote_address(request: Request) -> str:
    return request.client.host if request.client else "127.0.0.1"


class SlowAPIMiddleware:
    """Dummy middleware when slowapi is not available."""

    def __init__(self, app: ASGIApp):
        self.app = app

    async def __call__(
            self,
            scope: Scope,
            receive: Receive,
            send: Send) -> None:
        await self.app(scope, receive, send)


# Initialize rate limiter
limiter = DummyLimiter()
SLOWAPI_AVAILABLE = False


def _rate_limit_exceeded_handler(
        request: Request,
        exc: Exception) -> JSONResponse:
    return JSONResponse(
        status_code=429,
        content={"detail": "Rate limit exceeded"},
        headers={"Retry-After": "60"}
    )


# Try to import slowapi components, but make them optional
try:
    from slowapi import Limiter, _rate_limit_exceeded_handler as slowapi_handler
    from slowapi.errors import RateLimitExceeded as SlowAPIRateLimitExceeded
    from slowapi.util import get_remote_address as slowapi_get_remote_address
    from slowapi.middleware import SlowAPIMiddleware as SlowAPIImpl

    # Use the real implementations
    limiter = Limiter(key_func=slowapi_get_remote_address)
    _rate_limit_exceeded_handler = slowapi_handler
    RateLimitExceeded = SlowAPIRateLimitExceeded
    SlowAPIMiddleware = SlowAPIImpl
    SLOWAPI_AVAILABLE = True

except ImportError:
    # Use the dummy implementations defined above
    pass

# Security scheme for API key authentication
security = HTTPBearer()


class RateLimitConfig(BaseModel):
    """Rate limiting configuration."""
    enabled: bool = True
    default_limit: str = "100/minute"
    per_ip: bool = True

    @validator('default_limit')
    def validate_limit_format(cls, v):
        if not re.match(r'^\d+/(second|minute|hour|day)$', v):
            raise ValueError(
                'Rate limit must be in format "number/unit" (e.g., 100/minute)')
        return v


class SecurityConfig(BaseModel):
    """Security configuration."""
    rate_limiting: RateLimitConfig = RateLimitConfig()
    allowed_ips: List[str] = ["127.0.0.1", "::1"]
    require_api_key: bool = False

    def is_ip_allowed(self, ip: str) -> bool:
        """Check if an IP address is allowed."""
        if not self.allowed_ips:
            return True
        try:
            import ipaddress
            ip_addr = ipaddress.ip_address(ip)
            return any(ip_addr == ipaddress.ip_address(allowed)
                       for allowed in self.allowed_ips)
        except ValueError:
            return False


# Default security configuration
security_config = SecurityConfig()


def get_api_key(
        credentials: HTTPAuthorizationCredentials = Security(security)) -> str:
    """Validate and return the API key from the Authorization header."""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if security_config.require_api_key and credentials.credentials != os.getenv(
            "API_KEY"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid API key",
        )
    return credentials.credentials


# Type aliases
ToolName = str
ToolInput = Dict[str, Any]
ToolOutput = Dict[str, Any]


class ToolResultStatus:
    """Constants for tool execution status."""
    SUCCESS = "success"
    ERROR = "error"


class ToolResult(BaseModel):
    """Result of a tool execution."""
    status: str
    result: Any = None
    error: Optional[str] = None
    timestamp: str = Field(
        default_factory=lambda: datetime.utcnow().isoformat())

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat(),
        }

    @classmethod
    def success(cls, result: Any = None) -> 'ToolResult':
        """Create a successful tool result."""
        return cls(status="success", result=result)

    @classmethod
    def error(cls, error: str = "An unknown error occurred") -> 'ToolResult':
        """Create an error tool result."""
        return cls(status="error", error=error)  # type: ignore


class Tool:
    """Base class for MCP tools."""

    def __init__(
        self,
        name: str,
        description: str = "",
        input_model: Optional[Type[BaseModel]] = None,
        output_model: Optional[Type[BaseModel]] = None,
        rate_limit: Optional[str] = None,
        require_auth: bool = True,
        admin_only: bool = False,
    ) -> None:
        """Initialize a tool.

        Args:
            name: Unique name of the tool
            description: Description of what the tool does
            input_model: Pydantic model for input validation
            output_model: Pydantic model for output validation
            rate_limit: Rate limit string (e.g., "10/minute")
            require_auth: Whether the tool requires authentication
            admin_only: Whether the tool is restricted to admin users
        """
        self.name = name
        self.description = description
        self.input_model = input_model
        self.output_model = output_model
        self.rate_limit = rate_limit
        self.require_auth = require_auth
        self.admin_only = admin_only

    async def execute(self, input_data: Dict[str, Any]) -> Any:
        """Execute the tool with the given input data.

        Args:
            input_data: Input data for the tool

        Returns:
            Tool execution result
        """
        raise NotImplementedError("Subclasses must implement execute()")


class MCPServer:
    """MCP Server for RuneRogue."""

    def __init__(
        self,
        title: str = "RuneRogue MCP Server",
        version: str = "0.1.0",
        rate_limit_enabled: bool = True,
        allowed_ips: Optional[List[str]] = None,
        api_key: Optional[str] = None,
        admin_api_key: Optional[str] = None,
    ) -> None:
        """Initialize the MCP server.

        Args:
            title: Server title
            version: Server version
            rate_limit_enabled: Whether to enable rate limiting
            allowed_ips: List of allowed IP addresses (None for all)
            api_key: API key for authentication
            admin_api_key: Admin API key for privileged operations
        """
        # Initialize FastAPI app
        self.app = FastAPI(title=title, version=version)
        
        # Initialize server properties
        self.tools: Dict[str, Tool] = {}
        self.rate_limit_enabled = rate_limit_enabled
        self.allowed_ips = allowed_ips or []
        self.api_key = api_key
        self.admin_api_key = admin_api_key
        self.limiter = limiter  # Use the global limiter instance
        
        # Set up middleware and routes
        self._setup_middleware()
        self._setup_exception_handlers()
        self._setup_routes()

    def register_tool(self, tool: Tool) -> None:
        """Register a tool with the MCP server.

        Args:
            tool: The tool to register

        Raises:
            ValueError: If a tool with the same name is already registered
        """
        if tool.name in self.tools:
            raise ValueError(
                f"Tool with name '{
                    tool.name}' already registered")
        self.tools[tool.name] = tool
        logger.info(f"Registered tool: {tool.name}")

    def tool(
        self,
        name: str,
        description: str = "",
        input_model: Optional[Type[BaseModel]] = None,
        output_model: Optional[Type[BaseModel]] = None,
        rate_limit: Optional[str] = None,
        require_auth: bool = True,
        admin_only: bool = False,
    ) -> Callable[[Callable[..., Any]], Callable[..., Any]]:
        """Decorator to register a function as a tool.

        Args:
            name: Name of the tool (must be unique)
            description: Description of what the tool does
            input_model: Pydantic model for input validation
            output_model: Pydantic model for output validation
            rate_limit: Rate limit string (e.g., "10/minute")
            require_auth: Whether the tool requires authentication
            admin_only: Whether the tool is restricted to admin users

        Returns:
            Decorator function
        """
        def decorator(func: Callable[..., Any]) -> Callable[..., Any]:
            @wraps(func)
            async def wrapper(*args: Any, **kwargs: Any) -> Any:
                return await func(*args, **kwargs)

            # Create a dynamic Tool subclass that links to the function
            class DecoratedTool(Tool):
                def __init__(self):
                    super().__init__(
                        name=name,
                        description=description,
                        input_model=input_model,
                        output_model=output_model,
                        rate_limit=rate_limit,
                        require_auth=require_auth,
                        admin_only=admin_only,
                    )
                    self.func = func

                async def execute(self, input_data: Dict[str, Any]) -> Any:
                    """Execute the tool with the decorated function."""
                    # If input_model is provided, validate and convert input
                    if self.input_model:
                        if isinstance(input_data, dict):
                            validated_input = self.input_model(**input_data)
                        else:
                            validated_input = input_data
                        return await self.func(validated_input)
                    else:
                        return await self.func(**input_data)

            # Create and register the tool instance
            tool_instance = DecoratedTool()
            self.register_tool(tool_instance)
            return wrapper

        return decorator

    def _setup_middleware(self) -> None:
        """Set up middleware for the FastAPI app."""
        # CORS middleware
        self.app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],  # Configure this in production
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

        # Security headers middleware
        @self.app.middleware("http")
        async def add_security_headers(
                request: Request,
                call_next: Callable) -> Response:
            try:
                response = await call_next(request)
                response.headers["X-Content-Type-Options"] = "nosniff"
                response.headers["X-Frame-Options"] = "DENY"
                response.headers["X-XSS-Protection"] = "1; mode=block"
                response.headers["Content-Security-Policy"] = "default-src 'self'"
                return response
            except Exception as e:
                logger.error(f"Error in security middleware: {e}")
                raise

    def _setup_exception_handlers(self) -> None:
        """Set up exception handlers for the FastAPI app."""
        @self.app.exception_handler(StarletteHTTPException)
        async def http_exception_handler(
            request: Request, exc: StarletteHTTPException
        ) -> JSONResponse:
            return JSONResponse(
                status_code=exc.status_code,
                content={"detail": exc.detail},
                headers=dict(exc.headers) if exc.headers else {},
            )

        @self.app.exception_handler(HTTPException)
        async def fastapi_http_exception_handler(
            request: Request, exc: HTTPException
        ) -> JSONResponse:
            return JSONResponse(
                status_code=exc.status_code,
                content={"detail": exc.detail},
                headers=dict(exc.headers) if exc.headers else {},
            )

        @self.app.exception_handler(ValidationError)
        async def validation_exception_handler(
            request: Request, exc: ValidationError
        ) -> JSONResponse:
            return JSONResponse(
                status_code=422,
                content={"detail": [str(err) for err in exc.errors()]},
            )

        @self.app.exception_handler(RateLimitExceeded)
        async def rate_limit_exception_handler(
            request: Request, exc: RateLimitExceeded
        ) -> JSONResponse:
            return JSONResponse(
                status_code=429,
                content={"detail": str(exc.detail)},
                headers={"Retry-After": str(exc.retry_after) if hasattr(exc, 'retry_after') else '60'}
            )

        @self.app.exception_handler(Exception)
        async def global_exception_handler(
            request: Request, exc: Exception
        ) -> JSONResponse:
            logger.exception("Unhandled exception")
            return JSONResponse(
                status_code=500,
                content={"detail": "Internal server error"},
            )

    def _setup_routes(self) -> None:
        """Register API routes with security and rate limiting."""
        # Helper to apply rate limiting conditionally
        def apply_rate_limit(rate: str = "100/minute"):
            if not self.rate_limit_enabled or not SLOWAPI_AVAILABLE:
                return lambda x: x
            return self.limiter.limit(rate)

        # Public routes
        @self.app.get("/health", response_model=Dict[str, str])
        async def health_check() -> Dict[str, str]:
            """Health check endpoint."""
            return {"status": "ok"}

        # Protected routes
        @self.app.post("/token")
        # Stricter rate limit for token endpoint
        @apply_rate_limit("10/minute")
        async def login_for_access_token(
            request: Request,
            form_data: OAuth2PasswordRequestForm = Depends()
        ) -> Dict[str, Union[str, int]]:
            """Get an access token for authentication."""
            user = authenticate_user(
                fake_users_db,
                form_data.username,
                form_data.password)
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Incorrect username or password",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            access_token_expires = timedelta(
                minutes=int(os.getenv("MCP_ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
            )
            access_token = create_access_token(
                data={"sub": user.username},
                expires_delta=access_token_expires
            )
            return {
                "access_token": access_token,
                "token_type": "bearer",
                "expires_in": int(access_token_expires.total_seconds())
            }

        # List available tools endpoint
        @self.app.get("/tools", response_model=Dict[str, Any])
        @apply_rate_limit()
        async def list_tools(
            request: Request,
            current_user: User = Depends(get_current_active_user)
        ) -> Dict[str, Any]:
            """List all available tools."""
            tools_list = []
            for tool_name, tool in self.tools.items():
                tool_info = {
                    "name": tool.name,
                    "description": tool.description,
                    "require_auth": tool.require_auth,
                    "admin_only": tool.admin_only,
                }
                
                # Add input model info if available
                if hasattr(tool, 'input_model') and tool.input_model:
                    try:
                        tool_info["parameters"] = tool.input_model.model_json_schema()
                    except AttributeError:
                        # Fallback for older pydantic versions
                        tool_info["parameters"] = tool.input_model.schema()
                elif hasattr(tool, 'parameters'):
                    tool_info["parameters"] = tool.parameters
                
                # Add rate limit info if available
                if hasattr(tool, 'rate_limit') and tool.rate_limit:
                    tool_info["rate_limit"] = tool.rate_limit
                
                tools_list.append(tool_info)
            
            return {
                "tools": tools_list,
                "total_count": len(tools_list)
            }

        # Tool execution endpoint with rate limiting and authentication
        @self.app.post("/tools/{tool_name}", response_model=Dict[str, Any])
        @apply_rate_limit()
        async def execute_tool_endpoint(
            tool_name: str,
            input_data: Dict[str, Any],
            background_tasks: BackgroundTasks,
            request: Request,
            current_user: User = Depends(get_current_active_user)
        ) -> Dict[str, Any]:
            """Execute a tool with the given input data."""
            return await self.execute_tool(
                tool_name=tool_name,
                input_data=input_data,
                background_tasks=background_tasks,
                request=request,
                current_user=current_user
            )

        # Admin-only endpoint to update security configuration
        @self.app.post("/admin/security-config")
        @apply_rate_limit("30/minute")
        async def update_security_config(
            request: Request,
            config: SecurityConfigUpdate,
            current_user: User = Depends(get_current_active_user),
            api_key: str = Security(api_key_header)
        ) -> Dict[str, Any]:
            """Update security configuration (admin only)."""
            # Check admin API key if provided, otherwise check user permissions
            if not (
                    api_key and api_key == self.admin_api_key) and not getattr(
                    current_user,
                    'is_admin',
                    False):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Admin privileges required"
                )

            # Validate input
            if config.rate_limit_enabled is not None:
                self.rate_limit_enabled = config.rate_limit_enabled
                logger.info(
                    f"Rate limiting {
                        'enabled' if self.rate_limit_enabled else 'disabled'}")

            if config.allowed_ips is not None:
                # Validate IP addresses
                ip_pattern = re.compile(
                    r'^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}'
                    r'(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^::[0-9a-fA-F]{1,4}$|^((?:[0-9A-Fa-f]{1,4}:){7}[0-9A-Fa-f]{1,4})$')
                for ip in config.allowed_ips:
                    if not ip_pattern.match(ip):
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Invalid IP address format: {ip}"
                        )
                self.allowed_ips = set(config.allowed_ips)
                logger.info(
                    f"Updated allowed IPs: {
                        ', '.join(
                            self.allowed_ips) or 'None'}")

            return {
                "status": "success",
                "rate_limit_enabled": self.rate_limit_enabled,
                "allowed_ips": list(self.allowed_ips)
            }

    async def execute_tool(
        self,
        tool_name: str,
        input_data: Dict[str, Any],
        background_tasks: BackgroundTasks,
        request: Request,
        current_user: User = Depends(get_current_active_user)
    ) -> Dict[str, Any]:
        """Execute a tool with the given input."""
        logger.info(
            f"Executing tool: {tool_name} for user {
                current_user.username}")

        # Validate tool exists
        if tool_name not in self.tools:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Tool '{tool_name}' not found"
            )

        tool = self.tools[tool_name]

        # Validate input against tool parameters
        try:
            validated_input = tool.validate_input(input_data)  # type: ignore
        except ValidationError as e:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail={"errors": e.errors()}
            )

        # Execute the tool
        try:
            if asyncio.iscoroutinefunction(tool.func):
                result = await tool.func(**validated_input)
            else:
                # Run sync function in thread pool
                result = await asyncio.get_event_loop().run_in_executor(
                    None, lambda: tool.func(**validated_input)
                )

            # Process and return the result
            return {
                "status": "success",
                "result": result,
                "tool": tool_name,
                "timestamp": datetime.utcnow().isoformat()
            }

        except Exception as e:
            logger.exception(f"Error executing tool {tool_name}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Internal server error: {str(e)}"
            )

        tool = self.tools[tool_name]

        try:
            # Validate input against tool's parameter schema
            self._validate_tool_input(tool, input_data)

            # Execute the tool in a background task if it's long-running
            if getattr(tool, "is_long_running", False):
                task_id = str(uuid.uuid4())
                background_tasks.add_task(
                    self._execute_tool_async,
                    tool_name=tool_name,
                    input_data=input_data,
                    task_id=task_id,
                    user_id=current_user.username
                )
                return {
                    "status": "pending",
                    "task_id": task_id,
                    "message": "Tool execution started in background"
                }

            # Execute the tool synchronously
            start_time = datetime.now(timezone.utc)
            result = await tool.execute(input_data)
            exec_time_ms = (datetime.now(timezone.utc) -
                            start_time).total_seconds() * 1000

            # Log the execution
            logger.info(
                f"Successfully executed tool '{tool_name}' for {
                    current_user.username}. " f"Execution time: {
                    exec_time_ms:.2f}ms")

            # Sanitize the output
            sanitized_output = self._sanitize_output(result.output)

            return {
                "status": result.status,
                "output": sanitized_output,
                "error": result.error,
                "execution_time_ms": exec_time_ms,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }

        except ValidationError as ve:
            logger.warning(
                f"Input validation failed for tool '{tool_name}': {
                    str(ve)}")
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail={"validation_errors": ve.errors()}
            )
        except HTTPException:
            raise
        except Exception as e:
            logger.error(
                f"Error executing tool '{tool_name}': {str(e)}",
                exc_info=True
            )
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error executing tool: {str(e)}"
            )

    def _validate_tool_input(
            self, tool: Tool, input_data: Dict[str, Any]) -> None:
        """Validate tool input against its schema."""
        if not hasattr(tool, "parameters") or not tool.parameters:
            return

        try:
            # This is a simplified validation - in a real implementation,
            # you would use a proper JSON Schema validator
            required_params = tool.parameters.get("required", [])
            for param in required_params:
                if param not in input_data:
                    raise ValidationError(
                        [
                            {
                                "loc": (param,),
                                "msg": "field required",
                                "type": "value_error.missing"
                            }
                        ],
                        model=BaseModel
                    )
        except ValidationError:
            raise
        except Exception as e:
            logger.error(f"Error validating tool input: {str(e)}")
            raise ValidationError(
                [{"loc": ("input",), "msg": "Invalid input format", "type": "value_error"}],
                model=BaseModel
            )

    def _sanitize_output(self, output: Any) -> Any:
        """Sanitize tool output to prevent security issues."""
        if output is None:
            return None

        # Convert output to a safe format (e.g., JSON-serializable)
        if isinstance(output, (str, int, float, bool)) or output is None:
            return output

        if isinstance(output, (list, tuple)):
            return [self._sanitize_output(item) for item in output]

        if isinstance(output, dict):
            return {k: self._sanitize_output(v) for k, v in output.items()}

        # Convert other types to string representation
        return str(output)

    async def _execute_tool_async(
        self,
        tool_name: str,
        input_data: Dict[str, Any],
        task_id: str,
        user_id: str
    ) -> Dict[str, Any]:
        """Execute a tool asynchronously in the background."""
        try:
            tool = self.tools.get(tool_name)
            if not tool:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Tool '{tool_name}' not found"
                )

            if not hasattr(tool, 'execute') or not callable(tool.execute):
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Tool '{tool_name}' is not callable"
                )

            result = await tool.execute(input_data)
            logger.info(
                f"Completed background task {task_id} for user {user_id}")

            # Ensure the result is JSON-serializable
            if result is None:
                return {
                    "status": "success",
                    "message": f"Tool '{tool_name}' executed successfully"}
            if isinstance(result, dict):
                return result
            return {"status": "success", "result": str(result)}
        except Exception as e:
            error_msg = f"Error in background task {task_id}: {str(e)}"
            logger.error(error_msg, exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=error_msg
            )

    def _setup_exception_handlers(self) -> None:
        """Set up exception handlers for different types of exceptions."""

        @self.app.exception_handler(StarletteHTTPException)
        async def http_exception_handler(
            request: Request, exc: StarletteHTTPException
        ) -> JSONResponse:
            return JSONResponse(
                status_code=exc.status_code,
                content={"detail": exc.detail},
                headers=exc.headers if hasattr(exc, 'headers') else None,
            )

        @self.app.exception_handler(HTTPException)
        async def fastapi_http_exception_handler(
            request: Request, exc: HTTPException
        ) -> JSONResponse:
            return JSONResponse(
                status_code=exc.status_code,
                content={"detail": exc.detail},
                headers=exc.headers,
            )

        @self.app.exception_handler(ValidationError)
        async def validation_exception_handler(
            request: Request, exc: ValidationError
        ) -> JSONResponse:
            return JSONResponse(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                content={"detail": exc.errors()},
            )

        @self.app.exception_handler(RateLimitExceeded)
        async def rate_limit_exceeded_handler(
            request: Request, exc: RateLimitExceeded
        ) -> JSONResponse:
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={"detail": str(exc.detail)},
                headers={"Retry-After": str(exc.retry_after)},
            )

        @self.app.exception_handler(Exception)
        async def global_exception_handler(
            request: Request, exc: Exception
        ) -> JSONResponse:
            logger.exception("Unhandled exception")
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={"detail": "Internal server error"},
            )

    def get_app(self) -> FastAPI:
        """Get the FastAPI application instance."""
        return self.app


# Create a default server instance
server = MCPServer(title="RuneRogue MCP Server", version="0.1.0")

# Re-export the server instance and decorators
app = server.get_app()
tool = server.tool
register_tool = server.register_tool
