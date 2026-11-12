package com.campusbazaar.entity;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.DocumentReference;
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.data.mongodb.core.mapping.FieldType;

import java.math.BigDecimal;

@Document(collection = "listings")
public class Listing extends BaseEntity {

    @NotBlank
    private String title;

    @NotBlank
    private String description;

    @NotNull
    @DecimalMin("0.00")
    @Field(targetType = FieldType.DECIMAL128)
    private BigDecimal price;

    @NotNull
    private ListingCondition condition;

    @NotNull
    private ListingType listingType = ListingType.SALE;

    @NotNull
    @Indexed
    private ListingStatus status = ListingStatus.AVAILABLE;

    private String imageUrl;

    private boolean demo = false;

    private boolean popular = false;

    private boolean studentDeal = false;

    private boolean hostelClearance = false;

    @NotNull
    @DocumentReference(lazy = false)
    private Category category;

    @Indexed
    private Long categoryId;

    @NotNull
    @DocumentReference(lazy = false)
    private User seller;

    @Indexed
    private Long sellerId;

    protected Listing() {}

    public Listing(String title, String description, BigDecimal price, ListingCondition condition,
                   ListingType listingType, String imageUrl, Category category, User seller) {
        this.title = title;
        this.description = description;
        this.price = price;
        this.condition = condition;
        this.listingType = listingType;
        this.imageUrl = imageUrl;
        this.category = category;
        this.categoryId = category != null ? category.getId() : null;
        this.seller = seller;
        this.sellerId = seller != null ? seller.getId() : null;
    }

    @Override
    public void syncForeignKeys() {
        this.categoryId = category != null ? category.getId() : null;
        this.sellerId = seller != null ? seller.getId() : null;
    }

    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public BigDecimal getPrice() { return price; }
    public ListingCondition getCondition() { return condition; }
    public ListingType getListingType() { return listingType; }
    public ListingStatus getStatus() { return status; }
    public String getImageUrl() { return imageUrl; }
    public boolean isDemo() { return demo; }
    public boolean isPopular() { return popular; }
    public boolean isStudentDeal() { return studentDeal; }
    public boolean isHostelClearance() { return hostelClearance; }
    public Category getCategory() { return category; }
    public Long getCategoryId() { return categoryId; }
    public User getSeller() { return seller; }
    public Long getSellerId() { return sellerId; }
    public void setTitle(String title) { this.title = title; }
    public void setDescription(String description) { this.description = description; }
    public void setPrice(BigDecimal price) { this.price = price; }
    public void setCondition(ListingCondition condition) { this.condition = condition; }
    public void setListingType(ListingType listingType) { this.listingType = listingType; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public void setCategory(Category category) {
        this.category = category;
        this.categoryId = category != null ? category.getId() : null;
    }
    public void setStatus(ListingStatus status) { this.status = status; }
    public void setDemo(boolean demo) { this.demo = demo; }
    public void setPopular(boolean popular) { this.popular = popular; }
    public void setStudentDeal(boolean studentDeal) { this.studentDeal = studentDeal; }
    public void setHostelClearance(boolean hostelClearance) { this.hostelClearance = hostelClearance; }
}
