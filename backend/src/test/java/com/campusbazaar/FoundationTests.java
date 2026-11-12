package com.campusbazaar;

import com.campusbazaar.entity.ListingStatus;
import com.campusbazaar.repository.ListingRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.List;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class FoundationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ListingRepository listingRepository;

    @AfterEach
    void cleanupTestCreatedListings() {
        listingRepository.findAll().stream()
                .filter(listing -> listing.getId() != null && listing.getId() > 10)
                .forEach(listingRepository::delete);
    }

    @Test
    void healthIsPublic() throws Exception {
        mockMvc.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("UP"));
    }

    @Test
    void universitiesAreSeededAndPublic() throws Exception {
        mockMvc.perform(get("/api/universities"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(5));
    }

    @Test
    void listingsArePublicAndBackedBySeededRecords() throws Exception {
        mockMvc.perform(get("/api/listings"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(10))
                .andExpect(jsonPath("$.data[0].seller.verified").value(true))
                .andExpect(jsonPath("$.data[0].seller.studentId").doesNotExist())
                .andExpect(jsonPath("$.data[0].seller.passwordHash").doesNotExist());
    }

    @Test
    void listingDetailsArePublicAndUnknownListingsReturnNotFound() throws Exception {
        mockMvc.perform(get("/api/listings/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(1))
                .andExpect(jsonPath("$.data.title").isNotEmpty())
                .andExpect(jsonPath("$.data.category.name").isNotEmpty())
                .andExpect(jsonPath("$.data.seller.name").isNotEmpty());

        mockMvc.perform(get("/api/listings/9999"))
                .andExpect(status().isNotFound());
    }

    @Test
    void creatingListingsRequiresAuthentication() throws Exception {
        mockMvc.perform(post("/api/listings")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/listings/mine")).andExpect(status().isUnauthorized());
    }

    @Test
    void categoriesArePublicAndListingCreationPersistsForTheAuthenticatedSeller() throws Exception {
        mockMvc.perform(get("/api/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[?(@.slug == 'academic-books')]").exists());

        String registration = """
                {
                  "fullName": "Listing Owner",
                  "email": "listing.owner@example.edu",
                  "password": "a-strong-password-234",
                  "studentId": "LIST-5521",
                  "universityId": 1
                }
                """;
        MvcResult registrationResult = mockMvc.perform(post("/api/auth/register")
                        .contentType("application/json")
                        .content(registration))
                .andExpect(status().isOk())
                .andReturn();
        String token = com.jayway.jsonpath.JsonPath.read(
                registrationResult.getResponse().getContentAsString(), "$.data.accessToken");

        String listingRequest = """
                {
                  "title": "Used Physics Textbook",
                  "description": "Good condition, pages are clean.",
                  "price": 425.50,
                  "condition": "GOOD",
                  "listingType": "SALE",
                  "categorySlug": "academic-books",
                  "imageUrl": "https://images.unsplash.com/photo-1544947950-fa07a98d237f",
                  "studentDeal": true
                }
                """;
        MvcResult createResult = mockMvc.perform(post("/api/listings")
                        .header("Authorization", "Bearer " + token)
                        .contentType("application/json")
                        .content(listingRequest))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.title").value("Used Physics Textbook"))
                .andExpect(jsonPath("$.data.price").value(425.50))
                .andExpect(jsonPath("$.data.condition").value("GOOD"))
                .andExpect(jsonPath("$.data.listingType").value("SALE"))
                .andExpect(jsonPath("$.data.status").value("AVAILABLE"))
                .andExpect(jsonPath("$.data.imageUrl").value("https://images.unsplash.com/photo-1544947950-fa07a98d237f"))
                .andExpect(jsonPath("$.data.studentDeal").value(true))
                .andExpect(jsonPath("$.data.category.name").value("Books"))
                .andExpect(jsonPath("$.data.seller.name").value("Listing Owner"))
                .andExpect(jsonPath("$.data.seller.studentId").doesNotExist())
                .andReturn();

        String listingId = com.jayway.jsonpath.JsonPath.read(
                createResult.getResponse().getContentAsString(), "$.data.id").toString();
        mockMvc.perform(get("/api/listings/" + listingId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.title").value("Used Physics Textbook"));

        mockMvc.perform(get("/api/listings/mine").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].title").value("Used Physics Textbook"));
    }

    @Test
    void giveawayListingIsPersistedAtZeroPriceAndSaleRequiresPositivePrice() throws Exception {
        String registration = """
                {
                  "fullName": "Giveaway Owner",
                  "email": "giveaway.owner@example.edu",
                  "password": "a-strong-password-345",
                  "studentId": "GIVE-5522",
                  "universityId": 1
                }
                """;
        MvcResult registrationResult = mockMvc.perform(post("/api/auth/register")
                        .contentType("application/json")
                        .content(registration))
                .andExpect(status().isOk())
                .andReturn();
        String token = com.jayway.jsonpath.JsonPath.read(
                registrationResult.getResponse().getContentAsString(), "$.data.accessToken");

        mockMvc.perform(post("/api/listings")
                        .header("Authorization", "Bearer " + token)
                        .contentType("application/json")
                        .content("""
                                {
                                  "title": "Free Notebook",
                                  "description": "Unused notebook for pickup.",
                                  "condition": "LIKE_NEW",
                                  "listingType": "GIVEAWAY",
                                  "categorySlug": "academic-books"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.price").value(0))
                .andExpect(jsonPath("$.data.listingType").value("GIVEAWAY"));

        mockMvc.perform(post("/api/listings")
                        .header("Authorization", "Bearer " + token)
                        .contentType("application/json")
                        .content("""
                                {
                                  "title": "Priceless Book",
                                  "description": "No valid sale price provided.",
                                  "price": 0,
                                  "condition": "GOOD",
                                  "listingType": "SALE",
                                  "categorySlug": "academic-books"
                                }
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void listingSearchFiltersSortsAndPaginatesDatabaseResults() throws Exception {
        String token = registerForTest("search.owner@example.edu", "SEARCH-5111");
        for (int price : List.of(875, 125, 425)) {
            mockMvc.perform(post("/api/listings")
                            .header("Authorization", "Bearer " + token)
                            .contentType("application/json")
                            .content("""
                                    {
                                      "title":"Pageable campus item",
                                      "description":"Searchable listing created for pagination coverage.",
                                      "price":%d,
                                      "condition":"GOOD",
                                      "listingType":"SALE",
                                      "categorySlug":"academic-books"
                                    }
                                    """.formatted(price)))
                    .andExpect(status().isCreated());
        }

        mockMvc.perform(get("/api/listings/search")
                        .param("q", "Pageable campus")
                        .param("category", "academic")
                        .param("minPrice", "100")
                        .param("maxPrice", "900")
                        .param("condition", "GOOD")
                        .param("sort", "price_asc")
                        .param("page", "0")
                        .param("size", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items.length()").value(1))
                .andExpect(jsonPath("$.data.items[0].price").value(125))
                .andExpect(jsonPath("$.data.totalElements").value(3))
                .andExpect(jsonPath("$.data.totalPages").value(3))
                .andExpect(jsonPath("$.data.first").value(true))
                .andExpect(jsonPath("$.data.last").value(false));

        mockMvc.perform(get("/api/listings/search")
                        .param("q", "Pageable campus")
                        .param("category", "academic")
                        .param("sort", "price_desc")
                        .param("page", "1")
                        .param("size", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items[0].price").value(425))
                .andExpect(jsonPath("$.data.page").value(1));
    }

    @Test
    void listingOwnerCanEditMarkSoldAndSoftDeleteOnlyTheirOwnListing() throws Exception {
        String ownerToken = registerForTest("owner.crud@example.edu", "CRUD-5112");
        String otherToken = registerForTest("other.crud@example.edu", "CRUD-5113");
        MvcResult created = mockMvc.perform(post("/api/listings")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType("application/json")
                        .content("""
                                {
                                  "title":"Original owner listing",
                                  "description":"Listing created for ownership checks.",
                                  "price":350,
                                  "condition":"GOOD",
                                  "listingType":"SALE",
                                  "categorySlug":"academic-books"
                                }
                                """))
                .andExpect(status().isCreated())
                .andReturn();
        Long id = ((Number) com.jayway.jsonpath.JsonPath.read(
                created.getResponse().getContentAsString(), "$.data.id")).longValue();
        String update = """
                {
                  "title":"Updated owner listing",
                  "description":"Updated by the verified owner.",
                  "price":450,
                  "condition":"LIKE_NEW",
                  "listingType":"SALE",
                  "categorySlug":"academic-books"
                }
                """;

        mockMvc.perform(put("/api/listings/" + id)
                        .header("Authorization", "Bearer " + otherToken)
                        .contentType("application/json")
                        .content(update))
                .andExpect(status().isForbidden());
        mockMvc.perform(delete("/api/listings/" + id).header("Authorization", "Bearer " + otherToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(put("/api/listings/" + id)
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType("application/json")
                        .content(update))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.title").value("Updated owner listing"))
                .andExpect(jsonPath("$.data.price").value(450));

        mockMvc.perform(patch("/api/listings/" + id + "/status")
                        .param("status", "SOLD")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("SOLD"));

        mockMvc.perform(delete("/api/listings/" + id).header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/listings/" + id)).andExpect(status().isNotFound());
        org.junit.jupiter.api.Assertions.assertEquals(
                ListingStatus.REMOVED, listingRepository.findById(id).orElseThrow().getStatus());
    }

    @Test
    void campusBoardPostsAreCampusScopedAndOwnerManaged() throws Exception {
        mockMvc.perform(get("/api/campus-board")).andExpect(status().isUnauthorized());

        String ownerToken = registerForTest("board.owner@example.edu", "BOARD-5114", 4L);
        String otherToken = registerForTest("board.other@example.edu", "BOARD-5115", 5L);
        mockMvc.perform(get("/api/campus-board").header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(0));
        String postBody = """
                {
                  "title":"Found a blue water bottle",
                  "description":"Found near the library entrance after class.",
                  "location":"Library entrance",
                  "type":"FOUND"
                }
                """;

        mockMvc.perform(post("/api/campus-board")
                        .contentType("application/json")
                        .content(postBody))
                .andExpect(status().isUnauthorized());

        MvcResult created = mockMvc.perform(post("/api/campus-board")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType("application/json")
                        .content(postBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.type").value("FOUND"))
                .andExpect(jsonPath("$.data.status").value("OPEN"))
                .andExpect(jsonPath("$.data.universityName").isNotEmpty())
                .andExpect(jsonPath("$.data.studentId").doesNotExist())
                .andReturn();
        Long postId = ((Number) com.jayway.jsonpath.JsonPath.read(
                created.getResponse().getContentAsString(), "$.data.id")).longValue();

        mockMvc.perform(get("/api/campus-board").header("Authorization", "Bearer " + otherToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(0));
        mockMvc.perform(patch("/api/campus-board/" + postId + "/resolve")
                        .header("Authorization", "Bearer " + otherToken))
                .andExpect(status().isForbidden());
        mockMvc.perform(patch("/api/campus-board/" + postId + "/resolve")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("RESOLVED"));
        mockMvc.perform(get("/api/campus-board").header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1));
        mockMvc.perform(delete("/api/campus-board/" + postId).header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isNoContent());
        mockMvc.perform(get("/api/campus-board").header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(0));
    }

    @Test
    void conversationsMessagesAndNotificationsArePersistedAndScopedToParticipants() throws Exception {
        String sellerToken = registerForTest("chat.seller@example.edu", "CHAT-2001");
        String createListing = """
                {
                  "title": "Chat Test Textbook",
                  "description": "Available for a campus handover.",
                  "price": 300,
                  "condition": "GOOD",
                  "listingType": "SALE",
                  "categorySlug": "academic-books"
                }
                """;
        MvcResult listingResult = mockMvc.perform(post("/api/listings")
                        .header("Authorization", "Bearer " + sellerToken)
                        .contentType("application/json")
                        .content(createListing))
                .andExpect(status().isCreated())
                .andReturn();
        String listingId = com.jayway.jsonpath.JsonPath.read(
                listingResult.getResponse().getContentAsString(), "$.data.id").toString();

        String buyerToken = registerForTest("chat.buyer@example.edu", "CHAT-2002");
        MvcResult conversationResult = mockMvc.perform(post("/api/conversations")
                        .header("Authorization", "Bearer " + buyerToken)
                        .contentType("application/json")
                        .content("{\"listingId\":" + listingId + "}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.listingTitle").value("Chat Test Textbook"))
                .andExpect(jsonPath("$.data.otherParticipantName").value("Test Student"))
                .andReturn();
        String conversationId = com.jayway.jsonpath.JsonPath.read(
                conversationResult.getResponse().getContentAsString(), "$.data.id").toString();

        mockMvc.perform(post("/api/conversations/" + conversationId + "/messages")
                        .header("Authorization", "Bearer " + buyerToken)
                        .contentType("application/json")
                        .content("""
                                {"content":"Hi, is the textbook still available?"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.senderName").value("Test Student"))
                .andExpect(jsonPath("$.data.content").value("Hi, is the textbook still available?"));

        mockMvc.perform(get("/api/notifications").header("Authorization", "Bearer " + sellerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.unreadCount").value(1))
                .andExpect(jsonPath("$.data.items[0].conversationId").value(Long.valueOf(conversationId)));

        mockMvc.perform(get("/api/conversations/" + conversationId + "/messages")
                        .header("Authorization", "Bearer " + sellerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].content").value("Hi, is the textbook still available?"));

        mockMvc.perform(get("/api/notifications").header("Authorization", "Bearer " + sellerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.unreadCount").value(0));

        String outsiderToken = registerForTest("chat.outsider@example.edu", "CHAT-2003");
        mockMvc.perform(get("/api/conversations/" + conversationId + "/messages")
                        .header("Authorization", "Bearer " + outsiderToken))
                .andExpect(status().isNotFound());
        mockMvc.perform(post("/api/conversations/" + conversationId + "/messages")
                        .header("Authorization", "Bearer " + outsiderToken)
                        .contentType("application/json")
                        .content("{\"content\":\"Unauthorized message\"}"))
                .andExpect(status().isNotFound());

        mockMvc.perform(get("/api/conversations")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/conversations/" + conversationId + "/messages")
                        .header("Authorization", "Bearer " + sellerToken + ".tampered"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void adminEndpointsRequireRoleAndEnforceAccountAndListingActions() throws Exception {
        mockMvc.perform(get("/api/admin/dashboard")).andExpect(status().isUnauthorized());

        MvcResult studentRegistration = mockMvc.perform(post("/api/auth/register")
                .contentType("application/json")
                .content("""
                        {
                          "fullName": "Admin Permission Test",
                          "email": "admin.permission@example.edu",
                          "password": "a-strong-password-678",
                          "studentId": "ADMIN-8877",
                          "universityId": 1
                        }
                        """))
                .andExpect(status().isOk())
                .andReturn();
        String studentToken = com.jayway.jsonpath.JsonPath.read(
                studentRegistration.getResponse().getContentAsString(), "$.data.accessToken");
        Number studentIdValue = com.jayway.jsonpath.JsonPath.read(
                studentRegistration.getResponse().getContentAsString(), "$.data.user.id");
        Long studentId = studentIdValue.longValue();

        mockMvc.perform(get("/api/admin/dashboard").header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isForbidden());

        MvcResult adminLogin = mockMvc.perform(post("/api/auth/login")
                .contentType("application/json")
                .content("""
                        {"email":"admin@campusbazaar.demo","password":"ChangeMe@123"}
                        """))
                .andExpect(status().isOk())
                .andReturn();
        String adminToken = com.jayway.jsonpath.JsonPath.read(
                adminLogin.getResponse().getContentAsString(), "$.data.accessToken");

        mockMvc.perform(get("/api/admin/dashboard").header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalUsers").isNumber())
                .andExpect(jsonPath("$.data.openReports").isNumber());
        mockMvc.perform(get("/api/admin/users").header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[?(@.email == 'admin.permission@example.edu')].studentId").doesNotExist())
                .andExpect(jsonPath("$.data[?(@.email == 'admin.permission@example.edu')].maskedStudentId").exists());

        mockMvc.perform(patch("/api/admin/users/" + studentId + "/verify-student")
                .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.studentVerified").value(true))
                .andExpect(jsonPath("$.data.status").value("VERIFIED"));

        mockMvc.perform(patch("/api/admin/users/" + studentId + "/suspend")
                .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("SUSPENDED"));
        mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(patch("/api/admin/users/" + studentId + "/reinstate")
                .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("VERIFIED"));
        mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/reports")
                .header("Authorization", "Bearer " + studentToken)
                .contentType("application/json")
                .content("""
                        {"listingId":1,"reason":"Listing details appear to be misleading."}
                        """))
                .andExpect(status().isCreated());
        MvcResult reportResult = mockMvc.perform(get("/api/admin/reports")
                .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].status").value("OPEN"))
                .andReturn();
        String reportId = com.jayway.jsonpath.JsonPath.read(
                reportResult.getResponse().getContentAsString(), "$.data[0].id").toString();
        mockMvc.perform(patch("/api/admin/reports/" + reportId)
                .header("Authorization", "Bearer " + adminToken)
                .contentType("application/json")
                .content("{\"status\":\"DISMISSED\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("DISMISSED"));

        mockMvc.perform(patch("/api/admin/listings/1/moderation")
                .header("Authorization", "Bearer " + adminToken)
                .contentType("application/json")
                .content("{\"status\":\"REMOVED\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("REMOVED"));
        mockMvc.perform(get("/api/listings/1")).andExpect(status().isNotFound());
        mockMvc.perform(patch("/api/admin/listings/1/moderation")
                .header("Authorization", "Bearer " + adminToken)
                .contentType("application/json")
                .content("{\"status\":\"AVAILABLE\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("AVAILABLE"));
    }

    private String registerForTest(String email, String studentId) throws Exception {
        return registerForTest(email, studentId, 1L);
    }

    private String registerForTest(String email, String studentId, Long universityId) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/register")
                        .contentType("application/json")
                        .content("""
                                {
                                  "fullName": "Test Student",
                                  "email": "%s",
                                  "password": "a-strong-password-456",
                                  "studentId": "%s",
                                  "universityId": %d
                                }
                                """.formatted(email, studentId, universityId)))
                .andExpect(status().isOk())
                .andReturn();
        return com.jayway.jsonpath.JsonPath.read(result.getResponse().getContentAsString(), "$.data.accessToken");
    }

    @Test
    void registrationLoginAndCurrentUserUseSafeStudentProfile() throws Exception {
        String registration = """
                {
                  "fullName": "Test Student",
                  "email": "student.auth@example.edu",
                  "password": "a-strong-password-123",
                  "studentId": "STU-7766",
                  "universityId": 1
                }
                """;
        mockMvc.perform(post("/api/auth/register")
                        .contentType("application/json")
                        .content(registration))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.data.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.data.user.email").value("student.auth@example.edu"))
                .andExpect(jsonPath("$.data.user.status").value("PENDING_STUDENT_VERIFICATION"))
                .andExpect(jsonPath("$.data.user.studentVerified").value(false))
                .andExpect(jsonPath("$.data.user.maskedStudentId").value("****7766"))
                .andExpect(jsonPath("$.data.user.studentId").doesNotExist())
                .andExpect(jsonPath("$.data.user.passwordHash").doesNotExist());

        String login = """
                {
                  "email": "STUDENT.AUTH@example.edu",
                  "password": "a-strong-password-123"
                }
                """;
        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType("application/json")
                        .content(login))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.data.user.email").value("student.auth@example.edu"))
                .andReturn();

        String token = com.jayway.jsonpath.JsonPath.read(
                loginResult.getResponse().getContentAsString(), "$.data.accessToken");
        mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.email").value("student.auth@example.edu"))
                .andExpect(jsonPath("$.data.maskedStudentId").value("****7766"))
                .andExpect(jsonPath("$.data.studentId").doesNotExist())
                .andExpect(jsonPath("$.data.passwordHash").doesNotExist());

        mockMvc.perform(get("/api/auth/me")).andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/auth/login")
                        .contentType("application/json")
                        .content("""
                                {"email":"student.auth@example.edu","password":"wrong-password"}
                                """))
                .andExpect(status().isUnauthorized());
    }
}
