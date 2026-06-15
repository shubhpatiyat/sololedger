from functools import lru_cache

from langchain_openai import AzureChatOpenAI

from app.core.config import settings


@lru_cache
def get_llm() -> AzureChatOpenAI:
    return AzureChatOpenAI(
        model=settings.azure_openai_model,
        azure_deployment=settings.azure_openai_deployment,
        api_version=settings.azure_openai_api_version,
        azure_endpoint=settings.azure_endpoint,
        api_key=settings.azure_api_key,
        temperature=0,
        streaming=True,
    )
