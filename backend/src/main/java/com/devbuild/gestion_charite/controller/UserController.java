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
import com.devbuild.gestion_charite.entity.User;
import com.devbuild.gestion_charite.entity.enums.Role;
import com.devbuild.gestion_charite.repository.DonationRepository;
import com.devbuild.gestion_charite.repository.UserRepository;

@RestController
@RequestMapping("/api/users")
public class UserController {

	private final UserRepository userRepository;
	private final DonationRepository donationRepository;

	public UserController(UserRepository userRepository, DonationRepository donationRepository) {
		this.userRepository = userRepository;
		this.donationRepository = donationRepository;
	}

	@GetMapping
	public List<User> findAll() {
		return userRepository.findAll();
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
}
