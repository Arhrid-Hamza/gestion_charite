package com.devbuild.gestion_charite.controller;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.devbuild.gestion_charite.entity.CharityAction;
import com.devbuild.gestion_charite.entity.User;
import com.devbuild.gestion_charite.entity.enums.PaymentMethod;
import com.devbuild.gestion_charite.repository.CharityActionRepository;
import com.devbuild.gestion_charite.repository.UserRepository;
import com.devbuild.gestion_charite.service.DonationProcessingService;
import com.devbuild.gestion_charite.service.MongoSequenceService;

@RestController
@RequestMapping("/api/admin")
public class AdminApiController {

    private final CharityActionRepository charityActionRepository;
    private final DonationProcessingService donationProcessingService;
    private final UserRepository userRepository;
    private final MongoSequenceService mongoSequenceService;
    private final Random random = new Random();

    public AdminApiController(
            CharityActionRepository charityActionRepository,
            DonationProcessingService donationProcessingService,
            UserRepository userRepository,
            MongoSequenceService mongoSequenceService
    ) {
        this.charityActionRepository = charityActionRepository;
        this.donationProcessingService = donationProcessingService;
        this.userRepository = userRepository;
        this.mongoSequenceService = mongoSequenceService;
    }

    public static class SeedRequest {
        public Long organizationId; // optional: only seed actions for this org
        public int donationsPerAction = 3;
        public int minCents = 500; // default $5.00
        public int maxCents = 50000; // default $500.00
    }

    @PostMapping("/seed-donations")
    public ResponseEntity<?> seedDonations(@RequestBody(required = false) SeedRequest req) {
        SeedRequest r = req == null ? new SeedRequest() : req;
        List<CharityAction> actions;
        if (r.organizationId != null) {
            actions = charityActionRepository.findByOrganizationId(r.organizationId);
        } else {
            actions = charityActionRepository.findAll();
        }

        if (actions.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "No charity actions found to seed."));
        }

        // ensure a donor user exists (system donor)
        User donor = userRepository.findByEmail("system-donor@local").orElseGet(() -> {
            User u = new User();
            u.setId(mongoSequenceService.nextId("users"));
            u.setFullName("System Donor");
            u.setEmail("system-donor@local");
            u.setPreferredLanguage("fr");
            u.setRole(com.devbuild.gestion_charite.entity.enums.Role.DONOR);
            return userRepository.save(u);
        });

        List<Long> created = actions.stream().flatMap(action -> {
            return java.util.stream.IntStream.range(0, r.donationsPerAction).mapToObj(i -> {
                int cents = r.minCents + random.nextInt(Math.max(1, r.maxCents - r.minCents + 1));
                BigDecimal amount = new BigDecimal(cents).divide(new BigDecimal(100));
                try {
                    donationProcessingService.createConfirmedDonation(
                            action.getId(),
                            donor.getId(),
                            amount,
                            "Seed donation",
                            PaymentMethod.PAYPAL,
                            null
                    );
                    return action.getId();
                } catch (Exception ex) {
                    return null;
                }
            });
        }).filter(x -> x != null).collect(Collectors.toList());

        return ResponseEntity.ok(Map.of("seededForActions", created));
    }
}