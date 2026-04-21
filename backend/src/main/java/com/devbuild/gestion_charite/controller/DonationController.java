package com.devbuild.gestion_charite.controller;

import java.math.BigDecimal;
import java.util.List;

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
import com.devbuild.gestion_charite.service.DonationProcessingService;

@RestController
@RequestMapping("/api/donations")
public class DonationController {

	private final DonationRepository donationRepository;
	private final CharityActionRepository charityActionRepository;
	private final DonationProcessingService donationProcessingService;

	public DonationController(
			DonationRepository donationRepository,
			CharityActionRepository charityActionRepository,
			DonationProcessingService donationProcessingService
	) {
		this.donationRepository = donationRepository;
		this.charityActionRepository = charityActionRepository;
		this.donationProcessingService = donationProcessingService;
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

		PaymentMethod method = donation.getPaymentMethod() == null ? PaymentMethod.PAYPAL : donation.getPaymentMethod();
		String incomingStatus = donation.getStatus() == null ? null : donation.getStatus().name();
		if (incomingStatus != null && !incomingStatus.isBlank()) {
			if (!incomingStatus.equalsIgnoreCase(DonationStatus.CONFIRMED.name())
					&& !incomingStatus.equalsIgnoreCase(DonationStatus.PENDING.name())) {
				return ResponseEntity.badRequest().build();
			}
		}

		try {
			Donation savedDonation = donationProcessingService.createConfirmedDonation(
					donation.getActionId(),
					donation.getDonorUserId(),
					donation.getAmount(),
					donation.getMessage(),
					method,
					donation.getTransactionId()
			);
			return ResponseEntity.ok(savedDonation);
		} catch (IllegalArgumentException ex) {
			return ResponseEntity.badRequest().build();
		}
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

}
