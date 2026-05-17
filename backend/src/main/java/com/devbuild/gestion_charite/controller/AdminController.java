package com.devbuild.gestion_charite.controller;

import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import com.devbuild.gestion_charite.entity.Organization;
import com.devbuild.gestion_charite.entity.enums.OrganizationStatus;
import com.devbuild.gestion_charite.repository.CharityActionRepository;
import com.devbuild.gestion_charite.repository.DonationRepository;
import com.devbuild.gestion_charite.repository.OrganizationRepository;
import com.devbuild.gestion_charite.repository.UserRepository;

@Controller
@RequestMapping("/admin")
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

	@GetMapping
	public String adminPage(Model model) {
		List<Organization> pendingOrgs = organizationRepository.findByStatus(OrganizationStatus.PENDING);
		model.addAttribute("organizations", pendingOrgs);
		return "admin";
	}

	@PostMapping("/{orgId}/approve")
	@ResponseBody
	public Map<String, String> approveOrganization(@PathVariable Long orgId) {
		Organization org = organizationRepository.findById(orgId).orElse(null);
		if (org != null) {
			org.setStatus(OrganizationStatus.APPROVED);
			organizationRepository.save(org);
			return Map.of("status", "success", "message", "Organization approved");
		}
		return Map.of("status", "error", "message", "Organization not found");
	}
}
