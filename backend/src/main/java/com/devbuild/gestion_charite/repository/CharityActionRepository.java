package com.devbuild.gestion_charite.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.devbuild.gestion_charite.entity.CharityAction;

public interface CharityActionRepository extends JpaRepository<CharityAction, Long> {
	java.util.List<CharityAction> findByCategoryNameIgnoreCase(String categoryName);

	java.util.List<CharityAction> findByOrganizationId(Long organizationId);

	@Query("select c from CharityAction c order by c.collectedAmount desc")
	java.util.List<CharityAction> findPopularActions();
}
