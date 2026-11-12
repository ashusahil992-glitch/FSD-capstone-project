package com.campusbazaar.entity;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.DocumentReference;

@Document(collection = "campus_posts")
public class CampusPost extends BaseEntity {

    @NotBlank
    private String title;

    @NotBlank
    private String description;

    @NotBlank
    private String location;

    @NotNull
    private CampusPostType type;

    @NotNull
    @Indexed
    private CampusPostStatus status = CampusPostStatus.OPEN;

    @NotNull
    @DocumentReference(lazy = false)
    private User author;

    @Indexed
    private Long authorId;

    @NotNull
    @DocumentReference(lazy = false)
    private University university;

    @Indexed
    private Long universityId;

    protected CampusPost() {}

    public CampusPost(String title, String description, String location, CampusPostType type,
                      User author, University university) {
        this.title = title;
        this.description = description;
        this.location = location;
        this.type = type;
        this.author = author;
        this.authorId = author != null ? author.getId() : null;
        this.university = university;
        this.universityId = university != null ? university.getId() : null;
    }

    @Override
    public void syncForeignKeys() {
        this.authorId = author != null ? author.getId() : null;
        this.universityId = university != null ? university.getId() : null;
    }

    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public String getLocation() { return location; }
    public CampusPostType getType() { return type; }
    public CampusPostStatus getStatus() { return status; }
    public User getAuthor() { return author; }
    public Long getAuthorId() { return authorId; }
    public University getUniversity() { return university; }
    public Long getUniversityId() { return universityId; }
    public void setTitle(String title) { this.title = title; }
    public void setDescription(String description) { this.description = description; }
    public void setLocation(String location) { this.location = location; }
    public void setType(CampusPostType type) { this.type = type; }
    public void setStatus(CampusPostStatus status) { this.status = status; }
}
