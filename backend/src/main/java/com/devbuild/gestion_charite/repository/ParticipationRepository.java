package com.devbuild.gestion_charite.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.devbuild.gestion_charite.entity.Participation;

public interface ParticipationRepository extends MongoRepository<Participation, Long> {
	List<Participation> findByActionId(Long actionId);

	List<Participation> findByParticipantUserId(Long participantUserId);
}
