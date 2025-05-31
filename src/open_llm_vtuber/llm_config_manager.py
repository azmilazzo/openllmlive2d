# config_manager/llm.py
from typing import ClassVar, Literal, Optional, List, Dict, Any
from pydantic import BaseModel, Field
# Attempt to import I18nMixin and Description from a relative path
# This might fail if the file structure isn't what's expected
# For now, we'll define placeholders if the import fails
try:
    from .i18n import I18nMixin, Description
except ImportError:
    class I18nMixin:
        pass
    class Description:
        def __init__(self, en: str, zh: str):
            self.en = en
            self.zh = zh

from openai import OpenAI, AsyncOpenAI # Ensure openai is installed

# Keep existing Pydantic models for configuration structure
class StatelessLLMBaseConfig(I18nMixin):
    """Base configuration for StatelessLLM."""
    interrupt_method: Literal["system", "user"] = Field(
        "user", alias="interrupt_method"
    )
    DESCRIPTIONS: ClassVar[dict[str, Description]] = {
        "interrupt_method": Description(
            en="""The method to use for prompting the interruption signal.
            If the provider supports inserting system prompt anywhere in the cha
t memory, use "system".
            Otherwise, use "user". You don't need to change this setting.""",
            zh="""用于表示中断信号的方法(提示词模式)。如果LLM支持在聊天记忆中的任何位置插入系统提示词，请使用“system”。
            否则，请使用“user”。您不需要更改此设置。""",
        ),
    }

class OpenAICompatibleConfig(StatelessLLMBaseConfig):
    """Configuration for OpenAI-compatible LLM providers."""
    base_url: str = Field(..., alias="base_url")
    llm_api_key: Optional[str] = Field(None, alias="llm_api_key") # Made Optional
    model: str = Field(..., alias="model")
    organization_id: str | None = Field(None, alias="organization_id")
    project_id: str | None = Field(None, alias="project_id")
    temperature: float = Field(1.0, alias="temperature")
    _OPENAI_COMPATIBLE_DESCRIPTIONS: ClassVar[dict[str, Description]] = {
        "base_url": Description(en="Base URL for the API endpoint", zh="API的URL端点"),
        "llm_api_key": Description(en="API key for authentication", zh="API 认证密钥"),
        "organization_id": Description(en="Organization ID for the API (Optional)", zh="组织 ID (可选)"),
        "project_id": Description(en="Project ID for the API (Optional)", zh="项目 ID (可选)"),
        "model": Description(en="Name of the LLM model to use", zh="LLM 模型名称"),
        "temperature": Description(en="What sampling temperature to use, between 0 and 2.", zh="使用的采样温度，介于 0 和 2 之间。"),
    }
    DESCRIPTIONS: ClassVar[dict[str, Description]] = {
        **StatelessLLMBaseConfig.DESCRIPTIONS,
        **_OPENAI_COMPATIBLE_DESCRIPTIONS,
    }

class OllamaConfig(OpenAICompatibleConfig):
    llm_api_key: str = Field("default_api_key", alias="llm_api_key")
    keep_alive: float = Field(-1, alias="keep_alive")
    unload_at_exit: bool = Field(True, alias="unload_at_exit")
    interrupt_method: Literal["system", "user"] = Field("system", alias="interrupt_method")
    _OLLAMA_DESCRIPTIONS: ClassVar[dict[str, Description]] = {
        "llm_api_key": Description(en="API key for authentication (defaults to 'default_api_key' for Ollama)", zh="API 认证密钥 (Ollama 默认为 'default_api_key')"),
        "keep_alive": Description(en="Keep the model loaded for this many seconds after the last request. Set to -1 to keep the model loaded indefinitely.", zh="在最后一个请求之后保持模型加载的秒数。设置为 -1 以无限期保持模型加载。"),
        "unload_at_exit": Description(en="Unload the model when the program exits.", zh="是否在程序退出时卸载模型。"),
    }
    DESCRIPTIONS: ClassVar[dict[str, Description]] = {**OpenAICompatibleConfig.DESCRIPTIONS, **_OLLAMA_DESCRIPTIONS}

class OpenAIConfig(OpenAICompatibleConfig):
    base_url: str = Field("https://api.openai.com/v1", alias="base_url")
    interrupt_method: Literal["system", "user"] = Field("system", alias="interrupt_method")

class GeminiConfig(OpenAICompatibleConfig):
    base_url: str = Field("https://generativelanguage.googleapis.com/v1beta/openai/", alias="base_url")
    interrupt_method: Literal["system", "user"] = Field("user", alias="interrupt_method")

class MistralConfig(OpenAICompatibleConfig):
    base_url: str = Field("https://api.mistral.ai/v1", alias="base_url")
    interrupt_method: Literal["system", "user"] = Field("user", alias="interrupt_method")

