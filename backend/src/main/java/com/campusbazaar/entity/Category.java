package com.campusbazaar.entity;

import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.DocumentReference;

@Document(collection = "categories")
public class Category extends BaseEntity {

    private String name;

    @Indexed(unique = true)
    private String slug;

    private String icon;

    private boolean active = true;

    @DocumentReference(lazy = false)
    private Category parent;

    @Indexed
    private Long parentId;

    protected Category() {}

    public Category(String name, String slug, String icon, Category parent) {
        this.name = name;
        this.slug = slug;
        this.icon = icon;
        this.parent = parent;
        this.parentId = parent != null ? parent.getId() : null;
    }

    @Override
    public void syncForeignKeys() {
        this.parentId = parent != null ? parent.getId() : null;
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }
    public String getIcon() { return icon; }
    public void setIcon(String icon) { this.icon = icon; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public Category getParent() { return parent; }
    public void setParent(Category parent) {
        this.parent = parent;
        this.parentId = parent != null ? parent.getId() : null;
    }
    public Long getParentId() { return parentId; }
}
