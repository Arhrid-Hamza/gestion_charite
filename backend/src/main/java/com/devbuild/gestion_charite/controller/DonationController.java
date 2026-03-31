package com.devbuild.gestion_charite.controller;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.devbuild.gestion_charite.entity.CharityAction;
import com.devbuild.gestion_charite.entity.Donation;
import com.devbuild.gestion_charite.entity.enums.DonationStatus;
import com.devbuild.gestion_charite.entity.enums.PaymentMethod;
import com.devbuild.gestion_charite.repository.CharityActionRepository;
import com.devbuild.gestion_charite.repository.DonationRepository;
import com.devbuild.gestion_charite.repository.UserRepository;

@RestController
@RequestMapping("/api/donations")
public class DonationController {

	private final DonationRepository donationRepository;
	private final CharityActionRepository charityActionRepository;
    private final UserRepository userRepository;

	public DonationController(
			DonationRepository donationRepository,
			CharityActionRepository charityActionRepository,
			UserRepository userRepository
	) {
		this.donationRepository = donationRepository;
		this.charityActionRepository = charityActionRepository;
		this.userRepository = userRepository;
	}

	@GetMapping
	public List<Donation> findAll() {
		return donationRepository.findAll();
	}

	@GetMapping("/{id}")
	public ResponseEntity<Donation> findById(@PathVariable Long id) {
		return donationRepository.findById(id)
				.map(ResponseEntity::ok)
				.orElseGet(() -> ResponseEntity.notFound().build());
	}

	@GetMapping("/action/{actionId}")
	public List<Donation> findByAction(@PathVariable Long actionId) {
		return donationRepository.findByActionId(actionId);
	}

	@PostMapping
	public ResponseEntity<Donation> create(@RequestBody Donation donation) {
		if (donation.getActionId() == null || donation.getDonorUserId() == null || donation.getAmount() == null) {
			return ResponseEntity.badRequest().build();
		}
		if (donation.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
			return ResponseEntity.badRequest().build();
		}

		CharityAction action = charityActionRepository.findById(donation.getActionId()).orElse(null);
		if (action == null) {
			return ResponseEntity.badRequest().build();
		}
		com.devbuild.gestion_charite.entity.User donor = userRepository.findById(donation.getDonorUserId()).orElse(null);
		if (donor == null) {
			return ResponseEntity.badRequest().build();
		}
		if (donation.getDonorName() == null || donation.getDonorName().isBlank()) {
			donation.setDonorName(donor.getFullName());
		}
		if (donation.getDonorEmail() == null || donation.getDonorEmail().isBlank()) {
			donation.setDonorEmail(donor.getEmail());
		}
		if (donation.getPaymentMethod() == null) {
			donation.setPaymentMethod(PaymentMethod.STRIPE);
		}

		donation.setId(null);
		donation.setCreatedAt(LocalDateTime.now());
		donation.setTransactionId(generateTransactionId(donation.getPaymentMethod()));
		if (donation.getStatus() == null) {
			donation.setStatus(DonationStatus.CONFIRMED);
		}

		Donation savedDonation = donationRepository.save(donation);

		BigDecimal current = action.getCollectedAmount() == null ? BigDecimal.ZERO : action.getCollectedAmount();
		action.setCollectedAmount(current.add(savedDonation.getAmount()));
		charityActionRepository.save(action);

		return ResponseEntity.ok(savedDonation);
	}

	@GetMapping("/user/{userId}")
	public List<Donation> findByUser(@PathVariable Long userId) {
		return donationRepository.findByDonorUserIdOrderByCreatedAtDesc(userId);
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> delete(@PathVariable Long id) {
		if (!donationRepository.existsById(id)) {
			return ResponseEntity.notFound().build();
		}
		donationRepository.deleteById(id);
		return ResponseEntity.noContent().build();
	}

	private String generateTransactionId(PaymentMethod paymentMethod) {
		String method = paymentMethod == null ? "PAY" : paymentMethod.name();
		String suffix = UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase();
		return method + "-" + suffix;
	}
}
