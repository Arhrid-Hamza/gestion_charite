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
import com.devbuild.gestion_charite.entity.enums.ActionStatus;
import com.devbuild.gestion_charite.repository.CharityActionRepository;

@RestController
@RequestMapping("/api/charity-actions")
public class CharityActionController {

	private final CharityActionRepository charityActionRepository;

	public CharityActionController(CharityActionRepository charityActionRepository) {
		this.charityActionRepository = charityActionRepository;
	}

	@GetMapping
	public List<CharityAction> findAll() {
		return charityActionRepository.findAll();
	}

	@GetMapping("/{id}")
	public ResponseEntity<CharityAction> findById(@PathVariable Long id) {
		return charityActionRepository.findById(id)
				.map(ResponseEntity::ok)
				.orElseGet(() -> ResponseEntity.notFound().build());
	}

	@PostMapping
	public CharityAction create(@RequestBody CharityAction action) {
		action.setId(null);
		if (action.getCollectedAmount() == null) {
			action.setCollectedAmount(BigDecimal.ZERO);
		}
		if (action.getStatus() == null) {
			action.setStatus(ActionStatus.OPEN);
		}
		return charityActionRepository.save(action);
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
					existing.setOrganizationName(updated.getOrganizationName());
					existing.setCategoryName(updated.getCategoryName());
					existing.setStartDate(updated.getStartDate());
					existing.setEndDate(updated.getEndDate());
					return ResponseEntity.ok(charityActionRepository.save(existing));
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
