package com.devbuild.gestion_charite.controller;

import java.math.BigDecimal;
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

import com.devbuild.gestion_charite.entity.CharityAction;
import com.devbuild.gestion_charite.entity.Organization;
import com.devbuild.gestion_charite.entity.enums.ActionStatus;
import com.devbuild.gestion_charite.entity.enums.OrganizationStatus;
import com.devbuild.gestion_charite.repository.CharityActionRepository;
import com.devbuild.gestion_charite.repository.OrganizationRepository;
import com.devbuild.gestion_charite.repository.UserRepository;

@RestController
@RequestMapping("/api/charity-actions")
public class CharityActionController {

	private final CharityActionRepository charityActionRepository;
	private final OrganizationRepository organizationRepository;
	private final UserRepository userRepository;

	public CharityActionController(
			CharityActionRepository charityActionRepository,
			OrganizationRepository organizationRepository,
			UserRepository userRepository
	) {
		this.charityActionRepository = charityActionRepository;
		this.organizationRepository = organizationRepository;
		this.userRepository = userRepository;
	}

	@GetMapping
	public List<CharityAction> findAll(
			@org.springframework.web.bind.annotation.RequestParam(required = false) String category,
			@org.springframework.web.bind.annotation.RequestParam(required = false) Long organizationId,
			@org.springframework.web.bind.annotation.RequestParam(defaultValue = "false") boolean popular
	) {
		if (popular) {
			return charityActionRepository.findPopularActions();
		}
		if (category != null && !category.isBlank()) {
			return charityActionRepository.findByCategoryNameIgnoreCase(category);
		}
		if (organizationId != null) {
			return charityActionRepository.findByOrganizationId(organizationId);
		}
		return charityActionRepository.findAll();
	}

	@GetMapping("/{id}")
	public ResponseEntity<CharityAction> findById(@PathVariable Long id) {
		return charityActionRepository.findById(id)
				.map(ResponseEntity::ok)
				.orElseGet(() -> ResponseEntity.notFound().build());
	}

	@PostMapping
	public ResponseEntity<?> create(@RequestBody CharityAction action) {
		action.setId(null);
		if (action.getCollectedAmount() == null) {
			action.setCollectedAmount(BigDecimal.ZERO);
		}
		if (action.getStatus() == null) {
			action.setStatus(ActionStatus.OPEN);
		}

		if (action.getOrganizationId() == null) {
			return ResponseEntity.badRequest().body("organizationId est obligatoire");
		}

		Organization organization = organizationRepository.findById(action.getOrganizationId()).orElse(null);
		if (organization == null) {
			return ResponseEntity.badRequest().body("Organisation introuvable");
		}
		if (organization.getStatus() != OrganizationStatus.ACTIVE) {
			return ResponseEntity.badRequest().body("L'organisation doit etre ACTIVE pour creer des actions");
		}

		action.setOrganizationName(organization.getName());
		return ResponseEntity.ok(charityActionRepository.save(action));
	}

	@PostMapping("/organization/{organizationId}")
	public ResponseEntity<?> createForOrganization(@PathVariable Long organizationId, @RequestBody CharityAction action) {
		action.setOrganizationId(organizationId);
		return create(action);
	}

	@PutMapping("/{id}")
	public ResponseEntity<CharityAction> update(@PathVariable Long id, @RequestBody CharityAction updated) {
		return charityActionRepository.findById(id)
				.map(existing -> {
					existing.setTitle(updated.getTitle());
					existing.setDescription(updated.getDescription());
					existing.setTargetAmount(updated.getTargetAmount());
					existing.setCollectedAmount(updated.getCollectedAmount());
					existing.setStatus(updated.getStatus());
					existing.setOrganizationId(updated.getOrganizationId());
					existing.setOrganizationName(updated.getOrganizationName());
					existing.setCategoryName(updated.getCategoryName());
					existing.setStartDate(updated.getStartDate());
					existing.setEndDate(updated.getEndDate());
					existing.setLocation(updated.getLocation());
					existing.setMediaUrls(updated.getMediaUrls());
					return ResponseEntity.ok(charityActionRepository.save(existing));
				})
				.orElseGet(() -> ResponseEntity.notFound().build());
	}

	@PutMapping("/{id}/archive")
	public ResponseEntity<CharityAction> archive(@PathVariable Long id) {
		return charityActionRepository.findById(id)
				.map(existing -> {
					existing.setStatus(ActionStatus.CLOSED);
					return ResponseEntity.ok(charityActionRepository.save(existing));
				})
				.orElseGet(() -> ResponseEntity.notFound().build());
	}

	@GetMapping("/recommended/{userId}")
	public ResponseEntity<List<CharityAction>> recommended(@PathVariable Long userId) {
		return userRepository.findById(userId)
				.map(user -> {
					String interests = user.getInterests();
					if (interests == null || interests.isBlank()) {
						return ResponseEntity.ok(charityActionRepository.findPopularActions().stream().limit(10).toList());
					}
					String[] categories = interests.split(",");
					java.util.LinkedHashMap<Long, CharityAction> deduplicated = new java.util.LinkedHashMap<>();
					for (String category : categories) {
						for (CharityAction action : charityActionRepository.findByCategoryNameIgnoreCase(category.trim())) {
							deduplicated.put(action.getId(), action);
						}
					}
					return ResponseEntity.ok(deduplicated.values().stream().limit(10).toList());
				})
				.orElseGet(() -> ResponseEntity.notFound().build());
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> delete(@PathVariable Long id) {
		if (!charityActionRepository.existsById(id)) {
			return ResponseEntity.notFound().build();
		}
		charityActionRepository.deleteById(id);
		return ResponseEntity.noContent().build();
	}
}
