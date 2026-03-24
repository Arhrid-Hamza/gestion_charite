package com.devbuild.gestion_charite.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.devbuild.gestion_charite.entity.Organization;

public interface OrganizationRepository extends JpaRepository<Organization, Long> {
}
