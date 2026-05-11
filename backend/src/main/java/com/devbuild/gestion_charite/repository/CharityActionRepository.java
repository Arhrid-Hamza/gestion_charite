package com.devbuild.gestion_charite.repository;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.devbuild.gestion_charite.entity.CharityAction;

public interface CharityActionRepository extends MongoRepository<CharityAction, Long> {
	java.util.List<CharityAction> findByCategoryNameIgnoreCase(String categoryName);

	java.util.List<CharityAction> findByOrganizationId(Long organizationId);

	java.util.List<CharityAction> findAllByOrderByCollectedAmountDesc();
}
