package com.devbuild.gestion_charite.controller;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.devbuild.gestion_charite.entity.Organization;
import com.devbuild.gestion_charite.entity.enums.OrganizationStatus;
import com.devbuild.gestion_charite.repository.OrganizationRepository;

@RestController
@RequestMapping("/api/organizations")
public class OrganizationController {

	private final OrganizationRepository organizationRepository;

	public OrganizationController(OrganizationRepository organizationRepository) {
		this.organizationRepository = organizationRepository;
	}

	@GetMapping
	public List<Organization> findAll() {
		return organizationRepository.findAll();
	}

	@GetMapping("/{id}")
	public ResponseEntity<Organization> findById(@PathVariable Long id) {
		return organizationRepository.findById(id)
				.map(ResponseEntity::ok)
				.orElseGet(() -> ResponseEntity.notFound().build());
	}

	@PostMapping
	public ResponseEntity<?> create(@RequestBody Organization organization) {
		try {
			// Validate required fields
			if (organization.getName() == null || organization.getName().isBlank()) {
				return ResponseEntity.badRequest().body(Map.of("error", "Le nom de l'organisation est requis"));
			}
			if (organization.getLegalAddress() == null || organization.getLegalAddress().isBlank()) {
				return ResponseEntity.badRequest().body(Map.of("error", "L'adresse légale est requise"));
			}
			if (organization.getTaxIdentificationNumber() == null || organization.getTaxIdentificationNumber().isBlank()) {
				return ResponseEntity.badRequest().body(Map.of("error", "Le numéro d'identification fiscale est requis"));
			}
			if (organization.getPrimaryContactName() == null || organization.getPrimaryContactName().isBlank()) {
				return ResponseEntity.badRequest().body(Map.of("error", "Le nom du contact principal est requis"));
			}
			if (organization.getPrimaryContactEmail() == null || organization.getPrimaryContactEmail().isBlank()) {
				return ResponseEntity.badRequest().body(Map.of("error", "L'email du contact principal est requis"));
			}
			if (organization.getPassword() == null || organization.getPassword().isBlank()) {
				return ResponseEntity.badRequest().body(Map.of("error", "Le mot de passe est requis"));
			}

			if (organizationRepository.existsByTaxIdentificationNumber(organization.getTaxIdentificationNumber())) {
				return ResponseEntity.badRequest().body(Map.of("error", "Numero d'identification fiscale deja utilise"));
			}
			organization.setId(null);
			organization.setPassword(hashPassword(organization.getPassword()));
			if (organization.getStatus() == null) {
				organization.setStatus(OrganizationStatus.PENDING);
			}
			return ResponseEntity.ok(organizationRepository.save(organization));
		} catch (Exception e) {
			return ResponseEntity.status(500).body(Map.of("error", "Erreur lors de la création de l'organisation: " + e.getMessage()));
		}
	}

	@PostMapping("/login")
	public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
		String email = credentials.get("email");
		String password = credentials.get("password");

		if (email == null || email.isBlank() || password == null || password.isBlank()) {
			return ResponseEntity.badRequest().body(Map.of("error", "Email et mot de passe requis"));
		}

		return organizationRepository.findAll().stream()
				.filter(org -> email.equalsIgnoreCase(org.getPrimaryContactEmail()))
				.findFirst()
				.filter(org -> org.getPassword().equals(hashPassword(password)))
				.<ResponseEntity<?>>map(ResponseEntity::ok)
				.orElseGet(() -> ResponseEntity.status(401).body(Map.of("error", "Identifiants organisation invalides")));
	}

	@PutMapping("/{id}")
	public ResponseEntity<Organization> update(@PathVariable Long id, @RequestBody Organization updated) {
		return organizationRepository.findById(id)
				.map(existing -> {
					existing.setName(updated.getName());
					existing.setLegalAddress(updated.getLegalAddress());
					existing.setTaxIdentificationNumber(updated.getTaxIdentificationNumber());
					existing.setPrimaryContactName(updated.getPrimaryContactName());
					existing.setPrimaryContactEmail(updated.getPrimaryContactEmail());
					existing.setPrimaryContactPhone(updated.getPrimaryContactPhone());
					existing.setLogoUrl(updated.getLogoUrl());
					existing.setDescription(updated.getDescription());
					existing.setMission(updated.getMission());
					existing.setAdminUserId(updated.getAdminUserId());
					if (updated.getStatus() != null) {
						existing.setStatus(updated.getStatus());
					}
					return ResponseEntity.ok(organizationRepository.save(existing));
				})
				.orElseGet(() -> ResponseEntity.notFound().build());
	}

	@GetMapping("/pending")
	public List<Organization> findPending() {
		return organizationRepository.findByStatus(OrganizationStatus.PENDING);
	}

	@PutMapping("/{id}/approve")
	public ResponseEntity<?> approveOrganization(
			@PathVariable Long id,
			@org.springframework.web.bind.annotation.RequestParam(defaultValue = "false") boolean superAdminApproved
	) {
		if (!superAdminApproved) {
			return ResponseEntity.badRequest().body("Validation super-admin requise");
		}

		return organizationRepository.findById(id)
				.map(org -> {
					org.setStatus(OrganizationStatus.ACTIVE);
					return ResponseEntity.ok(organizationRepository.save(org));
				})
				.orElseGet(() -> ResponseEntity.notFound().build());
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> delete(@PathVariable Long id) {
		if (!organizationRepository.existsById(id)) {
			return ResponseEntity.notFound().build();
		}
		organizationRepository.deleteById(id);
		return ResponseEntity.noContent().build();
	}

	private String hashPassword(String password) {
		try {
			MessageDigest digest = MessageDigest.getInstance("SHA-256");
			byte[] hashed = digest.digest(password.getBytes(StandardCharsets.UTF_8));
			return Base64.getEncoder().encodeToString(hashed);
		} catch (NoSuchAlgorithmException e) {
			throw new IllegalStateException("Impossible de hacher le mot de passe", e);
		}
	}
}
