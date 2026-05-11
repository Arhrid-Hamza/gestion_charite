package com.devbuild.gestion_charite.repository;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.devbuild.gestion_charite.entity.Organization;
import com.devbuild.gestion_charite.entity.enums.OrganizationStatus;

public interface OrganizationRepository extends MongoRepository<Organization, Long> {
	boolean existsByTaxIdentificationNumber(String taxIdentificationNumber);

	java.util.List<Organization> findByStatus(OrganizationStatus status);

	java.util.Optional<Organization> findByAdminUserId(Long adminUserId);
}
