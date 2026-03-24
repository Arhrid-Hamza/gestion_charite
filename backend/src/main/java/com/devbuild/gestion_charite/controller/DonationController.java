package com.devbuild.gestion_charite.controller;

import java.math.BigDecimal;
import java.time.LocalDateTime;
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
import com.devbuild.gestion_charite.repository.CharityActionRepository;
import com.devbuild.gestion_charite.repository.DonationRepository;

@RestController
@RequestMapping("/api/donations")
public class DonationController {

	private final DonationRepository donationRepository;
	private final CharityActionRepository charityActionRepository;

	public DonationController(DonationRepository donationRepository, CharityActionRepository charityActionRepository) {
		this.donationRepository = donationRepository;
		this.charityActionRepository = charityActionRepository;
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
		CharityAction action = charityActionRepository.findById(donation.getActionId()).orElse(null);
		if (action == null) {
			return ResponseEntity.badRequest().build();
		}

		donation.setId(null);
		donation.setCreatedAt(LocalDateTime.now());
		if (donation.getStatus() == null) {
			donation.setStatus(DonationStatus.CONFIRMED);
		}

		Donation savedDonation = donationRepository.save(donation);

		BigDecimal current = action.getCollectedAmount() == null ? BigDecimal.ZERO : action.getCollectedAmount();
		action.setCollectedAmount(current.add(savedDonation.getAmount()));
		charityActionRepository.save(action);

		return ResponseEntity.ok(savedDonation);
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
