package com.campusbazaar.entity;

import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "universities")
public class University extends BaseEntity {

    @Indexed(unique = true)
    private String name;

    @Indexed(unique = true, sparse = true)
    private String domain;

    private String city;

    private String state;

    private String country = "India";

    private boolean active = true;

    protected University() {}

    public University(String name, String domain, String city, String state, String country) {
        this.name = name;
        this.domain = domain;
        this.city = city;
        this.state = state;
        this.country = country;
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDomain() { return domain; }
    public void setDomain(String domain) { this.domain = domain; }
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    public String getState() { return state; }
    public void setState(String state) { this.state = state; }
    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
}