class ZhipuConfig(OpenAICompatibleConfig):
    base_url: str = Field("https://open.bigmodel.cn/api/paas/v4/", alias="base_url")

class DeepseekConfig(OpenAICompatibleConfig):
    base_url: str = Field("https://api.deepseek.com/v1", alias="base_url")

class GroqConfig(OpenAICompatibleConfig):
    base_url: str = Field("https://api.groq.com/openai/v1", alias="base_url")
    interrupt_method: Literal["system", "user"] = Field("system", alias="interrupt_method")

class ClaudeConfig(StatelessLLMBaseConfig):
    base_url: str = Field("https://api.anthropic.com", alias="base_url")
    llm_api_key: str = Field(..., alias="llm_api_key")
    model: str = Field(..., alias="model")
    interrupt_method: Literal["system", "user"] = Field("user", alias="interrupt_method")
    _CLAUDE_DESCRIPTIONS: ClassVar[dict[str, Description]] = {
        "base_url": Description(en="Base URL for Claude API", zh="Claude API 的API端点"),
        "llm_api_key": Description(en="API key for authentication", zh="API 认证密钥"),
        "model": Description(en="Name of the Claude model to use", zh="要使用的 Claude 模型名称"),
    }
    DESCRIPTIONS: ClassVar[dict[str, Description]] = {**StatelessLLMBaseConfig.DESCRIPTIONS, **_CLAUDE_DESCRIPTIONS}

class LlamaCppConfig(StatelessLLMBaseConfig):
    model_path: str = Field(..., alias="model_path")
    interrupt_method: Literal["system", "user"] = Field("system", alias="interrupt_method")
    _LLAMA_DESCRIPTIONS: ClassVar[dict[str, Description]] = {
        "model_path": Description(en="Path to the GGUF model file", zh="GGUF 模型文件路径"),
    }
    DESCRIPTIONS: ClassVar[dict[str, Description]] = {**StatelessLLMBaseConfig.DESCRIPTIONS, **_LLAMA_DESCRIPTIONS}

class StatelessLLMConfigs(I18nMixin, BaseModel):
    openai_compatible_llm: OpenAICompatibleConfig | None = Field(None, alias="openai_compatible_llm")
    ollama_llm: OllamaConfig | None = Field(None, alias="ollama_llm")
    # ... (other configs remain the same) ...
    claude_llm: ClaudeConfig | None = Field(None, alias="claude_llm")
    llama_cpp_llm: LlamaCppConfig | None = Field(None, alias="llama_cpp_llm")
    mistral_llm: MistralConfig | None = Field(None, alias="mistral_llm")
    DESCRIPTIONS: ClassVar[dict[str, Description]] = {
        "openai_compatible_llm": Description(en="Configuration for OpenAI-compatible LLM providers", zh="OpenAI兼容的语言模型提供者配置"),
        "ollama_llm": Description(en="Configuration for Ollama", zh="Ollama 配置"),
        "openai_llm": Description(en="Configuration for Official OpenAI API", zh="官方 OpenAI API 配置"),
        "gemini_llm": Description(en="Configuration for Gemini API", zh="Gemini API 配置"),
        "mistral_llm": Description(en="Configuration for Mistral API", zh="Mistral API 配置"),
        "zhipu_llm": Description(en="Configuration for Zhipu API", zh="Zhipu API 配置"),
        "deepseek_llm": Description(en="Configuration for Deepseek API", zh="Deepseek API 配置"),
        "groq_llm": Description(en="Configuration for Groq API", zh="Groq API 配置"),
        "claude_llm": Description(en="Configuration for Claude API", zh="Claude API配置"),
        "llama_cpp_llm": Description(en="Configuration for local Llama.cpp", zh="本地Llama.cpp配置"),
    }

