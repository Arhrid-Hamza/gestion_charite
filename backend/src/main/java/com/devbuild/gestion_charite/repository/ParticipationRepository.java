package com.devbuild.gestion_charite.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.devbuild.gestion_charite.entity.Participation;

public interface ParticipationRepository extends JpaRepository<Participation, Long> {
	List<Participation> findByActionId(Long actionId);

	List<Participation> findByParticipantUserId(Long participantUserId);
}
