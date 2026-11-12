package com.campusbazaar.entity;

import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.DocumentReference;

@Document(collection = "users")
@CompoundIndex(name = "uk_users_university_student", def = "{'universityId': 1, 'studentId': 1}", unique = true, sparse = true)
public class User extends BaseEntity {

    private String fullName;

    @Indexed(unique = true)
    private String email;

    private String studentId;

    private String phone;

    private String hostel;

    private String passwordHash;

    private Role role = Role.STUDENT;

    @Indexed
    private UserStatus status = UserStatus.PENDING_EMAIL;

    private boolean emailVerified = false;

    private boolean studentVerified = false;

    private String profileImageUrl;

    @DocumentReference(lazy = false)
    private University university;

    @Indexed
    private Long universityId;

    protected User() {}

    public User(String fullName, String email, String passwordHash, Role role) {
        this.fullName = fullName;
        this.email = email;
        this.passwordHash = passwordHash;
        this.role = role;
    }

    @Override
    public void syncForeignKeys() {
        this.universityId = university != null ? university.getId() : null;
    }

    public String getMaskedStudentId() {
        if (studentId == null) return null;
        if (studentId.length() <= 4) return "****";
        return "*".repeat(studentId.length() - 4) + studentId.substring(studentId.length() - 4);
    }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getStudentId() { return studentId; }
    public void setStudentId(String studentId) { this.studentId = studentId; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getHostel() { return hostel; }
    public void setHostel(String hostel) { this.hostel = hostel; }
    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }
    public UserStatus getStatus() { return status; }
    public void setStatus(UserStatus status) { this.status = status; }
    public boolean isEmailVerified() { return emailVerified; }
    public void setEmailVerified(boolean emailVerified) { this.emailVerified = emailVerified; }
    public boolean isStudentVerified() { return studentVerified; }
    public void setStudentVerified(boolean studentVerified) { this.studentVerified = studentVerified; }
    public String getProfileImageUrl() { return profileImageUrl; }
    public void setProfileImageUrl(String profileImageUrl) { this.profileImageUrl = profileImageUrl; }
    public University getUniversity() { return university; }
    public void setUniversity(University university) {
        this.university = university;
        this.universityId = university != null ? university.getId() : null;
    }
    public Long getUniversityId() { return universityId; }
}
