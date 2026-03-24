package com.devbuild.gestion_charite.controller;

import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.devbuild.gestion_charite.repository.CharityActionRepository;
import com.devbuild.gestion_charite.repository.DonationRepository;
import com.devbuild.gestion_charite.repository.OrganizationRepository;
import com.devbuild.gestion_charite.repository.UserRepository;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

	private final UserRepository userRepository;
	private final OrganizationRepository organizationRepository;
	private final CharityActionRepository charityActionRepository;
	private final DonationRepository donationRepository;

	public AdminController(
			UserRepository userRepository,
			OrganizationRepository organizationRepository,
			CharityActionRepository charityActionRepository,
			DonationRepository donationRepository
	) {
		this.userRepository = userRepository;
		this.organizationRepository = organizationRepository;
		this.charityActionRepository = charityActionRepository;
		this.donationRepository = donationRepository;
	}

	@GetMapping("/stats")
	public Map<String, Long> stats() {
		return Map.of(
				"users", userRepository.count(),
				"organizations", organizationRepository.count(),
				"actions", charityActionRepository.count(),
				"donations", donationRepository.count()
		);
	}
}
