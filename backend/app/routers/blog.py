from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.dependencies import get_db
from app.dependencies.auth import get_current_user
from app.models.blog import BlogPost
from app.models.user import User
from app.schemas.blog import (
    BlogPostCreate,
    BlogPostResponse,
    BlogPostUpdate,
    BlogPostListItem,
)

router = APIRouter(prefix="/blog", tags=["blog"])


async def require_admin(
    user: User = Depends(get_current_user),
) -> User:
    if not user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return user


@router.get("", response_model=list[BlogPostListItem])
async def list_posts(
    published_only: bool = True,
    db: AsyncSession = Depends(get_db),
) -> list[BlogPostListItem]:
    query = select(BlogPost).order_by(BlogPost.created_at.desc())
    if published_only:
        query = query.where(BlogPost.published)
    result = await db.execute(query)
    posts = result.scalars().all()
    return [
        BlogPostListItem(
            id=str(p.id),
            slug=p.slug,
            title=p.title,
            excerpt=p.excerpt,
            tags=p.tags,
            published=p.published,
            created_at=p.created_at,
            updated_at=p.updated_at,
        )
        for p in posts
    ]


@router.get("/{slug}", response_model=BlogPostResponse)
async def get_post(
    slug: str,
    db: AsyncSession = Depends(get_db),
) -> BlogPostResponse:
    result = await db.execute(select(BlogPost).where(BlogPost.slug == slug))
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return BlogPostResponse(
        id=str(post.id),
        slug=post.slug,
        title=post.title,
        excerpt=post.excerpt,
        content=post.content,
        tags=post.tags,
        published=post.published,
        author_id=str(post.author_id),
        created_at=post.created_at,
        updated_at=post.updated_at,
    )


@router.post(
    "",
    response_model=BlogPostResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_post(
    data: BlogPostCreate,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> BlogPostResponse:
    existing = await db.execute(select(BlogPost).where(BlogPost.slug == data.slug))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Slug already exists")
    post = BlogPost(
        slug=data.slug,
        title=data.title,
        excerpt=data.excerpt,
        content=data.content,
        tags=data.tags,
        published=data.published,
        author_id=admin.id,
    )
    db.add(post)
    await db.commit()
    await db.refresh(post)
    return BlogPostResponse(
        id=str(post.id),
        slug=post.slug,
        title=post.title,
        excerpt=post.excerpt,
        content=post.content,
        tags=post.tags,
        published=post.published,
        author_id=str(post.author_id),
        created_at=post.created_at,
        updated_at=post.updated_at,
    )


@router.put("/{post_id}", response_model=BlogPostResponse)
async def update_post(
    post_id: str,
    data: BlogPostUpdate,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> BlogPostResponse:
    result = await db.execute(select(BlogPost).where(BlogPost.id == post_id))
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if data.slug is not None:
        existing = await db.execute(
            select(BlogPost).where(BlogPost.slug == data.slug, BlogPost.id != post.id)
        )
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=409, detail="Slug already exists")
        post.slug = data.slug
    if data.title is not None:
        post.title = data.title
    if data.excerpt is not None:
        post.excerpt = data.excerpt
    if data.content is not None:
        post.content = data.content
    if data.tags is not None:
        post.tags = data.tags
    if data.published is not None:
        post.published = data.published
    await db.commit()
    await db.refresh(post)
    return BlogPostResponse(
        id=str(post.id),
        slug=post.slug,
        title=post.title,
        excerpt=post.excerpt,
        content=post.content,
        tags=post.tags,
        published=post.published,
        author_id=str(post.author_id),
        created_at=post.created_at,
        updated_at=post.updated_at,
    )


@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_post(
    post_id: str,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> None:
    result = await db.execute(select(BlogPost).where(BlogPost.id == post_id))
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    await db.delete(post)
    await db.commit()
