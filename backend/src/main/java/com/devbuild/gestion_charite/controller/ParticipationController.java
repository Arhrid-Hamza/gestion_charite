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
import com.devbuild.gestion_charite.entity.CharityAction;
import com.devbuild.gestion_charite.entity.User;
import com.devbuild.gestion_charite.repository.CharityActionRepository;
import com.devbuild.gestion_charite.repository.ParticipationRepository;
import com.devbuild.gestion_charite.repository.UserRepository;
import com.devbuild.gestion_charite.service.MongoSequenceService;

@RestController
@RequestMapping("/api/participations")
public class 	ParticipationController {

	private final ParticipationRepository participationRepository;
	private final UserRepository userRepository;
	private final CharityActionRepository charityActionRepository;
	private final MongoSequenceService mongoSequenceService;

	public ParticipationController(
			ParticipationRepository participationRepository,
			UserRepository userRepository,
			CharityActionRepository charityActionRepository,
			MongoSequenceService mongoSequenceService
	) {
		this.participationRepository = participationRepository;
		this.userRepository = userRepository;
		this.charityActionRepository = charityActionRepository;
		this.mongoSequenceService = mongoSequenceService;
	}

	@GetMapping
	public List<Participation> findAll() {
		return participationRepository.findAll().stream().map(this::enrichParticipation).toList();
	}

	@GetMapping("/action/{actionId}")
	public List<Participation> findByAction(@PathVariable Long actionId) {
		return participationRepository.findByActionId(actionId).stream().map(this::enrichParticipation).toList();
	}

	@GetMapping("/user/{userId}")
	public List<Participation> findByUser(@PathVariable Long userId) {
		return participationRepository.findByParticipantUserId(userId).stream().map(this::enrichParticipation).toList();
	}

	@PostMapping
	public ResponseEntity<?> create(@RequestBody Participation participation) {
		if (participation.getParticipantUserId() == null || participation.getActionId() == null) {
			return ResponseEntity.badRequest().body("participantUserId et actionId sont obligatoires");
		}
		var user = userRepository.findById(participation.getParticipantUserId()).orElse(null);
		if (user == null) {
			return ResponseEntity.badRequest().body("Utilisateur introuvable");
		}
		if (!charityActionRepository.existsById(participation.getActionId())) {
			return ResponseEntity.badRequest().body("Action introuvable");
		}

		participation.setId(mongoSequenceService.nextId("participations"));
		if (participation.getParticipantName() == null || participation.getParticipantName().isBlank()) {
			participation.setParticipantName(resolveDisplayName(user));
		}
		if (participation.getActionTitle() == null || participation.getActionTitle().isBlank()) {
			CharityAction action = charityActionRepository.findById(participation.getActionId()).orElse(null);
			if (action != null) {
				participation.setActionTitle(resolveActionTitle(action));
			}
		}
		if (participation.getJoinedAt() == null) {
			participation.setJoinedAt(LocalDateTime.now());
		}
		if (participation.getRoleInAction() == null || participation.getRoleInAction().isBlank()) {
			participation.setRoleInAction("VOLUNTEER");
		}
		return ResponseEntity.ok(participationRepository.save(participation));
	}

	private String resolveDisplayName(com.devbuild.gestion_charite.entity.User user) {
		if (user.getFullName() != null && !user.getFullName().isBlank()) {
			return user.getFullName();
		}
		return user.getEmail() != null && !user.getEmail().isBlank() ? user.getEmail() : "—";
	}

	private String resolveActionTitle(CharityAction action) {
		if (action.getTitle() != null && !action.getTitle().isBlank()) {
			return action.getTitle();
		}
		return "Action #" + action.getId();
	}

	private Participation enrichParticipation(Participation participation) {
		if (participation.getParticipantName() == null || participation.getParticipantName().isBlank()) {
			if (participation.getParticipantUserId() != null) {
				userRepository.findById(participation.getParticipantUserId())
						.ifPresent(user -> participation.setParticipantName(resolveDisplayName(user)));
			}
		}
		if (participation.getActionTitle() == null || participation.getActionTitle().isBlank()) {
			if (participation.getActionId() != null) {
				charityActionRepository.findById(participation.getActionId())
						.ifPresent(action -> participation.setActionTitle(resolveActionTitle(action)));
			}
		}
		return participation;
	}
}
