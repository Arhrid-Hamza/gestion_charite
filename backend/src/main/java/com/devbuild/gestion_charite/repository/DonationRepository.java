package com.devbuild.gestion_charite.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.devbuild.gestion_charite.entity.Donation;

public interface DonationRepository extends MongoRepository<Donation, Long> {
    List<Donation> findByActionId(Long actionId);

	List<Donation> findByDonorUserIdOrderByCreatedAtDesc(Long donorUserId);

	boolean existsByTransactionId(String transactionId);

	Optional<Donation> findByTransactionId(String transactionId);
}
