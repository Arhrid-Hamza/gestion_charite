package com.devbuild.gestion_charite.controller;

import java.util.List;

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
		if (organizationRepository.existsByTaxIdentificationNumber(organization.getTaxIdentificationNumber())) {
			return ResponseEntity.badRequest().body("Numero d'identification fiscale deja utilise");
		}
		organization.setId(null);
		if (organization.getStatus() == null) {
			organization.setStatus(OrganizationStatus.PENDING);
		}
		return ResponseEntity.ok(organizationRepository.save(organization));
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
}