# New LLMClientManager class
class LLMClientManager:
    def __init__(self, default_config: Optional[OpenAICompatibleConfig] = None):
        """
        Initializes the LLMClientManager.
        Args:
            default_config: An optional OpenAICompatibleConfig object representing the
                            default configuration loaded from a file (e.g., conf.yaml).
        """
        self.default_config = default_config
        self.default_client = None
        self.default_model = None

        if self.default_config and self.default_config.llm_api_key and self.default_config.base_url:
            try:
                self.default_client = AsyncOpenAI(
                    api_key=self.default_config.llm_api_key,
                    base_url=self.default_config.base_url
                )
                self.default_model = self.default_config.model
                print("Default LLM client initialized from config.")
            except Exception as e:
                print(f"Error initializing default client from config: {e}")
        else:
            print("Default config not provided or incomplete for client initialization.")

    def get_client(self, user_api_key: Optional[str] = None, user_base_url: Optional[str] = None) -> AsyncOpenAI:
        """
        Gets an OpenAI client. Uses user-provided details if available, otherwise falls back to default.
        """
        if user_api_key and user_base_url:
            print(f"Using user-provided API key and base_url: {user_base_url}")
            return AsyncOpenAI(api_key=user_api_key, base_url=user_base_url)
        elif user_api_key and self.default_config and self.default_config.base_url : # User key, default base URL
            print(f"Using user-provided API key with default base_url: {self.default_config.base_url}")
            return AsyncOpenAI(api_key=user_api_key, base_url=self.default_config.base_url)
        elif self.default_client:
            print("Using default client from configuration.")
            return self.default_client
        else:
            # This case should ideally not be reached if configuration or user params are expected
            raise ValueError("LLM client cannot be initialized. No default config and no user API key/base_url provided.")

    async def generate_response(self, messages: List[Dict[str, str]],
                                model_name_override: Optional[str] = None,
                                user_api_key: Optional[str] = None,
                                user_openrouter_model_name: Optional[str] = None) -> str:
        """
        Generates a response from the LLM.
        Args:
            messages: A list of message dictionaries (e.g., [{"role": "user", "content": "Hello"}]).
            model_name_override: Specific model name to use, overriding default or OpenRouter model.
            user_api_key: User's OpenRouter API key.
            user_openrouter_model_name: User's desired OpenRouter model name.
        Returns:
            The LLM's response text or an error message.
        """
        client_to_use: AsyncOpenAI
        model_to_use: Optional[str]

        open_router_base_url = "https://openrouter.ai/api/v1"

        if user_api_key and user_openrouter_model_name:
            client_to_use = self.get_client(user_api_key=user_api_key, user_base_url=open_router_base_url)
            model_to_use = user_openrouter_model_name
            print(f"Generating response using OpenRouter: model {model_to_use} at {open_router_base_url}")
        elif user_api_key: # User wants to use their own key with a potentially default provider or custom base_url if they passed it
            # If user_openrouter_model_name is None, we assume they might be using a default_config setup
            # or want to use their key with the default_model if no model_name_override is given.
            client_to_use = self.get_client(user_api_key=user_api_key, user_base_url=self.default_config.base_url if self.default_config else None)
            model_to_use = model_name_override or user_openrouter_model_name or self.default_model
            print(f"Generating response using user API key: model {model_to_use} at {client_to_use.base_url}")
        elif self.default_client and self.default_model:
            client_to_use = self.default_client
            model_to_use = model_name_override or self.default_model
            print(f"Generating response using default configuration: model {model_to_use} at {client_to_use.base_url}")
        else:
            return "LLM client not configured. Please provide API key/model or check default configuration."

        if not model_to_use:
            return "Model name not determined. Cannot generate response."

        try:
            completion = await client_to_use.chat.completions.create(
                model=model_to_use,
                messages=messages  # type: ignore # openai client expects List[ChatCompletionMessageParam]
            )
            # Check if choices is not None and has at least one element
            if completion.choices and len(completion.choices) > 0:
                # Check if message is not None and content is not None
                if completion.choices[0].message and completion.choices[0].message.content:
                    return completion.choices[0].message.content
                else:
                    return "Received an empty message from LLM."
            else:
                return "Received no choices from LLM."
        except Exception as e:
            print(f"Error during LLM API call to {client_to_use.base_url} for model {model_to_use}: {e}")
            return f"Sorry, I encountered an error: {e}"

# Example of how this might be instantiated globally (though typically done in server setup)
# This part is conceptual and depends on how `conf.yaml` is loaded and parsed.
# For now, we assume `default_llm_config` would be an instance of `OpenAICompatibleConfig`
# loaded elsewhere.
# default_llm_config_data = {
#     "base_url": "http://localhost:1234/v1", # Example default
#     "llm_api_key": "your_default_key_here",  # Example default
#     "model": "default_model_name"        # Example default
# }
# try:
#     default_llm_config_obj = OpenAICompatibleConfig(**default_llm_config_data)
#     global_llm_client_manager = LLMClientManager(default_config=default_llm_config_obj)
# except Exception as e:
#     print(f"Failed to initialize global LLM manager with example config: {e}")
#     global_llm_client_manager = LLMClientManager() # Initialize with no default

# If you want a globally accessible instance, it's better to initialize it
# in your main application setup (e.g., in run_server.py)
# For now, this file defines the classes.
global_llm_client_manager: Optional[LLMClientManager] = None

def initialize_global_llm_manager(config: Optional[OpenAICompatibleConfig] = None):
    global global_llm_client_manager
    global_llm_client_manager = LLMClientManager(default_config=config)
    print("Global LLM Client Manager initialized.")

# Placeholder for i18n if import fails - already handled by try-except at the top.
# class I18nMixin: pass
# class Description: def __init__(self, en, zh): self.en = en; self.zh = zh

# Ensure the openai library is a dependency for this project.
# You would typically add "openai" to your requirements.txt or pyproject.toml.
