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
	public Organization create(@RequestBody Organization organization) {
		organization.setId(null);
		if (organization.getStatus() == null) {
			organization.setStatus(OrganizationStatus.PENDING);
		}
		return organizationRepository.save(organization);
	}

	@PutMapping("/{id}")
	public ResponseEntity<Organization> update(@PathVariable Long id, @RequestBody Organization updated) {
		return organizationRepository.findById(id)
				.map(existing -> {
					existing.setName(updated.getName());
					existing.setDescription(updated.getDescription());
					existing.setStatus(updated.getStatus());
					return ResponseEntity.ok(organizationRepository.save(existing));
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
