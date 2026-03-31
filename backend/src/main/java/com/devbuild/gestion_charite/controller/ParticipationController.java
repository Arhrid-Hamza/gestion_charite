package com.devbuild.gestion_charite.controller;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.devbuild.gestion_charite.entity.Participation;
import com.devbuild.gestion_charite.repository.CharityActionRepository;
import com.devbuild.gestion_charite.repository.ParticipationRepository;
import com.devbuild.gestion_charite.repository.UserRepository;

@RestController
@RequestMapping("/api/participations")
public class ParticipationController {

	private final ParticipationRepository participationRepository;
	private final UserRepository userRepository;
	private final CharityActionRepository charityActionRepository;

	public ParticipationController(
			ParticipationRepository participationRepository,
			UserRepository userRepository,
			CharityActionRepository charityActionRepository
	) {
		this.participationRepository = participationRepository;
		this.userRepository = userRepository;
		this.charityActionRepository = charityActionRepository;
	}

	@GetMapping
	public List<Participation> findAll() {
		return participationRepository.findAll();
	}

	@GetMapping("/action/{actionId}")
	public List<Participation> findByAction(@PathVariable Long actionId) {
		return participationRepository.findByActionId(actionId);
	}

	@GetMapping("/user/{userId}")
	public List<Participation> findByUser(@PathVariable Long userId) {
		return participationRepository.findByParticipantUserId(userId);
	}

	@PostMapping
	public ResponseEntity<?> create(@RequestBody Participation participation) {
		if (participation.getParticipantUserId() == null || participation.getActionId() == null) {
			return ResponseEntity.badRequest().body("participantUserId et actionId sont obligatoires");
		}
		if (!userRepository.existsById(participation.getParticipantUserId())) {
			return ResponseEntity.badRequest().body("Utilisateur introuvable");
		}
		if (!charityActionRepository.existsById(participation.getActionId())) {
			return ResponseEntity.badRequest().body("Action introuvable");
		}

		participation.setId(null);
		if (participation.getJoinedAt() == null) {
			participation.setJoinedAt(LocalDateTime.now());
		}
		if (participation.getRoleInAction() == null || participation.getRoleInAction().isBlank()) {
			participation.setRoleInAction("VOLUNTEER");
		}
		return ResponseEntity.ok(participationRepository.save(participation));
	}
}
