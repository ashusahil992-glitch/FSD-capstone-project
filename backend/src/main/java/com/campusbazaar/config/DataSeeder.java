package com.campusbazaar.config;

import com.campusbazaar.entity.CampusPost;
import com.campusbazaar.entity.CampusPostType;
import com.campusbazaar.entity.Category;
import com.campusbazaar.entity.ChatMessage;
import com.campusbazaar.entity.Conversation;
import com.campusbazaar.entity.Listing;
import com.campusbazaar.entity.ListingCondition;
import com.campusbazaar.entity.ListingType;
import com.campusbazaar.entity.Role;
import com.campusbazaar.entity.University;
import com.campusbazaar.entity.User;
import com.campusbazaar.entity.UserNotification;
import com.campusbazaar.entity.UserStatus;
import com.campusbazaar.repository.CampusPostRepository;
import com.campusbazaar.repository.CategoryRepository;
import com.campusbazaar.repository.ChatMessageRepository;
import com.campusbazaar.repository.ConversationRepository;
import com.campusbazaar.repository.ListingRepository;
import com.campusbazaar.repository.UniversityRepository;
import com.campusbazaar.repository.UserNotificationRepository;
import com.campusbazaar.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Component
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final UniversityRepository universityRepository;
    private final CategoryRepository categoryRepository;
    private final ListingRepository listingRepository;
    private final UserRepository userRepository;
    private final CampusPostRepository campusPostRepository;
    private final ConversationRepository conversationRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final UserNotificationRepository notificationRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.seed.enabled}") private boolean enabled;
    @Value("${app.admin.email}") private String adminEmail;
    @Value("${app.admin.password}") private String adminPassword;

    public DataSeeder(UniversityRepository universityRepository,
                      CategoryRepository categoryRepository,
                      ListingRepository listingRepository,
                      UserRepository userRepository,
                      CampusPostRepository campusPostRepository,
                      ConversationRepository conversationRepository,
                      ChatMessageRepository chatMessageRepository,
                      UserNotificationRepository notificationRepository,
                      PasswordEncoder passwordEncoder) {
        this.universityRepository = universityRepository;
        this.categoryRepository = categoryRepository;
        this.listingRepository = listingRepository;
        this.userRepository = userRepository;
        this.campusPostRepository = campusPostRepository;
        this.conversationRepository = conversationRepository;
        this.chatMessageRepository = chatMessageRepository;
        this.notificationRepository = notificationRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (!enabled) return;
        seedUniversities();
        seedCategories();
        seedAdmin();
        seedListingsAndCommunity();
    }

    private void seedUniversities() {
        if (universityRepository.count() > 0) return;
        universityRepository.saveAll(List.of(
                new University("Chitkara University", "chitkara.edu.in", "Rajpura", "Punjab", "India"),
                new University("Panjab University", "pu.ac.in", "Chandigarh", "Chandigarh", "India"),
                new University("Punjab Engineering College", "pec.edu.in", "Chandigarh", "Chandigarh", "India"),
                new University("Thapar Institute of Engineering & Technology", "thapar.edu", "Patiala", "Punjab", "India"),
                new University("IIT Ropar", "iitrpr.ac.in", "Rupnagar", "Punjab", "India")));
        log.info("Initialized MongoDB campus directory with 5 universities");
    }

    private void seedCategories() {
        if (categoryRepository.count() > 0) return;
        Map<String, List<String>> tree = new LinkedHashMap<>();
        tree.put("Academic", List.of("Books", "Textbooks", "Notes", "Lab Manuals", "Calculators", "Stationery", "Project Materials"));
        tree.put("Hostel", List.of("Mattress", "Study Table", "Chair", "Bedsheet", "Pillow", "Bucket", "Storage", "Hangers", "Lamps", "Extension Boards"));
        tree.put("Electronics", List.of("Laptop", "Keyboard", "Mouse", "Headphones", "Speakers", "Monitor", "Chargers", "Power Banks", "Cables"));
        tree.put("Fashion", List.of("Clothes", "Shoes", "Bags", "Watches", "Accessories"));
        tree.put("Sports & Fitness", List.of("Gym Equipment", "Sports Equipment", "Bicycles", "Sports Accessories"));
        tree.put("Appliances", List.of("Kettle", "Induction Cooker", "Fan", "Other Permitted Appliances"));
        tree.put("Gaming", List.of("Gaming Accessories", "Controllers", "Games", "Gaming Equipment"));
        Map<String, String> icons = Map.of(
                "Academic", "📚",
                "Hostel", "🛏️",
                "Electronics", "💻",
                "Fashion", "👕",
                "Sports & Fitness", "🚲",
                "Appliances", "🔌",
                "Gaming", "🎮");

        tree.forEach((name, subs) -> {
            Category parent = categoryRepository.save(new Category(name, slug(name), icons.get(name), null));
            for (String sub : subs) {
                categoryRepository.save(new Category(sub, slug(name + "-" + sub), icons.get(name), parent));
            }
        });
        log.info("Initialized MongoDB marketplace categories");
    }

    private void seedAdmin() {
        if (!userRepository.existsByEmailIgnoreCase(adminEmail)) {
            User admin = new User("CampusBazaar Moderator", adminEmail.toLowerCase(Locale.ROOT),
                    passwordEncoder.encode(adminPassword), Role.ADMIN);
            admin.setEmailVerified(true);
            admin.setStudentVerified(true);
            admin.setStatus(UserStatus.VERIFIED);
            userRepository.save(admin);
            log.info("Initialized admin account: {}", adminEmail);
        }
    }

    private void seedListingsAndCommunity() {
        if (listingRepository.count() > 0) return;
        List<University> universities = universityRepository.findByActiveTrueOrderByNameAsc();
        if (universities.isEmpty()) {
            throw new IllegalStateException("Cannot seed listings without an active university.");
        }

        University chitkara = universities.stream()
                .filter(u -> u.getName().contains("Chitkara"))
                .findFirst().orElse(universities.get(0));
        University pec = universities.stream()
                .filter(u -> u.getName().contains("Punjab Engineering"))
                .findFirst().orElse(universities.get(Math.min(1, universities.size() - 1)));
        University pu = universities.stream()
                .filter(u -> u.getName().contains("Panjab University"))
                .findFirst().orElse(universities.get(0));

        User aarav = getOrCreateStudent("Aarav Mehta", "aarav.mehta@chitkara.edu.in", "2210990412", "Archimedes Hostel", chitkara, true);
        User isha = getOrCreateStudent("Isha Nair", "isha.nair@chitkara.edu.in", "2210990845", "Nightingale Hostel", chitkara, true);
        User kabir = getOrCreateStudent("Kabir Sharma", "kabir.sharma@pec.edu.in", "23104019", "Shivalik Hostel", pec, true);
        User riya = getOrCreateStudent("Riya Verma", "riya.verma@pu.ac.in", "22091140", "Sarojini Hostel", pu, false);

        List<Listing> listings = new ArrayList<>();
        listings.add(buildListing(
                "Higher Engineering Mathematics (B.S. Grewal, 44th Ed.)",
                "Well-kept semester textbook with clean pages and zero highlights. Useful for 1st and 2nd year CSE/ECE calculus and differential equations modules. Can hand over near Turing Block or Central Library.",
                "450", ListingCondition.GOOD, ListingType.SALE, "academic-textbooks", aarav,
                "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=900&q=80",
                true, true, false));
        listings.add(buildListing(
                "Sony WH-CH720N Wireless Noise-Cancelling Headphones",
                "Bought last semester, battery easily lasts 30+ hours on a charge. Includes original USB-C cable and aux cord. Selling because I switched to earbuds.",
                "1800", ListingCondition.LIKE_NEW, ListingType.SALE, "electronics-headphones", isha,
                "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80",
                true, true, false));
        listings.add(buildListing(
                "Foldable Wooden Study Desk with Drawer",
                "Sturdy engineered-wood study table with cable grommet and side drawer. Fits comfortably in standard 2-seater and 3-seater hostel rooms. Pickup outside Archimedes Hostel.",
                "2200", ListingCondition.GOOD, ListingType.SALE, "hostel-study-table", kabir,
                "https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&w=900&q=80",
                true, false, true));
        listings.add(buildListing(
                "Casio FX-991EX ClassWiz Non-Programmable Calculator",
                "Permitted in all university theory and lab exams. Solar + battery powered, crisp LCD display, includes hard slide cover.",
                "600", ListingCondition.LIKE_NEW, ListingType.SALE, "academic-calculators", aarav,
                "https://images.unsplash.com/photo-1587145820266-a5951ee6f620?auto=format&fit=crop&w=900&q=80",
                true, true, false));
        listings.add(buildListing(
                "Single-Bed Microfiber Comforter & Bedsheet Set",
                "Warm reversible comforter with matching cotton bedsheet and two pillow covers. Freshly dry-cleaned and packed in a zip bag.",
                "900", ListingCondition.LIKE_NEW, ListingType.SALE, "hostel-bedsheet", isha,
                "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=900&q=80",
                false, true, true));
        listings.add(buildListing(
                "Yamaha F280 Acoustic Guitar (Semester Rental)",
                "Well-tuned acoustic guitar with padded gig bag, capo, and extra D'Addario strings. Available to rent for the semester or for campus cultural fest practice.",
                "650", ListingCondition.GOOD, ListingType.RENT, "gaming", kabir,
                "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=900&q=80",
                true, false, false));
        listings.add(buildListing(
                "Wildcraft 35L Laptop Backpack with Rain Cover",
                "Padded 15.6-inch laptop compartment, bottle mesh pockets on both sides, and built-in rain cover. Zippers and straps are in great shape.",
                "750", ListingCondition.GOOD, ListingType.SALE, "fashion-bags", aarav,
                "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=80",
                false, true, false));
        listings.add(buildListing(
                "Rechargeable Touch LED Desk Lamp (3 Color Modes)",
                "Warm, neutral, and cool white modes with stepless dimming. USB-C rechargeable — super handy during late-night exam prep without disturbing roommates.",
                "350", ListingCondition.GOOD, ListingType.SALE, "hostel-lamps", isha,
                "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=80",
                false, false, true));
        listings.add(buildListing(
                "Yonex Carbonex Badminton Racket + Shuttle Tube",
                "Graduating this month and giving away my spare racket with a fresh grip and 3 feather shuttles to anyone who plays at the hostel court.",
                "0", ListingCondition.FAIR, ListingType.GIVEAWAY, "sports-and-fitness-sports-equipment", kabir,
                "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=900&q=80",
                false, false, true));
        listings.add(buildListing(
                "Prestige 1.5L Stainless Steel Electric Kettle",
                "Auto cut-off, 1500W fast boil, recently descaled and spotless inside. Ideal for late-night coffee, tea, or instant noodles.",
                "500", ListingCondition.GOOD, ListingType.SALE, "appliances-kettle", aarav,
                "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=900&q=80",
                false, true, true));

        List<Listing> savedListings = listingRepository.saveAll(listings);

        if (campusPostRepository.count() == 0) {
            campusPostRepository.saveAll(List.of(
                    new CampusPost(
                            "Lost Casio FX-991EX Calculator after Lab",
                            "Left my black Casio ClassWiz calculator on the 2nd row bench in Turing Block Room 204 after the 2:00 PM DBMS lab. Has a small 'AM' sticker on the back cover.",
                            "Turing Block, Room 204",
                            CampusPostType.LOST,
                            aarav,
                            chitkara),
                    new CampusPost(
                            "Found Matte Blue Milton Thermosteel Bottle",
                            "Found a 1L matte blue water bottle near the Central Library reading hall charging desk yesterday evening. Handed it over to the library helpdesk counter.",
                            "Central Library Reading Hall",
                            CampusPostType.FOUND,
                            isha,
                            chitkara),
                    new CampusPost(
                            "Looking for 1 Frontend + 1 ML Member for Smart India Hackathon",
                            "Our team already has backend (Spring Boot) and UI/UX covered. Looking for two enthusiastic 2nd/3rd year students comfortable with React or PyTorch for internal shortlisting this Friday.",
                            "Innovation Incubator, Block C",
                            CampusPostType.ANNOUNCEMENT,
                            aarav,
                            chitkara)));
        }

        if (conversationRepository.count() == 0 && !savedListings.isEmpty()) {
            Listing textbook = savedListings.get(0);
            Conversation conv = conversationRepository.save(new Conversation(textbook, isha, aarav));
            chatMessageRepository.save(new ChatMessage(conv, isha,
                    "Hi Aarav! Is the B.S. Grewal Engineering Maths book still available? Can I check it near the library after 4 PM?"));
            conv.touch();
            conversationRepository.save(conv);
            notificationRepository.save(new UserNotification(
                    aarav, isha, conv, "New message from " + isha.getFullName()));
        }

        log.info("Seeded MongoDB campus listings, community notices, and sample conversation");
    }

    private User getOrCreateStudent(String fullName, String email, String studentId, String hostel,
                                    University university, boolean verified) {
        return userRepository.findByEmailIgnoreCase(email).orElseGet(() -> {
            User student = new User(fullName, email, passwordEncoder.encode("Student@123"), Role.STUDENT);
            student.setStudentId(studentId);
            student.setHostel(hostel);
            student.setEmailVerified(verified);
            student.setStudentVerified(verified);
            student.setStatus(verified ? UserStatus.VERIFIED : UserStatus.PENDING_STUDENT_VERIFICATION);
            student.setUniversity(university);
            return userRepository.save(student);
        });
    }

    private Listing buildListing(String title, String description, String price, ListingCondition condition,
                                 ListingType type, String categorySlug, User seller, String imageUrl,
                                 boolean popular, boolean studentDeal, boolean hostelClearance) {
        Category category = categoryRepository.findBySlug(categorySlug)
                .orElseGet(() -> categoryRepository.findBySlug(categorySlug.split("-")[0])
                        .orElseThrow(() -> new IllegalStateException("Missing category: " + categorySlug)));
        Listing listing = new Listing(title, description, new BigDecimal(price), condition, type,
                imageUrl, category, seller);
        listing.setDemo(false);
        listing.setPopular(popular);
        listing.setStudentDeal(studentDeal);
        listing.setHostelClearance(hostelClearance);
        return listing;
    }

    private static String slug(String s) {
        return s.toLowerCase(Locale.ROOT).replace("&", "and").replaceAll("[^a-z0-9]+", "-").replaceAll("(^-|-$)", "");
    }
}
