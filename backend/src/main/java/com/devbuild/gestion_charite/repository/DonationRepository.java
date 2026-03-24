package com.devbuild.gestion_charite.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.devbuild.gestion_charite.entity.Donation;

public interface DonationRepository extends JpaRepository<Donation, Long> {
    List<Donation> findByActionId(Long actionId);
}
