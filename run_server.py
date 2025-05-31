import os
import sys
import atexit
import argparse
from pathlib import Path
import tomli
import uvicorn
from loguru import logger
from fastapi import FastAPI # Added for endpoint
from pydantic import BaseModel # Added for request model
from typing import List, Optional # Added for request model typing

from upgrade import sync_user_config, select_language
from src.open_llm_vtuber.server import WebSocketServer
from src.open_llm_vtuber.config_manager import Config, read_yaml, validate_config
# Corrected import for validate_config based on its usage pattern
from src.open_llm_vtuber.llm_config_manager import (
    LLMClientManager,
    OpenAICompatibleConfig,
    initialize_global_llm_manager,
    global_llm_client_manager
)


os.environ["HF_HOME"] = str(Path(__file__).parent / "models")
os.environ["MODELSCOPE_CACHE"] = str(Path(__file__).parent / "models")


def get_version() -> str:
    with open("pyproject.toml", "rb") as f:
        pyproject = tomli.load(f)
    return pyproject["project"]["version"]


def init_logger(console_log_level: str = "INFO") -> None:
    logger.remove()
    # Console output
    logger.add(
        sys.stderr,
        level=console_log_level,
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</
level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> | {mess
age}",
        colorize=True,
    )

    # File output
    logger.add(
        "logs/debug_{time:YYYY-MM-DD}.log",
        rotation="10 MB",
        retention="30 days",
        level="DEBUG",
        format="{time:YYYY-MM-DD HH:mm:ss.SSS} | {level: <8} | {name}:{function}
:{line} | {message} | {extra}",
        backtrace=True,
        diagnose=True,
    )


def parse_args():
    parser = argparse.ArgumentParser(description="Open-LLM-VTuber Server")
    parser.add_argument("--verbose", action="store_true", help="Enable verbose l
ogging")
    parser.add_argument(
        "--hf_mirror", action="store_true", help="Use Hugging Face mirror"
    )
    return parser.parse_args()


@logger.catch
def run(console_log_level: str):
    init_logger(console_log_level)
    logger.info(f"Open-LLM-VTuber, version v{get_version()}")
    # Sync user config with default config
    try:
        sync_user_config(logger=logger, lang=select_language())
    except Exception as e:
        logger.error(f"Error syncing user config: {e}")

    atexit.register(WebSocketServer.clean_cache)

    # Load configurations from yaml file
    config: Config = validate_config(read_yaml("conf.yaml")) # type: ignore
    server_config = config.system_config

    # Initialize the global LLM client manager
    # We need to extract a default LLM configuration that fits OpenAICompatibleConfig
    # This is a simplification; the actual config path might be more complex
    # For example, it might be config.character_config.agent_config.llm_configs.ollama_llm (if using ollama as default)
    # or config.character_config.agent_config.llm_configs.openai_llm etc.
    # We'll try to find a compatible one or pass None.
    default_llm_config_for_manager: Optional[OpenAICompatibleConfig] = None
    if config.character_config and \
       config.character_config.agent_config and \
       config.character_config.agent_config.llm_configs:
        llm_configs = config.character_config.agent_config.llm_configs
        # Prioritize openai_compatible_llm, then ollama, then openai official
        if llm_configs.openai_compatible_llm and isinstance(llm_configs.openai_compatible_llm, OpenAICompatibleConfig):
            default_llm_config_for_manager = llm_configs.openai_compatible_llm
        elif llm_configs.ollama_llm and isinstance(llm_configs.ollama_llm, OpenAICompatibleConfig):
            default_llm_config_for_manager = llm_configs.ollama_llm
        elif llm_configs.openai_llm and isinstance(llm_configs.openai_llm, OpenAICompatibleConfig):
            default_llm_config_for_manager = llm_configs.openai_llm
        # Add other potential compatible configs here if necessary

    if default_llm_config_for_manager:
        logger.info(f"Initializing LLM Manager with default config: {default_llm_config_for_manager.model_dump(exclude_none=True)}")
    else:
        logger.warning("No compatible default LLM config found for LLMClientManager. It will rely on user-provided keys for OpenRouter.")
    initialize_global_llm_manager(config=default_llm_config_for_manager)


    # Initialize and run the WebSocket server
    server = WebSocketServer(config=config)

    # Define Pydantic model for chat request
    class ChatRequest(BaseModel):
        message: str
        history: List[dict] = []
        openRouterApiKey: Optional[str] = None
        openRouterModelName: Optional[str] = None

    # Add HTTP endpoint to the existing FastAPI app instance within WebSocketServer
    @server.app.post("/api/chat") # type: ignore
    async def chat_endpoint(request: ChatRequest):
        logger.info(f"Received chat request: {request.message}")
        messages = request.history + [{"role": "user", "content": request.message}]

        if not global_llm_client_manager:
            logger.error("LLM Client Manager not initialized.")
            return {"error": "LLM Client Manager not initialized."}

        response_text = await global_llm_client_manager.generate_response(
            messages=messages, # type: ignore
            user_api_key=request.openRouterApiKey,
            user_openrouter_model_name=request.openRouterModelName
        )
        return {"response": response_text}

    uvicorn.run(
        app=server.app, # type: ignore
        host=server_config.host,
        port=server_config.port,
        log_level=console_log_level.lower(),
    )


if __name__ == "__main__":
    args = parse_args()
    console_log_level = "DEBUG" if args.verbose else "INFO"
    if args.verbose:
        logger.info("Running in verbose mode")
    else:
        logger.info(
            "Running in standard mode. For detailed debug logs, use: uv run run_
server.py --verbose"
        )
    if args.hf_mirror:
        os.environ["HF_ENDPOINT"] = "https://hf-mirror.com"
    run(console_log_level=console_log_level)
