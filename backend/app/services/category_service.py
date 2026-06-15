import re

from sqlalchemy.orm import Session

from app.models.category import Category


def normalize_text(value: str | None) -> str:
    if not value:
        return ""
    return re.sub(r"\s+", " ", value).strip()


def get_categories(db: Session, owner_id: str) -> list[Category]:
    return (
        db.query(Category)
        .filter(Category.owner_id == owner_id)
        .order_by(Category.name.asc())
        .all()
    )


def find_category_by_name(categories: list[Category], category_name: str | None) -> Category | None:
    normalized = normalize_text(category_name).lower()
    if not normalized:
        return None
    for category in categories:
        if normalize_text(category.name).lower() == normalized:
            return category
    return None


def list_category_names(categories: list[Category]) -> list[str]:
    return [category.name for category in categories]


def top_category_recommendations(
    all_category_names: list[str],
    model_recommendations: list[str],
    limit: int = 5,
) -> list[str]:
    normalized_to_original = {
        normalize_text(category_name).lower(): category_name for category_name in all_category_names
    }

    results: list[str] = []
    seen: set[str] = set()

    for recommendation in model_recommendations:
        normalized = normalize_text(recommendation).lower()
        if not normalized:
            continue
        resolved = normalized_to_original.get(normalized)
        if resolved and normalized not in seen:
            results.append(resolved)
            seen.add(normalized)
        if len(results) == limit:
            return results

    for category_name in all_category_names:
        normalized = normalize_text(category_name).lower()
        if normalized and normalized not in seen:
            results.append(category_name)
            seen.add(normalized)
        if len(results) == limit:
            break

    return results
