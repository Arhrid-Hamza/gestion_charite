package com.devbuild.gestion_charite.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.devbuild.gestion_charite.entity.Donation;
import com.devbuild.gestion_charite.entity.Organization;
import com.devbuild.gestion_charite.entity.User;
import com.devbuild.gestion_charite.entity.enums.Role;
import com.devbuild.gestion_charite.entity.enums.OrganizationStatus;
import com.devbuild.gestion_charite.repository.DonationRepository;
import com.devbuild.gestion_charite.repository.OrganizationRepository;
import com.devbuild.gestion_charite.repository.UserRepository;

@RestController
@RequestMapping("/api/users")
public class UserController {

	private final UserRepository userRepository;
	private final DonationRepository donationRepository;
	private final OrganizationRepository organizationRepository;

	public UserController(
			UserRepository userRepository,
			DonationRepository donationRepository,
			OrganizationRepository organizationRepository
	) {
		this.userRepository = userRepository;
		this.donationRepository = donationRepository;
		this.organizationRepository = organizationRepository;
	}

	@GetMapping
	public List<User> findAll() {
		return userRepository.findAll();
	}

	@GetMapping("/{id}")
	public ResponseEntity<User> findById(@PathVariable Long id) {
		return userRepository.findById(id)
				.map(ResponseEntity::ok)
				.orElseGet(() -> ResponseEntity.notFound().build());
	}

	@PostMapping
	public User create(@RequestBody User user) {
		user.setId(null);
		if (user.getRole() == null) {
			user.setRole(Role.DONOR);
		}
		if (user.getPasswordHash() == null || user.getPasswordHash().isBlank()) {
			user.setPasswordHash("UNSET_PASSWORD");
		}
		if (user.getPreferredLanguage() == null || user.getPreferredLanguage().isBlank()) {
			user.setPreferredLanguage("fr");
		}
		return userRepository.save(user);
	}

	@PutMapping("/{id}")
	public ResponseEntity<User> updateProfile(@PathVariable Long id, @RequestBody User updated) {
		return userRepository.findById(id)
				.map(existing -> {
					existing.setFullName(updated.getFullName());
					existing.setPhone(updated.getPhone());
					existing.setAddress(updated.getAddress());
					existing.setPreferredLanguage(updated.getPreferredLanguage());
					existing.setInterests(updated.getInterests());
					return ResponseEntity.ok(userRepository.save(existing));
				})
				.orElseGet(() -> ResponseEntity.notFound().build());
	}

	@GetMapping("/{id}/donations")
	public ResponseEntity<List<Donation>> donationHistory(@PathVariable Long id) {
		if (!userRepository.existsById(id)) {
			return ResponseEntity.notFound().build();
		}
		return ResponseEntity.ok(donationRepository.findByDonorUserIdOrderByCreatedAtDesc(id));
	}

	@PutMapping("/{id}/join-organization/{organizationId}")
	public ResponseEntity<?> joinOrganization(@PathVariable Long id, @PathVariable Long organizationId) {
		User user = userRepository.findById(id).orElse(null);
		if (user == null) {
			return ResponseEntity.notFound().build();
		}

		Organization organization = organizationRepository.findById(organizationId).orElse(null);
		if (organization == null) {
			return ResponseEntity.badRequest().body(java.util.Map.of("error", "Organisation introuvable"));
		}
		if (organization.getStatus() != OrganizationStatus.ACTIVE) {
			return ResponseEntity.badRequest().body(java.util.Map.of("error", "Seules les organisations ACTIVE peuvent etre rejointes"));
		}

		user.setJoinedOrganizationId(organization.getId());
		user.setJoinedOrganizationName(organization.getName());
		User saved = userRepository.save(user);

		return ResponseEntity.ok(saved);
	}
}
